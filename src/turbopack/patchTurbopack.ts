/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import type { Patch, PatchReplacement } from "@utils/types";

import { matchesAllPatterns, matchesPattern } from "./match";
import { type ModuleFactory, type PageWindow, type PatchedModuleFactory, type PatchReport, type PatchResult, type PatchStats, SYM_ORIGINAL, SYM_PATCHED, SYM_PATCHED_BY, SYM_PATCHED_CODE, type TurbopackHelpers, type TurbopackModule, type TurbopackPushable } from "./types";

const logger = new Logger("TurbopackPatcher", "#e78284");
const pageWindow = (typeof unsafeWindow !== "undefined" ? unsafeWindow : window) as PageWindow;

const FACTORY_PROBE_ID = 0x7ffffffe;

const motionSymbol = Symbol.for("motionComponentSymbol");

let compileCounter = 0;

const compileFactory: (code: string, header?: string, sourceUrl?: string) => ModuleFactory = IS_EXTENSION
    ? (code, header, sourceUrl) => {
        let body = `return(${code})`;
        if (header) body = `${header}\n${body}`;
        if (sourceUrl) body += `\n${sourceUrl}`;
        return new Function(body)() as ModuleFactory;
    }
    : (code, header, sourceUrl) => {
        const key = `__void_eval_${compileCounter++}`;
        const script = document.createElement("script");
        let src = `window["${key}"]=(${code});`;
        if (header) src = `${header}\n${src}`;
        if (sourceUrl) src += `\n${sourceUrl}`;
        script.textContent = src;
        (document.head ?? document.documentElement).appendChild(script);
        script.remove();
        const fn = (pageWindow as any)[key];
        delete (pageWindow as any)[key];
        if (!fn) throw new Error("Factory compilation failed (CSP?)");
        return fn;
    };

export const patches: Patch[] = [];
const moduleCache = new Map<number, any>();
const waitForSubscriptions = new Map<(mod: any) => boolean, (mod: any, id: number) => void>();

let originalPush: ((...args: any[]) => any) | null = null;
let runtimeModuleCache: Record<number, TurbopackModule> | null = null;
let runtimeFactoryRegistry: Map<number, ModuleFactory> | null = null;
let turbopackHelpers: TurbopackHelpers | null = null;

export let _resolveReady: () => void;
export const onceReady = new Promise<void>(r => (_resolveReady = r));

interface PatchTiming {
    plugin: string;
    moduleId: number;
    match: PatchReplacement["match"];
    findTime: number;
    replaceTime: number;
    compileTime: number;
}

const patchTimings: PatchTiming[] = [];

export const patchResults: PatchResult[] = [];

export const patchStats: PatchStats = {
    applied: 0,
    noEffect: 0,
    errors: 0,
    runtimeFallbacks: 0,
    patchedModules: new Set<number>(),
};

const factoryStringCache = new WeakMap<ModuleFactory, string>();

function getFactorySource(factory: ModuleFactory): string {
    let source = factoryStringCache.get(factory);
    if (source === undefined) {
        source = String(factory);
        factoryStringCache.set(factory, source);
    }
    return source;
}

function getMinFindLength(patch: Patch): number {
    const finds = Array.isArray(patch.find) ? patch.find : [patch.find];
    let max = 0;
    for (const f of finds) {
        const len = typeof f === "string" ? f.length : 0;
        if (len > max) max = len;
    }
    return max;
}

export function getModuleCache(): Map<number, any> {
    return moduleCache;
}
export function getRuntimeModuleCache(): Record<number, TurbopackModule> | null {
    return runtimeModuleCache;
}
let lastSyncRtCount = 0;
export function syncLazyModules(): void {
    if (!runtimeModuleCache) return;
    const keys = Object.keys(runtimeModuleCache);
    if (keys.length === lastSyncRtCount) return;
    for (const id of keys) {
        const numId = Number(id);
        const mod = runtimeModuleCache[numId];
        if (mod?.exports == null) continue;
        if (!moduleCache.has(numId)) notifyModuleLoaded(mod.exports, numId);
    }
    lastSyncRtCount = keys.length;
}
export function getRuntimeFactoryRegistry(): Map<number, ModuleFactory> | null {
    return runtimeFactoryRegistry;
}
export function getTurbopackHelpers(): TurbopackHelpers | null {
    return turbopackHelpers;
}

export function addWaitForSubscription(filter: (mod: any) => boolean, cb: (mod: any, id: number) => void) {
    waitForSubscriptions.set(filter, cb);
}

export function removeWaitForSubscription(filter: (mod: any) => boolean) {
    waitForSubscriptions.delete(filter);
}

const moduleLoadListeners = new Set<() => void>();

export function onModuleLoad(cb: () => void): () => void {
    moduleLoadListeners.add(cb);
    return () => moduleLoadListeners.delete(cb);
}

const badExports = new WeakSet();

function shouldIgnoreValue(value: any): boolean {
    if (value == null) return true;
    const t = typeof value;
    if (t !== "object" && t !== "function") return true;
    if (value === window || value === document || value === document.documentElement) return true;
    try {
        if ((value as Record<symbol | string, any>)[Symbol.toStringTag] === "DOMTokenList") return true;
        if ((value as Record<symbol, any>)[motionSymbol]) return true;
    } catch {
        return true;
    }
    return (
        value instanceof HTMLElement ||
        value instanceof ArrayBuffer ||
        value instanceof MessagePort ||
        value instanceof Map ||
        value instanceof Set ||
        value instanceof WeakMap ||
        value instanceof WeakSet ||
        ArrayBuffer.isView(value) ||
        (typeof WebSocket !== "undefined" && value instanceof WebSocket)
    );
}

let warnsSuppressed = false;
export function silenceWarns<T>(fn: () => T): T {
    if (warnsSuppressed) return fn();
    warnsSuppressed = true;
    const orig = console.warn;
    console.warn = (...args: any[]) => {
        if (args.some(a => typeof a === "string" && (a.includes("has been renamed to") || a.includes("silence this warning")))) return;
        if (args.length === 1 && args[0] === "") return;
        orig.apply(console, args);
    };
    try {
        return fn();
    } finally {
        console.warn = orig;
        warnsSuppressed = false;
    }
}

export function blacklistBadModules(): void {
    silenceWarns(() => {
        for (const [, exports] of moduleCache) {
            if (shouldIgnoreValue(exports)) {
                if (exports != null && (typeof exports === "object" || typeof exports === "function")) badExports.add(exports);
                continue;
            }
            if (typeof exports !== "object") continue;
            for (const key in exports) {
                try {
                    const v = exports[key];
                    if (shouldIgnoreValue(v) && v != null && (typeof v === "object" || typeof v === "function")) badExports.add(v);
                } catch {}
            }
        }
    });
}

export function isBlacklisted(value: any): boolean {
    if (value == null) return false;
    const t = typeof value;
    if (t !== "object" && t !== "function") return false;
    if (badExports.has(value)) return true;
    if (shouldIgnoreValue(value)) {
        badExports.add(value);
        return true;
    }
    return false;
}

function notifyModuleLoaded(exports: any, id: number) {
    if (exports == null) return;
    if (moduleCache.get(id) === exports) return;
    moduleCache.set(id, exports);

    if (waitForSubscriptions.size) {
        for (const [filter, callback] of waitForSubscriptions) {
            try {
                if (!waitForSubscriptions.has(filter)) continue;
                if (filter(exports)) {
                    waitForSubscriptions.delete(filter);
                    callback(exports, id);
                }
            } catch (e) {
                logger.error("WaitFor listener error:", e);
            }
        }
    }

    if (moduleLoadListeners.size) {
        for (const cb of moduleLoadListeners) {
            try {
                cb();
            } catch (e) {
                logger.error("Module load listener error:", e);
            }
        }
    }
}

interface LazyPatchResult {
    code: string;
    plugins: string[];
}

function patchFactory(moduleId: number, factory: ModuleFactory): LazyPatchResult | null {
    if (!patches.length) return null;

    const originalCode = getFactorySource(factory);
    const codeLen = originalCode.length;
    let code = originalCode;
    const patchedBy = new Set<string>();

    for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];
        if (patch.predicate && !patch.predicate()) continue;

        const minLen = getMinFindLength(patch);
        if (minLen > codeLen) continue;

        const findStart = IS_DEV ? performance.now() : 0;
        const findMatches = Array.isArray(patch.find) ? matchesAllPatterns(originalCode, patch.find) : matchesPattern(originalCode, patch.find);
        const findElapsed = IS_DEV ? performance.now() - findStart : 0;
        if (!findMatches) continue;

        const replacements = Array.isArray(patch.replacement) ? patch.replacement : [patch.replacement];

        if (patch.validateOnly) {
            for (const replacement of replacements) {
                if (replacement.predicate && !replacement.predicate()) continue;
                const { match } = replacement;
                const matches = match instanceof RegExp ? match.test(originalCode) : originalCode.includes(match as string);
                if (!matches && !patch.noWarn && !replacement.noWarn) {
                    logger.warn(`[validate] ${patch.plugin}: ${String(match)}`);
                }
            }
            if (!patch.all) patches.splice(i--, 1);
            continue;
        }

        const previousCode = code;
        let allSucceeded = true;
        let groupApplied = 0;
        let groupNoEffect = 0;
        let groupErrors = 0;
        const result: PatchResult = {
            plugin: patch.plugin,
            find: String(patch.find),
            moduleId,
            replacements: [],
        };

        for (const replacement of replacements) {
            if (replacement.predicate && !replacement.predicate()) continue;
            const lastCode = code;

            try {
                const { match } = replacement;
                const start = performance.now();
                const newCode = code.replace(match, replacement.replace as string);
                const replaceElapsed = performance.now() - start;

                if (IS_DEV) patchTimings.push({ plugin: patch.plugin, moduleId, match, findTime: findElapsed, replaceTime: replaceElapsed, compileTime: 0 });

                if (newCode === code) {
                    groupNoEffect++;
                    result.replacements.push({ match: String(match), status: "noEffect" });
                    if (patch.group) {
                        allSucceeded = false;
                        break;
                    }
                    continue;
                }

                code = newCode;
                patchedBy.add(patch.plugin);
                groupApplied++;
                result.replacements.push({ match: String(match), status: "applied" });
            } catch (err) {
                groupErrors++;
                result.replacements.push({ match: String(replacement.match), status: "error" });
                logger.error(`Error in patch by ${patch.plugin} on module ${moduleId}:`, err);
                code = lastCode;

                if (patch.group) {
                    allSucceeded = false;
                    break;
                }
            }
        }

        if (patch.group && !allSucceeded) {
            code = previousCode;
            patchedBy.delete(patch.plugin);
            for (const r of result.replacements) {
                if (r.status === "applied") r.status = "reverted";
            }
            patchResults.push(result);
            if (!patch.noWarn) logger.warn(`Group patch by ${patch.plugin} failed, reverting`);
            continue;
        }

        patchResults.push(result);

        patchStats.applied += groupApplied;
        patchStats.noEffect += groupNoEffect;
        patchStats.errors += groupErrors;
        if (groupApplied) patchStats.patchedModules.add(moduleId);

        if (!patch.all) patches.splice(i--, 1);
    }

    if (!patchedBy.size) return null;
    return { code, plugins: [...patchedBy] };
}

function createLazyFactory(moduleId: number, patchResult: LazyPatchResult, original: ModuleFactory): PatchedModuleFactory {
    const { code, plugins } = patchResult;
    let compiled: ModuleFactory | null = null;

    const lazy: PatchedModuleFactory = function (this: any, helpers: TurbopackHelpers, mod?: TurbopackModule, exports?: Record<string, any>) {
        if (!compiled) {
            const compileStart = IS_DEV ? performance.now() : 0;
            try {
                compiled = compileFactory(
                    code,
                    `// Turbopack Module ${moduleId} - Patched by ${plugins.join(", ")}`,
                    `//# sourceURL=file:///TurbopackModule${moduleId}`,
                );
            } catch (err) {
                logger.error(`Failed to compile patched module ${moduleId} (${plugins.join(", ")}), using original:`, err);
                patchStats.errors++;
                compiled = original;
            }
            if (IS_DEV) {
                const compileElapsed = performance.now() - compileStart;
                for (let i = patchTimings.length - 1; i >= 0; i--) {
                    if (patchTimings[i].moduleId === moduleId) {
                        patchTimings[i].compileTime = compileElapsed;
                        break;
                    }
                }
            }
        }
        compiled.call(this, helpers, mod, exports);
    };

    lazy.toString = () => getFactorySource(original);
    lazy[SYM_ORIGINAL] = original;
    lazy[SYM_PATCHED] = true;
    lazy[SYM_PATCHED_BY] = plugins;
    lazy[SYM_PATCHED_CODE] = code;
    return lazy;
}

function wrapFactory(moduleId: number, factory: ModuleFactory): ModuleFactory {
    const patchResult = patchFactory(moduleId, factory);
    const patched = patchResult ? createLazyFactory(moduleId, patchResult, factory) : factory;
    const original = (patched as PatchedModuleFactory)[SYM_ORIGINAL] ?? factory;
    const isPatched = !!(patched as PatchedModuleFactory)[SYM_PATCHED];

    const wrapped: PatchedModuleFactory = function (this: any, helpers: TurbopackHelpers, mod?: TurbopackModule, exports?: Record<string, any>) {
        captureRuntimeState(helpers);

        try {
            patched.call(this, helpers, mod, exports);
        } catch (err) {
            if (!isPatched) throw err;
            patchStats.runtimeFallbacks++;
            logger.error(`Patched module ${mod?.id ?? moduleId} errored, using original:`, err);
            try {
                original.call(this, helpers, mod, exports);
            } catch (origErr) {
                logger.error(`Original module ${mod?.id ?? moduleId} also errored:`, origErr);
                throw origErr;
            }
        }

        try {
            const actualId = mod?.id ?? moduleId;
            if (mod?.exports != null) notifyModuleLoaded(mod.exports, actualId);
        } catch (e) {
            logger.error(`Module notification error for ${mod?.id ?? moduleId}:`, e);
        }

        factoryStringCache.delete(factory);
    };

    wrapped.toString = () => getFactorySource(factory);
    wrapped[SYM_ORIGINAL] = original;
    if (isPatched) {
        wrapped[SYM_PATCHED] = true;
        wrapped[SYM_PATCHED_BY] = (patched as PatchedModuleFactory)[SYM_PATCHED_BY];
        wrapped[SYM_PATCHED_CODE] = (patched as PatchedModuleFactory)[SYM_PATCHED_CODE];
    }

    return wrapped;
}

let chunksWithFactories = 0;
let chunksWithoutFactories = 0;

function patchChunkEntry(entry: any[]): any[] {
    const hasPatches = patches.length > 0;
    let patchedEntry: any[] | null = null;
    const wrappedInChunk = new Map<ModuleFactory, ModuleFactory>();

    for (let i = 1; i < entry.length; i++) {
        if (typeof entry[i] !== "function") continue;

        const prev = entry[i - 1];
        if (typeof prev !== "number") continue;

        if (!patchedEntry) patchedEntry = [...entry];
        const factory = entry[i] as ModuleFactory;
        const existing = wrappedInChunk.get(factory);
        if (existing) {
            patchedEntry[i] = existing;
        } else {
            const wrapped = hasPatches ? wrapFactory(prev, factory) : wrapNotifyOnly(prev, factory);
            wrappedInChunk.set(factory, wrapped);
            patchedEntry[i] = wrapped;
        }
    }

    if (entry.length > 2) {
        if (wrappedInChunk.size) chunksWithFactories++;
        else chunksWithoutFactories++;

        if (IS_DEV && !chunksWithFactories && chunksWithoutFactories >= 5)
            logger.warn("No [id, factory] pairs found in first chunks — Turbopack format may have changed");
    }

    return patchedEntry ?? entry;
}

function wrapNotifyOnly(moduleId: number, factory: ModuleFactory): ModuleFactory {
    const wrapped = function (this: any, helpers: TurbopackHelpers, mod?: TurbopackModule, exports?: Record<string, any>) {
        captureRuntimeState(helpers);
        factory.call(this, helpers, mod, exports);
        try {
            const actualId = mod?.id ?? moduleId;
            if (mod?.exports != null) notifyModuleLoaded(mod.exports, actualId);
        } catch (e) {
            logger.error(`Module notification error for ${mod?.id ?? moduleId}:`, e);
        }
    };
    wrapped.toString = () => getFactorySource(factory);
    return wrapped;
}

function handleChunkPush(...args: any[]) {
    for (let i = 0; i < args.length; i++) {
        if (Array.isArray(args[i])) args[i] = patchChunkEntry(args[i]);
    }
    return originalPush!(...args);
}

function isFactoryPending(patch: Patch): boolean {
    if (!runtimeFactoryRegistry) return false;
    const find = Array.isArray(patch.find) ? patch.find : [patch.find];
    for (const [, factory] of runtimeFactoryRegistry) {
        if (matchesAllPatterns(getFactorySource(factory), find)) return true;
    }
    return false;
}

export function patchReport(): PatchReport {
    const unmatched = patches.filter(p => !p.all);
    return {
        stats: { ...patchStats, patchedModules: [...patchStats.patchedModules] },
        results: patchResults,
        orphaned: unmatched.filter(p => !isFactoryPending(p)).map(p => ({ plugin: p.plugin, find: String(p.find) })),
        pending: unmatched.filter(p => isFactoryPending(p)).map(p => ({ plugin: p.plugin, find: String(p.find) })),
    };
}

export function reportOrphanedPatches(): void {
    const unmatched = patches.filter(p => !p.all);
    const orphaned = unmatched.filter(p => !isFactoryPending(p));
    const warnOrphaned = orphaned.filter(p => !p.noWarn);
    if (warnOrphaned.length)
        logger.warn(
            `${warnOrphaned.length} patch(es) found no module:`,
            warnOrphaned.map(p => `${p.plugin}: ${String(p.find)}`),
        );

    if (patchStats.noEffect || patchStats.errors) {
        for (const result of patchResults) {
            for (const rep of result.replacements) {
                if (rep.status === "noEffect") logger.error(`[no effect] ${result.plugin}: ${rep.match}`);
                else if (rep.status === "error") logger.error(`[error] ${result.plugin}: ${rep.match}`);
            }
        }
    }

    if (IS_DEV) {
        for (const t of patchTimings) {
            const patchTime = t.findTime + t.replaceTime;
            if (patchTime <= 10) continue;
            logger.warn(`Slow patch: ${t.plugin} on ${t.moduleId} (find: ${t.findTime.toFixed(1)}ms, replace: ${t.replaceTime.toFixed(1)}ms) ${String(t.match)}`);
        }
    }

}

function scanCache(cache: Record<number, TurbopackModule>): number {
    let count = 0;
    for (const id in cache) {
        const mod = cache[id];
        if (mod?.exports == null) continue;
        const numId = Number(id);
        if (moduleCache.get(numId) !== mod.exports) {
            notifyModuleLoaded(mod.exports, numId);
            count++;
        }
    }
    return count;
}

function scanExistingModules(cache: Record<number, TurbopackModule>) {
    const count = scanCache(cache);
    if (IS_DEV) logger.debug(`Scanned ${count} existing modules`);
}

export function rescanRuntimeModules(): void {
    if (!runtimeModuleCache) return;
    const count = scanCache(runtimeModuleCache);
    if (count > 0) logger.info(`Rescan found ${count} new/updated modules`);
}

function captureFactoryRegistry(): Map<number, ModuleFactory> | null {
    const origMapSet = Map.prototype.set;
    let captured: Map<number, any> | null = null;

    Map.prototype.set = function (key: any, value: any) {
        if (!captured && key === FACTORY_PROBE_ID && typeof value === "function") {
            captured = this;
        }
        return origMapSet.call(this, key, value);
    };

    try {
        originalPush!(["void-factory-probe", FACTORY_PROBE_ID, () => {}]);
    } finally {
        Map.prototype.set = origMapSet;
    }

    (captured as Map<number, any> | null)?.delete(FACTORY_PROBE_ID);

    if (captured) {
        let valid = 0;
        for (const [k, v] of captured as Map<number, any>) {
            if (typeof k === "number" && typeof v === "function" && ++valid >= 3) break;
        }
        if (valid < 3) {
            logger.warn("Captured Map doesn't look like a factory registry, discarding");
            return null;
        }
    }

    return captured as Map<number, ModuleFactory> | null;
}

function captureRuntimeState(helpers: TurbopackHelpers) {
    if (!turbopackHelpers) turbopackHelpers = helpers;
    if (!runtimeModuleCache && helpers.c) {
        runtimeModuleCache = helpers.c;
        scanExistingModules(runtimeModuleCache);
    }
    if (!runtimeFactoryRegistry && helpers.M) runtimeFactoryRegistry = helpers.M;
}

function captureModuleCache(factoryRegistry: Map<number, ModuleFactory>): void {
    const PROBE_ID = FACTORY_PROBE_ID - 1;
    factoryRegistry.set(PROBE_ID, ((helpers: TurbopackHelpers) => captureRuntimeState(helpers)) as ModuleFactory);

    originalPush!(["void-cache-probe", { otherChunks: [], runtimeModuleIds: [PROBE_ID] }]);

    Promise.resolve().then(() => factoryRegistry.delete(PROBE_ID));
}

function wrapExistingFactories() {
    runtimeFactoryRegistry = captureFactoryRegistry();
    if (runtimeFactoryRegistry) {
        const registry = runtimeFactoryRegistry;
        const wrapped = new Map<ModuleFactory, ModuleFactory>();

        // Hook Map.get so any factory read by the runtime during or after
        // iteration is guaranteed to be wrapped before execution. This closes
        // the race where Turbopack instantiates a module from the registry
        // before our iteration reaches it (common on soft-reload / F5).
        const origGet = registry.get.bind(registry);
        registry.get = function (id: number) {
            const factory = origGet(id);
            if (factory == null || (factory as PatchedModuleFactory)[SYM_ORIGINAL]) return factory;
            const existing = wrapped.get(factory);
            if (existing) {
                registry.set(id, existing);
                return existing;
            }
            const w = wrapFactory(id, factory);
            wrapped.set(factory, w);
            registry.set(id, w);
            return w;
        } as any;

        for (const [id, factory] of registry) {
            if ((factory as PatchedModuleFactory)[SYM_ORIGINAL]) continue;
            const existing = wrapped.get(factory);
            if (existing) {
                registry.set(id, existing);
            } else {
                const w = wrapFactory(id, factory);
                wrapped.set(factory, w);
                registry.set(id, w);
            }
        }
    }
    if (!runtimeModuleCache && runtimeFactoryRegistry) {
        captureModuleCache(runtimeFactoryRegistry);
    }
}

export function patchTurbopack(): void {
    const existingTp = pageWindow.TURBOPACK;

    if (existingTp && !Array.isArray(existingTp) && typeof existingTp.push === "function") {
        originalPush = existingTp.push.bind(existingTp);
        existingTp.push = (...args: any[]) => handleChunkPush(...args);
        wrapExistingFactories();
        return;
    }

    const queuedChunks: any[][] = [];
    if (Array.isArray(existingTp)) queuedChunks.push(...(existingTp as any[][]));

    let currentTurbopack: TurbopackPushable | any[] = existingTp ?? [];

    Object.defineProperty(pageWindow, "TURBOPACK", {
        configurable: true,
        get() {
            return currentTurbopack;
        },
        set(newValue: any) {
            if (newValue && !Array.isArray(newValue) && typeof (newValue as TurbopackPushable).push === "function") {
                const tp = newValue as TurbopackPushable;
                originalPush = tp.push.bind(tp);
                tp.push = (...args: any[]) => handleChunkPush(...args);
                currentTurbopack = tp;

                for (const chunk of queuedChunks) {
                    try {
                        handleChunkPush(chunk);
                    } catch (e) {
                        logger.error("Failed to process queued chunk:", e);
                    }
                }
                queuedChunks.length = 0;

                wrapExistingFactories();
            } else {
                currentTurbopack = newValue as TurbopackPushable | any[];
            }
        },
    });

    if (Array.isArray(currentTurbopack)) {
        const origPush = currentTurbopack.push.bind(currentTurbopack);
        (currentTurbopack as any[]).push = (...args: any[]) => {
            queuedChunks.push(...(args as any[][]));
            return origPush(...args);
        };
    }
}
