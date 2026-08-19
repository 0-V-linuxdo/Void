/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "noShareLink";

/**
 * Hide the "Share Project" button in the top-right corner.
 * Also collapses any direct parent wrapper to prevent empty gaps.
 */
const CSS = `
button[aria-label="Share Project"],
button[aria-label*="Share Project"] {
    display: none !important;
}

/* Collapse sizing wrappers so no empty space remains */
div:has(> button[aria-label="Share Project"]),
div:has(> button[aria-label*="Share Project"]) {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoShareLink",
    description: "Hide the Share Project button from the top-right corner.",
    authors: [Devs.p],
    tags: ["ui", "privacy"],
    enabledByDefault: true,

    start() {
        registerStyle(STYLE_NAME, CSS);
    },

    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
