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
import { BracesIcon, PaletteIcon, SettingsIcon, TestTubeIcon, UnplugIcon, VoidIcon } from "@components/icons";
import { CustomCSSTab, loadSavedCSS, PluginsTab, setPendingPluginDialog, ThemesTab } from "@components/settings/tabs";
import { Tab as ExperimentsTab } from "@plugins/experiments";
import { usePluginMenu } from "@plugins/pluginsFlyout";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@turbopack/common/components";
import { createElement, React } from "@turbopack/common/react";
import { setSettingsPrimitive, type SettingsPrimitives } from "@turbopack/common/settingsPrimitives";
import { SettingsDialogStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory, registerStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { useEventSubscription, useForceUpdater } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import type { ComponentType, ReactNode } from "react";

const logger = new Logger("Settings");

const cl = classNameFactory("void-settings-");

const settings = definePluginSettings({
    showVoidMenu: {
        type: OptionType.BOOLEAN,
        description: "Show the Void sub-menu in the avatar dropdown.",
        default: true,
    },
});

interface SettingsTab {
    id: string;
    name: string;
    icon: ComponentType<any>;
    component: ComponentType;
    plugin?: string;
}

const PLUGINS_TAB_ID = "void_plugins_tab";

export const allTabs: SettingsTab[] = [
    { id: PLUGINS_TAB_ID, name: "Plugins", icon: UnplugIcon, component: PluginsTab },
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
                <Text as="span" color="secondary">{VERSION}</Text>
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

function openPluginSettings(name: string) {
    setPendingPluginDialog(name);
    openSettingsTab(PLUGINS_TAB_ID);
}

function VoidMenu() {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);
    const { showVoidMenu } = settings.use(["showVoidMenu"]);
    const menuPlugins = usePluginMenu();

    if (!showVoidMenu) return null;

    return (
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <VoidIcon className={cl("menu-icon")} />
                Void
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
                {menuPlugins.length > 0 && (
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                            <UnplugIcon className={cl("menu-icon")} />
                            Plugins
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            {menuPlugins.map(name => {
                                const Icon = plugins[name].icon ?? UnplugIcon;
                                return (
                                    <DropdownMenuItem key={name} onSelect={() => openPluginSettings(name)}>
                                        <Icon className={cl("menu-icon")} />
                                        {name}
                                    </DropdownMenuItem>
                                );
                            })}
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                )}
                {getVisibleTabs().filter(t => t.id !== PLUGINS_TAB_ID).map(t => {
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
    icon: SettingsIcon,
    description: "Adds Void settings UI.",
    authors: [Devs.Prism],
    required: true,
    settings,

    _renderVoidMenu: () => createElement(WrappedVoidMenu),

    _setPrimitive<K extends keyof SettingsPrimitives>(name: K, component: SettingsPrimitives[K]) {
        setSettingsPrimitive(name, component);
        return component;
    },

    _tabEntries() {
        return getVisibleTabs().map(t => ({
            id: t.id,
            group: "void",
            icon: t.icon,
            i18nKey: t.name,
            defaultLabel: t.name,
            visible: () => true,
            component: t.component,
        }));
    },

    _tabLabel(tab: { defaultLabel?: string; i18nKey?: string; id: string }) {
        return tab.defaultLabel || tab.i18nKey || tab.id;
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
                match: /\(0,(\i)\.jsxs\)\((\i)\.DropdownMenuSub,\{children:\[\(0,\1\.jsxs\)\(\2\.DropdownMenuSubTrigger,\{(?:\i:\i,)*children:\[.{0,100}"user-dropdown\.help"/,
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
                    match: /(\["general","grok","payments","data","other"),("team-management"\])/,
                    replace: '$1,"void",$2',
                },
                {
                    match: /(case"other":return \i\("settings-nav-group\.other","Other"\);)(case"team-management":)/,
                    replace: '$1case"void":return"Void";$2',
                },
                {
                    match: /default:return\(0,\i\.logError\)\("SettingsDialog:tabLabel",`No label for settings tab \${(\i)\.id}`\),\1\.id/,
                    replace: "default:return $self._tabLabel($1)",
                },
            ],
        },
        {
            find: '"SettingsTitle",0,',
            all: true,
            replacement: [
                {
                    match: /("SettingsTitle",0,)(\i)/,
                    replace: '$1$self._setPrimitive("SettingsTitle",$2)',
                },
                {
                    match: /("SettingsDescription",0,)(\i)/,
                    replace: '$1$self._setPrimitive("SettingsDescription",$2)',
                },
                {
                    match: /("SettingsRow",0,)(?!function)(\i)/,
                    replace: '$1$self._setPrimitive("SettingsRow",$2)',
                },
                {
                    match: /("SettingsRow",0,)(function\(\i\)\{[\s\S]*?\})(?=,"Settings)/,
                    replace: '$1$self._setPrimitive("SettingsRow",$2)',
                },
            ],
        },
    ],
});
