/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useEffect } from "@turbopack/common/react";
import { isObject } from "@utils/guards";
import { idbGet, idbSet } from "@utils/idb";
import { Logger } from "@utils/Logger";
import { mergeDefaults } from "@utils/misc";
import { useForceUpdater } from "@utils/react";
import { SettingsStore as SettingsStoreClass, STORAGE_KEY } from "@utils/SettingsStore";
import { type DefinedSettings, OptionType, type PluginSettingDef, type PluginSettingValue, type SettingsChecks, type SettingsDefinition } from "@utils/types";

const logger = new Logger("Settings");

export interface Settings {
    plugins: {
        [plugin: string]: {
            enabled: boolean;
            [setting: string]: unknown;
        };
    };
}

const DefaultSettings: Settings = { plugins: {} };

const settings = {} as Settings;
mergeDefaults(settings, DefaultSettings);

export const SettingsStore = new SettingsStoreClass(settings);

export const PlainSettings = settings;
export const Settings = SettingsStore.store;

export const pluginPath = (name: string, key?: string) => key ? `plugins.${name}.${key}` : `plugins.${name}`;

export async function initSettings(): Promise<void> {
    let raw: string | null = null;

    if (typeof GM_getValue === "function") {
        raw = GM_getValue(STORAGE_KEY, null);
    } else {
        try {
            raw = await idbGet<string>(STORAGE_KEY) ?? null;
        } catch (e) {
            logger.warn("Failed to read IndexedDB:", e);
        }

        if (!raw) {
            try {
                raw = localStorage.getItem(STORAGE_KEY);
                if (raw) logger.info("Migrating settings from localStorage to IndexedDB");
            } catch (e) {
                logger.warn("Failed to read localStorage:", e);
            }
            if (raw) idbSet(STORAGE_KEY, raw).then(() => {
                try { localStorage.removeItem(STORAGE_KEY); } catch {}
            }).catch((e: unknown) => logger.debug("Failed to persist settings to IndexedDB:", e));
        }
    }

    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            if (isObject(parsed)) Object.assign(settings, parsed);
        } catch (e) {
            logger.error("Failed to parse settings:", e);
        }
    }

    mergeDefaults(settings, DefaultSettings);
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

export interface SettingsPluginData {
    themes?: import("@api/Themes").ThemeData[];
    themesEnabled?: boolean;
    customCSS?: string;
    customCSSEnabled?: boolean;
    knownPlugins?: Record<string, number>;
    chunkFingerprint?: string[];
    [key: string]: unknown;
}

export function getSettingsPluginData(): SettingsPluginData {
    return (Settings.plugins.Settings as SettingsPluginData) ?? {};
}

export function updateSettingsPluginData(patch: Partial<SettingsPluginData>) {
    Settings.plugins.Settings = { ...(Settings.plugins.Settings ?? { enabled: true }), ...patch };
}

export function mergePluginSettings(name: string, patch: Record<string, unknown>) {
    Settings.plugins[name] = { ...(Settings.plugins[name] ?? { enabled: false }), ...patch };
}

export function resolveDefault(setting: PluginSettingDef): PluginSettingValue | undefined {
    if ("default" in setting) return setting.default as PluginSettingValue;
    if (setting.type === OptionType.SELECT) return setting.options.find(o => o.default)?.value;
    return undefined;
}

export function definePluginSettings<Def extends SettingsDefinition, Checks extends SettingsChecks<Def>, PrivateSettings extends object = {}>(def: Def, checks?: Checks) {
    let _pluginName = "";

    type Store = DefinedSettings<Def, Checks, PrivateSettings>["store"];

    const definedSettings: DefinedSettings<Def, Checks, PrivateSettings> = {
        get store() {
            if (!_pluginName) throw new Error("Cannot access settings before plugin is initialized");
            return Settings.plugins[_pluginName] as unknown as Store;
        },
        get plain() {
            if (!_pluginName) throw new Error("Cannot access settings before plugin is initialized");
            return PlainSettings.plugins[_pluginName] as unknown as Store;
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

            SettingsStore.setDefaultGetter(pluginPath(name), key => {
                const setting = def[key];
                return setting ? resolveDefault(setting) : undefined;
            });
        },
        use(keys) {
            const forceUpdate = useForceUpdater();

            useEffect(() => {
                const prefix = pluginPath(_pluginName);
                let listener: (path: string) => void = forceUpdate;
                if (keys?.length) {
                    const watched = keys.map(k => `${prefix}.${String(k)}`);
                    listener = path => {
                        if (watched.some(p => path.startsWith(p) || p.startsWith(path + "."))) forceUpdate();
                    };
                }
                SettingsStore.addPrefixChangeListener(prefix, listener);
                return () => SettingsStore.removePrefixChangeListener(prefix, listener);
            }, []);

            return definedSettings.store;
        },
        withPrivateSettings<T extends object>() {
            return this as unknown as DefinedSettings<Def, Checks, T>;
        },
    };

    return definedSettings;
}
