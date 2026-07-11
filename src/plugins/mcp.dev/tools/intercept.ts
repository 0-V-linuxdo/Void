/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";

import { INTERCEPT } from "./constants";
import type { AnyFn, Capture, InterceptArgs, InterceptState } from "./types";
import { clampCaptureConfig, dispatch, errorMessage, isThenable, requireId, requireModuleExports, serialize } from "./utils";

const logger = new Logger("MCP:Intercept");

let nextId = 1;
const active = new Map<number, InterceptState>();

function restoreIntercept(state: InterceptState): void {
    try {
        state.holder[state.finalKey] = state.original;
    } catch (e) {
        logger.warn("Failed to restore intercepted export", e);
    }
    clearTimeout(state.timer);
    active.delete(state.id);
}

export function clearAllIntercepts(): void {
    for (const state of active.values()) restoreIntercept(state);
    active.clear();
}

function resolveHolder(exports: Record<string, unknown>, exportKey: string): { holder: Record<string, unknown>; finalKey: string } | { error: string } {
    const parts = exportKey.split(".");
    let holder = exports;
    for (let i = 0; i < parts.length - 1; i++) {
        const next = holder[parts[i]];
        if (next == null || typeof next !== "object") return { error: `Path ${parts.slice(0, i + 1).join(".")} not found` };
        holder = next as Record<string, unknown>;
    }
    return { holder, finalKey: parts[parts.length - 1] };
}

const captureArgs = (callArgs: unknown[]): unknown => serialize(callArgs, INTERCEPT.SERIALIZE_DEPTH);
const measureMs = (start: number) => Math.round((performance.now() - start) * 100) / 100;

function recordCall<R>(state: InterceptState, maxCaptures: number, callArgs: unknown[], invoke: () => R): R {
    const elapsed = Date.now() - state.startTime;
    const callStart = performance.now();
    const underLimit = state.captures.length < maxCaptures;
    try {
        const ret = invoke();
        if (!underLimit) return ret;
        const d = measureMs(callStart);
        if (isThenable(ret)) {
            const capture: Capture = { t: elapsed, d, args: captureArgs(callArgs), ret: "[Promise:pending]" };
            state.captures.push(capture);
            ret.then(
                v => { if (active.has(state.id)) capture.ret = serialize(v, INTERCEPT.SERIALIZE_DEPTH); },
                e => { if (active.has(state.id)) { capture.ret = null; capture.err = errorMessage(e); } },
            );
        } else {
            state.captures.push({ t: elapsed, d, args: captureArgs(callArgs), ret: serialize(ret, INTERCEPT.SERIALIZE_DEPTH) });
        }
        return ret;
    } catch (err: unknown) {
        if (underLimit) state.captures.push({ t: elapsed, d: measureMs(callStart), args: captureArgs(callArgs), ret: null, err: errorMessage(err) });
        throw err;
    }
}

function buildInterceptor(original: AnyFn, state: InterceptState, maxCaptures: number): AnyFn {
    return new Proxy(original, {
        apply: (target, thisArg, argArray) => recordCall(state, maxCaptures, argArray, () => Reflect.apply(target, thisArg, argArray)),
        construct: (target, argArray, newTarget) => recordCall(state, maxCaptures, argArray, () => Reflect.construct(target, argArray, newTarget)),
    });
}

function actionSet(args: InterceptArgs): unknown {
    const { exportKey = "default" } = args;
    const idResult = requireId(args.moduleId);
    if ("error" in idResult) return idResult;
    const { id: moduleId } = idResult;

    const result = requireModuleExports(moduleId);
    if ("error" in result) return result;

    const resolved = resolveHolder(result.exports, exportKey);
    if ("error" in resolved) return resolved;

    const { holder, finalKey } = resolved;
    const original = holder[finalKey];
    if (typeof original !== "function") return { error: `${exportKey} is not a function (${typeof original})` };
    const fn = original as AnyFn;

    for (const existing of active.values()) {
        if (existing.moduleId === moduleId && existing.exportKey === exportKey) {
            return { error: `Intercept already active on module ${moduleId}.${exportKey} (id: ${existing.id}). Stop it first with stop action.` };
        }
    }

    const { duration, maxCaptures } = clampCaptureConfig(args, {
        dur: { default: INTERCEPT.DEFAULT_DURATION, min: INTERCEPT.MIN_DURATION, max: INTERCEPT.MAX_DURATION },
        cap: { default: INTERCEPT.DEFAULT_CAPTURES, max: INTERCEPT.MAX_CAPTURES },
    });
    const id = nextId++;

    const state: InterceptState = {
        id,
        moduleId,
        exportKey,
        finalKey,
        captures: [],
        startTime: Date.now(),
        original: fn,
        holder,
        timer: setTimeout(() => restoreIntercept(state), duration),
    };

    const interceptor = buildInterceptor(fn, state, maxCaptures);
    try {
        Object.defineProperty(holder, finalKey, { value: interceptor, writable: true, configurable: true });
    } catch {
        clearTimeout(state.timer);
        return { error: `Cannot intercept non-configurable property "${exportKey}"` };
    }

    active.set(id, state);
    return { id, moduleId: state.moduleId, exportKey, duration, maxCaptures, fnName: fn.name ?? null };
}

function actionGet(args: InterceptArgs): unknown {
    const { id } = args;
    if (id == null) return { error: "Provide intercept id." };
    const state = active.get(id);
    if (!state) return { error: `Intercept ${id} not found (expired or stopped)` };
    return {
        id: state.id,
        moduleId: state.moduleId,
        exportKey: state.exportKey,
        elapsed: Date.now() - state.startTime,
        captures: state.captures.slice(-INTERCEPT.GET_CAPTURES_LIMIT),
        ...(state.captures.length > INTERCEPT.GET_CAPTURES_LIMIT && { totalCaptures: state.captures.length, hint: `Showing last ${INTERCEPT.GET_CAPTURES_LIMIT} captures. Use stop to get final count.` }),
    };
}

function actionStop(args: InterceptArgs): unknown {
    const { id } = args;
    if (id == null) return { error: "Provide intercept id." };
    const state = active.get(id);
    if (!state) return { error: `Intercept ${id} not found (expired or stopped)` };
    const totalCaptures = state.captures.length;
    restoreIntercept(state);
    return { id, totalCaptures, captures: state.captures.slice(-INTERCEPT.GET_CAPTURES_LIMIT), restored: true };
}

function actionStopAll(): unknown {
    const count = active.size;
    clearAllIntercepts();
    return { cleared: count };
}

function actionList(): unknown {
    return [...active.values()].map(s => ({
        id: s.id,
        moduleId: s.moduleId,
        exportKey: s.exportKey,
        captures: s.captures.length,
        elapsed: Date.now() - s.startTime,
    }));
}

const INTERCEPT_ACTIONS: Record<InterceptArgs["action"], (args: InterceptArgs) => unknown> = {
    set: actionSet,
    get: actionGet,
    stop: actionStop,
    stopAll: actionStopAll,
    list: actionList,
};

export const handleIntercept = (args: InterceptArgs): unknown => dispatch(INTERCEPT_ACTIONS, args);
