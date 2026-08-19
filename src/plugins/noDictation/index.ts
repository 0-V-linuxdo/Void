/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "noDictation";

/**
 * Hide both the icon-only Dictation button and any text variant
 * that uses the same aria-label ("Dictation (⌃D)").
 * Using :has() to also collapse the sizing wrapper so no empty gap remains.
 */
const CSS = `
button[aria-label^="Dictation"],
button[aria-label*="Dictation"] {
    display: none !important;
}
div:has(> button[aria-label^="Dictation"]),
div:has(> button[aria-label*="Dictation"]) {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoDictation",
    description: "Hide the Dictation (voice input) button from the chat input bar.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,

    start() {
        registerStyle(STYLE_NAME, CSS);
    },

    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
