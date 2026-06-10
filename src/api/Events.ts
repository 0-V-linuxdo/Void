/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { mapGetOrCreate } from "@utils/misc";

export interface VoidEventMap {
    pluginToggle: void;
    reloadNeeded: void;
    streamEnd: { responseId: string };
}

export type VoidEvent = keyof VoidEventMap | (string & {});

const logger = new Logger("Events");

type Handler = (data: unknown) => void;

const listeners = new Map<string, Set<Handler>>();

export function subscribe<E extends keyof VoidEventMap>(event: E, handler: (data: VoidEventMap[E]) => void): () => void;
export function subscribe(event: VoidEvent, handler: (data: unknown) => void): () => void;
export function subscribe(event: VoidEvent, handler: (data: unknown) => void): () => void {
    const set = mapGetOrCreate(listeners, event, () => new Set());
    set.add(handler);
    return () => {
        set.delete(handler);
        if (!set.size) listeners.delete(event);
    };
}

export function dispatch<E extends keyof VoidEventMap>(event: E, ...args: VoidEventMap[E] extends void ? [] : [data: VoidEventMap[E]]): void;
export function dispatch(event: VoidEvent, data?: unknown): void;
export function dispatch(event: VoidEvent, data?: unknown) {
    const set = listeners.get(event);
    if (!set?.size) return;
    for (const handler of Array.from(set)) {
        try { handler(data); } catch (e) { logger.error(`Event handler error (${event}):`, e); }
    }
}
