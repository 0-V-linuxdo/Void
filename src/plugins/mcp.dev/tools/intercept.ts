/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getModuleCache } from "@turbopack/patchTurbopack";
import { Logger } from "@utils/Logger";

import { INTERCEPT } from "./constants";
import type { Capture, InterceptArgs, InterceptState } from "./types";
import { clamp, errorMessage, serialize } from "./utils";

const logger = new Logger("MCP:Intercept");

const INTERCEPT_ACTIONS = ["set", "get", "stop", "list"] as const;
let nextId = 1;
const active = new Map<number, InterceptState>();

function restoreIntercept(state: InterceptState) {
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

export function handleIntercept(args: InterceptArgs): unknown {
    const { action } = args;

    if (action === "set") {
        const { moduleId, exportKey = "default" } = args;
        if (moduleId == null) return { error: "Provide moduleId" };

        const exports = getModuleCache().get(Number(moduleId));
        if (!exports || typeof exports !== "object") return { error: `Module ${moduleId} not found or not an object` };

        const parts = exportKey.split(".");
        let holder = exports as Record<string, unknown>;
        for (let i = 0; i < parts.length - 1; i++) {
            const next = holder[parts[i]];
            if (next == null || typeof next !== "object") return { error: `Path ${parts.slice(0, i + 1).join(".")} not found` };
            holder = next as Record<string, unknown>;
        }

        const finalKey = parts[parts.length - 1];
        const original = holder[finalKey];
        if (typeof original !== "function") return { error: `${exportKey} is not a function (${typeof original})` };

        for (const existing of active.values()) {
            if (existing.moduleId === Number(moduleId) && existing.finalKey === finalKey) {
                return { error: `Intercept already active on module ${moduleId}.${exportKey} (id: ${existing.id}). Stop it first with stop action.` };
            }
        }

        const rawDuration = Number(args.duration);
        const duration = clamp(Number.isFinite(rawDuration) ? rawDuration : INTERCEPT.DEFAULT_DURATION, INTERCEPT.MIN_DURATION, INTERCEPT.MAX_DURATION);
        const rawCaptures = Number(args.maxCaptures);
        const maxCaptures = Math.min(Number.isFinite(rawCaptures) && rawCaptures > 0 ? rawCaptures : INTERCEPT.DEFAULT_CAPTURES, INTERCEPT.MAX_CAPTURES);
        const id = nextId++;

        const state: InterceptState = {
            id,
            moduleId: Number(moduleId),
            exportKey,
            finalKey,
            captures: [],
            startTime: Date.now(),
            original,
            holder,
            timer: setTimeout(() => restoreIntercept(state), duration),
        };

        const wrapper = function (this: unknown, ...callArgs: unknown[]) {
            const elapsed = Date.now() - state.startTime;
            const callStart = performance.now();
            try {
                const ret = original.apply(this, callArgs);
                const d = Math.round((performance.now() - callStart) * 100) / 100;
                if (state.captures.length < maxCaptures) {
                    if (ret != null && typeof (ret as Promise<unknown>).then === "function") {
                        const capture: Capture = { t: elapsed, d, args: serialize(callArgs, INTERCEPT.SERIALIZE_DEPTH), ret: "[Promise:pending]" };
                        state.captures.push(capture);
                        (ret as Promise<unknown>).then(
                            v => { capture.ret = serialize(v, INTERCEPT.SERIALIZE_DEPTH); },
                            e => { capture.ret = null; capture.err = errorMessage(e); },
                        );
                    } else {
                        state.captures.push({ t: elapsed, d, args: serialize(callArgs, INTERCEPT.SERIALIZE_DEPTH), ret: serialize(ret, INTERCEPT.SERIALIZE_DEPTH) });
                    }
                }
                return ret;
            } catch (err: unknown) {
                if (state.captures.length < maxCaptures) {
                    state.captures.push({ t: elapsed, d: Math.round((performance.now() - callStart) * 100) / 100, args: serialize(callArgs, INTERCEPT.SERIALIZE_DEPTH), ret: null, err: errorMessage(err) });
                }
                throw err;
            }
        };
        Object.defineProperties(wrapper, {
            length: { value: original.length, configurable: true },
            name: { value: original.name, configurable: true },
            toString: { value: () => String(original), configurable: true },
        });
        for (const prop of Object.getOwnPropertyNames(original)) {
            if (prop === "length" || prop === "name" || prop === "prototype" || prop === "arguments" || prop === "caller") continue;
            try {
                Object.defineProperty(wrapper, prop, Object.getOwnPropertyDescriptor(original, prop)!);
            } catch {}
        }
        try {
            Object.defineProperty(holder, finalKey, { value: wrapper, writable: true, configurable: true });
        } catch {
            return { error: `Cannot intercept non-configurable property "${exportKey}"` };
        }

        active.set(id, state);
        return { id, moduleId: state.moduleId, exportKey, duration, maxCaptures, fnName: original.name ?? null };
    }

    if (action === "get") {
        const { id } = args;
        if (id == null) return { error: "Provide intercept id" };
        const state = active.get(id);
        if (!state) return { error: `Intercept ${id} not found (expired or stopped)` };
        return {
            id: state.id,
            moduleId: state.moduleId,
            exportKey: state.exportKey,
            elapsed: Date.now() - state.startTime,
            captures: state.captures.length > INTERCEPT.GET_CAPTURES_LIMIT ? state.captures.slice(-INTERCEPT.GET_CAPTURES_LIMIT) : state.captures,
            ...(state.captures.length > INTERCEPT.GET_CAPTURES_LIMIT && { totalCaptures: state.captures.length, hint: `Showing last ${INTERCEPT.GET_CAPTURES_LIMIT} captures. Use stop to get final count.` }),
        };
    }

    if (action === "stop") {
        const { id } = args;
        if (id == null) return { error: "Provide intercept id" };
        const state = active.get(id);
        if (!state) return { error: `Intercept ${id} not found (expired or stopped)` };
        const captureCount = state.captures.length;
        restoreIntercept(state);
        return { id, captures: captureCount, restored: true };
    }

    if (action === "list") {
        return [...active.values()].map(s => ({
            id: s.id,
            moduleId: s.moduleId,
            exportKey: s.exportKey,
            captures: s.captures.length,
            elapsed: Date.now() - s.startTime,
        }));
    }

    return { error: `Unknown action: ${action}`, validActions: INTERCEPT_ACTIONS };
}
