/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Minimize2Icon } from "@components/icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "CompactModeSelect",
    icon: Minimize2Icon,
    description: "Always show the chat input model selector as an icon, even on wide screens.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,

    patches: [
        {
            find: "data-query-bar-mode-select",
            all: true,
            replacement: {
                match: /ModeSelect,\{compact:\i\|\|\i,/,
                replace: "ModeSelect,{compact:!0,",
            },
        },
    ],
});
