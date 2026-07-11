/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type Fiber, type FiberState, getFiber, getReactRoot, walkFiberTree, walkFiberUp } from "@utils/react";

import { REACT } from "./constants";
import type { ReactArgs } from "./types";
import { clampConfig, dispatch, serialize } from "./utils";

const NO_FIBER = "No React fiber found on this element";
const hasHooks = (f: Fiber) => f.tag === 0 && !!f.memoizedState;

function walkHookStates(fiber: Fiber, visitor: (state: FiberState, index: number) => boolean | void, maxItems: number): void {
    let state = fiber.memoizedState;
    for (let i = 0; state && i < maxItems; i++, state = state.next) {
        if (visitor(state, i) === false) return;
    }
}

function fiberName(f: Fiber): string | null {
    const t = f.type;
    if (!t || typeof t === "string") return null;
    return t.displayName ?? t.name ?? null;
}

function resolveEl(selector: string | undefined, opts: { all: true }): NodeListOf<Element> | { error: string };
function resolveEl(selector: string | undefined): Element | { error: string };
function resolveEl(selector: string | undefined, opts?: { all?: boolean }): Element | NodeListOf<Element> | { error: string } {
    if (!selector) return { error: "Provide CSS selector (required for this action)." };
    try {
        if (opts?.all) return document.querySelectorAll(selector);
        const el = document.querySelector(selector);
        return el ?? { error: `No element: ${selector}` };
    } catch {
        return { error: "Invalid CSS selector" };
    }
}

function bounds(args: ReactArgs): { maxD: number; lim: number } {
    return {
        maxD: clampConfig(args.depth, { default: REACT.DEFAULT_DEPTH, min: 0, max: REACT.MAX_DEPTH }),
        lim: clampConfig(args.limit, { default: REACT.DEFAULT_LIMIT, min: 1, max: REACT.MAX_LIMIT }),
    };
}

function propKeys(fiber: Fiber, max: number): string[] {
    if (!fiber.memoizedProps) return [];
    return Object.keys(fiber.memoizedProps).filter(k => k !== "children").slice(0, max);
}

function actionFind(args: ReactArgs): unknown {
    const { componentName } = args;
    if (!componentName) return { error: "Provide componentName." };
    const root = getReactRoot();
    if (!root) return { error: "No React root found. Is grok.com loaded?" };

    const { lim } = bounds(args);
    const lower = componentName.toLowerCase();
    type Entry = { name: string; props?: string[]; s?: boolean; count?: number };
    const found: Entry[] = [];
    const byName = args.includeProps ? null : new Map<string, Entry>();
    walkFiberTree(root, f => {
        if (found.length >= lim) return false;
        const nm = fiberName(f);
        if (!nm?.toLowerCase().includes(lower)) return;
        if (byName) {
            const existing = byName.get(nm);
            if (existing) { existing.count = (existing.count ?? 1) + 1; return; }
        }
        const entry: Entry = { name: nm };
        if (args.includeProps) {
            const pk = propKeys(f, REACT.PROP_KEYS_PREVIEW);
            if (pk.length) entry.props = pk;
        }
        if (f.memoizedState) entry.s = true;
        found.push(entry);
        byName?.set(nm, entry);
    }, REACT.MAX_PROCESS);
    if (!found.length) return { error: `No components matching "${componentName}" found. Try a partial name or use the 'root' action to list all components.` };
    return found;
}

function actionRoot(): unknown {
    const root = getReactRoot();
    if (!root) return { error: "No React root found. Is grok.com loaded?" };

    const seen = new Set<string>();
    walkFiberTree(root, f => {
        const nm = fiberName(f);
        if (nm && nm.length >= REACT.MIN_COMPONENT_NAME && seen.size < REACT.MAX_NAMED) seen.add(nm);
    }, REACT.MAX_PROCESS);
    return [...seen].toSorted();
}

function requireSelector(args: ReactArgs): Element | { error: string } {
    return resolveEl(args.selector);
}

function actionQuery(args: ReactArgs): unknown {
    const elements = resolveEl(args.selector, { all: true });
    if (!(elements instanceof NodeList)) return elements;
    const { lim } = bounds(args);
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
            const comp = walkFiberUp(fiber, REACT.WALK_UP_DEPTH, f => !!fiberName(f));
            if (comp) item.component = fiberName(comp);
        }
        out.push(item);
    }
    return { total: elements.length, els: out };
}

function actionFiber(args: ReactArgs): unknown {
    const el = requireSelector(args);
    if (!(el instanceof Element)) return el;
    const fiber = getFiber(el);
    if (!fiber) return { error: NO_FIBER };

    const { maxD } = bounds(args);
    const nodes: Array<Record<string, unknown>> = [];
    walkFiberUp(fiber, maxD, cur => {
        const nm = fiberName(cur);
        const node: Record<string, unknown> = nm ? { n: nm } : { t: cur.tag };
        if (args.includeProps) {
            const pk = propKeys(cur, REACT.FIBER_PROP_KEYS);
            if (pk.length) node.p = pk;
        }
        if (cur.memoizedState) node.s = true;
        nodes.push(node);
        return false;
    });
    return nodes;
}

function actionProps(args: ReactArgs): unknown {
    const el = requireSelector(args);
    if (!(el instanceof Element)) return el;
    const fiber = getFiber(el);
    if (!fiber) return { error: NO_FIBER };
    const { maxD } = bounds(args);
    const target = walkFiberUp(fiber, maxD, f => !!f.memoizedProps && !!fiberName(f));
    if (!target) return { error: "No component with props found walking up from this element" };
    return { c: fiberName(target), props: serialize(target.memoizedProps) };
}

function describeHook(state: FiberState): Record<string, unknown> {
    const ms = state.memoizedState;
    if (state.queue?.dispatch) return { t: "state", v: serialize(ms, 1) };
    if (ms != null && typeof ms === "object") {
        const obj = ms as Record<string, unknown>;
        if ("current" in obj) return { t: "ref", v: serialize(obj.current, 1) };
        if ("create" in obj && "deps" in obj) return { t: "effect", deps: (obj.deps as unknown[])?.length ?? null };
    }
    if (Array.isArray(ms) && ms.length === 2 && Array.isArray(ms[1])) {
        return typeof ms[0] === "function" ? { t: "cb", deps: ms[1].length } : { t: "memo", v: serialize(ms[0], 1), deps: ms[1].length };
    }
    const h: Record<string, unknown> = { t: "?" };
    if (ms != null) h.v = serialize(ms, 1);
    return h;
}

function actionHooks(args: ReactArgs): unknown {
    const el = requireSelector(args);
    if (!(el instanceof Element)) return el;
    const fiber = getFiber(el);
    if (!fiber) return { error: NO_FIBER };
    const { maxD } = bounds(args);
    const target = walkFiberUp(fiber, maxD, hasHooks);
    if (!target) return { error: "No function component with hooks found" };

    const hooks: Array<Record<string, unknown>> = [];
    walkHookStates(target, state => { hooks.push(describeHook(state)); }, REACT.MAX_HOOKS);
    return { c: fiberName(target), hooks };
}

function actionState(args: ReactArgs): unknown {
    const el = requireSelector(args);
    if (!(el instanceof Element)) return el;
    const fiber = getFiber(el);
    if (!fiber) return { error: NO_FIBER };
    const { maxD } = bounds(args);
    const target = walkFiberUp(fiber, maxD, hasHooks);
    if (!target) return { error: "No useState hooks found on nearest function component" };

    const vals: unknown[] = [];
    walkHookStates(target, state => {
        if (state.queue?.dispatch) vals.push(serialize(state.memoizedState, 2));
    }, REACT.MAX_STATE_VALUES);
    return { c: fiberName(target), state: vals };
}

function actionTree(args: ReactArgs): unknown {
    const el = requireSelector(args);
    if (!(el instanceof Element)) return el;
    const { maxD } = bounds(args);
    const breadth = clampConfig(args.breadth, { default: REACT.DEFAULT_BREADTH, min: 1, max: REACT.MAX_BREADTH });
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

function actionOwner(args: ReactArgs): unknown {
    const el = requireSelector(args);
    if (!(el instanceof Element)) return el;
    const fiber = getFiber(el);
    if (!fiber) return { error: NO_FIBER };
    const { maxD, lim } = bounds(args);

    const owners: string[] = [];
    const start = fiber._debugOwner ?? fiber.return ?? null;
    if (start) {
        walkFiberUp(start, maxD, cur => {
            const nm = fiberName(cur);
            if (nm) owners.push(nm);
            return owners.length >= lim;
        });
    }
    if (!owners.length) return { error: "No named owner components found. _debugOwner may be stripped in production builds, try the 'fiber' action instead." };
    return owners;
}

const REACT_ACTIONS: Record<ReactArgs["action"], (args: ReactArgs) => unknown> = {
    find: actionFind,
    root: actionRoot,
    query: actionQuery,
    fiber: actionFiber,
    props: actionProps,
    hooks: actionHooks,
    state: actionState,
    tree: actionTree,
    owner: actionOwner,
};

export const handleReact = (args: ReactArgs): unknown => dispatch(REACT_ACTIONS, args);
