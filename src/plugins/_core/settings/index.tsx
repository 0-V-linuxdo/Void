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
import { Tab as ExperimentsTab } from "@plugins/experiments";
import {
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@turbopack/common/components";
import { createElement, Fragment, React } from "@turbopack/common/react";
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
    hideUserId: {
        type: OptionType.BOOLEAN,
        description: "Hide your user ID from the account settings page.",
        default: true,
    },
    fixDialogFlash: {
        type: OptionType.BOOLEAN,
        description: "Fix the white border flash when clicking inside dialogs.",
        default: true,
    },
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

interface TabButtonProps {
    icon: ComponentType;
    text: string;
    tab: string;
}

interface WrapperProps {
    children: ReactNode;
}

function VoidTabs({ jsx, TabButton }: { jsx: typeof createElement; TabButton: ComponentType<TabButtonProps> }) {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);

    return (
        <Fragment>
            {getVisibleTabs().map(t => jsx(TabButton, { key: t.id, icon: t.icon, text: t.name, tab: t.id }))}
        </Fragment>
    );
}

function VoidPanels({ jsx, activeTab, Wrapper }: { jsx: typeof createElement; activeTab: string; Wrapper: ComponentType<WrapperProps> }) {
    const forceUpdate = useForceUpdater();
    useEventSubscription("pluginToggle", forceUpdate);

    const tab = getVisibleTabs().find(t => t.id === activeTab);
    if (!tab) return null;
    return jsx(Wrapper, { key: tab.id, children: jsx(tab.component, {}) });
}

function openSettingsTab(tab: string) {
    const store = SettingsDialogStore.useSettingsDialogStore.getState();
    store.setTab(tab);
    store.setOpen(true);
}

let pendingPluginDialog: string | null = null;

/** Called by PluginsTab on mount to consume any pending dialog request. */
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

export default definePlugin({
    name: "Settings",
    description: "Adds Void settings UI.",
    authors: [Devs.Prism],
    required: true,
    settings,

    _hideUserId() {
        return settings.store.hideUserId;
    },

    _fixDialogFlash() {
        return settings.store.fixDialogFlash;
    },

    _VoidMenu: ErrorBoundary.wrap(VoidMenu),

    renderTabs(jsx: typeof createElement, TabButton: ComponentType<TabButtonProps>) {
        try {
            return [<VoidTabs key="void-tabs" jsx={jsx} TabButton={TabButton} />, <VersionInfo key="void-version" />];
        } catch (e) {
            logger.error("Failed to render tabs:", e);
            return [];
        }
    },

    renderPanels(jsx: typeof createElement, activeTab: string, Wrapper: ComponentType<WrapperProps>) {
        try {
            return [<VoidPanels key="void-panels" jsx={jsx} activeTab={activeTab} Wrapper={Wrapper} />];
        } catch (e) {
            logger.error("Failed to render panels:", e);
            return [];
        }
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
                replace: "(0,$1.jsx)($self._VoidMenu,{}),$&",
            },
        },
        {
            find: '"DialogContent",0,',
            all: true,
            replacement: {
                match: /dark:border-border-l1 duration-200/,
                replace: 'dark:border-border-l1 "+($self._fixDialogFlash()?"outline-none ":"")+"duration-200',
            },
        },
        {
            find: "pressed_cmd_settings",
            replacement: [
                {
                    match: /(?<=(\i\.jsx)\)\((\i),\{icon:\i\.)DatabaseIcon,.{0,80}tab:"data"\}\)/,
                    replace: "$&,...$self.renderTabs($1,$2)",
                },
                {
                    match: /"data"===(\i)&&\i\.user&&\(0,(\i\.jsx)\)\((\i),\{children:/,
                    replace: "...$self.renderPanels($2,$1,$3),$&",
                },
            ],
        },
        {
            find: "settings-account-card",
            replacement: {
                match: /\(0,\i\.jsx\)\("div",\{[^}]*\.userId\}\)/,
                replace: "($self._hideUserId()?null:$&)",
            },
        },
    ],
});
