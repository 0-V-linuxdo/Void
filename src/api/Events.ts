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

export type VoidEvent = keyof VoidEventMap;

const logger = new Logger("Events");

type Handler = (data: unknown) => void;

const listeners = new Map<VoidEvent, Set<Handler>>();

export function subscribe<E extends VoidEvent>(event: E, handler: (data: VoidEventMap[E]) => void): () => void {
    const set = mapGetOrCreate(listeners, event, () => new Set<Handler>());
    set.add(handler as Handler);
    return () => {
        set.delete(handler as Handler);
        if (!set.size) listeners.delete(event);
    };
}

export function dispatch<E extends VoidEvent>(event: E, ...args: VoidEventMap[E] extends void ? [] : [data: VoidEventMap[E]]): void {
    const set = listeners.get(event);
    if (!set?.size) return;
    const data = args[0];
    for (const handler of Array.from(set)) {
        try { handler(data); } catch (e) { logger.error(`Event handler error (${event}):`, e); }
    }
}
