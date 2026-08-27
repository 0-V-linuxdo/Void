/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Flex, Paragraph, Text, Textarea } from "@components";
import { TextCursorInputIcon } from "@components/icons";
import { React } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const cl = classNameFactory("void-ph-");

const DEFAULT_PHRASES = [
    "What do you want to know?",
    "How can I help you today?",
    "What's on your mind?",
].join("\n");

function parsePhrases(raw: unknown): string[] {
    return String(raw ?? "").split("\n").map(s => s.trim()).filter(Boolean);
}

const settings = definePluginSettings({
    phrases: {
        type: OptionType.COMPONENT,
        default: DEFAULT_PHRASES,
        component: PhrasesEditor,
    },
}).withPrivateSettings<{ phrases: string }>();

function PhrasesEditor() {
    const { phrases } = settings.use(["phrases"]);
    return (
        <Flex flexDirection="column" gap="0.5rem" className={cl("root")}>
            <Flex flexDirection="column" gap="0">
                <Text size="sm" weight="medium">Phrases</Text>
                <Paragraph>One placeholder per line. Empty list uses Grok's defaults.</Paragraph>
            </Flex>
            <div className={cl("textarea-wrap")}>
                <Textarea
                    className={cl("textarea")}
                    value={phrases ?? DEFAULT_PHRASES}
                    onChange={e => { settings.store.phrases = e.target.value; }}
                    placeholder={DEFAULT_PHRASES}
                />
            </div>
        </Flex>
    );
}

export default definePlugin({
    name: "Placeholder",
    icon: TextCursorInputIcon,
    description: "Replace the rotating chat input placeholder.",
    authors: [Devs.p],
    tags: ["chat"],
    settings,

    _phrases() {
        const lines = parsePhrases(settings.store.phrases ?? DEFAULT_PHRASES);
        return lines.length ? lines : null;
    },

    patches: [
        {
            find: 'query-bar-placeholder.whats-on-your-mind","What\'s on your mind?"',
            replacement: {
                match: /("query-bar-placeholder\.whats-on-your-mind","What's on your mind\?"\)\],\[\i,\i,\i,\i\]\),)(\i)=(\i\(\)),(\i)=(\i)\.map\(\2\)/,
                replace: "$1$2=$3,$4=($self._phrases()??$5).map($2)",
            },
        },
    ],
});
