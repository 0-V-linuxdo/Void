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
                match: /(\i)(?=\?null:.{0,160}"user-dropdown\.upgrade")/,
                replace: "$self.settings.store.hideUpgradePlan||$1",
            },
        },
        {
            find: '"UpsellCard",()=>',
            all: true,
            replacement: {
                match: /"UpsellCard",\(\)=>(\i)/,
                replace: '"UpsellCard",()=>$self.settings.store.hideUpsellCard?()=>null:$1',
            },
        },
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
        {
            find: "connect-x-upsell-dismissed",
            replacement: {
                match: /(\i)\.ENABLE_X_INTEGRATION&&\i\.SHOW_CONNECT_X_UPSELL/,
                replace: "!$self.settings.store.hideConnectX&&$&",
            },
        },
        {
            find: '"BrowserNotificationBanner",()=>',
            all: true,
            replacement: {
                match: /"BrowserNotificationBanner",\(\)=>(\i)/,
                replace: '"BrowserNotificationBanner",()=>$self.settings.store.hideNotificationBanner?()=>null:$1',
            },
        },
        // hides upsell card and locked modes in the mode selector
        {
            find: "mode-select.search-placeholder",
            all: true,
            group: true,
            replacement: [
                {
                    match: /(?<=useCheckSubscriptionOffer\)\(\);)(.{0,30}return null;)/,
                    replace: "if($self.settings.store.hideModelUpsell)return null;$1",
                },
                {
                    match: /(\i)(\.map\(\i=>\(0,\i\.jsx\).{0,60}"text-secondary opacity-75)/,
                    replace: "($self.settings.store.hideInaccessibleModels?[]:$1)$2",
                },
            ],
        },
    ],
});
