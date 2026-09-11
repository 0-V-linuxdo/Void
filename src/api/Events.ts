/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { mapGetOrCreate } from "@utils/misc";

export interface VoidPPEventMap {
    pluginToggle: void;
    pluginPin: void;
    pluginStar: void;
    reloadNeeded: void;
    streamEnd: { responseId: string };
}

export type VoidPPEvent = keyof VoidPPEventMap;

const logger = new Logger("Events");

type Handler = (data: unknown) => void;

const listeners = new Map<VoidPPEvent, Set<Handler>>();

export function subscribe<E extends VoidPPEvent>(event: E, handler: (data: VoidPPEventMap[E]) => void): () => void {
    const set = mapGetOrCreate(listeners, event, () => new Set<Handler>());
    set.add(handler as Handler);
    return () => {
        set.delete(handler as Handler);
        if (!set.size) listeners.delete(event);
    };
}

export function dispatch<E extends VoidPPEvent>(event: E, ...args: VoidPPEventMap[E] extends void ? [] : [data: VoidPPEventMap[E]]): void {
    const set = listeners.get(event);
    if (!set?.size) return;
    const data = args[0];
    for (const handler of Array.from(set)) {
        try { handler(data); } catch (e) { logger.error(`Event handler error (${event}):`, e); }
    }
}
