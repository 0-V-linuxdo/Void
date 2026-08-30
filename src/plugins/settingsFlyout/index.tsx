/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary, Text } from "@components";
import { BracesIcon, PaletteIcon, Settings2Icon, UnplugIcon } from "@components/icons";
import {
    DropdownMenuItem,
    DropdownMenuSeparator,
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

interface FlyoutTab {
    id: string;
    name: string;
    icon: ComponentType<{ className?: string }>;
}

interface GrokFlyoutTab extends FlyoutTab {
    setting: GrokTabSetting;
}

const GROK_TABS: GrokFlyoutTab[] = [
    { id: "account", name: "Account", setting: "account", icon: PersonIcon },
    { id: "appearance", name: "Appearance", setting: "appearance", icon: PaintIcon },
    { id: "behavior", name: "Behavior", setting: "behavior", icon: VisitIcon },
    { id: "personality", name: "Customize", setting: "customize", icon: SlidersIcon },
    { id: "billing", name: "Billing", setting: "billing", icon: PaymentsIcon },
    { id: "usage", name: "Usage", setting: "usage", icon: LightningIcon },
    { id: "data", name: "Data Controls", setting: "data", icon: DatabaseIcon },
];

const VOID_TABS: FlyoutTab[] = [
    { id: "void_plugins_tab", name: "Plugins", icon: UnplugIcon },
    { id: "void_themes_tab", name: "Themes", icon: PaletteIcon },
    { id: "void_css_tab", name: "Quick CSS", icon: BracesIcon },
];

function openTab(tab: string | undefined, onOpen?: (event?: Event) => void, event?: Event) {
    const store = SettingsDialogStore.useSettingsDialogStore.getState();
    if (tab) {
        store.setTab(tab);
        store.setOpen(true);
        return;
    }
    try {
        onOpen?.(event);
    } catch {}
    store.setOpen(true);
}

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

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <CogIcon className={cl("menu-icon")} />
                Settings
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className={cl("menu")}>
                {showOpen && (
                    <DropdownMenuItem onSelect={e => openTab(undefined, onOpen, e)}>
                        <CogIcon className={cl("menu-icon")} />
                        Open Settings
                    </DropdownMenuItem>
                )}
                {showOpen && <DropdownMenuSeparator />}
                <Text size="xs" color="secondary" className={cl("group")}>Void</Text>
                {VOID_TABS.map(t => {
                    const Icon = t.icon;
                    return (
                        <DropdownMenuItem key={t.id} onSelect={() => openTab(t.id)}>
                            <Icon className={cl("menu-icon")} />
                            {t.name}
                        </DropdownMenuItem>
                    );
                })}
                {grokTabs.length > 0 && <DropdownMenuSeparator />}
                {grokTabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <DropdownMenuItem key={t.id} onSelect={() => openTab(t.id)}>
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
    description: "Replace the avatar Settings item with a flyout of shortcuts to Void and Grok settings tabs.",
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
