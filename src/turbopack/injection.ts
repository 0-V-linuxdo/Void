/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { canonicalizeMatch } from "@utils/patches";

import { getFnSource } from "./fnSource";
import { matchesPattern } from "./match";
import type { ModuleFactory, TurbopackHelpers } from "./types";

type InjectedExports = Record<string, (ns: Record<string, unknown>) => unknown>;

interface ExportInjection {
    find: string | RegExp;
    exports: InjectedExports;
}

const exportInjections: ExportInjection[] = [];
const injectionsById = new Map<number, InjectedExports | null>();
export const injectionProxies = new Map<number, object>();
let injectionSeamInstalled = false;

let moduleCache!: Map<number, any>;
let getRuntimeFactoryRegistry: () => Map<number, ModuleFactory> | null = () => null;

export function setInjectionContext(cache: Map<number, any>, registry: () => Map<number, ModuleFactory> | null): void {
    moduleCache = cache;
    getRuntimeFactoryRegistry = registry;
}

export function injectExports(find: string | RegExp, exports: InjectedExports): void {
    exportInjections.push({ find: canonicalizeMatch(find), exports });
    injectionsById.clear();
    injectionProxies.clear();
}

export function resolveInjections(id: number): InjectedExports | null {
    const registry = getRuntimeFactoryRegistry();
    if (!exportInjections.length || !registry) return null;
    const cached = injectionsById.get(id);
    if (cached !== undefined) return cached;

    const factory = registry.get(id);
    if (!factory) return null;

    const source = getFnSource(factory);
    const merged: InjectedExports = {};
    let any = false;
    for (const inj of exportInjections) {
        if (!matchesPattern(source, inj.find)) continue;
        Object.assign(merged, inj.exports);
        any = true;
    }
    const result = any ? merged : null;
    injectionsById.set(id, result);
    return result;
}

export function proxyWithInjections(ns: Record<string, unknown>, id: number, injected: InjectedExports): object {
    const cached = injectionProxies.get(id);
    if (cached) return cached;

    const proxy = new Proxy(ns, {
        get(target, key, receiver) {
            if (typeof key === "string" && key in injected) return injected[key](ns);
            return Reflect.get(target, key, receiver);
        },
        has(target, key) {
            return (typeof key === "string" && key in injected) || Reflect.has(target, key);
        },
    });
    injectionProxies.set(id, proxy);
    return proxy;
}

export function installInjectionSeam(helpers: TurbopackHelpers): void {
    if (injectionSeamInstalled) return;
    const proto = Object.getPrototypeOf(helpers) as { i(id: number): any };
    if (!proto || typeof proto.i !== "function") return;
    injectionSeamInstalled = true;

    const originalImport = proto.i;
    proto.i = function (this: any, id: number) {
        const ns = originalImport.call(this, id);
        if (ns == null) return ns;
        const injected = resolveInjections(id);
        if (!injected) return ns;
        const proxy = proxyWithInjections(ns, id, injected);
        if (moduleCache.get(id) === ns) moduleCache.set(id, proxy);
        return proxy;
    };
}
