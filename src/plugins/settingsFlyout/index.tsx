/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components";
import { Settings2Icon } from "@components/icons";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@turbopack/common/components";
import { createElement, React } from "@turbopack/common/react";
import { SettingsDialogStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";
import type { ComponentType } from "react";

import { CogIcon, DatabaseIcon, LightningIcon, PaintIcon, PaymentsIcon, PersonIcon, SlidersIcon, VisitIcon } from "./icons";

const cl = classNameFactory("void-sf-");

const settings = definePluginSettings({
    showOpenSettings: {
        type: OptionType.BOOLEAN,
        description: 'Show "Open Settings" (last used tab).',
        default: true,
    },
    account: {
        type: OptionType.BOOLEAN,
        description: "Account",
        default: true,
    },
    appearance: {
        type: OptionType.BOOLEAN,
        description: "Appearance",
        default: true,
    },
    behavior: {
        type: OptionType.BOOLEAN,
        description: "Behavior",
        default: true,
    },
    customize: {
        type: OptionType.BOOLEAN,
        description: "Customize",
        default: true,
    },
    billing: {
        type: OptionType.BOOLEAN,
        description: "Billing",
        default: true,
    },
    usage: {
        type: OptionType.BOOLEAN,
        description: "Usage",
        default: true,
    },
    data: {
        type: OptionType.BOOLEAN,
        description: "Data Controls",
        default: true,
    },
});

type GrokTabSetting = "account" | "appearance" | "behavior" | "customize" | "billing" | "usage" | "data";

const GROK_TABS: { id: string; name: string; setting: GrokTabSetting; icon: ComponentType<{ className?: string }> }[] = [
    { id: "account", name: "Account", setting: "account", icon: PersonIcon },
    { id: "appearance", name: "Appearance", setting: "appearance", icon: PaintIcon },
    { id: "behavior", name: "Behavior", setting: "behavior", icon: VisitIcon },
    { id: "personality", name: "Customize", setting: "customize", icon: SlidersIcon },
    { id: "billing", name: "Billing", setting: "billing", icon: PaymentsIcon },
    { id: "usage", name: "Usage", setting: "usage", icon: LightningIcon },
    { id: "data", name: "Data Controls", setting: "data", icon: DatabaseIcon },
];

function SettingsMenu({ onOpen }: { onOpen?: (event?: Event) => void }) {
    const cfg = settings.use([
        "showOpenSettings",
        "account",
        "appearance",
        "behavior",
        "customize",
        "billing",
        "usage",
        "data",
    ]);

    const grokTabs = GROK_TABS.filter(t => cfg[t.setting]);
    const showOpen = cfg.showOpenSettings || grokTabs.length === 0;

    const openTab = (tab: string | undefined, event: Event) => {
        try {
            onOpen?.(event);
        } catch {}
        queueMicrotask(() => {
            const store = SettingsDialogStore.useSettingsDialogStore.getState();
            if (tab) store.setTab(tab);
            store.setOpen(true);
        });
    };

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <CogIcon className={cl("menu-icon")} />
                Settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                {showOpen && (
                    <DropdownMenuItem onSelect={e => openTab(undefined, e)}>
                        <CogIcon className={cl("menu-icon")} />
                        Open Settings
                    </DropdownMenuItem>
                )}
                {grokTabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <DropdownMenuItem key={t.id} onSelect={e => openTab(t.id, e)}>
                            <Icon className={cl("menu-icon")} />
                            {t.name}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}

const WrappedSettingsMenu = ErrorBoundary.wrap(SettingsMenu);

export default definePlugin({
    name: "SettingsFlyout",
    icon: Settings2Icon,
    description: "Replace the avatar Settings item with a flyout of shortcuts to settings tabs.",
    authors: [Devs.p],
    tags: ["ui", "settings"],
    enabledByDefault: true,
    requiresRestart: true,
    settings,

    _renderSettingsMenu: (onOpen?: (event?: Event) => void) => createElement(WrappedSettingsMenu, { onOpen }),

    patches: [
        {
            find: '"user-dropdown.settings","Settings"',
            replacement: {
                match: /\jsx{\i\.DropdownMenuItem}\{onSelect:(\i),children:\[\jsx{\i\.CogIcon}\{[^}]{0,80}\}\),\i\("user-dropdown\.settings","Settings"\)\]\}\)/,
                replace: "$self._renderSettingsMenu($1)",
            },
        },
    ],
});
