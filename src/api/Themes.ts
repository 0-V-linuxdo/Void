/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getSettingsPluginData, updateSettingsPluginData } from "@api/Settings";
import { disableStyle, enableStyle, registerStyle, unregisterStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { fetchExternal, randomId } from "@utils/misc";

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

function registerDisabledStyle(id: string, css: string) {
    registerStyle(id, css);
    disableStyle(id);
}

function parseThemeMeta(css: string): ThemeMeta {
    const header = css.match(/\/\*\*[\s\S]*?\*\//)?.[0] ?? "";
    return {
        name:        header.match(/@name\s+(.+)/)?.[1]?.trim() ?? "",
        author:      header.match(/@author\s+(.+)/)?.[1]?.trim() ?? "",
        description: header.match(/@description\s+(.+)/)?.[1]?.trim() ?? "",
    };
}

export function getThemes(): ThemeData[] {
    const { themes } = getSettingsPluginData();
    return Array.isArray(themes) ? themes : [];
}

function setThemes(themes: ThemeData[]) {
    updateSettingsPluginData({ themes });
}

function patchTheme(url: string, patch: Partial<ThemeData>) {
    setThemes(getThemes().map(t => (t.url === url ? { ...t, ...patch } : t)));
}

function isThemeStillActive(url: string): boolean {
    return isThemesEnabled() && (getThemes().find(t => t.url === url)?.enabled ?? false);
}

export function isThemesEnabled(): boolean {
    return getSettingsPluginData().themesEnabled !== false;
}

function toggleThemeStyles(enabled: boolean, filter?: (t: ThemeData) => boolean) {
    const toggle = enabled ? enableStyle : disableStyle;
    for (const t of getThemes()) {
        if (t.enabled && (!filter || filter(t))) toggle(themeStyleId(t.url));
    }
}

export function setThemesEnabled(enabled: boolean) {
    updateSettingsPluginData({ themesEnabled: enabled });
    toggleThemeStyles(enabled);
}

export function isOnlineThemesEnabled(): boolean {
    return getSettingsPluginData().onlineThemesEnabled !== false;
}

export function setOnlineThemesEnabled(enabled: boolean) {
    updateSettingsPluginData({ onlineThemesEnabled: enabled });
    toggleThemeStyles(enabled, t => !t.local);
}

function validateThemeUrl(url: string) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new Error("Enter a valid URL."); }
    if (parsed.protocol !== "https:") throw new Error("Enter a valid URL.");
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

    if (getThemes().some(t => t.url === url)) {
        throw new Error("This theme is already added.");
    }

    const meta = parseThemeMeta(css);
    const theme: ThemeData = {
        url,
        name: meta.name || (url.split("/").pop() ?? url).replace(/\.css$/i, "").replaceAll(/[-_]/g, " "),
        author: meta.author,
        description: meta.description,
        enabled: false,
    };

    registerDisabledStyle(themeStyleId(url), css);

    setThemes([...getThemes(), theme]);
    logger.info(`Added theme "${theme.name}" from ${url}`);
    return theme;
}

export function addLocalTheme(name: string, css: string): ThemeData {
    if (!name.trim()) throw new Error("Name is required.");
    if (!css.trim()) throw new Error("CSS is required.");

    const id = randomId("local");
    const meta = parseThemeMeta(css);
    const theme: ThemeData = {
        url: id,
        name: name.trim(),
        author: meta.author || "Local",
        description: meta.description,
        enabled: false,
        local: true,
        css,
    };

    registerDisabledStyle(themeStyleId(id), css);

    setThemes([...getThemes(), theme]);
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
    setThemes(themes);
}

export function removeTheme(url: string) {
    unregisterStyle(themeStyleId(url));
    setThemes(getThemes().filter(t => t.url !== url));
}

export async function enableTheme(url: string) {
    patchTheme(url, { enabled: true });
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

    let css: string;
    try {
        const resp = await fetchExternal(url);
        if (!resp.ok) {
            logger.warn(`Failed to fetch theme CSS (${resp.status}):`, url);
            return;
        }
        if (!isThemeStillActive(url)) return;

        css = await resp.text();
    } catch (e) {
        logger.warn("Failed to fetch theme CSS:", url, e);
        return;
    }

    if (!isThemeStillActive(url)) return;

    registerStyle(id, css);
}

export function disableTheme(url: string) {
    patchTheme(url, { enabled: false });
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
            if (!isThemeStillActive(t.url)) return;
            registerStyle(themeStyleId(t.url), css);
        }),
    );

    for (const [i, result] of results.entries()) {
        if (result.status === "rejected") {
            logger.warn(`Failed to load theme "${remote[i].name}":`, result.reason);
        }
    }
}
