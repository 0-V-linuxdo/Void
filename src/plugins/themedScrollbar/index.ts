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

const PANE = [
    "aside:has([aria-label=\"Preview\"]):has([aria-label=\"Files\"])",
    "aside:has(iframe[title=\"Preview\"])",
    ".absolute.inset-y-0.end-0",
    "[class*=\"pane-card\"]",
].join(",");

const PANE_ALL = `${PANE},${PANE} *`;

const THUMB = "var(--border-l2,color-mix(in srgb,var(--fg-primary,#888) 28%,transparent))";
const THUMB_HOVER = "var(--fg-tertiary,color-mix(in srgb,var(--fg-primary,#888) 42%,transparent))";

const CSS = `
html.dark,
html[data-theme="dark"],
html[data-color-scheme="dark"] {
    color-scheme: dark !important;
}

html.light,
html[data-theme="light"],
html[data-color-scheme="light"] {
    color-scheme: light !important;
}

html.dark :is(${PANE}),
html[data-theme="dark"] :is(${PANE}),
html[data-color-scheme="dark"] :is(${PANE}) {
    color-scheme: dark !important;
}

html.light :is(${PANE}),
html[data-theme="light"] :is(${PANE}),
html[data-color-scheme="light"] :is(${PANE}) {
    color-scheme: light !important;
}

${PANE_ALL} {
    scrollbar-width: thin !important;
    scrollbar-color: ${THUMB} transparent !important;
}

${PANE_ALL}::-webkit-scrollbar {
    width: 0.5rem !important;
    height: 0.5rem !important;
}

${PANE_ALL}::-webkit-scrollbar-track,
${PANE_ALL}::-webkit-scrollbar-corner {
    background: transparent !important;
}

${PANE_ALL}::-webkit-scrollbar-thumb {
    background-color: ${THUMB} !important;
    background-clip: padding-box !important;
    border: 0.125rem solid transparent !important;
    border-radius: 999px !important;
}

${PANE_ALL}::-webkit-scrollbar-thumb:hover {
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
