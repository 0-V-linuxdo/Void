/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getModuleCache, getRuntimeFactoryRegistry, patchStats } from "@turbopack/patchTurbopack";
import { type PatchedModuleFactory, SYM_PATCHED_BY, SYM_PATCHED_CODE } from "@turbopack/types";

import { EVAL, MODULE, SERIALIZE } from "./constants";
import type { Anchor, SuggestCandidate } from "./types";

export { clamp, errorMessage } from "@utils/misc";

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
        const fn = val as Function;
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

export function serialize(value: unknown, depth: number = SERIALIZE.DEFAULT_DEPTH): unknown {
    if (value === undefined) return "[undefined]";
    if (value === null) return null;
    const t = typeof value;
    if (t === "function") return `[fn:${(value as Function).name || "?"}]`;
    if (t === "symbol") return (value as symbol).toString();
    if (t === "bigint") return `${value}n`;
    if (t === "number") {
        if (Number.isNaN(value as number)) return "[NaN]";
        if (!Number.isFinite(value as number)) return value === Infinity ? "[Infinity]" : "[-Infinity]";
    }
    if (t !== "object") {
        if (t === "string" && (value as string).length > SERIALIZE.MAX_STRING_LENGTH)
            return (value as string).slice(0, SERIALIZE.MAX_STRING_LENGTH) + `…+${(value as string).length - SERIALIZE.MAX_STRING_LENGTH}`;
        return value;
    }
    if (depth <= 0) return "[…]";

    return serializeInner(value as object, depth, new WeakSet());
}

function serializeInner(value: unknown, depth: number, seen: WeakSet<object>): unknown {
    if (value === undefined) return "[undefined]";
    if (value === null) return null;
    const t = typeof value;
    if (t === "function") return `[fn:${(value as Function).name || "?"}]`;
    if (t === "symbol") return (value as symbol).toString();
    if (t === "bigint") return `${value}n`;
    if (t === "number") {
        if (Number.isNaN(value as number)) return "[NaN]";
        if (!Number.isFinite(value as number)) return value === Infinity ? "[Infinity]" : "[-Infinity]";
    }
    if (t !== "object") {
        if (t === "string" && (value as string).length > SERIALIZE.MAX_STRING_LENGTH)
            return (value as string).slice(0, SERIALIZE.MAX_STRING_LENGTH) + `…+${(value as string).length - SERIALIZE.MAX_STRING_LENGTH}`;
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

export const clampDefault = (value: number | undefined, defaultVal: number, max: number): number => {
    const v = value ?? defaultVal;
    return Number.isFinite(v) ? Math.max(0, Math.min(v, max)) : defaultVal;
};

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

export function parseRegexPattern(pattern: string): { regex: RegExp | null; literal: string } {
    const rm = pattern.match(/^\/(.+)\/([dgimsuyv]*)$/);
    if (rm) {
        try {
            return { regex: new RegExp(rm[1], rm[2].includes("g") ? rm[2] : `${rm[2]}g`), literal: pattern };
        } catch {
            return { regex: null, literal: pattern };
        }
    }
    return { regex: null, literal: pattern };
}

export function countCaptureGroups(matchStr: string): number {
    let count = 0;
    let inCharClass = false;
    for (let i = 0; i < matchStr.length; i++) {
        if (matchStr[i] === "\\" && i + 1 < matchStr.length) {
            i++;
            continue;
        }
        if (inCharClass) {
            if (matchStr[i] === "]") inCharClass = false;
            continue;
        }
        if (matchStr[i] === "[") {
            inCharClass = true;
            continue;
        }
        if (matchStr[i] === "(") {
            if (matchStr[i + 1] !== "?") {
                count++;
            } else if (matchStr[i + 2] === "<" && matchStr[i + 3] !== "!" && matchStr[i + 3] !== "=") {
                count++;
            }
        }
    }
    return count;
}

export const re = {
    i18nKey: () => /\w\("([a-z][a-z0-9]*(?:[-.][a-z0-9]+)+)","([^"]+)"\)/g,
    displayName: () => /displayName="([^"]+)"/g,
    dataTestId: () => /"data-testid":"([^"]+)"/g,
    stringLiteral: () => /"([^"\\]{6,80})"/g,
    templateLiteral: () => /`([^`\\]{6,80})`/g,
    exportBlock: () => /\.s\(\[([^\]]*)\]/g,
    exportEntry: () => /\["([A-Z][\w]+)",\(\)=>/g,
    exportInner: () => /"([^"]+)"/g,
    propAccess: (minLen = 4) => new RegExp(`\\.([a-zA-Z_$][\\w$]{${minLen},})[=(]`, "g"),
    i18nNamespace: () => /useTranslation\)\("([a-z]+)"\)/g,
    featureFlag: () => /"((?:ENABLE|DISABLE|ALLOW|SHOW|HIDE|IS|HAS)_[A-Z][A-Z0-9_]+)"/g,
    jsxComponent: () => /jsx\)\(\w+\.(\w{3,}),/g,
    turbopackImport: () => /\.[irAR]\((\d+)\)/g,
    turbopackSyncImport: () => /\.[irR]\((\d+)\)/g,
    turbopackAsyncImport: () => /\.A\((\d+)\)/g,
    turbopackExportDef: () => /\.s\(\[([^\]]*)\](?:,(\d+))?\)/g,
};

let factorySourceCache: Map<number, string> | null = null;
let factorySourceCacheGen = 0;

export function getFactorySourceCache(): Map<number, string> {
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return new Map();
    const gen = registry.size;
    if (factorySourceCache && factorySourceCacheGen === gen) return factorySourceCache;
    factorySourceCache = new Map();
    for (const [id, factory] of registry) factorySourceCache.set(id, String(factory));
    factorySourceCacheGen = gen;
    return factorySourceCache;
}

let allFactorySourcesCache: string[] | null = null;

export function getAllFactorySources(): string[] {
    const cache = getFactorySourceCache();
    if (allFactorySourcesCache && allFactorySourcesCache.length === cache.size) return allFactorySourcesCache;
    allFactorySourcesCache = [...new Set(cache.values())];
    return allFactorySourcesCache;
}

export function countInSources(sources: string[], text: string, max: number): number {
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
    factorySourceCache = null;
    factorySourceCacheGen = 0;
    allFactorySourcesCache = null;
    reverseCache = null;
    reverseCacheGeneration = 0;
}

export function getFactorySource(id: number): string | null {
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return null;
    const factory = registry.get(id);
    return factory ? String(factory) : null;
}

let reverseCache: Map<unknown, number> | null = null;
let reverseCacheGeneration = 0;

export function findModuleId(exportValue: unknown): number | null {
    const cache = getModuleCache();
    const currentGen = cache.size;
    if (!reverseCache || reverseCacheGeneration !== currentGen) {
        reverseCache = new Map();
        for (const [id, exports] of cache) {
            reverseCache.set(exports, id);
            if (typeof exports === "object" && exports != null) {
                for (const key in exports as Record<string, unknown>) {
                    try {
                        const val = (exports as Record<string, unknown>)[key];
                        if (!reverseCache.has(val)) reverseCache.set(val, id);
                    } catch {}
                }
            }
        }
        reverseCacheGeneration = currentGen;
    }
    return reverseCache.get(exportValue) ?? null;
}

export function getPatchInfo(moduleId: number): string[] | null {
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return null;
    const factory = registry.get(moduleId) as PatchedModuleFactory | undefined;
    return factory?.[SYM_PATCHED_BY] ?? null;
}

export function getPatchedSource(moduleId: number): string | null {
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return null;
    const factory = registry.get(moduleId) as PatchedModuleFactory | undefined;
    return factory?.[SYM_PATCHED_CODE] ?? null;
}

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
    let m;
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

    let m;
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
        let nm;
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

    const codegenRe = /\b(idsert\w+|idsertAndCache\w+)\b/g;
    while ((m = codegenRe.exec(src)) !== null) collect(m[1], "codegen", m.index);

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
