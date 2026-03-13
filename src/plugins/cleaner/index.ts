/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "Cleaner",
    description: "Hides upgrade nags and upsell banners.",
    authors: [Devs.Prism],

    patches: [
        {
            find: '"user-dropdown.upgrade","Upgrade plan"',
            all: true,
            replacement: {
                match: /\i(?:\|\|\i)+(?=\?null:.{0,160}"user-dropdown\.upgrade")/,
                replace: "true",
            },
        },
        {
            find: '"UpsellCard",()=>',
            all: true,
            replacement: {
                match: /"UpsellCard",\(\)=>\i/,
                replace: '"UpsellCard",()=>()=>null',
            },
        },
        {
            find: '"UpsellSuperGrokSmall",()=>',
            all: true,
            replacement: {
                match: /"UpsellSuperGrokSmall",\(\)=>\i/,
                replace: '"UpsellSuperGrokSmall",()=>()=>null',
            },
        },
        {
            find: "group/model-mode-select-upsell",
            replacement: [
                {
                    match: /(?<=useCheckSubscriptionOffer\)\(\);).{0,30}return null;/,
                    replace: "return null;",
                },
                {
                    match: /upgradeRequiredModes:(\i)\}=(\i)\(\)/,
                    replace: "upgradeRequiredModes:$1}=function(){let r=$2();r.upgradeRequiredModes=[];return r}()",
                },
            ],
        },
    ],
});
