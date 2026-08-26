/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import { clamp } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_NAME = "composerOpacity";
const SHELL = ".query-bar";

const settings = definePluginSettings({
    opacity: {
        type: OptionType.SLIDER,
        description: "Background opacity of the chat input. 100 is fully opaque.",
        min: 0,
        max: 100,
        default: 100,
    },
    blur: {
        type: OptionType.SLIDER,
        description: "Backdrop blur in pixels. Helps when opacity is below 100.",
        min: 0,
        max: 40,
        default: 16,
    },
});

function apply() {
    const pct = clamp(settings.store.opacity, 0, 100);
    const blur = clamp(settings.store.blur, 0, 40);
    const alpha = pct / 100;
    registerStyle(
        STYLE_NAME,
        `${SHELL}{`
        + `background-color:hsl(var(--surface-l1)/${alpha})!important;`
        + `background-color:color-mix(in srgb,var(--background) ${pct}%,transparent)!important;`
        + "background-image:none!important;"
        + `-webkit-backdrop-filter:blur(${blur}px)!important;`
        + `backdrop-filter:blur(${blur}px)!important;`
        + "}",
    );
}

export default definePlugin({
    name: "ComposerOpacity",
    description: "Customizable chat input background opacity so content behind the bar cannot show through.",
    authors: [Devs.p],
    tags: ["ui", "chat"],
    enabledByDefault: true,
    settings,

    start: apply,
    onSettingsChange: apply,
    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
