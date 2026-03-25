/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ComponentType } from "react";

export type AnyComponent = ComponentType & Record<string, any>;

type CreateElementFn = (type: any, props?: any, ...children: any[]) => any;

let _createElement: CreateElementFn | null = null;

export function setCreateElement(fn: CreateElementFn) {
    _createElement = fn;
}

const LAZY_MAX_RETRIES = 200;

export function LazyComponent<T extends AnyComponent = AnyComponent>(name: string, factory: () => T | null): T {
    let cached: T | null = null;
    let attempts = 0;

    const wrapper = ((props: Record<string, any>) => {
        if (!cached && attempts < LAZY_MAX_RETRIES) {
            cached = factory();
            attempts++;
        }
        if (!cached || !_createElement) return null;
        return _createElement(cached, props);
    }) as unknown as T;

    Object.defineProperty(wrapper, "name", { value: name });

    return new Proxy(wrapper, {
        get(target, prop, receiver) {
            if (prop === "$$voidGetWrapped") return () => cached ?? factory();
            if (!cached && attempts < LAZY_MAX_RETRIES) {
                cached = factory();
                attempts++;
            }
            if (cached && prop in (cached as Record<string | symbol, any>)) return (cached as Record<string | symbol, any>)[prop];
            return Reflect.get(target, prop, receiver);
        },
    }) as T;
}
