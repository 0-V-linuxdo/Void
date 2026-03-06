/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";

/** Known event names dispatched within Void. Extensible via `(string & {})`. */
export type VoidEvent = "pluginToggle" | (string & {});

const logger = new Logger("Events");

type Handler = (data: any) => void;

const listeners = new Map<string, Set<Handler>>();

export function subscribe(event: VoidEvent, handler: Handler): () => void {
    let set = listeners.get(event);
    if (!set) {
        set = new Set();
        listeners.set(event, set);
    }
    set.add(handler);
    return () => {
        set.delete(handler);
    };
}

export function dispatch(event: VoidEvent, data?: any) {
    const set = listeners.get(event);
    if (!set?.size) return;
    for (const handler of [...set]) {
        try { handler(data); } catch (e) { logger.error(`Event handler error (${event}):`, e); }
    }
}
