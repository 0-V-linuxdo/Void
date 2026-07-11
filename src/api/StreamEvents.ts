/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { dispatch } from "@api/Events";
import type { ChatPageStoreModule } from "@grok-types/stores";
import { filters, waitFor } from "@turbopack/turbopack";

let started = false;

export function initStreamEvents(): void {
    if (started) return;
    started = true;

    waitFor<ChatPageStoreModule>(filters.byProps("useChatPageStore"), mod => {
        mod.useChatPageStore.subscribe(
            s => s.streamedMessageId,
            (current, prev) => {
                if (!current && prev) dispatch("streamEnd", { responseId: prev });
            },
        );
    });
}
