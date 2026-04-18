/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled, plugins, startPlugin, stopPlugin } from "@api/PluginManager";
import { mergePluginSettings, Settings } from "@api/Settings";
import { OptionType, type Plugin } from "@utils/types";

import type { PluginArgs, PluginInfo } from "./types";
import { notFound } from "./utils";

const TYPE_MAP: Partial<Record<number, string>> = {
    [OptionType.BOOLEAN]: "boolean",
    [OptionType.STRING]: "string",
    [OptionType.NUMBER]: "number",
    [OptionType.SLIDER]: "number",
    [OptionType.BIGINT]: "bigint",
};

function resolvePlugin(name: string | undefined): { plugin: Plugin; resolvedName: string } | { error: string; similar?: string[] } {
    if (!name) return { error: "Provide plugin name." };
    const resolvedName = plugins[name] ? name : Object.keys(plugins).find(n => n.toLowerCase() === name.toLowerCase());
    if (!resolvedName) return notFound("Plugin", name, Object.keys(plugins));
    return { plugin: plugins[resolvedName], resolvedName };
}

function actionList(): PluginInfo[] {
    return Object.values(plugins).map((p): PluginInfo => {
        const info: PluginInfo = { name: p.name, enabled: isPluginEnabled(p.name), started: p.started };
        if (p.required) info.required = true;
        if (p.description) info.desc = p.description;
        return info;
    });
}

function setEnabled(plugin: Plugin, resolvedName: string, enabling: boolean): unknown {
    if (!enabling) {
        if (plugin.required) return { error: `Cannot disable required plugin: ${resolvedName}` };
        if (resolvedName === "MCP") return { error: "Cannot disable MCP plugin via MCP, would kill this connection." };
    }
    const wasInTargetState = enabling === isPluginEnabled(resolvedName);
    mergePluginSettings(resolvedName, { enabled: enabling });
    if (!wasInTargetState) (enabling ? startPlugin : stopPlugin)(plugin);
    const action = enabling ? "enabled" : "disabled";
    return { ok: true, action, name: resolvedName, ...(wasInTargetState && { noop: true }) };
}

function actionEnable(args: PluginArgs): unknown {
    const r = resolvePlugin(args.name);
    if ("error" in r) return r;
    return setEnabled(r.plugin, r.resolvedName, true);
}

function actionDisable(args: PluginArgs): unknown {
    const r = resolvePlugin(args.name);
    if ("error" in r) return r;
    return setEnabled(r.plugin, r.resolvedName, false);
}

function actionToggle(args: PluginArgs): unknown {
    const r = resolvePlugin(args.name);
    if ("error" in r) return r;
    return setEnabled(r.plugin, r.resolvedName, !isPluginEnabled(r.resolvedName));
}

function actionSettings(args: PluginArgs): unknown {
    const r = resolvePlugin(args.name);
    if ("error" in r) return r;
    return Settings.plugins[r.resolvedName] ?? {};
}

function actionSetSetting(args: PluginArgs): unknown {
    const r = resolvePlugin(args.name);
    if ("error" in r) return r;
    const { key, value } = args;
    if (!key) return { error: "Provide setting key. Use settings action to see available keys." };

    const settingsDef = r.plugin.settings?.def;
    if (settingsDef) {
        if (!(key in settingsDef)) return { error: `Unknown setting key "${key}" for ${r.resolvedName}. Valid keys: ${Object.keys(settingsDef).join(", ")}` };
        const def = settingsDef[key];
        const expectedType = TYPE_MAP[def.type];
        if (expectedType && typeof value !== expectedType) {
            return { error: `Setting "${key}" expects ${expectedType}, got ${typeof value}.` };
        }
        if (def.type === OptionType.SELECT) {
            const { options } = def;
            if (!options.some(o => o.value === value)) {
                return { error: `Invalid value for "${key}". Valid options: ${options.map(o => JSON.stringify(o.value)).join(", ")}` };
            }
        }
        if (def.type === OptionType.SLIDER && typeof value === "number" && (value < def.min || value > def.max)) {
            return { error: `Value ${value} out of range for "${key}" (min: ${def.min}, max: ${def.max}).` };
        }
    }
    mergePluginSettings(r.resolvedName, { [key]: value });
    return { ok: true, name: r.resolvedName, key, value };
}

const PLUGIN_ACTIONS: Record<PluginArgs["action"], (args: PluginArgs) => unknown> = {
    list: actionList,
    enable: actionEnable,
    disable: actionDisable,
    toggle: actionToggle,
    settings: actionSettings,
    setSetting: actionSetSetting,
};

export function handlePlugin(args: PluginArgs): unknown {
    const fn = PLUGIN_ACTIONS[args.action];
    if (!fn) return { error: `Unknown action: ${args.action}` };
    return fn(args);
}
