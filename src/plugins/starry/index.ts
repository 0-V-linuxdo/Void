/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "Starry",
    description: "Enables Grok's native starry idle background with shooting stars.",
    authors: [Devs.Prism],

    patches: [
        {
            find: "inactivityDelay:1e4,fadeInDuration:1e4",
            replacement: [
                {
                    match: /\i\.SHOW_STARRY_IDLE&&!\i&&\i&&"main"===\i\.page&&/,
                    replace: "true&&",
                },
                {
                    match: /inactivityDelay:1e4,fadeInDuration:1e4/,
                    replace: "inactivityDelay:0,fadeInDuration:0",
                },
            ],
        },
    ],
});
