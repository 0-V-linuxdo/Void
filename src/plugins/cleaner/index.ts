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
        // replaces upgrade/try free button (imagine page, sidebar, new chat)
        {
            find: '"UpsellButton",()=>',
            replacement: {
                match: /"UpsellButton",\(\)=>(\i)/,
                replace: '"UpsellButton",()=>$self.settings.store.hideUpsellSmall?()=>null:$1',
            },
        },
        // hides upsell card and locked modes in the mode selector
        {
            find: "mode-select.search-placeholder",
            all: true,
            group: true,
            replacement: [
                // hides the upsell card
                {
                    match: /(?<=useCheckSubscriptionOffer\)\(\);)(.{0,30}return null;)/,
                    replace: "if($self.settings.store.hideModelUpsell)return null;$1",
                },
                // empties the locked modes list so they don't render greyed out
                {
                    match: /(\i)(\.map\(\i=>\(0,\i\.jsx\).{0,60}"text-secondary opacity-75)/,
                    replace: "($self.settings.store.hideModelUpsell?[]:$1)$2",
                },
            ],
        },
    ],
});
