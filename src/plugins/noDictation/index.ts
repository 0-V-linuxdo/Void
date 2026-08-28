/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { MicOffIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const STYLE_NAME = "noDictation";

const BUTTON_CSS = `
button[aria-label="Dictation"]:not([role="dialog"] *),
button[aria-label^="Dictation ("]:not([role="dialog"] *),
div:has(> button[aria-label="Dictation"]):not([role="dialog"] *),
div:has(> button[aria-label^="Dictation ("]):not([role="dialog"] *) {
    display: none !important;
}
`;

const REFINEMENT_ROW = '.flex.flex-row.items-center.justify-between.w-full.gap-4:has([aria-label="Dictation Refinement"])';
const REFINEMENT_CSS = `[role="dialog"] ${REFINEMENT_ROW},[role="dialog"] .h-px.bg-border:has(+ ${REFINEMENT_ROW}){display:none!important}`;

const settings = definePluginSettings({
    hideDictationRefinement: {
        type: OptionType.BOOLEAN,
        description: 'Hide "Dictation Refinement" in the Grok Settings dialog (Behavior tab).',
        default: true,
    },
});

function apply() {
    const rules = [BUTTON_CSS];
    if (settings.store.hideDictationRefinement) rules.push(REFINEMENT_CSS);
    registerStyle(STYLE_NAME, rules.join("\n"));
}

export default definePlugin({
    name: "NoDictation",
    icon: MicOffIcon,
    description: "Hide the Dictation (voice input) button from the chat input bar, and optionally Dictation Refinement in Settings.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings,

    start: apply,
    onSettingsChange: apply,
    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
