/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { VoidContextMenuItems } from "@api/ContextMenus";
import { createElement } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "ContextMenuAPI",
    description: "Adds items to context menus.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,

    renderItems(location: string, ctx?: Record<string, any>) {
        return createElement(VoidContextMenuItems as any, { location, ...ctx });
    },

    patches: [
        {
            find: "handleIsolateClick,children:[i&&",
            all: true,
            group: true,
            replacement: [
                {
                    match: /onSaveEdit:(\i)\}\)/,
                    replace: "onSaveEdit:$1,id:arguments[0].id})",
                },
                {
                    match: /onEditClick:(\i)\}\)/,
                    replace: "onEditClick:$1,...arguments[0]})",
                },
                {
                    match: /"Delete","Delete"\)\]\}\)/,
                    replace: '$&,$self.renderItems("conversation",{conversationId:arguments[0].id})',
                },
            ],
        },
        {
            find: '"CopyButton",()=>',
            all: true,
            replacement: {
                match: /slice\(0,5\)\}\}\)\}\)\]\}\)/,
                replace: '$&,$self.renderItems("message",{response:arguments[0].response})',
            },
        },
        {
            find: '"AvatarDropdownMenu",()=>',
            all: true,
            replacement: {
                match: /"Sign Out"\)\]\}\)/,
                replace: '$&,$self.renderItems("user")',
            },
        },
    ],
});
