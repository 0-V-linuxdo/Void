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

export function LazyComponent<T extends AnyComponent = AnyComponent>(name: string, factory: () => T | null): T {
    let cached: T | null = null;

    const wrapper = ((props: Record<string, any>) => {
        cached ??= factory();
        if (!cached || !_createElement) return null;
        return _createElement(cached, props);
    }) as unknown as T;

    Object.defineProperty(wrapper, "name", { value: name });

    return new Proxy(wrapper, {
        get(target, prop) {
            if (prop === "$$voidGetWrapped") return () => cached ?? factory();
            if (prop === "displayName") {
                cached ??= factory();
                if (cached) return (cached as Record<string, any>)[prop];
            }
            return Reflect.get(target, prop);
        },
    }) as T;
}
