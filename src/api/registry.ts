/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { createExternalStore, type ExternalStore, sortedEntries } from "@utils/misc";

export interface Registry<V extends { order?: number }> {
    readonly store: ExternalStore;
    set(id: string, value: V): void;
    delete(id: string): boolean;
    get size(): number;
    sorted(): [string, V][];
}

export function createRegistry<V extends { order?: number }>(): Registry<V> {
    const map = new Map<string, V>();
    const store = createExternalStore();

    return {
        store,
        set(id, value) { map.set(id, value); store.notify(); },
        delete(id) {
            const had = map.delete(id);
            if (had) store.notify();
            return had;
        },
        get size() { return map.size; },
        sorted: () => sortedEntries(map),
    };
}
