/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { OptionType, type Plugin, type PluginSettingDef } from "@utils/types";

export type InputChangeEvent = { target: { value: string } };

export type ListFilter = "all" | "enabled" | "disabled";

export type PluginCategory = "favorites" | "recent" | "all" | "chat" | "ui" | "privacy" | "other";

export const PLUGIN_CATEGORY_TABS: readonly { id: PluginCategory; label: string }[] = [
    { id: "favorites", label: "Favorites" },
    { id: "recent", label: "Recent" },
    { id: "all", label: "All" },
    { id: "chat", label: "Chat" },
    { id: "ui", label: "UI" },
    { id: "privacy", label: "Privacy" },
    { id: "other", label: "Other" },
];

const CATEGORY_TAGS = new Set(["chat", "ui", "privacy"]);
const RECENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function isRecentlyUpdated(plugin: Plugin): boolean {
    return plugin.updatedAt != null && Date.now() - plugin.updatedAt < RECENT_TTL_MS;
}

export function pluginMatchesCategory(plugin: Plugin, category: PluginCategory): boolean {
    if (category === "all" || category === "favorites") return true;
    if (category === "recent") return isRecentlyUpdated(plugin);
    const tags = (plugin.tags ?? []).map(t => t === "sidebar" ? "ui" : t);
    if (category === "other") return !plugin.required && !tags.some(t => CATEGORY_TAGS.has(t));
    return tags.includes(category);
}

export function isVisibleSetting([, s]: [string, PluginSettingDef]): boolean {
    return s.type !== OptionType.CUSTOM && !s.hidden;
}

export function hasVisibleSettings(plugin: Plugin): boolean {
    return !!plugin.settings?.def && Object.entries(plugin.settings.def).some(isVisibleSetting);
}
