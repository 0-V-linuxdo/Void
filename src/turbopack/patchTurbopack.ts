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

const cacheDiscoveryListeners = new Set<() => void>();

export const patches: Patch[] = [];
const moduleCache = new Map<number, any>();
const waitForSubscriptions = new Map<(mod: any) => boolean, (mod: any, id: number) => void>();

let originalPush: ((...args: any[]) => any) | null = null;
let runtimeModuleCache: Record<number, TurbopackModule> | null = null;
let runtimeFactoryRegistry: Map<number, ModuleFactory> | null = null;
let turbopackHelpers: TurbopackHelpers | null = null;

export let _resolveReady: () => void;
export const onceReady = new Promise<void>(r => (_resolveReady = r));

const patchTimings: Array<[plugin: string, moduleId: number, match: PatchReplacement["match"], totalTime: number]> = [];

export const patchResults: PatchResult[] = [];

export const patchStats: PatchStats = {
    applied: 0,
    noEffect: 0,
    errors: 0,
    runtimeFallbacks: 0,
    patchedModules: new Set<number>(),
};

export function getModuleCache(): Map<number, any> {
    return moduleCache;
}
export function getRuntimeModuleCache(): Record<number, TurbopackModule> | null {
    return runtimeModuleCache;
}
let lastSyncRtCount = 0;
export function syncLazyModules(): void {
    if (!runtimeModuleCache) return;
    let rtCount = 0;
    for (const _ in runtimeModuleCache) rtCount++;
    if (rtCount === lastSyncRtCount) return;
    for (const id in runtimeModuleCache) {
        const mod = runtimeModuleCache[id];
        if (mod?.exports == null) continue;
        const numId = Number(id);
        if (!moduleCache.has(numId)) notifyModuleLoaded(mod.exports, numId);
    }
    lastSyncRtCount = rtCount;
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
    return shouldIgnoreValue(value);
}

function notifyModuleLoaded(exports: any, id: number) {
    if (exports == null) return;
    if (moduleCache.get(id) === exports) return;
    moduleCache.set(id, exports);

    if (waitForSubscriptions.size) {
        for (const [filter, callback] of [...waitForSubscriptions]) {
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

    for (const cb of [...moduleLoadListeners]) {
        try {
            cb();
        } catch (e) {
            logger.error("Module load listener error:", e);
        }
    }
}

function patchFactory(moduleId: number, factory: ModuleFactory): PatchedModuleFactory {
    if (!patches.length) return factory as PatchedModuleFactory;

    const originalCode = String(factory);
    let code = originalCode;
    let patchedFactory: PatchedModuleFactory = factory as PatchedModuleFactory;
    const patchedBy = new Set<string>();

    for (let i = 0; i < patches.length; i++) {
        const patch = patches[i];
        if (patch.predicate && !patch.predicate()) continue;
        const findMatches = Array.isArray(patch.find) ? matchesAllPatterns(originalCode, patch.find) : matchesPattern(originalCode, patch.find);
        if (!findMatches) continue;

        const replacements = Array.isArray(patch.replacement) ? patch.replacement : [patch.replacement];
        const previousCode = code;
        const previousFactory = patchedFactory;
        let allSucceeded = true;
        let groupApplied = 0;
        const result: PatchResult = {
            plugin: patch.plugin,
            find: String(patch.find),
            moduleId,
            replacements: [],
        };

        for (const replacement of replacements) {
            if (replacement.predicate && !replacement.predicate()) continue;
            const lastCode = code;
            const lastFactory = patchedFactory;

            try {
                const { match } = replacement;
                const start = performance.now();
                const newCode = code.replace(match, replacement.replace as string);
                const elapsed = performance.now() - start;

                if (IS_DEV) patchTimings.push([patch.plugin, moduleId, match, elapsed]);

                if (newCode === code) {
                    patchStats.noEffect++;
                    result.replacements.push({ match: String(match), status: "noEffect" });
                    if (!patch.noWarn && !replacement.noWarn) logger.error(`Patch by ${patch.plugin} had no effect: ${String(match)}`);
                    if (patch.group) {
                        allSucceeded = false;
                        break;
                    }
                    continue;
                }

                code = newCode;

                patchedFactory = compileFactory(code) as PatchedModuleFactory;
                patchedFactory[SYM_ORIGINAL] = factory;
                patchedFactory[SYM_PATCHED] = true;
                patchedFactory[SYM_PATCHED_CODE] = code;

                patchedBy.add(patch.plugin);
                patchStats.applied++;
                groupApplied++;
                patchStats.patchedModules.add(moduleId);
                result.replacements.push({ match: String(match), status: "applied" });
            } catch (err) {
                patchStats.errors++;
                result.replacements.push({ match: String(replacement.match), status: "error" });
                logger.error(`Error in patch by ${patch.plugin} on module ${moduleId}:`, err);
                code = lastCode;
                patchedFactory = lastFactory;

                if (patch.group) {
                    allSucceeded = false;
                    break;
                }
            }
        }

        patchResults.push(result);

        if (patch.group && !allSucceeded) {
            patchStats.applied -= groupApplied;
            code = previousCode;
            patchedFactory = previousFactory;
            patchedBy.delete(patch.plugin);
            if (!patch.noWarn) logger.warn(`Group patch by ${patch.plugin} failed, reverting`);
            continue;
        }

        if (!patch.all) patches.splice(i--, 1);
    }

    if (patchedBy.size) {
        const plugins = [...patchedBy].join(", ");
        patchedFactory = compileFactory(
            code,
            `// Turbopack Module ${moduleId} - Patched by ${plugins}`,
            `//# sourceURL=file:///TurbopackModule${moduleId}`,
        ) as PatchedModuleFactory;
        patchedFactory[SYM_ORIGINAL] = factory;
        patchedFactory[SYM_PATCHED] = true;
        patchedFactory[SYM_PATCHED_CODE] = code;
        patchedFactory[SYM_PATCHED_BY] = [...patchedBy];
    }

    return patchedFactory;
}

function wrapFactory(moduleId: number, factory: ModuleFactory): ModuleFactory {
    const patched = patchFactory(moduleId, factory);
    const original = (patched as PatchedModuleFactory)[SYM_ORIGINAL] ?? factory;

    const wrapped: PatchedModuleFactory = function (this: any, helpers: TurbopackHelpers, mod?: TurbopackModule, exports?: Record<string, any>) {
        captureRuntimeState(helpers);

        try {
            patched.call(this, helpers, mod, exports);
        } catch (err) {
            if (patched === factory) throw err;
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
    };

    wrapped.toString = () => String(factory);
    wrapped[SYM_ORIGINAL] = original;
    if ((patched as PatchedModuleFactory)[SYM_PATCHED]) {
        wrapped[SYM_PATCHED] = true;
        wrapped[SYM_PATCHED_BY] = (patched as PatchedModuleFactory)[SYM_PATCHED_BY];
        wrapped[SYM_PATCHED_CODE] = (patched as PatchedModuleFactory)[SYM_PATCHED_CODE];
    }

    return wrapped;
}

function patchChunkEntry(entry: any[]): any[] {
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
            const wrapped = wrapFactory(prev, factory);
            wrappedInChunk.set(factory, wrapped);
            patchedEntry[i] = wrapped;
        }
    }
    return patchedEntry ?? entry;
}

function handleChunkPush(...args: any[]) {
    for (let i = 0; i < args.length; i++) {
        if (Array.isArray(args[i])) args[i] = patchChunkEntry(args[i]);
    }
    return originalPush!(...args);
}

export function patchReport(): PatchReport {
    return {
        stats: { ...patchStats, patchedModules: [...patchStats.patchedModules] },
        results: patchResults,
        orphaned: patches.filter(p => !p.all).map(p => ({ plugin: p.plugin, find: String(p.find) })),
    };
}

export function reportOrphanedPatches(): void {
    const orphaned = patches.filter(p => !p.all);
    if (orphaned.length)
        logger.warn(
            `${orphaned.length} patch(es) found no module:`,
            orphaned.map(p => `${p.plugin}: ${String(p.find)}`),
        );

    if (patchStats.noEffect || patchStats.errors) {
        for (const result of patchResults) {
            for (const rep of result.replacements) {
                if (rep.status === "noEffect") logger.error(`[no effect] ${result.plugin} on ${result.moduleId}: ${rep.match}`);
                else if (rep.status === "error") logger.error(`[error] ${result.plugin} on ${result.moduleId}: ${rep.match}`);
            }
        }
    }

    if (IS_DEV) {
        const slow = patchTimings.filter(([, , , t]) => t > 5);
        for (const [plugin, moduleId, match, time] of slow) logger.warn(`Slow patch: ${plugin} on ${moduleId} took ${time.toFixed(2)}ms (${String(match)})`);
    }

    logger.info(`Patches: ${patchStats.applied} applied, ${patchStats.noEffect} no-effect, ${patchStats.errors} errors, ${patchStats.runtimeFallbacks} fallbacks, ${orphaned.length} orphaned`);
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
    return captured as Map<number, ModuleFactory> | null;
}

function captureRuntimeState(helpers: TurbopackHelpers) {
    if (!turbopackHelpers) turbopackHelpers = helpers;
    if (!runtimeModuleCache && helpers.c) {
        runtimeModuleCache = helpers.c;
        scanExistingModules(runtimeModuleCache);
        for (const cb of cacheDiscoveryListeners) {
            try { cb(); } catch (e) { logger.error("Cache discovery listener error:", e); }
        }
        cacheDiscoveryListeners.clear();
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
        for (const [id, factory] of runtimeFactoryRegistry) {
            runtimeFactoryRegistry.set(id, wrapFactory(id, factory));
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
