/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getSettingsPluginData, updateSettingsPluginData } from "@api/Settings";
import { disableStyle, enableStyle, registerStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { fetchExternal } from "@utils/misc";

const logger = new Logger("Themes", "#c6a0f6");

export interface ThemeData {
    url: string;
    name: string;
    author: string;
    description: string;
    enabled: boolean;
    local?: boolean;
    css?: string;
}

interface ThemeMeta {
    name: string;
    author: string;
    description: string;
}

function themeStyleId(url: string) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
        hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
    }
    return `void-theme-${(hash >>> 0).toString(36)}`;
}

function parseThemeMeta(css: string) {
    const meta: ThemeMeta = { name: "", author: "", description: "" };
    const header = css.match(/\/\*\*[\s\S]*?\*\//);
    if (!header) return meta;

    const nameMatch = header[0].match(/@name\s+(.+)/);
    const authorMatch = header[0].match(/@author\s+(.+)/);
    const descMatch = header[0].match(/@description\s+(.+)/);

    if (nameMatch) meta.name = nameMatch[1].trim();
    if (authorMatch) meta.author = authorMatch[1].trim();
    if (descMatch) meta.description = descMatch[1].trim();
    return meta;
}

export function getThemes(): ThemeData[] {
    const s = getSettingsPluginData();
    return Array.isArray(s.themes) ? s.themes as ThemeData[] : [];
}

export function isThemesEnabled(): boolean {
    return getSettingsPluginData().themesEnabled !== false;
}

export function setThemesEnabled(enabled: boolean) {
    updateSettingsPluginData({ themesEnabled: enabled });

    for (const theme of getThemes()) {
        if (theme.enabled) {
            if (enabled) enableStyle(themeStyleId(theme.url));
            else disableStyle(themeStyleId(theme.url));
        }
    }
}

export function isOnlineThemesEnabled(): boolean {
    return getSettingsPluginData().onlineThemesEnabled !== false;
}

export function setOnlineThemesEnabled(enabled: boolean) {
    updateSettingsPluginData({ onlineThemesEnabled: enabled });

    for (const theme of getThemes()) {
        if (theme.local || !theme.enabled) continue;
        if (enabled) enableStyle(themeStyleId(theme.url));
        else disableStyle(themeStyleId(theme.url));
    }
}

function validateThemeUrl(url: string) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") throw 0;
    } catch {
        throw new Error("Enter a valid URL.");
    }
    if (!/\.css(?:[?#]|$)/i.test(url)) throw new Error("URL must point to a .css file.");
}

export async function addTheme(url: string): Promise<ThemeData> {
    validateThemeUrl(url);

    if (getThemes().some(t => t.url === url)) {
        throw new Error("This theme is already added.");
    }

    const resp = await fetchExternal(url);
    if (!resp.ok) throw new Error(`Failed to fetch theme (${resp.status}).`);

    const css = await resp.text();
    if (!css.trim()) throw new Error("Theme file is empty.");

    // Re-check after async to prevent race with concurrent addTheme calls
    if (getThemes().some(t => t.url === url)) {
        throw new Error("This theme is already added.");
    }

    const meta = parseThemeMeta(css);
    const theme: ThemeData = {
        url,
        name: meta.name || (url.split("/").pop() ?? url).replace(/\.css$/i, "").replace(/[-_]/g, " "),
        author: meta.author,
        description: meta.description,
        enabled: false,
    };

    const styleId = themeStyleId(url);
    registerStyle(styleId, css);
    disableStyle(styleId);

    updateSettingsPluginData({ themes: [...getThemes(), theme] });
    logger.info(`Added theme "${theme.name}" from ${url}`);
    return theme;
}

export function addLocalTheme(name: string, css: string): ThemeData {
    if (!name.trim()) throw new Error("Name is required.");
    if (!css.trim()) throw new Error("CSS is required.");

    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const meta = parseThemeMeta(css);
    const theme: ThemeData = {
        url: id,
        name: name.trim(),
        author: meta.author ?? "Local",
        description: meta.description ?? "",
        enabled: false,
        local: true,
        css,
    };

    const styleId = themeStyleId(id);
    registerStyle(styleId, css);
    disableStyle(styleId);

    updateSettingsPluginData({ themes: [...getThemes(), theme] });
    logger.info(`Added local theme "${theme.name}"`);
    return theme;
}

export function updateLocalTheme(url: string, data: { name?: string; css?: string }) {
    const themes = getThemes().map(t => {
        if (t.url !== url || !t.local) return t;
        const updated = { ...t };
        if (data.name != null) updated.name = data.name.trim();
        if (data.css != null) {
            updated.css = data.css;
            const meta = parseThemeMeta(data.css);
            if (meta.description) updated.description = meta.description;
            if (updated.enabled && isThemesEnabled()) registerStyle(themeStyleId(url), data.css);
        }
        return updated;
    });
    updateSettingsPluginData({ themes });
}

export function removeTheme(url: string) {
    disableStyle(themeStyleId(url));
    updateSettingsPluginData({ themes: getThemes().filter(t => t.url !== url) });
}

export async function enableTheme(url: string) {
    updateSettingsPluginData({ themes: getThemes().map(t => (t.url === url ? { ...t, enabled: true } : t)) });
    if (!isThemesEnabled()) return;

    const theme = getThemes().find(t => t.url === url);
    if (!theme) return;
    if (!theme.local && !isOnlineThemesEnabled()) return;

    const id = themeStyleId(url);
    if (enableStyle(id)) return;

    if (theme.local) {
        if (theme.css) registerStyle(id, theme.css);
        return;
    }

    const resp = await fetchExternal(url);
    if (!resp.ok) {
        logger.warn(`Failed to fetch theme CSS (${resp.status}):`, url);
        return;
    }

    const current = getThemes().find(t => t.url === url);
    if (!current?.enabled || !isThemesEnabled()) return;

    const css = await resp.text();
    registerStyle(id, css);
}

export function disableTheme(url: string) {
    updateSettingsPluginData({ themes: getThemes().map(t => (t.url === url ? { ...t, enabled: false } : t)) });
    disableStyle(themeStyleId(url));
}

export async function loadSavedThemes() {
    if (!isThemesEnabled()) return;

    const enabled = getThemes().filter(t => t.enabled);

    for (const t of enabled) {
        if (t.local && t.css) {
            registerStyle(themeStyleId(t.url), t.css);
        }
    }

    const remote = isOnlineThemesEnabled() ? enabled.filter(t => !t.local) : [];
    const results = await Promise.allSettled(
        remote.map(async t => {
            const resp = await fetchExternal(t.url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const css = await resp.text();
            registerStyle(themeStyleId(t.url), css);
        }),
    );

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "rejected") {
            logger.warn(`Failed to load theme "${remote[i].name}":`, result.reason);
        }
    }
}
