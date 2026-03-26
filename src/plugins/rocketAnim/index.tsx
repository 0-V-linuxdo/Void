/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_KEY = "void-rocket-glow";
const GLOW_COLORS: Record<string, string> = { orange: "#FF5C00", blue: "#82B1F9" };

function syncGlow() {
    const color = GLOW_COLORS[settings.store.variant] ?? GLOW_COLORS.orange;
    registerStyle(STYLE_KEY, `:root { --void-rocket-glow: ${color}; }`);
}

const settings = definePluginSettings({
    variant: {
        type: OptionType.SELECT,
        description: "Color variant for the rocket plume.",
        onChange: syncGlow,
        options: [
            { label: "Orange", value: "orange", default: true },
            { label: "Blue", value: "blue" },
        ],
    },
});

export default definePlugin({
    name: "RocketAnim",
    description: "Enables the rocket plume animation.",
    authors: [Devs.Prism],
    settings,

    patches: [
        {
            find: ["SUPERGROK_BRANDING_QUERY_BAR_ANIMATION_ENABLED", "glowBorderColor"],
            all: true,
            replacement: [
                {
                    match: /(\i)=\i\.SUPERGROK_BRANDING_QUERY_BAR_ANIMATION_ENABLED&&\(\i\|\|\i\)/g,
                    replace: "$1=!0",
                },
                {
                    match: /glowBorderColor:\i\?\i\?"#82B1F9":"#FF5C00":void 0/,
                    replace: 'glowBorderColor:"var(--void-rocket-glow)"',
                },
            ],
        },
        {
            find: ["u_isHeavy", "glowBorderColor"],
            replacement: {
                match: /\i&&\(0,(\i)\.jsx\)\((\i),\{isHeavy:\i\}\)/,
                replace: "(0,$1.jsx)($2,{isHeavy:$self._isHeavy()})",
            },
        },
    ],

    start() {
        if (!GLOW_COLORS[settings.store.variant]) settings.store.variant = "orange";
        syncGlow();
    },

    stop() {
        unregisterStyle(STYLE_KEY);
    },

    _isHeavy: () => settings.store.variant === "blue",
});
