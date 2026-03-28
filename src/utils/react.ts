/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { subscribe, type VoidEvent } from "@api/Events";
import { useEffect, useMemo, useReducer, useSyncExternalStore } from "@turbopack/common/react";
import type { ExternalStore } from "@utils/misc";
import type { ReactNode } from "react";

export type LazyNode = ReactNode | (() => ReactNode);

export function resolveLazyNode(node: LazyNode | undefined): ReactNode {
    return typeof node === "function" ? node() : node;
}

export function useExternalStore(store: ExternalStore) {
    useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useForceUpdater() {
    return useReducer((x: number) => x + 1, 0)[1];
}

export function useEventSubscription(event: VoidEvent, handler: () => void) {
    useEffect(() => subscribe(event, handler), [event, handler]);
}

export function useFiltered<T>(list: T[], search: string, getKey: (item: T) => string): T[] {
    return useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return list;
        return list.filter(item => getKey(item).toLowerCase().includes(q));
    }, [list, search, getKey]);
}
