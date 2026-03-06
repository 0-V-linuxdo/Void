/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isObject } from "./guards";
import { idbSet } from "./idb";
import { Logger } from "./Logger";

const logger = new Logger("SettingsStore");

const STORAGE_KEY = "VoidSettings";
const SAVE_DEBOUNCE_MS = 100;

type Listener = (path: string) => void;

function getOrCreateSet<K, V>(map: Map<K, Set<V>>, key: K): Set<V> {
    let set = map.get(key);
    if (!set) {
        set = new Set();
        map.set(key, set);
    }
    return set;
}

export class SettingsStore<T extends object> {
    private globalListeners = new Set<Listener>();
    private pathListeners = new Map<string, Set<Listener>>();
    private prefixListeners = new Map<string, Set<Listener>>();
    private defaultGetters = new Map<string, (key: string) => any>();
    private saveTimer: ReturnType<typeof setTimeout> | null = null;

    public declare store: T;
    public declare plain: T;

    constructor(plain: T) {
        this.plain = plain;
        this.store = this.makeProxy(plain as any);
        window.addEventListener("beforeunload", () => this.flush());
    }

    /** Flush any pending save immediately. */
    public flush() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
            this.save();
        }
    }

    public setDefaultGetter(prefix: string, getter: (key: string) => any) {
        this.defaultGetters.set(prefix, getter);
    }

    private makeProxy(target: any, path = ""): T {
        return new Proxy(target, {
            get: (t, key: string) => {
                let value = t[key];
                if (value === undefined && key !== "__proto__") {
                    const fullPath = path ? `${path}.${key}` : key;
                    for (const [prefix, getter] of this.defaultGetters) {
                        if (fullPath.startsWith(prefix)) {
                            const settingKey = fullPath.slice(prefix.length + 1);
                            if (settingKey && !settingKey.includes(".")) {
                                const defaultVal = getter(settingKey);
                                if (defaultVal !== undefined) {
                                    t[key] = defaultVal;
                                    value = defaultVal;
                                }
                            }
                            break;
                        }
                    }
                }
                if (isObject(value)) {
                    return this.makeProxy(value, path ? `${path}.${key}` : key);
                }
                return value;
            },
            set: (t, key: string, value) => {
                if (t[key] === value) return true;
                t[key] = value;
                const fullPath = path ? `${path}.${key}` : key;
                this.notifyListeners(fullPath);
                return true;
            },
            deleteProperty: (t, key: string) => {
                if (!(key in t)) return true;
                delete t[key];
                const fullPath = path ? `${path}.${key}` : key;
                this.notifyListeners(fullPath);
                return true;
            },
        });
    }

    private notifyListeners(path: string) {
        for (const l of this.globalListeners) l(path);

        const listeners = this.pathListeners.get(path);
        if (listeners) for (const l of listeners) l(path);

        for (const [prefix, set] of this.prefixListeners) {
            if (path.startsWith(prefix)) for (const l of set) l(path);
        }

        this.scheduleSave();
    }

    private scheduleSave() {
        if (this.saveTimer) return;
        this.saveTimer = setTimeout(() => {
            this.saveTimer = null;
            this.save();
        }, SAVE_DEBOUNCE_MS);
    }

    private save() {
        try {
            const json = JSON.stringify(this.plain);
            if (typeof GM_setValue === "function") {
                GM_setValue(STORAGE_KEY, json);
            } else {
                idbSet(STORAGE_KEY, json).catch(e => logger.warn("Failed to save settings to IndexedDB:", e));
            }
        } catch (e) {
            logger.error("Failed to save settings:", e);
        }
    }

    public markAsChanged() {
        this.notifyListeners("");
    }

    public addGlobalChangeListener(listener: Listener) {
        this.globalListeners.add(listener);
    }

    public removeGlobalChangeListener(listener: Listener) {
        this.globalListeners.delete(listener);
    }

    public addChangeListener(path: string, listener: Listener) {
        getOrCreateSet(this.pathListeners, path).add(listener);
    }

    public removeChangeListener(path: string, listener: Listener) {
        const set = this.pathListeners.get(path);
        if (set) { set.delete(listener); if (!set.size) this.pathListeners.delete(path); }
    }

    public addPrefixChangeListener(prefix: string, listener: Listener) {
        getOrCreateSet(this.prefixListeners, prefix).add(listener);
    }

    public removePrefixChangeListener(prefix: string, listener: Listener) {
        const set = this.prefixListeners.get(prefix);
        if (set) { set.delete(listener); if (!set.size) this.prefixListeners.delete(prefix); }
    }
}
