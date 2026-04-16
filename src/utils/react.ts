/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { subscribe, type VoidEvent } from "@api/Events";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "@turbopack/common/react";
import type { ExternalStore, SelectionStore } from "@utils/misc";
import type { ReactNode } from "react";

export type LazyNode = ReactNode | (() => ReactNode);

export function resolveLazyNode(node: LazyNode | undefined): ReactNode {
    return typeof node === "function" ? node() : node;
}

export function useExternalStore(store: ExternalStore) {
    useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useSelectionHas<T>(store: SelectionStore<T>, id: T): boolean {
    useExternalStore(store);
    return store.has(id);
}

export function useSelectionSize<T>(store: SelectionStore<T>): number {
    useExternalStore(store);
    return store.size();
}

export function useForceUpdater() {
    return useReducer((x: number) => x + 1, 0)[1];
}

export function useEventSubscription(event: VoidEvent, handler: () => void) {
    const ref = useRef(handler);
    ref.current = handler;
    useEffect(() => subscribe(event, () => ref.current()), [event]);
}

export function useFiltered<T>(list: T[], search: string, getKey: (item: T) => string): T[] {
    return useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return list;
        return list.filter(item => getKey(item).toLowerCase().includes(q));
    }, [list, search, getKey]);
}

export function useAsyncAction(fn: () => Promise<void>): [busy: boolean, execute: () => void] {
    const [busy, setBusy] = useState(false);
    const fnRef = useRef(fn);
    fnRef.current = fn;

    const execute = useCallback(async () => {
        setBusy(true);
        try { await fnRef.current(); }
        finally { setBusy(false); }
    }, []);

    return [busy, execute];
}
