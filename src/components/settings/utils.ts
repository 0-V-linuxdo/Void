/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { OptionType, type Plugin, type PluginSettingDef } from "@utils/types";

export type InputChangeEvent = { target: { value: string } };

export type ListFilter = "all" | "enabled" | "disabled";

export type PluginCategory = "favorites" | "all" | "chat" | "ui" | "privacy" | "other";

export const PLUGIN_CATEGORY_TABS: readonly { id: PluginCategory; label: string }[] = [
    { id: "favorites", label: "Favorites" },
    { id: "all", label: "All" },
    { id: "chat", label: "Chat" },
    { id: "ui", label: "UI" },
    { id: "privacy", label: "Privacy" },
    { id: "other", label: "Other" },
];

const CATEGORY_TAGS = new Set(["chat", "ui", "privacy"]);

export function pluginMatchesCategory(plugin: Plugin, category: PluginCategory): boolean {
    if (category === "all" || category === "favorites") return true;
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
