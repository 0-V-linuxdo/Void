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
        description: "Hide the upgrade prompt in the model selector.",
        default: true,
    },
    hideInaccessibleModels: {
        type: OptionType.BOOLEAN,
        description: "Hide locked/inaccessible models in the model selector.",
        default: true,
    },
    hideNotificationBanner: {
        type: OptionType.BOOLEAN,
        description: "Hide the \"Get notified when Grok finishes answering\" banner.",
        default: true,
    },
    hideConnectX: {
        type: OptionType.BOOLEAN,
        description: "Hide the \"Connect your 𝕏 account\" upsell popout.",
        default: true,
    },
});

const hideComponentPatch = (name: string, setting: keyof typeof settings.store, all = true) => ({
    find: `"${name}",0,`,
    all,
    replacement: {
        match: new RegExp(`"${name}",0,`),
        replace: `"${name}",0,$self.settings.store.${setting}?()=>null:`,
    },
});

export default definePlugin({
    name: "Cleaner",
    description: "Hides upgrade nags and upsell banners.",
    authors: [Devs.Prism],
    settings,

    patches: [
        {
            find: '"user-dropdown.upgrade","Upgrade plan"',
            all: true,
            replacement: {
                match: /,(\i)(?=\?null:.{0,160}"user-dropdown\.upgrade")/,
                replace: ",$self.settings.store.hideUpgradePlan||$1",
            },
        },
        {
            find: "UPSELL_CARD_PRIORITY)",
            all: true,
            replacement: {
                match: /(\(0,\i\.useIsUpsellLayerVisible\)\(\i\.UPSELL_CARD_PRIORITY\))/,
                replace: "$1&&!$self.settings.store.hideUpsellCard",
            },
        },
        hideComponentPatch("UpsellSuperGrokSmall", "hideUpsellSmall"),
        hideComponentPatch("UpsellButton", "hideUpsellSmall", false),
        {
            find: "connect-x-upsell-dismissed",
            replacement: {
                match: /\.ENABLE_X_INTEGRATION&&(\i\.SHOW_CONNECT_X_UPSELL)/,
                replace: ".ENABLE_X_INTEGRATION&&!$self.settings.store.hideConnectX&&$1",
            },
        },
        hideComponentPatch("BrowserNotificationBanner", "hideNotificationBanner"),
        {
            find: ["mode-select.search-placeholder", "UPSELL_MODEL_SELECT_PRIORITY"],
            all: true,
            group: true,
            replacement: [
                {
                    match: /UPSELL_MODEL_SELECT_PRIORITY\),.{0,200}?if\(/,
                    replace: "$&$self.settings.store.hideModelUpsell||",
                },
                {
                    match: /,(\i)(\.map\(\i=>\(0,\i\.jsx\)\(\i\.DropdownMenuItem,\{className:[^}]{0,200}?\("div",\{className:[^}]{0,200}?\{mode:\i,showDescription:!0\}\)\}\)\},\i\.id\)\))/,
                    replace: ",($self.settings.store.hideInaccessibleModels?[]:$1)$2",
                },
            ],
        },
    ],
});
