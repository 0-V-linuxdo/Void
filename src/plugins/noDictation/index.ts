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
const REFINEMENT_MARK = "void-no-dictation-refinement";
const REFINEMENT_ROW = `div:has(> .${REFINEMENT_MARK})`;

const BUTTON_CSS = `
button[aria-label="Dictation"]:not([role="dialog"] *),
button[aria-label^="Dictation ("]:not([role="dialog"] *),
div:has(> button[aria-label="Dictation"]):not([role="dialog"] *),
div:has(> button[aria-label^="Dictation ("]):not([role="dialog"] *) {
    display: none !important;
}
`;

const REFINEMENT_CSS = `${REFINEMENT_ROW},.h-px.bg-border:has(+ ${REFINEMENT_ROW}){display:none!important}`;

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

    patches: [
        {
            find: 'settings.behavior.dictation-refinement.description","How much Grok refines your speech-to-text transcriptions',
            replacement: {
                match: /("How much Grok refines your speech-to-text transcriptions".{0,200}?\(0,\i\.jsxs\)\(\i,\{action:\i)(?=,children:\[)/,
                replace: `$1,className:"${REFINEMENT_MARK}"`,
            },
        },
    ],

    start: apply,
    onSettingsChange: apply,
    stop() {
        unregisterStyle(STYLE_NAME);
    },
});
