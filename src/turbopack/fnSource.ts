/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const fnSourceCache = new WeakMap<Function, string>();

export function getFnSource(fn: Function): string {
    let src = fnSourceCache.get(fn);
    if (src === undefined) {
        src = String(fn);
        fnSourceCache.set(fn, src);
    }
    return src;
}
