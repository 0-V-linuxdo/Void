/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type ContextMenuLocation, VoidContextMenuItems } from "@api/ContextMenus";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { React } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "ContextMenuAPI",
    description: "Adds items to context menus.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,

    renderItems(location: ContextMenuLocation, ctx?: Record<string, any>) {
        return (
            <ErrorBoundary>
                <VoidContextMenuItems location={location} {...ctx} />
            </ErrorBoundary>
        );
    },

    patches: [
        {
            find: '"Editing actions","Editing actions"',
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
            find: '"more-actions-dropdown"',
            all: true,
            replacement: {
                match: /"more-action\.copy-model-hash".{0,80}slice\(0,5\)\}\}\)\}\)/,
                replace: '$&,$self.renderItems("message",{response:arguments[0].response})',
            },
        },
        {
            find: '"user-dropdown.upgrade","Upgrade plan"',
            all: true,
            replacement: {
                match: /(\(0,\i\.jsxs?\)\(\i\.DropdownMenuItem,\{onSelect:\i,children:\[\(0,\i\.jsx\)\(\i\.SignOutIcon)/,
                replace: '$self.renderItems("user"),$1',
            },
        },
    ],
});
