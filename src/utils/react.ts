/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { subscribe } from "@api/Events";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "@turbopack/common/react";
import { onModuleLoad } from "@turbopack/patchTurbopack";
import { debounce, type ExternalStore } from "@utils/misc";
import type { ReactNode } from "react";

export const NoopComponent = () => null;

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

/**
 * Force a re-render whenever the Turbopack module cache grows.
 * Debounced to avoid excessive re-renders during chunk loading.
 * @param ms Debounce interval in milliseconds (default 500)
 */
export function useModuleLoadEffect(ms = 500) {
    const update = useForceUpdater();

    useEffect(() => {
        const invalidate = debounce(update, ms);
        const unsub = onModuleLoad(invalidate);
        return () => {
            unsub();
            invalidate.cancel();
        };
    }, [update, ms]);
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

interface AwaiterOpts<T> {
    fallbackValue: T;
    deps?: any[];
    onError?(e: any): void;
    onSuccess?(value: T): void;
}

type AwaiterRes<T> = [value: T, error: any, isPending: boolean];

/**
 * Await a promise in a React component.
 * @param factory Async function that returns the value
 * @param opts Options with fallbackValue, deps, onError, onSuccess
 * @returns [value, error, isPending]
 */
export function useAwaiter<T>(factory: () => Promise<T>): AwaiterRes<T | null>;
export function useAwaiter<T>(factory: () => Promise<T>, opts: AwaiterOpts<T>): AwaiterRes<T>;
export function useAwaiter<T>(factory: () => Promise<T>, opts?: AwaiterOpts<T | null>): AwaiterRes<T | null> {
    const resolved: Required<AwaiterOpts<T | null>> = {
        fallbackValue: null,
        deps: [],
        onError: undefined!,
        onSuccess: undefined!,
        ...opts,
    };

    const [state, setState] = useState({
        value: resolved.fallbackValue,
        error: null as any,
        pending: true,
    });

    useEffect(() => {
        let alive = true;
        if (!state.pending) setState({ ...state, pending: true });

        factory()
            .then(value => {
                if (!alive) return;
                setState({ value, error: null, pending: false });
                resolved.onSuccess?.(value);
            })
            .catch(error => {
                if (!alive) return;
                setState({ value: null, error, pending: false });
                resolved.onError?.(error);
            });

        return () => {
            alive = false;
        };
    }, resolved.deps);

    return [state.value, state.error, state.pending];
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

/** Intersection observer hook. Returns [refCallback, isIntersecting]. If `once` is true, stays true after first intersection. */
export function useIntersection(once = false): [(el: Element | null) => void, boolean] {
    const [intersecting, setIntersecting] = useState(false);
    const elRef = useRef<Element | null>(null);

    useEffect(() => {
        const el = elRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            setIntersecting(prev => {
                if (once && prev) return prev;
                return entry.isIntersecting;
            });
            if (once && entry.isIntersecting) observer.disconnect();
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [elRef.current, once]);

    const ref = useCallback((el: Element | null) => { elRef.current = el; }, []);
    return [ref, intersecting];
}
