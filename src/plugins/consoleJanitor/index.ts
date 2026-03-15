/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "ConsoleJanitor",
    description: "Silences noisy warnings and info logs in the browser console.",
    authors: [Devs.Prism],

    patches: [
        {
            find: "x.ai/careers",
            replacement: {
                match: /console\.info\("[^"]{0,2000}"\)/,
                replace: "void 0",
            },
        },
        {
            find: "DialogDescriptionWarning",
            all: true,
            replacement: {
                match: /console\.warn\(\i\)/,
                replace: "void 0",
            },
        },
        {
            find: "pressure_observer",
            replacement: {
                match: /"PressureObserver"in window/,
                replace: "false",
            },
        },
        {
            find: "NO_I18NEXT_INSTANCE",
            all: true,
            replacement: {
                match: /console\.warn\(\.\.\.\i\)/,
                replace: "void 0",
            },
        },
    ],
});
