/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Text } from "@components/Text";
import type { GrokResponse } from "@grok-types";
import { React } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    showDate: {
        type: OptionType.BOOLEAN,
        description: "Show the full date for messages older than today.",
        default: true,
    },
    hideOwnMessages: {
        type: OptionType.BOOLEAN,
        description: "Hide timestamps on your own messages.",
        default: false,
    },
});

function formatTimestamp(iso: string, showDate: boolean) {
    const date = new Date(iso);
    if (!showDate || isToday(date)) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isToday(date: Date) {
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export default definePlugin({
    name: "MessageTimestamps",
    description: "Shows timestamps on chat messages.",
    authors: [Devs.Prism],
    settings,

    _renderTimestamp(response: GrokResponse) {
        if (!response?.createTime) return null;
        if (settings.store.hideOwnMessages && response.sender === "human") return null;
        return (
            <Text as="span" size="xs" color="muted" className="mb-0.5 print:hidden">
                {formatTimestamp(response.createTime, settings.store.showDate)}
            </Text>
        );
    },

    patches: [
        {
            find: 'displayName="ResponseFamily"',
            replacement: {
                match: /(\i)\.parentQuotedText(.{0,10})\(0,(\i)\.jsx\)\((\i)\.MessageBubble/,
                replace: "$1.parentQuotedText$2$self._renderTimestamp($1),(0,$3.jsx)($4.MessageBubble",
            },
        },
    ],
});
