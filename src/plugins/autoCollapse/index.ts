/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "AutoCollapse",
    description: "Automatically collapse code blocks in responses.",
    authors: [Devs.Prism],
    tags: ["chat"],

    _collapse: () => true,

    patches: [
        {
            find: ["isInitiallyCollapsed", "MarkdownChunkContext"],
            all: true,
            replacement: {
                match: /isInitiallyCollapsed:(\i)=!1/g,
                replace: "isInitiallyCollapsed:$1=$self._collapse()",
            },
        },
    ],
});
