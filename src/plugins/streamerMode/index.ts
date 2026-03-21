/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings, SettingsStore } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const CSS_CLASSES = {
    sidebarAvatar: "void-streamer-sidebar-avatar",
    sidebarName: "void-streamer-sidebar-name",
    accountAvatar: "void-streamer-account-avatar",
    accountName: "void-streamer-account-name",
    accountEmail: "void-streamer-account-email",
    accountAge: "void-streamer-account-age",
    projects: "void-streamer-projects",
    conversations: "void-streamer-conversations",
} as const;

const settings = definePluginSettings({
    sidebarAvatar: {
        type: OptionType.BOOLEAN,
        description: "Blur your avatar in the sidebar.",
        default: true,
    },
    sidebarName: {
        type: OptionType.BOOLEAN,
        description: "Blur your username in the sidebar.",
        default: true,
    },
    accountAvatar: {
        type: OptionType.BOOLEAN,
        description: "Blur your avatar in the account settings tab.",
        default: true,
    },
    accountName: {
        type: OptionType.BOOLEAN,
        description: "Blur your name in the account settings tab.",
        default: true,
    },
    accountEmail: {
        type: OptionType.BOOLEAN,
        description: "Blur your email in the account settings tab.",
        default: true,
    },
    accountAge: {
        type: OptionType.BOOLEAN,
        description: "Blur your birth year in the account settings tab.",
        default: true,
    },
    projects: {
        type: OptionType.BOOLEAN,
        description: "Blur project names in the sidebar.",
        default: true,
    },
    conversations: {
        type: OptionType.BOOLEAN,
        description: "Blur conversation titles in the sidebar.",
        default: true,
    },
});

function syncClasses() {
    const { classList } = document.documentElement;
    for (const [key, cls] of Object.entries(CSS_CLASSES)) {
        classList.toggle(cls, !!settings.store[key as keyof typeof CSS_CLASSES]);
    }
}

let unsubscribe: (() => void) | null = null;

export default definePlugin({
    name: "StreamerMode",
    description: "Blurs personal information for privacy while streaming.",
    authors: [Devs.Prism],
    settings,

    start() {
        syncClasses();
        const prefix = `plugins.${settings.pluginName}`;
        SettingsStore.addPrefixChangeListener(prefix, syncClasses);
        unsubscribe = () => SettingsStore.removePrefixChangeListener(prefix, syncClasses);
    },

    stop() {
        unsubscribe?.();
        unsubscribe = null;
        const { classList } = document.documentElement;
        for (const cls of Object.values(CSS_CLASSES)) {
            classList.remove(cls);
        }
    },
});
