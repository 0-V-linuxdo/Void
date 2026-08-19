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
 * Hide share-related buttons (Share Project, Create share link, etc.)
 * and collapse their immediate parent wrappers to avoid empty gaps.
 */
const CSS = `
button[aria-label="Share Project"],
button[aria-label*="Share Project"],
button[aria-label="Create share link"],
button[aria-label*="Create share link"],
button[aria-label="Share link"],
button[aria-label*="Share link"] {
    display: none !important;
}

/* Collapse sizing wrappers so no empty space remains */
div:has(> button[aria-label="Share Project"]),
div:has(> button[aria-label*="Share Project"]),
div:has(> button[aria-label="Create share link"]),
div:has(> button[aria-label*="Create share link"]),
div:has(> button[aria-label="Share link"]),
div:has(> button[aria-label*="Share link"]) {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoShareLink",
    description: "Hide Share Project / Create share link buttons for privacy.",
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
