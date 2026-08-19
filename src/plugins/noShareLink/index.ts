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
 * Hide only the share buttons themselves.
 * Do NOT hide parent containers — that would remove neighboring action buttons
 * that live in the same toolbar/wrapper.
 */
const CSS = `
button[aria-label="Share Project"],
button[aria-label="Create share link"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoShareLink",
    description: "Hide Share Project and Create share link buttons for privacy.",
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
