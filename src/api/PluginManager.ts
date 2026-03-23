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
import { addContextMenuItem, type ContextMenuLocation, removeContextMenuItem } from "./ContextMenus";
import { subscribe as subscribeEvent } from "./Events";
import { PlainSettings, Settings, SettingsStore } from "./Settings";

const logger = new Logger("PluginManager", "#b4befe");

export const plugins: Record<string, Plugin> = {};
const pluginUnsubscribers = new Map<string, Array<() => void>>();
let initialized = false;

const storeRegistry = allStores as Record<string, Record<string, any>>;

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

function resolveStoreHook(storeName: string): { subscribe: (...args: any[]) => any } | null {
    const storeModule = storeRegistry[storeName];
    if (!storeModule) return null;

    const hookName = `use${storeName}`;
    const hook = storeModule[hookName] as { subscribe?: (...args: any[]) => any } | undefined;
    if (hook && typeof hook.subscribe === "function") return hook as { subscribe: (...args: any[]) => any };

    for (const key in storeModule) {
        const val = storeModule[key] as { subscribe?: (...args: any[]) => any } | undefined;
        if (val && typeof val.subscribe === "function") return val as { subscribe: (...args: any[]) => any };
    }

    return null;
}

function ensureMethodsBound(plugin: Plugin) {
    for (const key of Object.keys(plugin)) {
        if (key === "start" || key === "stop") continue;
        const val = (plugin as any)[key];
        if (typeof val === "function" && !val.$$voidBound) {
            const bound = val.bind(plugin);
            bound.$$voidBound = true;
            (plugin as any)[key] = bound;
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
                addContextMenuItem(location as ContextMenuLocation, plugin.name, def as any);
            }
        }

        const unsubs: Array<() => void> = [];

        if (plugin.events) {
            for (const [event, handler] of Object.entries(plugin.events)) {
                unsubs.push(subscribeEvent(event, handler));
            }
        }

        if (plugin.storeSubscriptions?.length) {
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

                const wrappedHandler = (current: any, prev: any) => {
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
        const unsubs = pluginUnsubscribers.get(plugin.name);
        if (unsubs) {
            for (const unsub of unsubs) unsub();
            pluginUnsubscribers.delete(plugin.name);
        }
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

    try {
        const unsubs = pluginUnsubscribers.get(plugin.name);
        if (unsubs) {
            for (const unsub of unsubs) unsub();
            pluginUnsubscribers.delete(plugin.name);
        }

        removeChatBarButton(plugin.name);

        removePluginContextMenuItems(plugin);

        if (plugin.managedStyle && !plugin.patches?.length) disableStyle(plugin.managedStyle);

        if (plugin.cleanupSelectors) {
            for (const selector of plugin.cleanupSelectors) {
                document.querySelectorAll(selector).forEach(el => el.remove());
            }
        }

        plugin.started = false;
        return true;
    } catch (e) {
        plugin.started = false;
        logger.error(`Failed to stop plugin ${plugin.name}:`, e);
        return false;
    }
}

export function startAllPlugins(target: StartAt) {
    for (const name in plugins) {
        const plugin = plugins[name];
        if (!isPluginEnabled(name)) continue;
        if ((plugin.startAt ?? StartAt.Init) !== target) continue;
        startPlugin(plugin);
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
    let pruned = false;

    for (const name in stored) {
        if (!plugins[name]) {
            logger.info(`Pruning settings for removed plugin: ${name}`);
            delete stored[name];
            pruned = true;
        }
    }

    if (pruned) SettingsStore.markAsChanged();
}

export function initPluginManager() {
    if (initialized) return;
    initialized = true;

    pruneOrphanedPluginSettings();

    const neededApis = new Set<string>();

    for (const name in plugins) {
        if (!isPluginEnabled(name)) continue;
        const plugin = plugins[name];

        plugin.dependencies?.forEach(d => {
            const dep = plugins[d];
            if (!dep) {
                logger.warn(`Plugin ${name} has unresolved dependency ${d}`);
                return;
            }
            Settings.plugins[d] = { ...Settings.plugins[d], enabled: true };
            dep.isDependency = true;
        });

        if (plugin.chatBarButton) neededApis.add("ChatBarButtonAPI");
        if (plugin.contextMenuItems) neededApis.add("ContextMenuAPI");
    }

    for (const api of neededApis) {
        const dep = plugins[api];
        if (!dep) continue;
        Settings.plugins[api] = { ...Settings.plugins[api], enabled: true };
        dep.isDependency = true;
    }

    for (const name in plugins) {
        const enabled = isPluginEnabled(name);
        const plugin = plugins[name];

        if (enabled) ensureMethodsBound(plugin);

        if (plugin.patches) {
            for (const patch of plugin.patches) {
                if (enabled) addPatch(patch, name);
                else if (IS_DEV) addPatch({ ...patch, validateOnly: true }, name);
            }
        }
    }

}
