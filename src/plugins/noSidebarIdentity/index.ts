/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { UserRoundXIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_NAME = "noSidebarIdentity";

const FOOTER = '[data-sidebar="footer"]';
const STACK = `${FOOTER} button[data-slot="button"] div.flex.flex-col.items-start.min-w-0.text-left`;
const TEXT_WRAP = `${FOOTER} button[data-slot="button"]>div.min-w-0.flex-1.overflow-hidden,${FOOTER} button[data-state]>div.min-w-0.flex-1.overflow-hidden`;

const settings = definePluginSettings({
    hideUsername: {
        type: OptionType.BOOLEAN,
        description: "Hide the username next to the sidebar avatar.",
        default: true,
    },
    hideEmail: {
        type: OptionType.BOOLEAN,
        description: "Hide the email next to the sidebar avatar.",
        default: true,
    },
});

function apply() {
    const rules: string[] = [];
    if (settings.store.hideUsername) {
        rules.push(`${STACK}>:first-child{display:none!important}`);
        rules.push(`${FOOTER} .void-sidebar-name{display:none!important}`);
    }
    if (settings.store.hideEmail) {
        rules.push(`${STACK}>:nth-child(2){display:none!important}`);
    }
    if (settings.store.hideUsername && settings.store.hideEmail) {
        rules.push(`${TEXT_WRAP}{display:none!important}`);
        rules.push(`${FOOTER} .void-sidebar-info{display:none!important}`);
    }
    registerStyle(STYLE_NAME, rules.join("\n"));
}

export default definePlugin({
    name: "NoSidebarIdentity",
    icon: UserRoundXIcon,
    description: "Hide username and/or email in the Grok sidebar. Avatar stays clickable.",
    authors: [Devs.p],
    tags: ["ui", "privacy"],
    enabledByDefault: true,
    settings,

    start: apply,
    onSettingsChange: apply,
    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
