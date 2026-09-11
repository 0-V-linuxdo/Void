/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { bootstrapPreviewFrame, isGrokPreviewFrame } from "./plugins/themedScrollbar";
import * as VoidPP from "./VoidPP";

const target = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;

if (isGrokPreviewFrame()) {
    bootstrapPreviewFrame();
} else if (window === window.top && !(target as { VoidPP?: unknown; Void?: unknown }).VoidPP && !(target as { Void?: unknown }).Void) {
    Object.defineProperty(target, "VoidPP", {
        value: VoidPP,
        writable: false,
        configurable: true,
    });
    Object.defineProperty(target, "Void", {
        value: VoidPP,
        writable: false,
        configurable: true,
    });

    VoidPP.initSettings().then(() => VoidPP.init()).catch(e => console.error("[Void++] Fatal init error:", e));
}
