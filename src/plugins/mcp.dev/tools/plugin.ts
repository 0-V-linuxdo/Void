/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled, plugins, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings } from "@api/Settings";
import { OptionType } from "@utils/types";

import type { PluginArgs, PluginInfo } from "./types";

const PLUGIN_ACTIONS = ["list", "enable", "disable", "toggle", "settings", "setSetting"] as const;

export function handlePlugin(args: PluginArgs): unknown {
    const { action, name, key, value } = args;

    if (action === "list") {
        return Object.values(plugins).map((p): PluginInfo => {
            const info: PluginInfo = { name: p.name, enabled: isPluginEnabled(p.name), started: p.started };
            if (p.required) info.required = true;
            if (p.description) info.desc = p.description;
            return info;
        });
    }

    if (!(PLUGIN_ACTIONS as readonly string[]).includes(action)) return { error: `Unknown action: ${action}`, validActions: PLUGIN_ACTIONS };

    if (!name) return { error: "Provide plugin name." };

    const resolved = plugins[name] ? name : Object.keys(plugins).find(n => n.toLowerCase() === name.toLowerCase());
    const plugin = resolved ? plugins[resolved] : null;
    if (!plugin || !resolved) {
        const lower = name.toLowerCase();
        const similar = Object.keys(plugins).filter(n => n.toLowerCase().includes(lower) || lower.includes(n.toLowerCase()));
        return similar.length ? { error: `Plugin not found: ${name}`, similar } : { error: `Plugin not found: ${name}. Use list action to see available plugins.` };
    }

    if (action === "enable") {
        const wasEnabled = isPluginEnabled(resolved);
        Settings.plugins[resolved] = { ...Settings.plugins[resolved], enabled: true };
        if (!wasEnabled) startPlugin(plugin);
        return wasEnabled ? { ok: true, action: "enabled", name: resolved, noop: true } : { ok: true, action: "enabled", name: resolved };
    }

    if (action === "disable") {
        if (plugin.required) return { error: `Cannot disable required plugin: ${resolved}` };
        if (resolved === "MCP") return { error: "Cannot disable MCP plugin via MCP — it would kill this connection" };
        const wasDisabled = !isPluginEnabled(resolved);
        Settings.plugins[resolved] = { ...Settings.plugins[resolved], enabled: false };
        if (!wasDisabled) stopPlugin(plugin);
        return wasDisabled ? { ok: true, action: "disabled", name: resolved, noop: true } : { ok: true, action: "disabled", name: resolved };
    }

    if (action === "toggle") {
        const enabled = isPluginEnabled(resolved);
        if (enabled && resolved === "MCP") return { error: "Cannot disable MCP plugin via MCP — it would kill this connection" };
        return handlePlugin({ action: enabled ? "disable" : "enable", name: resolved });
    }

    if (action === "settings") {
        return Settings.plugins[resolved] ?? {};
    }

    if (!key) return { error: "Provide setting key. Use settings action to see available keys." };
    const settingsDef = plugin.settings?.def;
    if (settingsDef && !(key in settingsDef)) {
        return { error: `Unknown setting key "${key}" for ${resolved}. Valid keys: ${Object.keys(settingsDef).join(", ")}` };
    }
    if (settingsDef && key in settingsDef) {
        const def = settingsDef[key];
        const TYPE_MAP: Partial<Record<number, string>> = {
            [OptionType.BOOLEAN]: "boolean",
            [OptionType.STRING]: "string",
            [OptionType.NUMBER]: "number",
            [OptionType.SLIDER]: "number",
            [OptionType.BIGINT]: "bigint",
        };
        const expectedType = TYPE_MAP[def.type] ?? null;
        if (expectedType && typeof value !== expectedType) {
            return { error: `Setting "${key}" expects ${expectedType}, got ${typeof value}.` };
        }
        if (def.type === OptionType.SELECT) {
            const { options } = (def as { options: readonly { value: unknown }[] });
            if (!options.some(o => o.value === value)) {
                return { error: `Invalid value for "${key}". Valid options: ${options.map(o => JSON.stringify(o.value)).join(", ")}` };
            }
        }
    }
    Settings.plugins[resolved] = { ...Settings.plugins[resolved], [key]: value };
    return { ok: true, name: resolved, key, value };
}
