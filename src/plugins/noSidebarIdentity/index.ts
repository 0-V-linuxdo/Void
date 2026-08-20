/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "noSidebarIdentity";

/**
 * Hide username and email in the Grok sidebar account button.
 * Avatar stays so the account menu still opens.
 * Scoped to [data-sidebar="footer"] so other shadcn buttons are untouched.
 * Also hides BetterSidebar's extra name/plan block.
 */
const CSS = `
[data-sidebar="footer"] button[data-slot="button"] div.flex.flex-col.items-start.min-w-0.text-left,
[data-sidebar="footer"] button[data-slot="button"] > div.min-w-0.flex-1.overflow-hidden,
[data-sidebar="footer"] button[data-state] > div.min-w-0.flex-1.overflow-hidden {
    display: none !important;
}

[data-sidebar="footer"] .void-sidebar-info,
[data-sidebar="footer"] .void-sidebar-name,
[data-sidebar="footer"] .void-sidebar-plan {
    display: none !important;
}
`;

export default definePlugin({
    name: "NoSidebarIdentity",
    description: "Hide username and email in the Grok sidebar. Avatar stays clickable.",
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
