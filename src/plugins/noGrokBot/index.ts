/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "noGrokBot";

const CSS = `
#grok-bot-nav-button,
div:has(> #grok-bot-nav-button) {
    display: none !important;
}
#promo-portal [aria-label*="Grok Bot"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoGrokBot",
    description: "Hide the top-right Grok Bot promo button.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,

    start() {
        registerStyle(STYLE_NAME, CSS);
    },

    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
