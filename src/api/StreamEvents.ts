/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { dispatch } from "@api/Events";
import type { ChatPageStoreModule, GatewayNodeStatus, MessageStoreModule, MessageStoreState } from "@grok-types/stores";
import { filters, waitFor } from "@turbopack/turbopack";

let started = false;

const GATEWAY_LIVE = new Set<GatewayNodeStatus>(["send-queued", "send-sent", "streaming"]);

function onGatewayChange(state: MessageStoreState, prev: MessageStoreState) {
    for (const [cid, conv] of Object.entries(state.conversations)) {
        const old = prev.conversations[cid];
        if (!old || old === conv) continue;
        for (const [id, node] of Object.entries(conv.nodes)) {
            const before = old.nodes[id];
            if (node === before || node.role !== "assistant" || node.status !== "complete") continue;
            if (before && GATEWAY_LIVE.has(before.status)) dispatch("streamEnd", { responseId: id });
        }
    }
}

export function initStreamEvents(): void {
    if (started) return;
    started = true;

    waitFor<ChatPageStoreModule>(filters.byProps("useChatPageStore"), mod => {
        mod.useChatPageStore.subscribe((state, prev) => {
            const current = state.streamedMessageId;
            const previous = prev?.streamedMessageId;
            if (!current && previous) dispatch("streamEnd", { responseId: previous });
        });
    });

    waitFor<MessageStoreModule>(filters.byProps("useMessageStore", "nodeToResponse"), mod => {
        mod.useMessageStore.subscribe(onGatewayChange);
    });
}
