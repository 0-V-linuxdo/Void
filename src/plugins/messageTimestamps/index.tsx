/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Text } from "@components/Text";
import { ClockIcon } from "@components/icons";
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
    icon: ClockIcon,
    description: "Shows timestamps on chat messages.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings,

    _renderTimestamp: ErrorBoundary.wrap(({ response }: { response: GrokResponse }) => {
        if (!response?.createTime) return null;
        if (settings.store.hideOwnMessages && response.sender === "human") return null;
        return (
            <Text as="span" size="xs" color="muted" className="void-timestamp">
                {formatTimestamp(response.createTime, settings.store.showDate)}
            </Text>
        );
    }),

    patches: [
        {
            find: "response-family:handleEditSave",
            all: true,
            replacement: {
                match: /\(0,\i\.jsx\)\(\i\.MessageBubble,\{isUser:\i,isIncognito:\i,responseId:(\i)\.responseId/,
                replace: "$self._renderTimestamp({response:$1}),$&",
            },
        },
    ],
});
