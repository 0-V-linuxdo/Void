/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    variant: {
        type: OptionType.SELECT,
        description: "Color variant for the rocket plume.",
        options: [
            { label: "Orange", value: "orange", default: true },
            { label: "Blue", value: "blue" },
        ],
    },
    fullWidth: {
        type: OptionType.BOOLEAN,
        description: "Expand the animation beyond the chat column to fill the full page width.",
        default: false,
    },
});

export default definePlugin({
    name: "RocketAnim",
    description: "Enables the rocket plume animation.",
    authors: [Devs.Prism],
    settings,

    patches: [
        {
            find: ["useSuperGrokAnimations", "useRocketStore", "useSurveyLocation"],
            all: true,
            noWarn: true,
            replacement: {
                match: /(\i)=!!\(\i\.SUPERGROK_BRANDING_QUERY_BAR_ANIMATION_ENABLED&&\(\i\|\|\i\)\);return\{enabled:/,
                replace: "$1=!0;return{enabled:",
            },
        },
        {
            find: ["u_isHeavy", "isSuperGrokProUser"],
            replacement: {
                match: /\i&&\(0,(\i)\.jsx\)\((\i),\{isHeavy:\i\}\)/,
                replace: "(0,$1.jsx)($2,{isHeavy:$self._isHeavy(),maxWidthClass:$self._maxWidth()})",
            },
        },
        {
            find: ["withRocketGlowBorder", "isSuperGrokProUser"],
            all: true,
            noWarn: true,
            replacement: {
                match: /withRocketGlowBorder:\i=!1\}=\i,.{0,60}\{isSuperGrokProUser:(\i)\}=\(0,(\i)\.useSubscriptions\)\(\)/,
                replace: "$&;$1=$self._isHeavy()",
            },
        },
    ],

    _isHeavy: () => settings.store.variant === "blue",
    _maxWidth: () => settings.store.fullWidth ? "" : "max-w-breakout",
});
