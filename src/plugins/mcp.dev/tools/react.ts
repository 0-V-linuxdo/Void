/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { REACT } from "./constants";
import type { Fiber, FiberState, ReactArgs } from "./types";
import { clampDefault, serialize } from "./utils";

const REACT_ACTIONS = ["find", "root", "query", "fiber", "props", "hooks", "state", "tree", "owner"] as const;

let fiberKey: string | null = null;

function findFiberKey(el: Element): string | null {
    if (fiberKey && fiberKey in el) return fiberKey;
    for (const k in el) {
        if (k.startsWith("__reactFiber$")) {
            fiberKey = k;
            return k;
        }
    }
    return null;
}

function getRoot(): Fiber | null {
    for (const el of [document.body, document.getElementById("__next"), document.getElementById("root")]) {
        if (!el) continue;
        const k = findFiberKey(el);
        if (k) return (el as unknown as Record<string, Fiber>)[k];
    }
    return null;
}

function getFiber(el: Element): Fiber | null {
    let cur: Element | null = el;
    while (cur) {
        const k = findFiberKey(cur);
        if (k) return (cur as unknown as Record<string, Fiber>)[k];
        cur = cur.parentElement;
    }
    return null;
}

function fiberName(f: Fiber): string | null {
    const t = f.type;
    if (!t || typeof t === "string") return null;
    return t.displayName ?? t.name ?? null;
}

function walkUp(f: Fiber | null, max: number, test: (f: Fiber) => boolean): Fiber | null {
    const seen = new WeakSet<Fiber>();
    let cur = f;
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

function resolveEl(selector: string): Element | string {
    try {
        const el = document.querySelector(selector);
        return el ?? `No element: ${selector}`;
    } catch {
        return "Invalid CSS selector";
    }
}

export function handleReact(args: ReactArgs): unknown {
    const { action, selector, componentName } = args;
    const maxD = Math.max(0, clampDefault(args.depth, REACT.DEFAULT_DEPTH, REACT.MAX_DEPTH));
    const lim = Math.max(1, clampDefault(args.limit, REACT.DEFAULT_LIMIT, REACT.MAX_LIMIT));

    if (action === "find") {
        if (!componentName) return { error: "Provide componentName" };
        const root = getRoot();
        if (!root) return { error: "No React root found. Is grok.com loaded?" };

        const lower = componentName.toLowerCase();
        const found: Array<{ name: string; d: number; props?: string[]; s?: boolean; count?: number }> = [];
        const queue: Array<{ f: Fiber; d: number }> = [{ f: root, d: 0 }];
        const visited = new WeakSet<Fiber>();
        visited.add(root);
        let qi = 0;

        while (qi < queue.length && qi < REACT.MAX_PROCESS && found.length < lim) {
            const { f, d } = queue[qi++];
            const nm = fiberName(f);
            if (nm?.toLowerCase().includes(lower)) {
                const entry: { name: string; d: number; props?: string[]; s?: boolean; count?: number } = { name: nm, d };
                if (args.includeProps && f.memoizedProps) {
                    const pk = Object.keys(f.memoizedProps).filter(k => k !== "children");
                    if (pk.length) entry.props = pk.slice(0, REACT.PROP_KEYS_PREVIEW);
                }
                if (f.memoizedState) entry.s = true;
                const existing = found.find(e => e.name === nm && e.d === d && !args.includeProps);
                if (existing) { existing.count = (existing.count ?? 1) + 1; }
                else found.push(entry);
            }
            if (f.child && !visited.has(f.child)) { visited.add(f.child); queue.push({ f: f.child, d: d + 1 }); }
            if (f.sibling && !visited.has(f.sibling)) { visited.add(f.sibling); queue.push({ f: f.sibling, d }); }
        }
        if (!found.length) return { error: `No components matching "${componentName}" found. Try a partial name or use the 'root' action to list all components.` };
        return found;
    }

    if (action === "root") {
        const root = getRoot();
        if (!root) return { error: "No React root found. Is grok.com loaded?" };

        const seen = new Set<string>();
        const visited = new WeakSet<Fiber>();
        visited.add(root);
        const queue: Fiber[] = [root];
        let qi = 0;

        while (qi < queue.length && qi < REACT.MAX_PROCESS) {
            const f = queue[qi++];
            const nm = fiberName(f);
            if (nm && nm.length >= REACT.MIN_COMPONENT_NAME && seen.size < REACT.MAX_NAMED) seen.add(nm);
            if (f.child && !visited.has(f.child)) { visited.add(f.child); queue.push(f.child); }
            if (f.sibling && !visited.has(f.sibling)) { visited.add(f.sibling); queue.push(f.sibling); }
        }
        return [...seen].sort();
    }

    if (!selector) return { error: "Provide CSS selector (required for this action)" };
    const el = resolveEl(selector);
    if (typeof el === "string") return { error: el };

    if (action === "query") {
        let elements: NodeListOf<Element>;
        try {
            elements = document.querySelectorAll(selector);
        } catch {
            return { error: "Invalid CSS selector" };
        }
        const out: Array<Record<string, unknown>> = [];
        for (let i = 0, l = Math.min(elements.length, lim); i < l; i++) {
            const e = elements[i];
            const r = e.getBoundingClientRect();
            const item: Record<string, unknown> = { tag: e.tagName.toLowerCase() };
            if (e.id) item.id = e.id;
            if (e.className) item.cls = e.className.toString().slice(0, REACT.TEXT_SLICE);
            item.rect = [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
            const fiber = getFiber(e);
            if (fiber) {
                const comp = walkUp(fiber, REACT.WALK_UP_DEPTH, f => !!fiberName(f));
                if (comp) item.component = fiberName(comp);
            }
            out.push(item);
        }
        return { total: elements.length, els: out };
    }

    if (action === "fiber") {
        const fiber = getFiber(el);
        if (!fiber) return { error: "No React fiber found on this element" };

        const nodes: Array<Record<string, unknown>> = [];
        const seen = new WeakSet<Fiber>();
        let cur: Fiber | null = fiber;
        let d = 0;
        while (cur && d < maxD) {
            if (seen.has(cur)) break;
            seen.add(cur);
            const nm = fiberName(cur);
            const node: Record<string, unknown> = nm ? { n: nm } : { t: cur.tag };
            if (args.includeProps && cur.memoizedProps) {
                const pk = Object.keys(cur.memoizedProps).filter(k => k !== "children");
                if (pk.length) node.p = pk.slice(0, REACT.FIBER_PROP_KEYS);
            }
            if (cur.memoizedState) node.s = true;
            nodes.push(node);
            cur = cur.return;
            d++;
        }
        return nodes;
    }

    if (action === "props") {
        const fiber = getFiber(el);
        if (!fiber) return { error: "No React fiber found on this element" };
        const target = walkUp(fiber, maxD, f => !!f.memoizedProps && !!fiberName(f));
        if (!target) return { error: "No component with props found walking up from this element" };
        return { c: fiberName(target), props: serialize(target.memoizedProps) };
    }

    if (action === "hooks") {
        const fiber = getFiber(el);
        if (!fiber) return { error: "No React fiber found on this element" };
        const target = walkUp(fiber, maxD, f => f.tag === 0 && !!f.memoizedState);
        if (!target) return { error: "No function component with hooks found" };

        const hooks: Array<Record<string, unknown>> = [];
        const seenStates = new WeakSet<FiberState>();
        let state: FiberState | null = target.memoizedState;
        let i = 0;
        while (state && i < REACT.MAX_HOOKS) {
            if (seenStates.has(state)) break;
            seenStates.add(state);
            const ms = state.memoizedState;
            let h: Record<string, unknown>;
            if (state.queue?.dispatch) {
                h = { t: "state", v: serialize(ms, 1) };
            } else if (ms != null && typeof ms === "object" && "current" in (ms as Record<string, unknown>)) {
                h = { t: "ref", v: serialize((ms as Record<string, unknown>).current, 1) };
            } else if (ms != null && typeof ms === "object" && "create" in (ms as Record<string, unknown>) && "deps" in (ms as Record<string, unknown>)) {
                h = { t: "effect", deps: ((ms as Record<string, unknown>).deps as unknown[])?.length ?? null };
            } else if (Array.isArray(ms) && ms.length === 2 && Array.isArray(ms[1])) {
                h = typeof ms[0] === "function" ? { t: "cb", deps: ms[1].length } : { t: "memo", v: serialize(ms[0], 1), deps: ms[1].length };
            } else {
                h = { t: "?" };
                if (ms != null) h.v = serialize(ms, 1);
            }
            hooks.push(h);
            state = state.next;
            i++;
        }
        return { c: fiberName(target), hooks };
    }

    if (action === "state") {
        const fiber = getFiber(el);
        if (!fiber) return { error: "No React fiber found on this element" };
        const target = walkUp(fiber, maxD, f => f.tag === 0 && !!f.memoizedState);
        if (!target) return { error: "No useState hooks found on nearest function component" };

        const vals: unknown[] = [];
        const seenStates = new WeakSet<FiberState>();
        let hs: FiberState | null = target.memoizedState;
        while (hs && vals.length < REACT.MAX_STATE_VALUES) {
            if (seenStates.has(hs)) break;
            seenStates.add(hs);
            if (hs.queue?.dispatch) vals.push(serialize(hs.memoizedState, 2));
            hs = hs.next;
        }
        return { c: fiberName(target), state: vals };
    }

    if (action === "tree") {
        const breadth = Math.max(1, clampDefault(args.breadth, REACT.DEFAULT_BREADTH, REACT.MAX_BREADTH));
        const build = (node: Element, d: number): Record<string, unknown> => {
            const info: Record<string, unknown> = { tag: node.tagName.toLowerCase() };
            if (node.id) info.id = node.id;
            if (node.classList?.length) info.cls = [...node.classList].slice(0, REACT.MAX_CLASS_PREVIEW);
            if (!node.children.length && node.textContent) info.txt = node.textContent.slice(0, REACT.TEXT_SLICE);
            if (d > 0 && node.children.length) {
                const ch: Array<Record<string, unknown>> = [];
                for (let i = 0, l = Math.min(node.children.length, breadth); i < l; i++) ch.push(build(node.children[i], d - 1));
                info.ch = ch;
                if (node.children.length > breadth) info.more = node.children.length - breadth;
            }
            return info;
        };
        return build(el, Math.min(maxD, REACT.MAX_TREE_DEPTH));
    }

    if (action === "owner") {
        const fiber = getFiber(el);
        if (!fiber) return { error: "No React fiber found on this element" };

        const owners: string[] = [];
        const seen = new WeakSet<Fiber>();
        let cur: Fiber | null = fiber._debugOwner ?? fiber.return ?? null;
        let d = 0;
        while (cur && d < maxD && owners.length < lim) {
            if (seen.has(cur)) break;
            seen.add(cur);
            const nm = fiberName(cur);
            if (nm) owners.push(nm);
            cur = cur._debugOwner ?? cur.return ?? null;
            d++;
        }
        if (!owners.length) return { error: "No named owner components found. _debugOwner may be stripped in production builds — try the 'fiber' action instead." };
        return owners;
    }

    return { error: `Unknown action: ${action}`, validActions: REACT_ACTIONS };
}
