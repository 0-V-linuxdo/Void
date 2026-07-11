/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { isPluginEnabled, plugins } from "@api/PluginManager";
import { definePluginSettings } from "@api/Settings";
import { loadSavedThemes } from "@api/Themes";
import { ErrorBoundary, Flex, Text } from "@components";
import { BracesIcon, PaletteIcon, TestTubeIcon, UnplugIcon } from "@components/icons";
import { CustomCSSTab, loadSavedCSS, PluginsTab, ThemesTab } from "@components/settings/tabs";
import { hasVisibleSettings } from "@components/settings/utils";
import type { SettingsDescriptionProps, SettingsRowProps, SettingsTitleProps } from "@grok-types";
import { Tab as ExperimentsTab } from "@plugins/experiments";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@turbopack/common/components";
import { createElement, React } from "@turbopack/common/react";
import { setSettingsPrimitive } from "@turbopack/common/settingsPrimitives";
import { SettingsDialogStore } from "@turbopack/common/stores";
import { findExportedComponentLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { classNameFactory, registerStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { useEventSubscription, useForceUpdater } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import type { ComponentType, ReactNode } from "react";

const logger = new Logger("Settings");

const MoonIcon = findExportedComponentLazy("MoonIcon");

const cl = classNameFactory("void-settings-");

const settings = definePluginSettings({
    showVoidMenu: {
        type: OptionType.BOOLEAN,
        description: "Show the Void sub-menu in the avatar dropdown.",
        default: true,
    },
});

export interface SettingsTab {
    id: string;
    name: string;
    icon: ComponentType<any>;
    component: ComponentType;
    plugin?: string;
}

export const allTabs: SettingsTab[] = [
    { id: "void_plugins_tab", name: "Plugins", icon: UnplugIcon, component: PluginsTab },
    { id: "void_themes_tab", name: "Themes", icon: PaletteIcon, component: ThemesTab },
    { id: "void_css_tab", name: "Quick CSS", icon: BracesIcon, component: CustomCSSTab },
    { id: "void_experiments_tab", name: "Experiments", icon: TestTubeIcon, component: ExperimentsTab, plugin: "Experiments" },
];

function getVisibleTabs() {
    return allTabs.filter(t => !t.plugin || isPluginEnabled(t.plugin));
}

const Dot = () => <Text as="span" color="secondary">{"\u2022"}</Text>;

function VersionLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a href={href} target="_blank" rel="noreferrer" className={cl("version-link")}>
            <Text as="span" color="secondary">
                {children}
            </Text>
        </a>
    );
}

function VersionInfo() {
    return (
        <Flex flexDirection="column" gap="0" className={cl("version")}>
            <Flex alignItems="center" gap="0.25rem">
                <VersionLink href={REPO_URL}>Void</VersionLink>
                <Dot />
                <Text as="span" color="secondary">{`v${VERSION}`}</Text>
                <Dot />
                <VersionLink href={`${REPO_URL}/commit/${GIT_HASH}`}>{`(${GIT_HASH})`}</VersionLink>
            </Flex>
            <Flex alignItems="center" gap="0.25rem">
                <Text as="span" color="secondary">
                    {IS_DEV ? "Development" : "Production"}
                </Text>
                <Dot />
                <Text as="span" color="secondary">
                    {IS_EXTENSION ? "Extension" : "Userscript"}
                </Text>
            </Flex>
        </Flex>
    );
}

function openSettingsTab(tab: string) {
    const store = SettingsDialogStore.useSettingsDialogStore.getState();
    store.setTab(tab);
    store.setOpen(true);
}

let pendingPluginDialog: string | null = null;

export function consumePendingPluginDialog(): string | null {
    const name = pendingPluginDialog;
    pendingPluginDialog = null;
    return name;
}

function openPluginSettings(name: string) {
    pendingPluginDialog = name;
    openSettingsTab("void_plugins_tab");
}

function VoidMenu() {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);

    if (!settings.store.showVoidMenu) return null;

    const settingsPlugins = Object.keys(plugins)
        .filter(n => !plugins[n].hidden && hasVisibleSettings(plugins[n]))
        .toSorted((a, b) => a.localeCompare(b));

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <MoonIcon className={cl("menu-icon")} />
                Void
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <UnplugIcon className={cl("menu-icon")} />
                        Plugins
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {settingsPlugins.map(name => (
                            <DropdownMenuItem key={name} onSelect={() => openPluginSettings(name)}>
                                {name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                {getVisibleTabs().filter(t => t.id !== "void_plugins_tab").map(t => {
                    const Icon = t.icon;
                    return (
                        <DropdownMenuItem key={t.id} onSelect={() => openSettingsTab(t.id)}>
                            <Icon className={cl("menu-icon")} />
                            {t.name}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuSubContent>
        </DropdownMenuSub>
    );
}

const WrappedVoidMenu = ErrorBoundary.wrap(VoidMenu);

export default definePlugin({
    name: "Settings",
    description: "Adds Void settings UI.",
    authors: [Devs.Prism],
    required: true,
    settings,

    _renderVoidMenu: () => createElement(WrappedVoidMenu),

    _setTitle(title: ComponentType<SettingsTitleProps>) {
        setSettingsPrimitive("SettingsTitle", title);
        return title;
    },

    _setDescription(description: ComponentType<SettingsDescriptionProps>) {
        setSettingsPrimitive("SettingsDescription", description);
        return description;
    },

    _setRow(row: ComponentType<SettingsRowProps>) {
        setSettingsPrimitive("SettingsRow", row);
        return row;
    },

    _tabEntries() {
        return getVisibleTabs().map(t => ({
            id: t.id,
            icon: t.icon,
            i18nKey: t.name,
            defaultLabel: t.name,
            visible: () => true,
            component: t.component,
        }));
    },

    _renderVersion() {
        return <VersionInfo key="void-version" />;
    },

    start() {
        registerStyle("void-global", "[data-sonner-toast] [data-title]{font-weight:400}");
        try {
            if (document.head) loadSavedCSS();
            else document.addEventListener("DOMContentLoaded", loadSavedCSS, { once: true });
        } catch (e) {
            logger.error("Failed to load saved CSS:", e);
        }
        loadSavedThemes().catch(e => logger.error("Failed to load saved themes:", e));
    },

    patches: [
        {
            find: "avatar_menu_click",
            all: true,
            replacement: {
                match: /\(0,(\i)\.jsxs\)\((\i)\.DropdownMenuSub,\{children:\[\(0,\1\.jsxs\)\(\2\.DropdownMenuSubTrigger,\{children:\[.{0,100}"user-dropdown\.help"/,
                replace: "$self._renderVoidMenu(),$&",
            },
        },
        {
            find: "pressed_cmd_settings",
            replacement: [
                {
                    match: /\i\.filter\(\i=>\i\.visible\(\i\)\)/,
                    replace: "[...$&,...$self._tabEntries()]",
                },
                {
                    match: /children:(\i\.map\(\i=>\(0,\i\.jsx\)\(\i,\{enterprise:\i\.enterprise,children:.{0,160}?\},\i\.id\)\))\}\)/,
                    replace: "children:[...$1,$self._renderVersion()]})",
                },
            ],
        },
        {
            find: /,\{children:\i,action:\i,hidden:\i,className:\i\}=\i,\i=\(0,\i\.useId\)\(\)/,
            all: true,
            replacement: [
                {
                    match: /("SettingsTitle",0,)(\i)/,
                    replace: "$1$self._setTitle($2)",
                },
                {
                    match: /("SettingsDescription",0,)(\i)/,
                    replace: "$1$self._setDescription($2)",
                },
                {
                    match: /("SettingsRow",0,)(function\(\i\)\{[\s\S]*?\})(,"SettingsSection")/,
                    replace: "$1$self._setRow($2)$3",
                },
            ],
        },
    ],
});
