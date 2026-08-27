/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ScrollTextIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "themedScrollbar";

const HOST = "aside:has([aria-label=\"Preview\"]):has([aria-label=\"Files\"])";
const SCROLLER = `${HOST} :is([class*="overflow-auto"],[class*="overflow-y-auto"],[class*="overflow-scroll"],[class*="overflow-y-scroll"])`;

const THUMB = "var(--border-l2,color-mix(in srgb,var(--fg-primary,#888) 28%,transparent))";
const THUMB_HOVER = "var(--fg-tertiary,color-mix(in srgb,var(--fg-primary,#888) 42%,transparent))";
const TRACK = "var(--surface-l1,var(--surface-inset,transparent))";

const CSS = `
${SCROLLER} {
    scrollbar-width: thin !important;
    scrollbar-color: ${THUMB} ${TRACK} !important;
}

${SCROLLER}::-webkit-scrollbar {
    width: 0.5rem !important;
    height: 0.5rem !important;
}

${SCROLLER}::-webkit-scrollbar-track,
${SCROLLER}::-webkit-scrollbar-corner {
    background: ${TRACK} !important;
}

${SCROLLER}::-webkit-scrollbar-thumb {
    background-color: ${THUMB} !important;
    background-clip: padding-box !important;
    border: 0.125rem solid transparent !important;
    border-radius: 999px !important;
}

${SCROLLER}::-webkit-scrollbar-thumb:hover {
    background-color: ${THUMB_HOVER} !important;
}
`;

export default definePlugin({
    name: "ThemedScrollbar",
    icon: ScrollTextIcon,
    description: "Makes the project pane scrollbar follow Grok's dark and light theme.",
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
