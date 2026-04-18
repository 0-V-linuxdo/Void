/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { dispatch } from "@api/Events";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import { ChatPageStore } from "@turbopack/common/stores";
import { Logger } from "@utils/Logger";

const logger = new Logger("StreamEvents");

let started = false;

type SelectorSubscribe<S> = {
    subscribe<U>(selector: (s: S) => U, listener: (current: U, prev: U) => void): () => void;
};

export function initStreamEvents(): void {
    if (started) return;
    started = true;

    try {
        const hook = ChatPageStore.useChatPageStore as unknown as SelectorSubscribe<ChatPageStoreState>;
        hook.subscribe(
            s => s.streamedMessageId,
            (current, prev) => {
                if (!current && prev) dispatch("streamEnd", { responseId: prev });
            },
        );
    } catch (e) {
        logger.error("Failed to subscribe to ChatPageStore:", e);
    }
}
