/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings } from "@api/Settings";
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
}

interface ThemeMeta {
    name: string;
    author: string;
    description: string;
}

function getPluginSettings(): Record<string, any> {
    return (Settings.plugins.Settings as Record<string, any>) ?? {};
}

function updatePluginSettings(patch: Record<string, any>) {
    Settings.plugins.Settings = { ...Settings.plugins.Settings, ...patch };
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
    const s = getPluginSettings();
    return Array.isArray(s.themes) ? s.themes as ThemeData[] : [];
}

export function isThemesEnabled(): boolean {
    return getPluginSettings().themesEnabled !== false;
}

export function setThemesEnabled(enabled: boolean) {
    updatePluginSettings({ themesEnabled: enabled });

    for (const theme of getThemes()) {
        if (theme.enabled) {
            if (enabled) enableStyle(themeStyleId(theme.url));
            else disableStyle(themeStyleId(theme.url));
        }
    }
}

function validateThemeUrl(url: string) {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw 0;
    } catch {
        throw new Error("Enter a valid URL.");
    }
    if (!/\.css$/i.test(url)) throw new Error("URL must point to a .css file.");
}

export async function addTheme(url: string): Promise<ThemeData> {
    validateThemeUrl(url);

    const existing = getThemes();
    if (existing.some(t => t.url === url)) {
        throw new Error("This theme is already added.");
    }

    const resp = await fetchExternal(url);
    if (!resp.ok) throw new Error(`Failed to fetch theme (${resp.status}).`);

    const css = await resp.text();
    if (!css.trim()) throw new Error("Theme file is empty.");

    const meta = parseThemeMeta(css);
    const theme: ThemeData = {
        url,
        name: meta.name || (url.split("/").pop() ?? url).replace(/\.css$/i, "").replace(/[-_]/g, " "),
        author: meta.author,
        description: meta.description,
        enabled: false,
    };

    registerStyle(themeStyleId(url), css);
    disableStyle(themeStyleId(url));

    updatePluginSettings({ themes: [...existing, theme] });
    logger.info(`Added theme "${theme.name}" from ${url}`);
    return theme;
}

export function removeTheme(url: string) {
    disableStyle(themeStyleId(url));
    updatePluginSettings({ themes: getThemes().filter(t => t.url !== url) });
}

export async function enableTheme(url: string) {
    updatePluginSettings({ themes: getThemes().map(t => (t.url === url ? { ...t, enabled: true } : t)) });
    if (!isThemesEnabled()) return;

    const id = themeStyleId(url);
    if (enableStyle(id)) return;

    const resp = await fetchExternal(url);
    if (!resp.ok) return;
    const css = await resp.text();
    registerStyle(id, css);
}

export function disableTheme(url: string) {
    updatePluginSettings({ themes: getThemes().map(t => (t.url === url ? { ...t, enabled: false } : t)) });
    disableStyle(themeStyleId(url));
}

export async function loadSavedThemes() {
    if (!isThemesEnabled()) return;

    const enabled = getThemes().filter(t => t.enabled);
    const results = await Promise.allSettled(
        enabled.map(async t => {
            const resp = await fetchExternal(t.url);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const css = await resp.text();
            registerStyle(themeStyleId(t.url), css);
        }),
    );

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.status === "rejected") {
            logger.warn(`Failed to load theme "${enabled[i].name}":`, result.reason);
        }
    }
}
