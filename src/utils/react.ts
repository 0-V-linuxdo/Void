/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { subscribe } from "@api/Events";
import { useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "@turbopack/common/react";
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

export function useEventSubscription(event: string, handler: () => void) {
    useEffect(() => subscribe(event, handler), [event, handler]);
}

export function useFiltered<T>(list: T[], search: string, getKey: (item: T) => string): T[] {
    return useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return list;
        return list.filter(item => getKey(item).toLowerCase().includes(q));
    }, [list, search, getKey]);
}

/** Countdown timer hook. Ticks down from `seconds` to 0, then returns null. */
export function useCountdown(seconds: number | null): number | null {
    const [value, setValue] = useState(seconds);
    const prevRef = useRef(seconds);

    if (prevRef.current !== seconds) {
        prevRef.current = seconds;
        setValue(seconds);
    }

    useEffect(() => {
        if (value == null || value <= 0) return;
        const id = setInterval(() => setValue(p => (p != null && p > 1 ? p - 1 : null)), 1000);
        return () => clearInterval(id);
    }, [value != null && value > 0]);

    return value;
}
