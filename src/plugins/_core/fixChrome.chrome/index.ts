/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { registerStyle } from "@utils/css";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "FixChrome",
    description: "Fixes Chromium-specific performance issues like backdrop blur lag.",
    authors: [Devs.Prism],
    required: true,
    managedStyle: "void-fix-chrome",

    start() {
        registerStyle("void-fix-chrome", `[class*="backdrop-blur"] {
            -webkit-backdrop-filter: none !important;
            backdrop-filter: none !important;
        }`);
    },
});
