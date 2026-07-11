/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { subscribe, type VoidEvent } from "@api/Events";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore } from "@turbopack/common/react";
import { ChatPageStore } from "@turbopack/common/stores";
import type { ExternalStore, SelectionStore } from "@utils/misc";
import type { ReactNode } from "react";

export interface Fiber {
    tag: number;
    type: { displayName?: string; name?: string } | string | null;
    stateNode: Element | null;
    return: Fiber | null;
    child: Fiber | null;
    sibling: Fiber | null;
    memoizedProps: Record<string, unknown> | null;
    memoizedState: FiberState | null;
    _debugOwner?: Fiber | null;
}

export interface FiberState {
    memoizedState: unknown;
    queue: { dispatch?: Function } | null;
    next: FiberState | null;
}

function findFiberKey(el: Element): string | null {
    for (const k in el) {
        if (k.startsWith("__reactFiber$")) return k;
    }
    return null;
}

export function getFiber(el: Element): Fiber | null {
    let cur: Element | null = el;
    while (cur) {
        const k = findFiberKey(cur);
        if (k) return (cur as unknown as Record<string, Fiber>)[k];
        cur = cur.parentElement;
    }
    return null;
}

export function getReactRoot(): Fiber | null {
    for (const el of [document.body, document.getElementById("__next"), document.getElementById("root")]) {
        if (!el) continue;
        const k = findFiberKey(el);
        if (k) return (el as unknown as Record<string, Fiber>)[k];
    }
    return null;
}

export function walkFiberTree(root: Fiber, visit: (fiber: Fiber) => boolean | void, maxProcessed: number): void {
    const visited = new WeakSet<Fiber>();
    const queue: Fiber[] = [root];
    let processed = 0;
    while (queue.length && processed < maxProcessed) {
        const fiber = queue.shift()!;
        if (visited.has(fiber)) continue;
        visited.add(fiber);
        processed++;
        if (visit(fiber) === false) return;
        if (fiber.child) queue.push(fiber.child);
        if (fiber.sibling) queue.push(fiber.sibling);
    }
}

export function walkFiberUp(fiber: Fiber | null, max: number, test: (fiber: Fiber) => boolean): Fiber | null {
    const seen = new WeakSet<Fiber>();
    let cur = fiber;
    let d = 0;
    while (cur && d < max) {
        if (seen.has(cur)) return null;
        seen.add(cur);
        if (test(cur)) return cur;
        cur = cur.return;
        d++;
    }
    return null;
}

export type Resolvable<T> = T | (() => T);
export type LazyNode = Resolvable<ReactNode>;
export function resolveLazy<T>(v: Resolvable<T> | undefined): T | undefined {
    return typeof v === "function" ? (v as () => T)() : v;
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

export function useIsStreaming(conversationId?: string): boolean {
    return ChatPageStore.useChatPageStore((s: ChatPageStoreState) =>
        !!s.streamedMessageId && (conversationId == null || s.conversationId === conversationId));
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
