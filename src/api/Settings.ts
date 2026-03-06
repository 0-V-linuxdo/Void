/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect } from "@turbopack/common/react";
import { idbGet, idbSet } from "@utils/idb";
import { Logger } from "@utils/Logger";
import { mergeDefaults } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import { SettingsStore as SettingsStoreClass } from "@utils/SettingsStore";
import { type DefinedSettings, OptionType, type PluginSettingDef, type PluginSettingSelectOption, type SettingsChecks, type SettingsDefinition } from "@utils/types";

const logger = new Logger("Settings");

export interface Settings {
    plugins: {
        [plugin: string]: {
            enabled: boolean;
            [setting: string]: any;
        };
    };
    notifications: {
        timeout: number;
        position: "top-right" | "bottom-right";
    };
}

const DefaultSettings: Settings = {
    plugins: {},
    notifications: {
        timeout: 5000,
        position: "bottom-right",
    },
};

const settings = {} as Settings;
mergeDefaults(settings, DefaultSettings);

export const SettingsStore = new SettingsStoreClass(settings);

export const PlainSettings = settings;
export const Settings = SettingsStore.store;

export async function initSettings(): Promise<void> {
    if (typeof GM_getValue === "function") {
        try {
            const raw = GM_getValue("VoidSettings", null);
            if (raw) Object.assign(settings, JSON.parse(raw));
        } catch (e) {
            logger.error("Failed to load settings:", e);
        }
        mergeDefaults(settings, DefaultSettings);
        return;
    }

    let raw: string | null = null;

    try {
        raw = await idbGet("VoidSettings") as string | null;
    } catch (e) {
        logger.warn("Failed to read IndexedDB:", e);
    }

    if (!raw) {
        raw = migrateFromLocalStorage();
        if (raw) idbSet("VoidSettings", raw).catch((e: any) => logger.debug("Failed to persist settings to IndexedDB:", e));
    }

    if (raw) {
        try {
            Object.assign(settings, JSON.parse(raw));
        } catch (e) {
            logger.error("Failed to parse settings:", e);
        }
    }

    mergeDefaults(settings, DefaultSettings);
}

function migrateFromLocalStorage(): string | null {
    try {
        const raw = localStorage.getItem("VoidSettings");
        if (raw) {
            localStorage.removeItem("VoidSettings");
            logger.info("Migrated settings from localStorage to IndexedDB");
            return raw;
        }
    } catch (e) {
        logger.warn("Failed to read localStorage:", e);
    }
    return null;
}

export function migratePluginSettings(name: string, ...oldNames: string[]) {
    const { plugins } = SettingsStore.plain;
    if (name in plugins) return;

    for (const oldName of oldNames) {
        if (oldName in plugins) {
            logger.info(`Migrating settings from old name ${oldName} to ${name}`);
            plugins[name] = plugins[oldName];
            delete plugins[oldName];
            SettingsStore.markAsChanged();
            break;
        }
    }
}

export function migratePluginSetting(pluginName: string, newKey: string, oldKey: string) {
    const pluginSettings = SettingsStore.plain.plugins[pluginName];
    if (!pluginSettings || !(oldKey in pluginSettings) || newKey in pluginSettings) return;

    logger.info(`Migrating setting ${oldKey} -> ${newKey} in ${pluginName}`);
    pluginSettings[newKey] = pluginSettings[oldKey];
    delete pluginSettings[oldKey];
    SettingsStore.markAsChanged();
}

export function migrateSettingsToPlugin(targetPlugin: string, sourcePlugin: string, ...settingKeys: string[]) {
    const source = SettingsStore.plain.plugins[sourcePlugin];
    if (!source) return;

    const target = SettingsStore.plain.plugins[targetPlugin] ??= { enabled: false };
    let changed = false;

    for (const key of settingKeys) {
        if (key in source && !(key in target)) {
            target[key] = source[key];
            delete source[key];
            changed = true;
        }
    }

    if (changed) {
        logger.info(`Migrated settings [${settingKeys.join(", ")}] from ${sourcePlugin} to ${targetPlugin}`);
        SettingsStore.markAsChanged();
    }
}

export function resolveDefault(setting: PluginSettingDef): any {
    if ("default" in setting) return setting.default;
    if (setting.type === OptionType.SELECT) return (setting as { options: readonly PluginSettingSelectOption[] }).options.find(o => o.default)?.value;
    return;
}

export function definePluginSettings<Def extends SettingsDefinition, Checks extends SettingsChecks<Def>, PrivateSettings extends object = {}>(def: Def, checks?: Checks) {
    let _pluginName = "";

    const definedSettings: DefinedSettings<Def, Checks, PrivateSettings> = {
        get store() {
            if (!_pluginName) throw new Error("Cannot access settings before plugin is initialized");
            return Settings.plugins[_pluginName] as any;
        },
        get plain() {
            if (!_pluginName) throw new Error("Cannot access settings before plugin is initialized");
            return PlainSettings.plugins[_pluginName] as any;
        },
        def,
        checks: (checks ?? {}) as Checks,
        get pluginName() {
            return _pluginName;
        },
        set pluginName(name: string) {
            _pluginName = name;
            if (!name) return;

            if (!PlainSettings.plugins[name]) PlainSettings.plugins[name] = { enabled: false };

            SettingsStore.setDefaultGetter(`plugins.${name}`, key => {
                const setting = def[key];
                return setting ? resolveDefault(setting) : undefined;
            });
        },
        use(keys) {
            const forceUpdate = useForceUpdater();

            useEffect(() => {
                const prefix = `plugins.${_pluginName}`;
                if (keys?.length) {
                    const paths = keys.map(k => `${prefix}.${String(k)}`);
                    const listener = (path: string) => {
                        if (paths.some(p => path.startsWith(p))) forceUpdate();
                    };
                    SettingsStore.addPrefixChangeListener(prefix, listener);
                    return () => SettingsStore.removePrefixChangeListener(prefix, listener);
                }
                SettingsStore.addPrefixChangeListener(prefix, forceUpdate);
                return () => SettingsStore.removePrefixChangeListener(prefix, forceUpdate);
            }, []);

            return definedSettings.store;
        },
        withPrivateSettings<T extends object>() {
            return this as DefinedSettings<Def, Checks, T>;
        },
    };

    return definedSettings;
}
