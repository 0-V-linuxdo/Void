/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as allStores from "@turbopack/common/stores";
import { patches } from "@turbopack/patchTurbopack";
import { disableStyle, enableStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { canonicalizeFind, canonicalizeReplacement } from "@utils/patches";
import { type Patch, type Plugin, StartAt } from "@utils/types";

import { addChatBarButton, removeChatBarButton } from "./ChatBarButtons";
import { addContextMenuItem, type ContextMenuItemDef, type ContextMenuLocation, removeContextMenuItem } from "./ContextMenus";
import { subscribe as subscribeEvent } from "./Events";
import { PlainSettings, Settings, SettingsStore } from "./Settings";

const logger = new Logger("PluginManager", "#b4befe");

export const plugins: Record<string, Plugin> = {};
const pluginUnsubscribers = new Map<string, Array<() => void>>();
let initialized = false;

const storeRegistry = allStores as unknown as Record<string, Record<string, unknown>>;

function runUnsubs(pluginName: string) {
    const unsubs = pluginUnsubscribers.get(pluginName);
    if (!unsubs) return;
    for (const unsub of unsubs) {
        try { unsub(); } catch (e) { logger.error(`Unsub error in ${pluginName}:`, e); }
    }
    pluginUnsubscribers.delete(pluginName);
}

function removePluginContextMenuItems(plugin: Plugin) {
    if (!plugin.contextMenuItems) return;
    for (const location of Object.keys(plugin.contextMenuItems)) {
        removeContextMenuItem(location as ContextMenuLocation, plugin.name);
    }
}

export function isPluginEnabled(pluginName: string): boolean {
    const plugin = plugins[pluginName];
    if (!plugin) return false;
    if (plugin.required || plugin.isDependency) return true;
    return Settings.plugins[pluginName]?.enabled ?? plugin.enabledByDefault ?? false;
}

export function addPatch(newPatch: Omit<Patch, "plugin">, pluginName: string) {
    const patch = newPatch as Patch;
    patch.plugin = pluginName;

    if (patch.predicate && !patch.predicate()) return;

    canonicalizeFind(patch);

    if (!Array.isArray(patch.replacement)) {
        patch.replacement = [patch.replacement];
    }

    const pluginPath = `Void.plugins[${JSON.stringify(pluginName)}]`;
    for (const replacement of patch.replacement) {
        canonicalizeReplacement(replacement, pluginPath);
    }

    patches.push(patch);
}

function startDependenciesRecursive(plugin: Plugin, visiting = new Set<string>()) {
    if (!plugin.dependencies) return true;

    for (const depName of plugin.dependencies) {
        const dep = plugins[depName];
        if (!dep) {
            logger.warn(`Missing dependency ${depName} for ${plugin.name}`);
            return false;
        }

        if (dep.started) continue;

        if (visiting.has(depName)) {
            logger.error(`Circular dependency detected: ${plugin.name} -> ${depName}`);
            return false;
        }

        dep.isDependency = true;
        Settings.plugins[depName] = { ...Settings.plugins[depName], enabled: true };

        visiting.add(depName);
        if (!startDependenciesRecursive(dep, visiting)) return false;
        if (!startPlugin(dep)) return false;
    }

    return true;
}

type Subscribable = { subscribe: (...args: unknown[]) => unknown };

function isSubscribable(val: unknown): val is Subscribable {
    return val != null && typeof (val as { subscribe?: unknown }).subscribe === "function";
}

function resolveStoreHook(storeName: string): Subscribable | null {
    const storeModule = storeRegistry[storeName];
    if (!storeModule) return null;

    const hook = storeModule[`use${storeName}`];
    if (isSubscribable(hook)) return hook;

    return Object.values(storeModule).find(isSubscribable) ?? null;
}

function ensureMethodsBound(plugin: Plugin) {
    for (const key of Object.keys(plugin)) {
        if (key === "start" || key === "stop") continue;
        const val = (plugin as unknown as Record<string, unknown>)[key];
        if (typeof val === "function" && !(val as { $$voidBound?: boolean }).$$voidBound) {
            const bound = val.bind(plugin);
            (bound as { $$voidBound?: boolean }).$$voidBound = true;
            (plugin as unknown as Record<string, unknown>)[key] = bound;
        }
    }
}

export function startPlugin(plugin: Plugin, silent = false): boolean {
    if (plugin.started) return true;

    try {
        if (!startDependenciesRecursive(plugin)) {
            logger.error(`Failed to start dependencies for ${plugin.name}`);
            return false;
        }

        ensureMethodsBound(plugin);

        if (plugin.managedStyle) enableStyle(plugin.managedStyle);

        if (!plugin.hidden && !silent) logger.info(`Starting plugin ${plugin.name}`);
        plugin.start?.();

        if (plugin.chatBarButton) {
            addChatBarButton(plugin.name, plugin.chatBarButton);
        }

        if (plugin.contextMenuItems) {
            for (const [location, def] of Object.entries(plugin.contextMenuItems)) {
                addContextMenuItem(location as ContextMenuLocation, plugin.name, def as ContextMenuItemDef<any>);
            }
        }

        const unsubs: Array<() => void> = [];

        if (plugin.events) {
            for (const [event, handler] of Object.entries(plugin.events)) {
                unsubs.push(subscribeEvent(event, handler));
            }
        }

        if (plugin.storeSubscriptions) {
            for (const sub of plugin.storeSubscriptions) {
                unsubs.push(sub.store.subscribe(sub.callback, sub.selector));
            }
        }

        if (plugin.zustand) {
            for (const [storeName, sub] of Object.entries(plugin.zustand)) {
                const store = resolveStoreHook(storeName);
                if (!store) {
                    logger.warn(`Store "${storeName}" not found for plugin ${plugin.name}`);
                    continue;
                }

                const wrappedHandler = (current: unknown, prev: unknown) => {
                    try {
                        sub.handler(current, prev);
                    } catch (e) {
                        logger.error(`Zustand handler error in ${plugin.name} for ${storeName}:`, e);
                    }
                };

                const unsub = sub.selector ? store.subscribe(sub.selector, wrappedHandler) : store.subscribe(wrappedHandler);
                unsubs.push(unsub as () => void);
            }
        }

        if (plugin.eventListeners) {
            for (const el of plugin.eventListeners) {
                const target = el.target === "window" ? window : document;
                target.addEventListener(el.event, el.handler, el.options);
                unsubs.push(() => target.removeEventListener(el.event, el.handler, el.options));
            }
        }

        if (unsubs.length) pluginUnsubscribers.set(plugin.name, unsubs);

        plugin.started = true;
        return true;
    } catch (e) {
        logger.error(`Failed to start plugin ${plugin.name}:`, e);
        if (plugin.managedStyle) disableStyle(plugin.managedStyle);
        removeChatBarButton(plugin.name);
        removePluginContextMenuItems(plugin);
        runUnsubs(plugin.name);
        return false;
    }
}

export function stopPlugin(plugin: Plugin): boolean {
    if (!plugin.started) return true;

    try {
        plugin.stop?.();
    } catch (e) {
        logger.error(`Error in ${plugin.name}.stop():`, e);
    }

    let failed = false;

    runUnsubs(plugin.name);

    try { removeChatBarButton(plugin.name); } catch (e) { failed = true; logger.error(`Failed to remove chat bar button for ${plugin.name}:`, e); }

    try { removePluginContextMenuItems(plugin); } catch (e) { failed = true; logger.error(`Failed to remove context menu items for ${plugin.name}:`, e); }

    try {
        if (plugin.managedStyle && !plugin.patches?.length) disableStyle(plugin.managedStyle);
    } catch (e) { failed = true; logger.error(`Failed to disable style for ${plugin.name}:`, e); }

    try {
        if (plugin.cleanupSelectors) {
            for (const selector of plugin.cleanupSelectors) {
                for (const el of document.querySelectorAll(selector)) el.remove();
            }
        }
    } catch (e) { failed = true; logger.error(`Failed to cleanup selectors for ${plugin.name}:`, e); }

    plugin.started = false;
    if (failed) logger.error(`Plugin ${plugin.name} stopped with errors`);
    return !failed;
}

export function startAllPlugins(target: StartAt): void {
    for (const [name, plugin] of Object.entries(plugins)) {
        if (!isPluginEnabled(name)) continue;
        if ((plugin.startAt ?? StartAt.Init) !== target) continue;
        try { startPlugin(plugin); } catch (e) { logger.error(`Unexpected error starting ${name}:`, e); }
    }
}

export function registerPlugin(plugin: Plugin) {
    if (plugins[plugin.name]) return;

    plugins[plugin.name] = plugin;
    plugin.started = false;

    if (plugin.settings) {
        plugin.settings.pluginName = plugin.name;
    }
}

function pruneOrphanedPluginSettings() {
    const stored = PlainSettings.plugins;
    const orphaned = Object.keys(stored).filter(name => !plugins[name]);
    for (const name of orphaned) {
        logger.info(`Pruning settings for removed plugin: ${name}`);
        delete stored[name];
    }
    if (orphaned.length) SettingsStore.markAsChanged();
}

export function initPluginManager() {
    if (initialized) return;
    initialized = true;

    pruneOrphanedPluginSettings();

    const neededApis = new Set<string>();

    for (const [name, plugin] of Object.entries(plugins)) {
        if (!isPluginEnabled(name)) continue;

        for (const d of plugin.dependencies ?? []) {
            const dep = plugins[d];
            if (!dep) {
                logger.warn(`Plugin ${name} has unresolved dependency ${d}`);
                continue;
            }
            Settings.plugins[d] = { ...Settings.plugins[d], enabled: true };
            dep.isDependency = true;
        }

        if (plugin.chatBarButton) neededApis.add("ChatBarButtonAPI");
        if (plugin.contextMenuItems) neededApis.add("ContextMenuAPI");
    }

    for (const api of neededApis) {
        const dep = plugins[api];
        if (!dep) continue;
        Settings.plugins[api] = { ...Settings.plugins[api], enabled: true };
        dep.isDependency = true;
    }

    for (const [name, plugin] of Object.entries(plugins)) {
        const enabled = isPluginEnabled(name);

        if (enabled) ensureMethodsBound(plugin);

        if (plugin.patches) {
            try {
                for (const patch of plugin.patches) {
                    if (enabled) addPatch(patch, name);
                    else if (IS_DEV) addPatch({ ...patch, validateOnly: true }, name);
                }
            } catch (e) {
                logger.error(`Failed to register patches for ${name}`, e);
            }
        }
    }

}
