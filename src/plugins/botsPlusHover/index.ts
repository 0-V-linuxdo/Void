/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { PlusIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { disableStyle, enableStyle } from "@utils/css";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "BotsPlusHover",
    icon: PlusIcon,
    description: "Show the sidebar Bots plus button only on hover, matching Projects.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,
    managedStyle: "botsPlusHover",

    patches: [
        {
            find: "\"sidebar.new-bot-btn.aria-label\",\"New bot\"",
            replacement: [
                {
                    match: /(\i)\("flex size-5 shrink-0 items-center justify-center rounded-md text-tertiary","hover:bg-button-ghost-hover hover:text-primary","focus:outline-none focus-visible:bg-button-ghost-hover"\)/,
                    replace: "$1(\"flex size-5 shrink-0 items-center justify-center rounded-md text-tertiary void-bots-plus\",\"hover:bg-button-ghost-hover hover:text-primary\",\"focus:outline-none focus-visible:bg-button-ghost-hover\",\"opacity-0 transition-opacity duration-150\",\"group-hover/app-sidebar:opacity-100 focus-visible:opacity-100\")",
                },
                {
                    match: /("button",\{type:"button","aria-label":\i,className:\i,onClick:\i)/,
                    replace: "$&,\"data-void-bots-plus\":\"\"",
                },
            ],
        },
    ],

    start() {
        enableStyle("botsPlusHover");
    },

    stop() {
        disableStyle("botsPlusHover");
    },
});
