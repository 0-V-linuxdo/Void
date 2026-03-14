/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByProps } from "@turbopack/turbopack";

import { GROK } from "./constants";
import type { GrokArgs } from "./types";
import { serialize } from "./utils";

function getClients() {
    const api = findByProps("rateLimitsApi", "chatApi");
    if (!api) return null;
    return { chat: api.chatApi, rateLimits: api.rateLimitsApi };
}

async function readStream(raw: Response, isNewConversation: boolean): Promise<{
    conversationId: string;
    responseId: string;
    message: string;
    thinkingTrace: string;
}> {
    const reader = (raw as any).body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let message = "";
    let thinkingTrace = "";
    let conversationId = "";
    let responseId = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const { result } = JSON.parse(line);
                if (!result) continue;
                if (result.conversation?.conversationId) conversationId = result.conversation.conversationId;
                const resp = isNewConversation ? (result.response ?? result) : result;
                if (resp.token) {
                    if (resp.isThinking) thinkingTrace += resp.token;
                    else if (!resp.messageTag || resp.messageTag === "FINAL") message += resp.token;
                }
                if (resp.responseId) responseId = resp.responseId;
            } catch { /* malformed chunk */ }
        }
    }

    return { conversationId, responseId, message, thinkingTrace };
}

async function handleSend(args: GrokArgs): Promise<unknown> {
    const { message, model, conversationId, temporary = true, reasoningMode = "none", parentResponseId } = args;
    if (!message) return { error: "Provide a message to send." };

    const clients = getClients();
    if (!clients) return { error: "API clients not available." };

    const isNew = !conversationId;
    const modelName = model || findByProps("useChatPageStore", "getLatestThreadMessageId")?.useChatPageStore.getState().activeModelId;

    const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout waiting for response")), GROK.SEND_TIMEOUT));

    try {
        let raw: any;
        if (isNew) {
            raw = await Promise.race([
                clients.chat.chatCreateConversationAndRespondRaw({
                    body: {
                        message,
                        modelName,
                        temporary,
                        isReasoning: reasoningMode === "think",
                        deepsearchPreset: reasoningMode === "deepsearch" ? "default" : undefined,
                    },
                }),
                timeoutPromise,
            ]);
        } else {
            if (!parentResponseId) return { error: "Provide parentResponseId for follow-up messages." };
            raw = await Promise.race([
                clients.chat.chatAddResponseRaw({
                    conversationId,
                    body: {
                        message,
                        parentResponseId,
                        modelName,
                        isReasoning: reasoningMode === "think",
                        deepsearchPreset: reasoningMode === "deepsearch" ? "default" : undefined,
                    },
                }),
                timeoutPromise,
            ]);
        }

        const result = await readStream(raw.raw, isNew);
        return {
            conversationId: result.conversationId || conversationId,
            responseId: result.responseId,
            model: modelName,
            message: result.message.slice(0, GROK.MAX_RESPONSE_LENGTH),
            thinkingTrace: result.thinkingTrace ? result.thinkingTrace.slice(0, GROK.MAX_THINKING_LENGTH) : undefined,
        };
    } catch (err: any) {
        return { error: err?.message ?? String(err) };
    }
}

async function handleRead(args: GrokArgs): Promise<unknown> {
    const { conversationId, responseId } = args;
    if (!conversationId && !responseId) return { error: "Provide conversationId or responseId." };

    const clients = getClients();
    if (!clients) return { error: "API clients not available." };

    const respStore = findByProps("useResponseStore", "createOptimisticResponse");

    if (responseId && respStore) {
        const cached = respStore.useResponseStore.getState().byId?.[responseId];
        if (cached) {
            return {
                responseId: cached.responseId,
                sender: cached.sender,
                model: cached.model,
                message: cached.message?.slice(0, GROK.MAX_RESPONSE_LENGTH),
                thinkingTrace: cached.thinkingTrace?.slice(0, GROK.MAX_THINKING_LENGTH) || undefined,
            };
        }
    }

    if (conversationId && responseId) {
        try {
            const data = await clients.chat.chatLoadResponses({ conversationId, body: { responseIds: [responseId] } });
            const resp = data.responses?.[0];
            if (!resp) return { error: "Response not found." };
            return {
                responseId: resp.responseId,
                sender: resp.sender,
                model: resp.model,
                message: resp.message?.slice(0, GROK.MAX_RESPONSE_LENGTH),
            };
        } catch (err: any) {
            return { error: err?.message ?? String(err) };
        }
    }

    if (conversationId && respStore) {
        const responses = respStore.useResponseStore.getState().byConversationId?.[conversationId];
        if (responses?.length) {
            return {
                conversationId,
                responses: responses.map((r: any) => ({
                    responseId: r.responseId,
                    sender: r.sender,
                    model: r.model,
                    message: r.message?.slice(0, 500),
                })),
            };
        }
    }

    return { error: "Could not load responses. Provide both conversationId and responseId for API lookup." };
}

async function handleModels(): Promise<unknown> {
    const modelsStore = findByProps("useModelsStore");
    const clients = getClients();
    if (!modelsStore || !clients) return { error: "Stores not available." };

    const { models, unavailableModels } = modelsStore.useModelsStore.getState();
    const allModels = [...(models || []), ...(unavailableModels || [])];

    const results = await Promise.all(allModels.map(async (m: any) => {
        try {
            const rl = await clients.rateLimits.rateLimitsGetRateLimits({ body: { modelName: m.modelId, requestKind: "DEFAULT" } });
            return {
                modelId: m.modelId,
                name: m.name,
                description: m.description,
                available: (models || []).some((am: any) => am.modelId === m.modelId),
                rateLimit: { remaining: rl.remainingQueries, total: rl.totalQueries, windowSeconds: rl.windowSizeSeconds },
            };
        } catch {
            return { modelId: m.modelId, name: m.name, available: (models || []).some((am: any) => am.modelId === m.modelId) };
        }
    }));

    return serialize(results, GROK.SERIALIZE_DEPTH);
}

export async function handleGrok(args: GrokArgs): Promise<unknown> {
    const { action } = args;
    if (action === "send") return handleSend(args);
    if (action === "read") return handleRead(args);
    if (action === "models") return handleModels();
    return { error: `Unknown action: ${action}`, validActions: ["send", "read", "models"] };
}
