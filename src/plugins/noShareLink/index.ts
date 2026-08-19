/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_NAME = "noShareLink";

const settings = definePluginSettings({
    hideShareProject: {
        type: OptionType.BOOLEAN,
        description: "Hide the Share Project button.",
        default: true,
    },
    hideCreateShareLink: {
        type: OptionType.BOOLEAN,
        description: "Hide the Create share link button.",
        default: true,
    },
});

function apply() {
    const rules: string[] = [];
    if (settings.store.hideShareProject) {
        rules.push('button[aria-label="Share Project"]{display:none!important}');
    }
    if (settings.store.hideCreateShareLink) {
        rules.push('button[aria-label="Create share link"]{display:none!important}');
    }
    registerStyle(STYLE_NAME, rules.join("\n"));
}

export default definePlugin({
    name: "NoShareLink",
    description: "Hide Share Project and Create share link buttons for privacy.",
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
