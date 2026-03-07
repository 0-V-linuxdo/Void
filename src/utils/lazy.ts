/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const unconfigurable = ["arguments", "caller", "prototype"];

const SYM_LAZY_GET = Symbol.for("void.lazy.get");
const SYM_LAZY_CACHED = Symbol.for("void.lazy.cached");

const handler: ProxyHandler<any> = {};

for (const method of [
    "apply",
    "construct",
    "defineProperty",
    "deleteProperty",
    "getPrototypeOf",
    "has",
    "isExtensible",
    "preventExtensions",
    "set",
    "setPrototypeOf",
] as const) {
    handler[method] = (target: any, ...args: any[]) => (Reflect[method] as any)(target[SYM_LAZY_GET]?.() ?? target, ...args);
}

handler.ownKeys = target => {
    const v = target[SYM_LAZY_GET]?.() ?? target;
    const keys = Reflect.ownKeys(v);
    for (const key of unconfigurable) {
        if (!keys.includes(key)) keys.push(key);
    }
    return keys;
};

handler.getOwnPropertyDescriptor = (target, p) => {
    if (typeof p === "string" && unconfigurable.includes(p)) return Reflect.getOwnPropertyDescriptor(target, p);

    const resolved = target[SYM_LAZY_GET]?.() ?? target;
    const descriptor = Reflect.getOwnPropertyDescriptor(resolved, p);
    if (descriptor) Object.defineProperty(target, p, descriptor);
    return descriptor;
};

handler.get = (target, p, receiver) => {
    if (p === SYM_LAZY_CACHED || p === SYM_LAZY_GET) return Reflect.get(target, p, receiver);

    const value = target[SYM_LAZY_GET]();
    if (value == null) return undefined;
    if (typeof value === "object" || typeof value === "function") return Reflect.get(value, p, receiver);

    throw new Error("proxyLazy: factory returned a primitive value");
};

export function makeLazy<T>(factory: () => T): () => T {
    let cache: T;
    let resolved = false;
    return () => {
        if (!resolved) {
            cache = factory();
            if (cache != null) resolved = true;
        }
        return cache;
    };
}

export function proxyLazy<T>(factory: () => T): T {
    const getter = makeLazy(factory);
    const proxyDummy = Object.assign(() => {}, {
        [SYM_LAZY_CACHED]: void 0 as T | undefined,
        [SYM_LAZY_GET]() {
            const result = getter();
            proxyDummy[SYM_LAZY_CACHED] = result;
            return result;
        },
    });

    return new Proxy(proxyDummy, handler) as unknown as T;
}
