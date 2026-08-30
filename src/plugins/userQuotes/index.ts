/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TextQuoteIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "userQuotes";

const CSS = `
[data-testid="user-message"] blockquote:not(.twitter-tweet) {
    border-inline-start-color: hsl(var(--fg-tertiary)) !important;
    border-inline-start-width: 0.125rem !important;
    border-inline-start-style: solid !important;
    padding-inline-start: 0.75rem !important;
}
`;

export default definePlugin({
    name: "UserQuotes",
    icon: TextQuoteIcon,
    description: "Show a visible left bar on quoted lines in your own chat bubbles.",
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
