/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getModuleCache, syncLazyModules } from "@turbopack/patchTurbopack";
import { isObject } from "@utils/guards";

import { SERIALIZE, STORE } from "./constants";
import type { StoreArgs, StoreEntry, ZustandLike } from "./types";
import { clamp, describeValue, errorMessage, getPath, serialize } from "./utils";

const STORE_ACTIONS = ["list", "get", "keys", "methods", "call", "subscribe"] as const;

let storeCache: StoreEntry[] | null = null;
let storeCacheGen = 0;

export function clearStoreCache(): void {
    storeCache = null;
    storeCacheGen = 0;
}

function isZustandStore(value: unknown): value is ZustandLike {
    if (value == null) return false;
    const t = typeof value;
    if (t !== "function" && t !== "object") return false;
    const v = value as Record<string, unknown>;
    return typeof v.getState === "function" && typeof v.setState === "function" && typeof v.subscribe === "function";
}

function findStores(): StoreEntry[] {
    const cache = getModuleCache();
    if (storeCache && storeCacheGen === cache.size) return storeCache;
    syncLazyModules();

    const stores: StoreEntry[] = [];
    const seen = new WeakSet<object>();

    for (const [id, exports] of cache) {
        if (exports == null || typeof exports !== "object") continue;
        const mod = exports as Record<string, unknown>;
        for (const key in mod) {
            try {
                const val = mod[key];
                if (!isZustandStore(val) || seen.has(val as object)) continue;
                seen.add(val as object);
                const state = val.getState();
                const stateKeys = isObject(state) ? Object.keys(state) : [];
                const storeName = (key.startsWith("use") ? key : null) ?? (typeof val.name === "string" && val.name !== STORE.MINIFIED_STORE_NAME ? val.name : null) ?? (key !== "default" && key !== STORE.MINIFIED_STORE_NAME ? key : null);
                stores.push({ id, name: storeName, keys: stateKeys.slice(0, STORE.KEYS_PREVIEW) });
            } catch {}
        }
    }

    storeCache = stores;
    storeCacheGen = cache.size;
    return stores;
}

function getStoreFromModule(moduleId: number, exportName?: string | null): ZustandLike | null {
    const exports = getModuleCache().get(moduleId);
    if (!exports || typeof exports !== "object") return null;
    const mod = exports as Record<string, unknown>;
    if (exportName && isZustandStore(mod[exportName])) return mod[exportName] as ZustandLike;
    for (const key in mod) {
        try {
            if (isZustandStore(mod[key])) return mod[key] as ZustandLike;
        } catch {}
    }
    return null;
}

function findStoreByQuery(query: string | number): ZustandLike | null {
    const stores = findStores();
    const numQuery = typeof query === "number" ? query : (String(query).trim().length > 0 ? Number(query) : NaN);
    if (!Number.isNaN(numQuery) && Number.isFinite(numQuery)) return getStoreFromModule(numQuery);

    const lower = String(query).toLowerCase();

    let bestMatch: StoreEntry | null = null;
    let bestLen = Infinity;

    for (const entry of stores) {
        if (!entry.name) continue;
        const nameLower = entry.name.toLowerCase();
        if (nameLower === lower || nameLower === `use${lower}store` || nameLower === `use${lower}`) {
            return getStoreFromModule(entry.id, entry.name);
        }
        if (nameLower.includes(lower) && entry.name.length < bestLen) {
            bestMatch = entry;
            bestLen = entry.name.length;
        }
    }
    if (bestMatch) return getStoreFromModule(bestMatch.id, bestMatch.name);

    for (const entry of stores) {
        if (entry.keys.some(k => k.toLowerCase().includes(lower))) return getStoreFromModule(entry.id, entry.name);
    }
    return null;
}

function storeNotFound(query: string | number): { error: string; similar?: string[] } {
    const stores = findStores();
    const lower = String(query).toLowerCase();
    const similar = stores
        .filter(s => s.name?.toLowerCase().includes(lower) || s.keys.some(k => k.toLowerCase().includes(lower)))
        .map(s => s.name ?? `module:${s.id}`)
        .slice(0, STORE.SIMILAR_LIMIT);
    return similar.length ? { error: `No store "${query}"`, similar } : { error: `No store "${query}". Use list action.` };
}

const DESTRUCTIVE_METHODS = new Set(["clearUser", "logout", "reset", "clearAll", "deleteUser", "signOut", "clearSession", "__proto__", "constructor", "prototype"]);

export function handleStore(args: StoreArgs): unknown {
    const { action, query, path } = args;
    const rawDepth = Number(args.depth);
    const depth = Number.isFinite(rawDepth) && rawDepth >= 0 ? rawDepth : SERIALIZE.DEFAULT_DEPTH;

    if (action === "list") {
        return findStores().map(s => ({ id: s.id, n: s.name, k: s.keys.slice(0, STORE.LIST_KEYS_PREVIEW) }));
    }

    if (action === "get") {
        if (!query) return { error: "Provide query (store name or module ID)" };
        const store = findStoreByQuery(query);
        if (!store) return storeNotFound(query);
        const state = store.getState();
        if (path) return serialize(getPath(state, path), Math.min(depth, STORE.MAX_DEPTH));
        return serialize(state, Math.min(depth, STORE.DEFAULT_DEPTH));
    }

    if (action === "keys") {
        if (!query) return { error: "Provide query (store name or module ID)" };
        const store = findStoreByQuery(query);
        if (!store) return storeNotFound(query);
        const state = store.getState();
        if (!isObject(state)) return [];
        const result: Record<string, string> = {};
        for (const k of Object.keys(state)) {
            try {
                result[k] = describeValue(state[k]);
            } catch {
                result[k] = "!";
            }
        }
        return result;
    }

    if (action === "methods") {
        if (!query) return { error: "Provide query (store name or module ID)" };
        const store = findStoreByQuery(query);
        if (!store) return storeNotFound(query);
        const state = store.getState();
        if (!isObject(state)) return [];
        const methods: Record<string, number> = {};
        for (const k of Object.keys(state)) {
            if (typeof state[k] === "function") methods[k] = (state[k] as Function).length;
        }
        return methods;
    }

    if (action === "call") {
        if (!query) return { error: "Provide query (store name or module ID)" };
        const { method, callArgs } = args;
        if (!method) return { error: "Provide method name. Use methods action to list available methods." };
        if (DESTRUCTIVE_METHODS.has(method)) return { error: `Method "${method}" is potentially destructive and blocked via MCP. Use evaluateCode if you really need to call it.` };
        const store = findStoreByQuery(query);
        if (!store) return storeNotFound(query);
        const state = store.getState();
        if (!state || typeof state[method] !== "function") {
            const available = state ? Object.keys(state).filter(k => typeof state[k] === "function").slice(0, STORE.METHODS_PREVIEW) : [];
            return available.length
                ? { error: `No method "${method}"`, available }
                : { error: `No method "${method}". Store has no callable methods.` };
        }
        try {
            const result = (state[method] as Function)(...(callArgs ?? []));
            if (result != null && typeof (result as Promise<unknown>).then === "function") {
                return (result as Promise<unknown>).then(
                    v => serialize(v, Math.min(depth, STORE.MAX_DEPTH)),
                    (e: unknown) => ({ error: errorMessage(e) }),
                );
            }
            return serialize(result, Math.min(depth, STORE.MAX_DEPTH));
        } catch (e: unknown) {
            return { error: errorMessage(e) };
        }
    }

    if (action === "subscribe") {
        if (!query) return { error: "Provide query (store name or module ID)" };
        const store = findStoreByQuery(query);
        if (!store) return storeNotFound(query);
        const rawDuration = Number(args.duration);
        const duration = clamp(Number.isFinite(rawDuration) ? rawDuration : STORE.DEFAULT_DURATION, STORE.MIN_DURATION, STORE.MAX_DURATION);
        const rawCaptures = Number(args.maxCaptures);
        const maxCaptures = Math.min(Number.isFinite(rawCaptures) && rawCaptures > 0 ? rawCaptures : STORE.DEFAULT_CAPTURES, STORE.MAX_CAPTURES);
        const watchPath = args.path;

        return new Promise<unknown>(resolve => {
            const changes: Array<{ t: number; p?: string; from: unknown; to: unknown }> = [];
            const startTime = Date.now();
            let prev = watchPath ? getPath(store.getState(), watchPath) : store.getState();
            let done = false;

            const finish = (capped: boolean) => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                unsub();
                resolve({ changes, ...(capped ? { capped: true } : {}), ms: Date.now() - startTime });
            };

            const unsub = store.subscribe((state: Record<string, unknown>) => {
                if (done) return;
                const cur = watchPath ? getPath(state, watchPath) : state;
                if (cur === prev) return;

                if (watchPath) {
                    changes.push({ t: Date.now() - startTime, p: watchPath, from: serialize(prev, STORE.SUBSCRIBE_DEPTH), to: serialize(cur, STORE.SUBSCRIBE_DEPTH) });
                } else if (isObject(cur) && isObject(prev)) {
                    const curObj = cur as Record<string, unknown>;
                    const prevObj = prev as Record<string, unknown>;
                    for (const k of Object.keys(curObj)) {
                        if (curObj[k] !== prevObj[k] && changes.length < maxCaptures) {
                            changes.push({ t: Date.now() - startTime, p: k, from: serialize(prevObj[k], STORE.SUBSCRIBE_DEPTH), to: serialize(curObj[k], STORE.SUBSCRIBE_DEPTH) });
                        }
                    }
                    for (const k of Object.keys(prevObj)) {
                        if (!(k in curObj) && changes.length < maxCaptures) {
                            changes.push({ t: Date.now() - startTime, p: k, from: serialize(prevObj[k], STORE.SUBSCRIBE_DEPTH), to: "[deleted]" });
                        }
                    }
                } else {
                    changes.push({ t: Date.now() - startTime, from: serialize(prev, STORE.SUBSCRIBE_DEPTH), to: serialize(cur, STORE.SUBSCRIBE_DEPTH) });
                }

                prev = cur;
                if (changes.length >= maxCaptures) finish(true);
            });

            const timer = setTimeout(() => finish(false), duration);
        });
    }

    return { error: `Unknown action: ${action}`, validActions: STORE_ACTIONS };
}
