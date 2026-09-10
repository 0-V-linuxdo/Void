/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ErrorBoundary } from "@components/ErrorBoundary";
import { LayoutGridIcon } from "@components/icons";
import { DropdownMenuItem } from "@turbopack/common/components";
import { createElement, React } from "@turbopack/common/react";
import { findByPropsLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

const PluginsDialogStore = findByPropsLazy("usePluginsDialogStore");

function openPlugins() {
    PluginsDialogStore.usePluginsDialogStore.getState().setOpen(true);
}

function PluginsItem() {
    return (
        <DropdownMenuItem onSelect={openPlugins}>
            <LayoutGridIcon className="void-settings-menu-icon" />
            Plugins
        </DropdownMenuItem>
    );
}

const WrappedPluginsItem = ErrorBoundary.wrap(PluginsItem);

export default definePlugin({
    name: "NoSidebarPlugins",
    icon: LayoutGridIcon,
    description: "Move the sidebar Plugins button into the avatar menu.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,

    _renderItem: () => createElement(WrappedPluginsItem),

    patches: [
        {
            find: "usePluginsDialogStore.getState().setOpen(!0)",
            replacement: {
                match: /(\(0,\i\.jsx\)\(\i\.AppSidebarItem,\{icon:.{0,80}?onClick:\(\)=>\{"skills-and-connectors")/,
                replace: "false&&$1",
            },
        },
        {
            find: 'ENABLE_GROK_WEB_PLUGIN_MARKETPLACE)&&{id:"skills-and-connectors"',
            replacement: {
                match: /ENABLE_GROK_WEB_PLUGIN_MARKETPLACE\)&&\{id:"skills-and-connectors"/,
                replace: 'ENABLE_GROK_WEB_PLUGIN_MARKETPLACE)&&!1&&{id:"skills-and-connectors"',
            },
        },
        {
            find: '"user-dropdown.help"',
            replacement: {
                match: /(?=\(0,\i\.jsxs\)\(\i\.DropdownMenuSub,\{children:\[\(0,\i\.jsxs\)\(\i\.DropdownMenuSubTrigger,\{(?:\i:\i,)*children:\[.{0,100}"user-dropdown\.help")/,
                replace: "$self._renderItem(),",
            },
        },
    ],
});
