/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { PlusIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { disableStyle, enableStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    titleRowHover: {
        type: OptionType.BOOLEAN,
        description: "Show Bots and Projects header actions only when hovering that section title, like the expand chevron.",
        default: true,
    },
});

function apply() {
    if (settings.store.titleRowHover) enableStyle("botsPlusHover");
    else disableStyle("botsPlusHover");
}

export default definePlugin({
    name: "BotsPlusHover",
    icon: PlusIcon,
    description: "Show Bots and Projects header actions only on that section title hover, like the expand chevron.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,
    managedStyle: "botsPlusHover",
    settings,

    patches: [
        {
            find: "\"sidebar.new-bot-btn.aria-label\",\"New bot\"",
            replacement: [
                {
                    match: /(\i)\("flex size-5 shrink-0 items-center justify-center rounded-md text-tertiary","hover:bg-button-ghost-hover hover:text-primary","focus:outline-none focus-visible:bg-button-ghost-hover"\)/,
                    replace: "$1(\"flex size-5 shrink-0 items-center justify-center rounded-md text-tertiary void-bots-plus\",\"hover:bg-button-ghost-hover hover:text-primary\",\"focus:outline-none focus-visible:bg-button-ghost-hover\")",
                },
                {
                    match: /("button",\{type:"button","aria-label":\i,className:\i,onClick:\i)/,
                    replace: "$&,\"data-void-bots-plus\":\"\"",
                },
            ],
        },
    ],

    start: apply,
    onSettingsChange: apply,
    stop() {
        disableStyle("botsPlusHover");
    },
});
