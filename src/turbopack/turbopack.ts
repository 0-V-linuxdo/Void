/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ZustandStore } from "@grok-types/zustand";
import { proxyLazy } from "@utils/lazy";
import { LazyComponent } from "@utils/lazyReact";
import { Logger } from "@utils/Logger";
import { escapeRegExp } from "@utils/text";

import { matchesAllPatterns } from "./match";
import { addWaitForSubscription, getModuleCache, getRuntimeFactoryRegistry, getTurbopackHelpers, isBlacklisted, removeWaitForSubscription, silenceWarns, syncLazyModules } from "./patchTurbopack";
import type { FilterFn, ModuleFactory } from "./types";

export { matchesAllPatterns, matchesPattern } from "./match";

const logger = new Logger("TurbopackFinder", "#a6d189");

import { getFnSource } from "./fnSource";

const zustandStoreCache = new Map<string, any>();

interface FinderRecord {
    type: string;
    args: string[];
    resolve: () => any;
}

const finderRegistry: FinderRecord[] | null = IS_DEV ? [] : null;

function trackFinder(type: string, args: string[], resolve: () => any): void {
    finderRegistry?.push({ type, args, resolve });
}

function isEmptyResult(value: any): boolean {
    if (value == null) return true;
    return typeof value === "object" && Object.keys(value).length === 0;
}

export function reportFailedFinders(): void {
    if (!finderRegistry?.length) return;

    const failed: string[] = [];
    for (const record of finderRegistry) {
        try {
            if (isEmptyResult(record.resolve())) failed.push(`${record.type}(${record.args.map(a => JSON.stringify(a)).join(", ")})`);
        } catch (e) {
            logger.warn("Finder resolution error:", e);
        }
    }

    if (failed.length) logger.debug(`${failed.length} finder(s) resolved to nothing:`, failed);
}

export { fnSourceCache, getFnSource } from "./fnSource";

function toZustandHookName(name: string): string {
    if (name.startsWith("use")) return name;
    return name.endsWith("Store") ? `use${name}` : `use${name}Store`;
}

export function isZustandStore(val: any): val is ZustandStore<any> {
    return typeof val === "function"
        && typeof val.getState === "function"
        && typeof val.setState === "function"
        && typeof val.subscribe === "function";
}

export const filters = {
    byProps: (...props: string[]): FilterFn => {
        return props.length === 1 ? m => m[props[0]] != null : m => props.every(p => m[p] != null);
    },

    byCode: (...code: (string | RegExp)[]): FilterFn => {
        return m => {
            if (typeof m !== "function") return false;
            return matchesAllPatterns(getFnSource(m), code);
        };
    },

    byDisplayName: (name: string): FilterFn => {
        return m => m?.displayName === name || m?.render?.displayName === name;
    },

    byStoreName: (name: string): FilterFn => {
        const hookName = toZustandHookName(name);
        return m => {
            if (typeof m !== "object" || m === null) return false;
            const hook = m[hookName];
            return typeof hook === "function" && typeof hook.getState === "function";
        };
    },

    componentByCode: (...code: (string | RegExp)[]): FilterFn => {
        const byCode = filters.byCode(...code);
        return m => {
            if (byCode(m)) return true;
            if (!m?.$$typeof) return false;
            if (m.type) return byCode(m.type);
            if (m.render) return byCode(m.render);
            return false;
        };
    },

    byClassName: (...classes: string[]): FilterFn => {
        return m => {
            if (typeof m !== "object" || m === null) return false;
            return classes.every(c => typeof m[c] === "string");
        };
    },
};

function withLazySync<T>(scan: () => T, isEmpty: (result: T) => boolean): T {
    return silenceWarns(() => {
        const result = scan();
        if (!isEmpty(result)) return result;
        const prevSize = getModuleCache().size;
        syncLazyModules();
        if (getModuleCache().size === prevSize) return result;
        return scan();
    });
}

function searchCache(filter: FilterFn, collectAll: true, topLevelOnly?: boolean): any[];
function searchCache(filter: FilterFn, collectAll?: false, topLevelOnly?: boolean): any;
function searchCache(filter: FilterFn, collectAll = false, topLevelOnly = false): any {
    return withLazySync(
        () => scanModuleCache(filter, collectAll, topLevelOnly),
        result => collectAll ? !(result as any[]).length : !result,
    );
}

function scanModuleCache(filter: FilterFn, collectAll: boolean, topLevelOnly: boolean): any {
    const results: any[] = [];
    const seen: Set<any> | null = collectAll ? new Set() : null;
    const cache = getModuleCache();

    for (const [, exports] of cache) {
        if (exports == null || isBlacklisted(exports)) continue;

        try {
            if (filter(exports)) {
                if (!collectAll) return exports;
                if (!seen!.has(exports)) {
                    seen!.add(exports);
                    results.push(exports);
                }
                continue;
            }
        } catch {}

        if (!topLevelOnly && typeof exports === "object") {
            for (const key in exports) {
                try {
                    const nested = exports[key];
                    if (nested == null || isBlacklisted(nested)) continue;
                    if (filter(nested)) {
                        if (!collectAll) return nested;
                        if (!seen!.has(nested)) {
                            seen!.add(nested);
                            results.push(nested);
                        }
                    }
                } catch {}
            }
        }
    }

    return collectAll ? results : null;
}

export function find(filter: FilterFn): any {
    return searchCache(filter);
}

export function findAll(filter: FilterFn): any[] {
    return searchCache(filter, true);
}

export function findLazy(filter: FilterFn): any {
    const cached = searchCache(filter);
    if (cached) return cached;
    trackFinder("find", [String(filter)], () => searchCache(filter));
    return proxyLazy(() => searchCache(filter));
}

function makeFinder(name: string, filterFactory: (...args: any[]) => FilterFn) {
    const finder = (...args: any[]) => find(filterFactory(...args));
    const lazy = (...args: any[]) => {
        const resolve = () => finder(...args);
        trackFinder(name, args.map(String), resolve);
        return proxyLazy(resolve);
    };
    return [finder, lazy] as const;
}

export const [findByProps, findByPropsLazy] = makeFinder("findByProps", filters.byProps);
export const [findByCode, findByCodeLazy] = makeFinder("findByCode", filters.byCode);
export const [findByDisplayName, findByDisplayNameLazy] = makeFinder("findByDisplayName", filters.byDisplayName);

export function findComponentByCode(...code: (string | RegExp)[]): any {
    return find(filters.componentByCode(...code));
}

export function findComponentByCodeLazy(...code: (string | RegExp)[]): any {
    const resolve = () => findComponentByCode(...code);
    trackFinder("findComponentByCode", code.map(String), resolve);
    return LazyComponent("findComponentByCode", resolve);
}

export function findExportedComponent(...props: string[]): any {
    return withLazySync(() => scanExportedComponent(props), result => !result);
}

function scanExportedComponent(props: string[]): any {
    const cache = getModuleCache();
    for (const [, exports] of cache) {
        if (exports == null || typeof exports !== "object" || isBlacklisted(exports)) continue;
        for (const prop of props) {
            try {
                const comp = exports[prop];
                if (comp == null || isBlacklisted(comp)) continue;
                if (typeof comp === "function" || comp?.$$typeof) return comp;
            } catch {}
        }
    }
    return null;
}

export function findExportedComponentLazy(...props: string[]): any {
    const resolve = () => findExportedComponent(...props);
    trackFinder("findExportedComponent", props, resolve);
    return LazyComponent(props[0], resolve);
}

function collectStores(): void {
    for (const [, exports] of getModuleCache()) {
        if (exports == null || typeof exports !== "object" || isBlacklisted(exports)) continue;
        for (const key in exports) {
            try {
                if (zustandStoreCache.has(key)) continue;
                const val = exports[key];
                if (isZustandStore(val)) zustandStoreCache.set(key, val);
            } catch {}
        }
    }
}

function populateStoreCache(): void {
    silenceWarns(() => {
        collectStores();
        const prevSize = getModuleCache().size;
        syncLazyModules();
        if (getModuleCache().size !== prevSize) collectStores();
    });
}

export function findStore(name: string): any {
    const hookName = toZustandHookName(name);
    if (zustandStoreCache.has(hookName)) return zustandStoreCache.get(hookName);
    if (!zustandStoreCache.size) populateStoreCache();
    if (zustandStoreCache.has(hookName)) return zustandStoreCache.get(hookName);
    const mod = find(filters.byStoreName(name));
    const hook = mod?.[hookName] ?? mod;
    if (!hook || !isZustandStore(hook)) return undefined;
    zustandStoreCache.set(hookName, hook);
    return hook;
}

export function findStoreLazy(name: string): any {
    const resolve = () => findStore(name);
    trackFinder("findStore", [name], resolve);
    return proxyLazy(resolve);
}

export function getAllStores(): Map<string, any> {
    if (!zustandStoreCache.size) populateStoreCache();
    return new Map(zustandStoreCache);
}

export function findCssClasses(...classes: string[]): Record<string, string> {
    const mod = searchCache(filters.byClassName(...classes), false, true);
    if (!mod) return {} as Record<string, string>;
    return mapMangledCssClasses(mod, classes);
}

export function findCssClassesLazy(...classes: string[]): Record<string, string> {
    const resolve = () => findCssClasses(...classes);
    trackFinder("findCssClasses", classes, resolve);
    return proxyLazy(resolve);
}

export function mapMangledCssClasses<S extends string>(mod: Record<string, string>, classes: S[] | readonly S[]): Record<S, string> {
    const result = {} as Record<S, string>;
    for (const name of classes) {
        const regex = new RegExp(`(?:\\b|_)${escapeRegExp(name)}(?:\\b|_)`);
        for (const key in mod) {
            if (typeof mod[key] === "string" && regex.test(mod[key])) {
                result[name] = mod[key];
                break;
            }
        }
        if (!(name in result)) logger.warn(`mapMangledCssClasses: class "${name}" not found in module`);
    }
    return result;
}

export function findBulk(...filterFns: FilterFn[]): any[] {
    const { length } = filterFns;
    if (length < 2) {
        logger.warn("findBulk called with fewer than 2 filters, use find instead.");
        return length === 1 ? [find(filterFns[0])] : [];
    }

    const scan = () => {
        const activeFilters: Array<FilterFn | undefined> = [...filterFns];
        const results = new Array(length).fill(null);
        let found = 0;
        const cache = getModuleCache();

        outer: for (const [, exports] of cache) {
            if (exports == null || isBlacklisted(exports)) continue;

            for (let j = 0; j < length; j++) {
                const filter = activeFilters[j];
                if (!filter) continue;
                try {
                    if (filter(exports)) {
                        results[j] = exports;
                        activeFilters[j] = undefined;
                        if (++found === length) break outer;
                    }
                } catch {}
            }

            if (typeof exports === "object") {
                for (const key in exports) {
                    try {
                        const nested = exports[key];
                        if (nested == null || isBlacklisted(nested)) continue;
                        for (let j = 0; j < length; j++) {
                            const filter = activeFilters[j];
                            if (!filter) continue;
                            if (filter(nested)) {
                                results[j] = nested;
                                activeFilters[j] = undefined;
                                if (++found === length) break outer;
                                break;
                            }
                        }
                    } catch {}
                }
            }
        }

        return { results, found };
    };

    return silenceWarns(() => {
        let { results, found } = scan();

        if (found < length) {
            const prevSize = getModuleCache().size;
            syncLazyModules();
            if (getModuleCache().size > prevSize) ({ results, found } = scan());
        }

        if (found !== length) logger.warn(`findBulk: got ${length} filters but only found ${found} modules.`);
        return results;
    });
}

export function findModuleFactory(...code: (string | RegExp)[]): [id: number, factory: ModuleFactory] | null {
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return null;
    for (const [id, factory] of registry) {
        if (matchesAllPatterns(getFnSource(factory), code)) return [id, factory];
    }
    return null;
}

export function findModuleId(...code: (string | RegExp)[]): number | null {
    return findModuleFactory(...code)?.[0] ?? null;
}

export function mapMangledModule<S extends string>(code: (string | RegExp)[], mappers: Record<S, FilterFn>): Record<S, any> {
    const result = {} as Record<S, any>;
    const id = findModuleId(...code);
    if (id == null) return result;

    const mod = requireModule(id);
    if (mod == null) return result;

    return silenceWarns(() => {
        const mapperEntries = Object.entries<FilterFn>(mappers);
        let found = 0;

        outer: for (const key in mod) {
            try {
                const member = mod[key];
                for (let i = 0; i < mapperEntries.length; i++) {
                    const [name, filter] = mapperEntries[i];
                    if (name in result) continue;
                    if (filter(member)) {
                        result[name as S] = member;
                        if (++found === mapperEntries.length) break outer;
                        break;
                    }
                }
            } catch {}
        }
        return result;
    });
}

export function mapMangledModuleLazy<S extends string>(code: (string | RegExp)[], mappers: Record<S, FilterFn>): Record<S, any> {
    const resolve = () => mapMangledModule(code, mappers);
    trackFinder("mapMangledModule", code.map(String), resolve);
    return proxyLazy(resolve);
}

const IDENT = "[A-Za-z_$][\\w$]*";
export const DefaultChunkLoadRegex = new RegExp(`Promise\\.all\\(\\[([^\\]]+)\\]\\.map\\(${IDENT}=>${IDENT}\\.l\\(${IDENT}\\)\\)\\)\\.then\\(\\(\\)=>${IDENT}\\((\\d+)\\)\\)`);
export const ChunkPathRegex = /"(static\/chunks\/[^"]+)"/g;

export async function extractAndLoadChunks(code: (string | RegExp)[], matcher = DefaultChunkLoadRegex): Promise<boolean> {
    const factory = findModuleFactory(...code);
    if (!factory) {
        logger.warn("extractAndLoadChunks: no module factory found for:", code);
        return false;
    }

    const match = getFnSource(factory[1]).match(matcher);
    if (!match) {
        logger.warn("extractAndLoadChunks: no chunk loading pattern found in factory for:", code);
        return false;
    }

    const [, rawChunkPaths, entryPointId] = match;
    if (entryPointId == null) {
        logger.warn("extractAndLoadChunks: matcher did not capture entry point ID for:", code);
        return false;
    }

    const helpers = getTurbopackHelpers();
    if (!helpers) {
        logger.warn("extractAndLoadChunks: Turbopack helpers not available.");
        return false;
    }

    if (rawChunkPaths) {
        const chunkPaths = Array.from(rawChunkPaths.matchAll(ChunkPathRegex), m => m[1]);
        if (chunkPaths.length) {
            try {
                await Promise.all(chunkPaths.map(path => helpers.l(path)));
            } catch (e) {
                logger.warn("extractAndLoadChunks: chunk loading failed:", e);
                return false;
            }
        }
    }

    const entryPoint = Number(entryPointId);
    try {
        requireModule(entryPoint);
    } catch (e) {
        logger.warn("extractAndLoadChunks: entry point module failed:", e);
        return false;
    }
    return true;
}

export function extractAndLoadChunksLazy(code: (string | RegExp)[], matcher = DefaultChunkLoadRegex): () => Promise<boolean> {
    let cache: Promise<boolean> | null = null;
    return () => {
        if (cache) return cache;
        const promise = extractAndLoadChunks(code, matcher);
        promise.then(ok => { if (!ok) cache = null; }, () => { cache = null; });
        cache = promise;
        return promise;
    };
}

export function search(...code: (string | RegExp)[]): Record<number, ModuleFactory> {
    const results: Record<number, ModuleFactory> = {};
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return results;
    for (const [id, factory] of registry) {
        if (matchesAllPatterns(getFnSource(factory), code)) results[id] = factory;
    }
    return results;
}

export function requireModule(moduleId: number): any {
    const cache = getModuleCache();
    if (cache.has(moduleId)) return cache.get(moduleId);

    const helpers = getTurbopackHelpers();
    if (!helpers) return null;

    try {
        return helpers.i(moduleId);
    } catch (e) {
        logger.warn(`Failed to require module ${moduleId}:`, e);
        return null;
    }
}

export function importModule(moduleId: number): Promise<any> {
    const helpers = getTurbopackHelpers();
    if (!helpers) return Promise.reject(new Error("Turbopack helpers not available"));
    return helpers.A(moduleId);
}

function findMatchInExports(exports: any, filter: FilterFn): any {
    return silenceWarns(() => {
        if (isBlacklisted(exports)) return null;
        try {
            if (filter(exports)) return exports;
            if (typeof exports === "object" && exports !== null) {
                for (const key in exports) {
                    try {
                        const nested = exports[key];
                        if (nested != null && !isBlacklisted(nested) && filter(nested)) return nested;
                    } catch {}
                }
            }
        } catch {}
        return null;
    });
}

export function waitFor(filter: FilterFn, callback: (mod: any, id: number) => void, timeout = 0) {
    const cached = searchCache(filter);
    if (cached) {
        callback(cached, -1);
        return () => {};
    }

    let lastMatch: any = null;

    const wrappedFilter = (exports: any) => {
        lastMatch = findMatchInExports(exports, filter);
        return lastMatch != null;
    };

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const wrappedCallback = (_exports: any, id: number) => {
        if (timeoutId) clearTimeout(timeoutId);
        removeWaitForSubscription(wrappedFilter);
        try {
            if (lastMatch) callback(lastMatch, id);
            lastMatch = null;
        } catch (e) {
            logger.error("waitFor callback error:", e);
        }
    };

    addWaitForSubscription(wrappedFilter, wrappedCallback);

    const cancel = () => {
        if (timeoutId) clearTimeout(timeoutId);
        removeWaitForSubscription(wrappedFilter);
    };

    if (timeout > 0) {
        timeoutId = setTimeout(() => {
            timeoutId = null;
            cancel();
            if (!searchCache(filter)) {
                logger.warn(`waitFor timed out after ${timeout}ms:`, filter);
            }
        }, timeout);
    }

    return cancel;
}
