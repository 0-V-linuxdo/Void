/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { PlusIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "BotsPlusHover",
    icon: PlusIcon,
    description: "Show the sidebar Bots plus button only on hover, matching Projects.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,
    managedStyle: "botsPlusHover",
});
