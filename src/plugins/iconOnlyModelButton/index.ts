/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChevronsDownUpIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "iconOnlyModelButton";

/**
 * Lock the composer model trigger to Grok's official compact (icon-only) state
 * at any viewport width. Scoped to `.query-bar` so Imagine / other pickers
 * are left alone. The dropdown is a portal and is not matched.
 */
const CSS = `
.query-bar #model-select-trigger,
.query-bar button[aria-label="Model select"],
.query-bar button[aria-label="选择模型"],
.query-bar button[aria-label="選擇模型"],
form:has(.query-bar) #model-select-trigger,
form:has(.query-bar) button[aria-label="Model select"] {
    width: 2.5rem !important;
    min-width: 2.5rem !important;
    max-width: 2.5rem !important;
    height: 2.5rem !important;
    min-height: 2.5rem !important;
    padding: 0 !important;
    gap: 0 !important;
    justify-content: center !important;
    align-items: center !important;
    overflow: hidden !important;
    font-size: 0 !important;
    line-height: 0 !important;
    border-radius: 9999px !important;
}

.query-bar #model-select-trigger svg,
.query-bar button[aria-label="Model select"] svg,
.query-bar button[aria-label="选择模型"] svg,
.query-bar button[aria-label="選擇模型"] svg,
form:has(.query-bar) #model-select-trigger svg,
form:has(.query-bar) button[aria-label="Model select"] svg {
    width: 1.125rem !important;
    height: 1.125rem !important;
    min-width: 1.125rem !important;
    min-height: 1.125rem !important;
    flex-shrink: 0 !important;
    display: block !important;
}

.query-bar #model-select-trigger svg + svg,
.query-bar button[aria-label="Model select"] svg + svg,
form:has(.query-bar) #model-select-trigger svg + svg {
    display: none !important;
}

.query-bar #model-select-trigger span:not(:has(svg)),
.query-bar #model-select-trigger p,
.query-bar #model-select-trigger > div:not(:has(svg)),
.query-bar button[aria-label="Model select"] span:not(:has(svg)),
.query-bar button[aria-label="Model select"] p,
.query-bar button[aria-label="Model select"] > div:not(:has(svg)),
.query-bar button[aria-label="选择模型"] span:not(:has(svg)),
.query-bar button[aria-label="選擇模型"] span:not(:has(svg)),
form:has(.query-bar) #model-select-trigger span:not(:has(svg)),
form:has(.query-bar) button[aria-label="Model select"] span:not(:has(svg)) {
    display: none !important;
    width: 0 !important;
    max-width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
}

.query-bar #model-select-trigger .sm\:inline,
.query-bar #model-select-trigger .sm\:block,
.query-bar #model-select-trigger [class*="sm:inline"],
.query-bar #model-select-trigger [class*="sm:block"],
.query-bar button[aria-label="Model select"] .sm\:inline,
.query-bar button[aria-label="Model select"] .sm\:block,
.query-bar button[aria-label="Model select"] [class*="sm:inline"],
.query-bar button[aria-label="Model select"] [class*="sm:block"] {
    display: none !important;
}
`;

export default definePlugin({
    name: "IconOnlyModelButton",
    icon: ChevronsDownUpIcon,
    description: "Lock the composer model trigger to Grok's official compact icon-only state at any width. Dropdown unchanged.",
    authors: [Devs.p],
    tags: ["ui", "chat"],
    enabledByDefault: true,

    start() {
        registerStyle(STYLE_NAME, CSS);
    },

    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
