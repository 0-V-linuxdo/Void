/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { createExternalStore, type ExternalStore, sortedEntries } from "@utils/misc";

export interface Registry<V extends { order?: number }> {
    readonly store: ExternalStore;
    set(id: string, value: V): void;
    get(id: string): V | undefined;
    delete(id: string): boolean;
    update(id: string, patch: Partial<V>): void;
    has(id: string): boolean;
    get size(): number;
    sorted(): [string, V][];
}

export function createRegistry<V extends { order?: number }>(): Registry<V> {
    const map = new Map<string, V>();
    const store = createExternalStore();

    return {
        store,
        set(id, value) { map.set(id, value); store.notify(); },
        get: id => map.get(id),
        delete(id) {
            const had = map.delete(id);
            if (had) store.notify();
            return had;
        },
        update(id, patch) {
            const existing = map.get(id);
            if (!existing) return;
            map.set(id, { ...existing, ...patch });
            store.notify();
        },
        has: id => map.has(id),
        get size() { return map.size; },
        sorted: () => sortedEntries(map),
    };
}
