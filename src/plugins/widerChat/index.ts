/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, SettingsStore } from "@api/Settings";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_NAME = "widerChat";

const settings = definePluginSettings({
    width: {
        type: OptionType.NUMBER,
        description: "Maximum chat width in rem (default: 48).",
        default: 64,
    },
});

function applyWidth() {
    const w = settings.store.width ?? 64;
    registerStyle(STYLE_NAME, `.breakout{--content-max-width:${w}rem!important}.max-w-breakout{max-width:${w}rem!important}`);
}

let unsubscribe: (() => void) | null = null;

export default definePlugin({
    name: "WiderChat",
    description: "Adjustable chat width for big monitors.",
    authors: [Devs.Prism],
    settings,

    start() {
        applyWidth();
        const prefix = `plugins.${settings.pluginName}`;
        SettingsStore.addPrefixChangeListener(prefix, applyWidth);
        unsubscribe = () => SettingsStore.removePrefixChangeListener(prefix, applyWidth);
    },

    stop() {
        unsubscribe?.();
        unsubscribe = null;
        unregisterStyle(STYLE_NAME);
    },
});
