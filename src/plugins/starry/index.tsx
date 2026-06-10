/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Flex, SettingsDescription, SettingsRow, SettingsTitle, Text } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { React } from "@turbopack/common/react";
import { findExportedComponentLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const cl = classNameFactory("void-starry-");

const DEFAULT_COLOR = "#ffffff";

const StarsBackground = findExportedComponentLazy("StarsBackground");

function hexToRgb(hex: string): [number, number, number] {
    const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return [255, 255, 255];
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function ColorPicker() {
    const { starColor } = settings.use(["starColor"]);
    const value = starColor ?? DEFAULT_COLOR;

    return (
        <SettingsRow action={
            <Flex alignItems="center" gap="0.5rem">
                <input
                    type="color"
                    className={cl("picker")}
                    value={value}
                    onChange={e => { settings.store.starColor = e.target.value; }}
                />
                <Text size="sm" color="muted">{value}</Text>
            </Flex>
        }>
            <Flex flexDirection="column" gap="0">
                <SettingsTitle>Star color</SettingsTitle>
                <SettingsDescription>Color of the twinkling stars.</SettingsDescription>
            </Flex>
        </SettingsRow>
    );
}

function StarryBackground() {
    const { starColor } = settings.use(["starColor"]);
    return (
        <div aria-hidden className="fixed inset-0 -z-10 pointer-events-none">
            <StarsBackground starColor={hexToRgb(starColor ?? DEFAULT_COLOR)} />
        </div>
    );
}

const WrappedStarry = ErrorBoundary.wrap(StarryBackground);

const settings = definePluginSettings({
    starColor: {
        type: OptionType.COMPONENT,
        component: ColorPicker,
    },
}).withPrivateSettings<{ starColor: string }>();

export default definePlugin({
    name: "Starry",
    description: "Adds Grok's native twinkling starry background to the main page.",
    authors: [Devs.Prism],
    settings,

    _StarryBg() {
        return <WrappedStarry key="void-starry-bg" />;
    },

    patches: [
        {
            find: "\"chat-page\")",
            replacement: {
                match: /(children:\[)((?:\i,){2,8}\i\]\},"chat-page"\))/,
                replace: "$1$self._StarryBg(),$2",
            },
        },
    ],

    start() {
        settings.store.starColor ??= DEFAULT_COLOR;
    },
});
