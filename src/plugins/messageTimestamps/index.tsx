/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

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
    const now = new Date();
    const today = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (!showDate || today) return time;
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
}

export default definePlugin({
    name: "MessageTimestamps",
    description: "Shows timestamps on chat messages.",
    authors: [Devs.Prism],
    settings,

    _renderTimestamp(response: GrokResponse) {
        try {
            if (!response?.createTime) return null;
            if (settings.store.hideOwnMessages && response.sender === "human") return null;
            return (
                <Text as="span" size="xs" color="muted" className="void-timestamp">
                    {formatTimestamp(response.createTime, settings.store.showDate)}
                </Text>
            );
        } catch {
            return null;
        }
    },

    patches: [
        {
            find: 'displayName="ResponseFamily"',
            all: true,
            replacement: {
                match: /:null,\(0,(\i)\.jsx\)\((\i)\.MessageBubble,\{isUser:(\i),isIncognito:(\i),children:!(\i)&&(\i)\?\(0,\1\.jsx\)\((\i)\.Editor,\{initialMessage:(\i)\./,
                replace: ":null,$self._renderTimestamp($8),(0,$1.jsx)($2.MessageBubble,{isUser:$3,isIncognito:$4,children:!$5&&$6?(0,$1.jsx)($7.Editor,{initialMessage:$8.",
            },
        },
    ],
});
