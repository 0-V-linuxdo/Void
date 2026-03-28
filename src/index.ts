/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as Void from "./Void";

const target = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

if (!(target as { Void?: unknown }).Void) {
    Object.defineProperty(target, "Void", {
        value: Void,
        writable: false,
        configurable: true,
    });

    Void.initSettings().then(() => Void.init()).catch(e => console.error("[Void] Fatal init error:", e));
}
