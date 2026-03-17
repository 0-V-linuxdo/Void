/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    hideUpgradePlan: {
        type: OptionType.BOOLEAN,
        description: "Hide the upgrade plan button in the user menu.",
        default: true,
    },
    hideUpsellCard: {
        type: OptionType.BOOLEAN,
        description: "Hide the upsell card banner.",
        default: true,
    },
    hideUpsellSmall: {
        type: OptionType.BOOLEAN,
        description: "Hide the small SuperGrok upsell banner.",
        default: true,
    },
    hideModelUpsell: {
        type: OptionType.BOOLEAN,
        description: "Hide upgrade prompts and locked modes in the model selector.",
        default: true,
    },
});

export default definePlugin({
    name: "Cleaner",
    description: "Hides upgrade nags and upsell banners.",
    authors: [Devs.Prism],
    settings,

    patches: [
        // hides "upgrade plan" button in user dropdown menu
        {
            find: '"user-dropdown.upgrade","Upgrade plan"',
            all: true,
            replacement: {
                match: /(\i(?:\|\|\i)+)(?=\?null:.{0,160}"user-dropdown\.upgrade")/,
                replace: "$self.settings.store.hideUpgradePlan||$1",
            },
        },
        // replaces UpsellCard component with empty render
        {
            find: '"UpsellCard",()=>',
            all: true,
            replacement: {
                match: /"UpsellCard",\(\)=>(\i)/,
                replace: '"UpsellCard",()=>$self.settings.store.hideUpsellCard?()=>null:$1',
            },
        },
        // replaces small supergrok upsell component with empty render
        {
            find: '"UpsellSuperGrokSmall",()=>',
            all: true,
            replacement: {
                match: /"UpsellSuperGrokSmall",\(\)=>(\i)/,
                replace: '"UpsellSuperGrokSmall",()=>$self.settings.store.hideUpsellSmall?()=>null:$1',
            },
        },
        {
            find: "model-mode-select-upsell",
            group: true,
            replacement: [
                // hides the upsell card inside the model selector dropdown
                {
                    match: /(?<=useCheckSubscriptionOffer\)\(\);)(.{0,30}return null;)/,
                    replace: "if($self.settings.store.hideModelUpsell)return null;$1",
                },
                // clears locked modes so they don't show as greyed out
                {
                    match: /upgradeRequiredModes:(\i)\}=(\i)\(\)/,
                    replace: "upgradeRequiredModes:$1}=function(){let r=$2();if($self.settings.store.hideModelUpsell)r.upgradeRequiredModes=[];return r}()",
                },
            ],
        },
    ],
});
