/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoidEventMap } from "@api/Events";
import { showToast, ToastType } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import type { GrokResponse } from "@grok-types";
import { ChatPageStore, ResponseStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const logger = new Logger("AutoRetry");

const CONTENT_MODERATED = "grok:content-moderated";

const settings = definePluginSettings({
    retryModeration: {
        type: OptionType.BOOLEAN,
        description: "Retry content moderation errors.",
        default: true,
    },
    retryNetwork: {
        type: OptionType.BOOLEAN,
        description: "Retry network and stream errors.",
        default: true,
    },
    maxRetries: {
        type: OptionType.NUMBER,
        description: "Maximum consecutive retries per conversation.",
        default: 3,
    },
    delay: {
        type: OptionType.NUMBER,
        description: "Seconds to wait before retrying.",
        default: 2,
    },
});

const retryCounts = new Map<string, number>();
let pendingTimer: ReturnType<typeof setTimeout> | null = null;

function clearPending() {
    if (pendingTimer != null) {
        clearTimeout(pendingTimer);
        pendingTimer = null;
    }
}

function isModeration(response: GrokResponse): boolean {
    return String(response.error?.message ?? "").includes(CONTENT_MODERATED);
}

function shouldRetry(response: GrokResponse): boolean {
    if (isModeration(response)) return settings.store.retryModeration;
    return settings.store.retryNetwork;
}

function retry(responseId: string, conversationId: string, response: GrokResponse) {
    const count = (retryCounts.get(conversationId) ?? 0) + 1;
    const max = settings.store.maxRetries ?? 3;

    if (count > max) {
        showToast("Max retries reached.", ToastType.ERROR);
        retryCounts.delete(conversationId);
        return;
    }

    retryCounts.set(conversationId, count);
    const delaySec = settings.store.delay ?? 2;

    showToast(`Retrying... (${count}/${max})`, ToastType.MESSAGE);
    logger.info(`Retry ${count}/${max} for ${conversationId} in ${delaySec}s`);

    clearPending();
    pendingTimer = setTimeout(() => {
        pendingTimer = null;
        const state = ChatPageStore.useChatPageStore.getState();
        if (state.streamedMessageId) return;

        state.sendResponse({
            message: "",
            parentResponseId: responseId,
            conversationId,
            fileAttachmentIds: response.fileAttachments,
            setOpimisticUserResponse: false,
            setUserResponse: false,
            enableRetries: true,
        });
    }, delaySec * 1000);
}

function onStreamEnd({ responseId }: VoidEventMap["streamEnd"]) {
    const response = ResponseStore.useResponseStore.getState().byId[responseId];
    if (!response || response.state !== "error") {
        const convId = ChatPageStore.useChatPageStore.getState().conversationId;
        if (convId) retryCounts.delete(convId);
        return;
    }

    if (!shouldRetry(response)) return;

    const { conversationId } = ChatPageStore.useChatPageStore.getState();
    if (!conversationId) return;

    retry(responseId, conversationId, response);
}

export default definePlugin({
    name: "AutoRetry",
    description: "Automatically retry failed messages on moderation or network errors.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings,
    startAt: StartAt.TurbopackReady,

    start() {
        retryCounts.clear();
        clearPending();
    },

    stop() {
        clearPending();
        retryCounts.clear();
    },

    events: {
        streamEnd: onStreamEnd,
    },
});
