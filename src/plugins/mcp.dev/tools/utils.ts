/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { patchStats } from "@turbopack/patchReport";
import { getModuleCache, getRuntimeFactoryRegistry } from "@turbopack/patchTurbopack";
import { type PatchedModuleFactory, SYM_PATCHED_BY, SYM_PATCHED_CODE } from "@turbopack/types";
import { clamp, errorMessage } from "@utils/misc";

import { EVAL, MODULE, SERIALIZE } from "./constants";
import type { Anchor, AnyFn, SuggestCandidate } from "./types";

export { errorMessage };

export function isThenable(value: unknown): value is PromiseLike<unknown> {
    return value != null && typeof (value as PromiseLike<unknown>).then === "function";
}

export function dispatch<A extends { action: string }>(actions: Record<A["action"], (args: A) => unknown>, args: A): unknown {
    const fn = actions[args.action as A["action"]];
    return fn ? fn(args) : { error: `Unknown action: ${args.action}`, validActions: Object.keys(actions) };
}

export const asError = (e: unknown): { error: string } => ({ error: errorMessage(e) });

export const moduleNotFound = (id: number): string => `Module ${id} not found.`;

export function requireId(id: number | undefined): { id: number } | { error: string } {
    return id == null ? { error: "Provide module id." } : { id };
}

export function requireCode(code: string[] | undefined): { code: string[] } | { error: string } {
    return code?.length ? { code } : { error: "Provide code strings." };
}

export function pageBounds(args: { limit?: number; offset?: number }, cfg: { default: number; max: number }): { off: number; cap: number } {
    return { off: Math.max(0, Math.floor(args.offset ?? 0)), cap: clampConfig(args.limit, cfg) };
}

interface CaptureConfig {
    dur: { default: number; min: number; max: number };
    cap: { default: number; max: number };
}

export function clampCaptureConfig(args: { duration?: number; maxCaptures?: number }, cfg: CaptureConfig): { duration: number; maxCaptures: number } {
    return {
        duration: clampConfig(args.duration, cfg.dur),
        maxCaptures: clampConfig(args.maxCaptures, { default: cfg.cap.default, min: 1, max: cfg.cap.max }),
    };
}

export function createGenerationalCache<T>(rebuild: () => T, getGen: () => number): { get(): T; clear(): void } {
    let cache: T | null = null;
    let gen = -1;
    return {
        get() {
            const current = getGen();
            if (cache != null && gen === current) return cache;
            cache = rebuild();
            gen = getGen();
            return cache;
        },
        clear() {
            cache = null;
            gen = -1;
        },
    };
}

export function clampConfig(raw: number | undefined, defaultVal: number, max: number): number;
export function clampConfig(raw: number | undefined, config: { default: number; min?: number; max: number }): number;
export function clampConfig(raw: number | undefined, configOrDefault: number | { default: number; min?: number; max: number }, max?: number): number {
    const cfg = typeof configOrDefault === "number" ? { default: configOrDefault, min: 0, max: max! } : configOrDefault;
    const v = raw != null && Number.isFinite(raw) ? raw : cfg.default;
    return clamp(v, cfg.min ?? 0, cfg.max);
}

export function notFound(kind: string, query: string, allNames: Iterable<string>): { error: string; similar?: string[] } {
    const lower = query.toLowerCase();
    const similar = [...allNames].filter(n => n.toLowerCase().includes(lower)).slice(0, 5);
    const result: { error: string; similar?: string[] } = { error: `${kind} "${query}" not found.` };
    if (similar.length) result.similar = similar;
    return result;
}

export function requireModuleExports(id: number): { exports: Record<string, unknown> } | { error: string } {
    const cache = getModuleCache();
    const exports = cache.get(id);
    if (exports != null) return { exports };
    const registry = getRuntimeFactoryRegistry();
    if (registry?.has(id)) return { error: `Module ${id} exists but is not yet loaded. Use the "load" action first.` };
    return { error: moduleNotFound(id) };
}

const INTERNAL_FRAME_RE = /tryEval|evalAsync|handleEval|ws\.onmessage|<anonymous>:\d+:\d+\)$/;

export function formatError(err: unknown): string {
    if (!(err instanceof Error)) return `Error: ${String(err)}`;
    const stack = err.stack
        ? `\n${err.stack
              .split("\n")
              .slice(1)
              .filter(line => !INTERNAL_FRAME_RE.test(line))
              .slice(0, EVAL.STACK_LINES)
              .join("\n")}`
        : "";
    return `Error: ${err.message}${stack}`;
}

export function describeValue(val: unknown, maxSlice = MODULE.EXPORT_VALUE_SLICE): string {
    if (val == null) return String(val);
    const t = typeof val;
    if (t === "function") {
        const fn = val as AnyFn;
        return fn.name ? `fn:${fn.name}(${fn.length})` : `fn(${fn.length})`;
    }
    if (t !== "object") return `${t}:${String(val).slice(0, maxSlice)}`;
    if (Array.isArray(val)) return `[${val.length}]`;
    if (val instanceof Map) return `Map(${val.size})`;
    if (val instanceof Set) return `Set(${val.size})`;
    try {
        return `{${Object.keys(val as object).slice(0, MODULE.EXPORT_KEYS_PREVIEW)}}`;
    } catch {
        return "{?}";
    }
}

export function describeKeys(obj: Record<string, unknown>, cap = Infinity): Record<string, string> {
    const keys = Object.keys(obj);
    const result: Record<string, string> = {};
    for (let i = 0, l = Math.min(keys.length, cap); i < l; i++) {
        try {
            result[keys[i]] = describeValue(obj[keys[i]]);
        } catch {
            result[keys[i]] = "!";
        }
    }
    if (keys.length > cap) result["…"] = `+${keys.length - cap}`;
    return result;
}

export const truncate = (s: string, max: number): string => s.length > max ? s.slice(0, max) + `…+${s.length - max}` : s;

export function serialize(value: unknown, depth: number = SERIALIZE.DEFAULT_DEPTH): unknown {
    return serializeInner(value, depth, new WeakSet());
}

function serializeInner(value: unknown, depth: number, seen: WeakSet<object>): unknown {
    if (value === undefined) return "[undefined]";
    if (value === null) return null;
    const t = typeof value;
    if (t === "function") return `[fn:${(value as AnyFn).name || "?"}]`;
    if (t === "symbol") return (value as symbol).toString();
    if (t === "bigint") return `${value}n`;
    if (t === "number") {
        if (Number.isNaN(value as number)) return "[NaN]";
        if (!Number.isFinite(value as number)) return value === Infinity ? "[Infinity]" : "[-Infinity]";
    }
    if (t !== "object") {
        if (t === "string") return truncate(value as string, SERIALIZE.MAX_STRING_LENGTH);
        return value;
    }
    if (depth <= 0) return "[…]";
    if (seen.has(value as object)) return "[Circular]";
    seen.add(value as object);

    try {
        if (Array.isArray(value)) {
            if (value.length > SERIALIZE.MAX_ARRAY) return `[Array(${value.length})]`;
            return value.slice(0, SERIALIZE.MAX_ARRAY).map(v => serializeInner(v, depth - 1, seen));
        }
        if (value instanceof Date) return value.toISOString();
        if (value instanceof RegExp) return String(value);
        if (value instanceof Set) {
            if (value.size > SERIALIZE.MAX_ARRAY) return `[Set(${value.size})]`;
            return [...value].map(v => serializeInner(v, depth - 1, seen));
        }
        if (value instanceof Map) {
            if (value.size > SERIALIZE.MAX_KEYS) return `[Map(${value.size})]`;
            const result: Record<string, unknown> = {};
            for (const [k, v] of value) {
                result[String(k)] = serializeInner(v, depth - 1, seen);
            }
            return result;
        }
        if (value instanceof Error) return `[Error: ${value.message}]`;
        const obj = value as Record<string, unknown>;
        const result: Record<string, unknown> = {};
        let keys: string[];
        try {
            keys = Object.keys(obj);
        } catch {
            return "[Object]";
        }
        const len = Math.min(keys.length, SERIALIZE.MAX_KEYS);
        for (let i = 0; i < len; i++) {
            const key = keys[i];
            try {
                result[key] = serializeInner(obj[key], depth - 1, seen);
            } catch {
                result[key] = "[!]";
            }
        }
        if (keys.length > SERIALIZE.MAX_KEYS) result["…"] = `+${keys.length - SERIALIZE.MAX_KEYS} keys`;
        return result;
    } finally {
        seen.delete(value as object);
    }
}

export function getPath(obj: unknown, path: string): unknown {
    let current = obj;
    for (const p of path.split(".")) {
        if (current == null || typeof current !== "object") return undefined;
        try {
            current = (current as Record<string, unknown>)[p];
        } catch {
            return undefined;
        }
    }
    return current;
}

export function parseRegexPattern(pattern: string): RegExp | null {
    const rm = pattern.match(/^\/(.+)\/([dgimsuyv]*)$/);
    if (rm) {
        try {
            return new RegExp(rm[1], rm[2].includes("g") ? rm[2] : `${rm[2]}g`);
        } catch {
            return null;
        }
    }
    return null;
}

export { countCaptureGroups, invalidBackrefs } from "@utils/patches";

const RE_I18N_KEY = /\w\("([a-z][a-z0-9]*(?:[-.][a-z0-9]+)+)","([^"]+)"\)/g;
const RE_DISPLAY_NAME = /displayName="([^"]+)"/g;
const RE_DATA_TEST_ID = /"data-testid":"([^"]+)"/g;
const RE_STRING_LITERAL = /"([^"\\]{6,80})"/g;
const RE_TEMPLATE_LITERAL = /`([^`\\]{6,80})`/g;
const RE_EXPORT_BLOCK = /\.s\(\[([^\]]*)\]/g;
const RE_EXPORT_INNER = /"([^"]+)"/g;
const RE_I18N_NAMESPACE = /useTranslation\)\("([a-z]+)"\)/g;
const RE_FEATURE_FLAG = /"((?:ENABLE|DISABLE|ALLOW|SHOW|HIDE|IS|HAS)_[A-Z][A-Z0-9_]+)"/g;
const RE_JSX_COMPONENT = /jsx\)\(\w+\.(\w{3,}),/g;
const RE_TURBOPACK_IMPORT = /\.[irAR]\((\d+)\)/g;
const RE_TURBOPACK_SYNC_IMPORT = /\.[irR]\((\d+)\)/g;
const RE_TURBOPACK_ASYNC_IMPORT = /\.A\((\d+)\)/g;
const RE_TURBOPACK_EXPORT_DEF = /\.s\(\[([^\]]*)\](?:,(\d+))?\)/g;
const RE_CODEGEN = /"(idsert\w*|lisert\w*)"/g;
const RE_PROP_ACCESS_4 = /\.([a-zA-Z_$][\w$]{4,})[=(]/g;
const RE_PROP_ACCESS_5 = /\.([a-zA-Z_$][\w$]{5,})[=(]/g;

function resetRe(r: RegExp): RegExp {
    r.lastIndex = 0;
    return r;
}

export const re = {
    i18nKey: () => resetRe(RE_I18N_KEY),
    displayName: () => resetRe(RE_DISPLAY_NAME),
    dataTestId: () => resetRe(RE_DATA_TEST_ID),
    stringLiteral: () => resetRe(RE_STRING_LITERAL),
    templateLiteral: () => resetRe(RE_TEMPLATE_LITERAL),
    exportBlock: () => resetRe(RE_EXPORT_BLOCK),
    exportInner: () => resetRe(RE_EXPORT_INNER),
    i18nNamespace: () => resetRe(RE_I18N_NAMESPACE),
    featureFlag: () => resetRe(RE_FEATURE_FLAG),
    jsxComponent: () => resetRe(RE_JSX_COMPONENT),
    turbopackImport: () => resetRe(RE_TURBOPACK_IMPORT),
    turbopackSyncImport: () => resetRe(RE_TURBOPACK_SYNC_IMPORT),
    turbopackAsyncImport: () => resetRe(RE_TURBOPACK_ASYNC_IMPORT),
    turbopackExportDef: () => resetRe(RE_TURBOPACK_EXPORT_DEF),
    codegen: () => resetRe(RE_CODEGEN),
    propAccess: (minLen = 4) => resetRe(minLen >= 5 ? RE_PROP_ACCESS_5 : RE_PROP_ACCESS_4),
};

const registrySize = () => getRuntimeFactoryRegistry()?.size ?? 0;

const factorySourceHolder = createGenerationalCache(() => {
    const registry = getRuntimeFactoryRegistry();
    const map = new Map<number, string>();
    if (registry) for (const [id, factory] of registry) map.set(id, String(factory));
    return map;
}, registrySize);

export const getFactorySourceCache = (): Map<number, string> => factorySourceHolder.get();

const allFactorySourcesHolder = createGenerationalCache(() => [...new Set(getFactorySourceCache().values())], registrySize);

export const getAllFactorySources = (): string[] => allFactorySourcesHolder.get();

export const asArray = <T>(v: T | T[]): T[] => Array.isArray(v) ? v : [v];

function countInSources(sources: string[], text: string, max: number): number {
    let count = 0;
    for (const src of sources) {
        if (src.includes(text)) {
            count++;
            if (count >= max) return count;
        }
    }
    return count;
}

export function clearFactoryCaches(): void {
    factorySourceHolder.clear();
    allFactorySourcesHolder.clear();
    reverseHolder.clear();
}

export const getFactorySource = (id: number): string | null => getFactorySourceCache().get(id) ?? null;

const reverseHolder = createGenerationalCache(() => {
    const cache = getModuleCache();
    const map = new Map<unknown, number>();
    for (const [id, exports] of cache) {
        map.set(exports, id);
        if (typeof exports === "object" && exports != null) {
            for (const key in exports as Record<string, unknown>) {
                try {
                    const val = (exports as Record<string, unknown>)[key];
                    if (!map.has(val)) map.set(val, id);
                } catch {}
            }
        }
    }
    return map;
}, () => getModuleCache().size);

export const findModuleId = (exportValue: unknown): number | null => reverseHolder.get().get(exportValue) ?? null;

const getPatchedFactory = (id: number) => getRuntimeFactoryRegistry()?.get(id) as PatchedModuleFactory | undefined ?? null;
export const getPatchInfo = (id: number): string[] | null => getPatchedFactory(id)?.[SYM_PATCHED_BY] ?? null;
export const getPatchedSource = (id: number): string | null => getPatchedFactory(id)?.[SYM_PATCHED_CODE] ?? null;

export function isModulePatched(id: number): boolean {
    return patchStats.patchedModules.has(id);
}

export function attachPatchInfo(result: Record<string, unknown>, moduleId: number): void {
    const info = getPatchInfo(moduleId);
    if (info) result.patchedBy = info;
}

export function extractI18nKeys(ctx: string): Array<{ key: string; default: string }> {
    const keys: Array<{ key: string; default: string }> = [];
    const seen = new Set<string>();
    const pattern = re.i18nKey();
    let m: RegExpExecArray | null;
    while ((m = pattern.exec(ctx)) !== null) {
        if (!seen.has(m[1])) {
            seen.add(m[1]);
            keys.push({ key: m[1], default: m[2] });
        }
    }
    return keys;
}

const ANCHOR_TYPE_ORDER = ["i18n", "i18n-ns", "flag", "displayName", "export", "testid", "codegen", "string", "template", "jsx", "prop"] as const;

function sortAnchors<T extends { unique: boolean; type: string }>(items: T[]): T[] {
    items.sort((a, b) => {
        if (a.unique !== b.unique) return a.unique ? -1 : 1;
        return ANCHOR_TYPE_ORDER.indexOf(a.type as (typeof ANCHOR_TYPE_ORDER)[number]) - ANCHOR_TYPE_ORDER.indexOf(b.type as (typeof ANCHOR_TYPE_ORDER)[number]);
    });
    return items;
}

interface AnchorCollectorOpts {
    minLen?: number;
    propMinLen?: number;
    includeTemplates?: boolean;
    includeI18nNamespace?: boolean;
    includeFlags?: boolean;
    includeJsx?: boolean;
}

function collectRawAnchors(
    src: string,
    opts: AnchorCollectorOpts = {},
): Array<{ text: string; type: string; at: number }> {
    const { minLen = 4, propMinLen = 4, includeTemplates = false, includeI18nNamespace = false, includeFlags = false, includeJsx = false } = opts;
    const seen = new Set<string>();
    const raw: Array<{ text: string; type: string; at: number }> = [];

    const collect = (text: string, type: string, at: number) => {
        if (text.length < minLen || seen.has(text)) return;
        seen.add(text);
        raw.push({ text, type, at });
    };

    let m: RegExpExecArray | null;
    const i18nRe = re.i18nKey();
    while ((m = i18nRe.exec(src)) !== null) collect(`"${m[1]}","${m[2]}"`, "i18n", m.index);

    if (includeI18nNamespace) {
        const nsRe = re.i18nNamespace();
        while ((m = nsRe.exec(src)) !== null) collect(`useTranslation)("${m[1]}")`, "i18n-ns", m.index);
    }

    if (includeFlags) {
        const flagRe = re.featureFlag();
        while ((m = flagRe.exec(src)) !== null) collect(`"${m[1]}"`, "flag", m.index);
    }

    const dnRe = re.displayName();
    while ((m = dnRe.exec(src)) !== null) collect(`displayName="${m[1]}"`, "displayName", m.index);

    const exportRe = re.exportBlock();
    while ((m = exportRe.exec(src)) !== null) {
        const innerRe = re.exportInner();
        let nm: RegExpExecArray | null;
        while ((nm = innerRe.exec(m[1])) !== null) collect(`"${nm[1]}",()=>`, "export", m.index);
    }

    const testIdRe = re.dataTestId();
    while ((m = testIdRe.exec(src)) !== null) collect(`"data-testid":"${m[1]}"`, "testid", m.index);

    const strRe = re.stringLiteral();
    while ((m = strRe.exec(src)) !== null) {
        if (!seen.has(`"${m[1]}"`)) collect(m[1], "string", m.index);
    }

    if (includeTemplates) {
        const tplRe = re.templateLiteral();
        while ((m = tplRe.exec(src)) !== null) collect(m[1], "template", m.index);
    }

    if (includeJsx) {
        const jsxRe = re.jsxComponent();
        while ((m = jsxRe.exec(src)) !== null) collect(m[1], "jsx", m.index);
    }

    const codegenRe = re.codegen();
    while ((m = codegenRe.exec(src)) !== null) collect(`"${m[1]}"`, "codegen", m.index);

    const propRe = re.propAccess(propMinLen);
    while ((m = propRe.exec(src)) !== null) collect(m[1], "prop", m.index);

    return raw;
}

export function extractSuggestAnchors(src: string, allSources: string[], maxCandidates: number): SuggestCandidate[] {
    const raw = collectRawAnchors(src, { minLen: MODULE.SUGGEST_MIN_LEN, propMinLen: 5, includeTemplates: true });
    const capped = raw.slice(0, maxCandidates * 3);
    const candidates: SuggestCandidate[] = [];
    let uniqueCount = 0;
    for (const { text, type } of capped) {
        if (uniqueCount >= maxCandidates) break;
        const count = countInSources(allSources, text, 3);
        const unique = count === 1;
        if (unique) uniqueCount++;
        candidates.push({ text, type, unique, count });
    }
    return sortAnchors(candidates).slice(0, maxCandidates);
}

export function extractContextAnchors(ctx: string, allSources: string[], maxAnchors: number): Anchor[] {
    const raw = collectRawAnchors(ctx, { minLen: 4, propMinLen: 4, includeI18nNamespace: true, includeFlags: true, includeJsx: true });
    const anchors: Anchor[] = [];
    for (const { text, type, at } of raw) {
        const globalCount = countInSources(allSources, text, 3);
        anchors.push({ text, type, at, unique: globalCount === 1 });
    }
    return sortAnchors(anchors).slice(0, maxAnchors);
}
