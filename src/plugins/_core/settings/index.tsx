/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { isPluginEnabled } from "@api/PluginManager";
import { definePluginSettings } from "@api/Settings";
import { loadSavedThemes } from "@api/Themes";
import { Flex, Text } from "@components";
import { BracesIcon, PaletteIcon, TestTubeIcon, UnplugIcon } from "@components/icons";
import { CustomCSSTab, loadSavedCSS, PluginsTab, ThemesTab } from "@components/settings/tabs";
import { Tab as ExperimentsTab } from "@plugins/experiments";
import { createElement, Fragment, React } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import { classes, classNameFactory, registerStyle } from "@utils/css";
import { useEventSubscription, useForceUpdater } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import type { ComponentType, ReactNode } from "react";

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
});

interface SettingsTab {
    id: string;
    name: string;
    icon: ComponentType;
    component: ComponentType;
    plugin?: string;
}

const allTabs: SettingsTab[] = [
    { id: "void_plugins_tab", name: "Plugins", icon: UnplugIcon, component: PluginsTab },
    { id: "void_themes_tab", name: "Themes", icon: PaletteIcon, component: ThemesTab },
    { id: "void_css_tab", name: "Quick CSS", icon: BracesIcon, component: CustomCSSTab },
    { id: "void_experiments_tab", name: "Experiments", icon: TestTubeIcon, component: ExperimentsTab, plugin: "Experiments" },
];

function getVisibleTabs() {
    return allTabs.filter(t => !t.plugin || isPluginEnabled(t.plugin));
}

function Dot() {
    return (
        <Text as="span" color="secondary">
            {"\u2022"}
        </Text>
    );
}

function VersionLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <a href={href} target="_blank" rel="noreferrer" className={classes(cl("version-link"), "pointer-events-auto")}>
            <Text as="span" color="secondary">
                {children}
            </Text>
        </a>
    );
}

function VersionInfo() {
    return (
        <Flex flexDirection="column" gap="0" className={classes(cl("version"), "absolute bottom-0 left-0 right-0 p-3 opacity-30 text-secondary pointer-events-none")}>
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

    renderTabs(jsx: typeof createElement, TabButton: ComponentType<TabButtonProps>) {
        return [<VoidTabs key="void-tabs" jsx={jsx} TabButton={TabButton} />, <VersionInfo key="void-version" />];
    },

    renderPanels(jsx: typeof createElement, activeTab: string, Wrapper: ComponentType<WrapperProps>) {
        return [<VoidPanels key="void-panels" jsx={jsx} activeTab={activeTab} Wrapper={Wrapper} />];
    },

    start() {
        registerStyle("void-global", "[data-sonner-toast] [data-title]{font-weight:400}");
        if (document.head) loadSavedCSS();
        else document.addEventListener("DOMContentLoaded", loadSavedCSS, { once: true });
        loadSavedThemes();
    },

    patches: [
        {
            find: 'DialogOverlay",()=>',
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
                    match: /(\i\.jsx)\)\((\i),\{icon:\i\.DatabaseIcon,.{0,80}tab:"data"\}\)/,
                    replace: "$&,...$self.renderTabs($1,$2)",
                },
                {
                    match: /"data"===(\i)&&\i\.user&&\(0,(\i\.jsx)\)\((\i),\{children:/,
                    replace: "...$self.renderPanels($2,$1,$3),$&",
                },
                {
                    match: /\i\.user&&\(0,\i\.jsx\)\("div",.{0,120}:\i\.userId\}\)/,
                    replace: "!$self._hideUserId()&&$&",
                },
            ],
        },
    ],
});
