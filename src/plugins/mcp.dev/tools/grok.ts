/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatPageStore, ModelsStore, ResponseStore, RoutingStore } from "@turbopack/common/stores";
import { ApiClients } from "@turbopack/common/utils";

import { GROK } from "./constants";
import type { GrokArgs } from "./types";
import { serialize } from "./utils";

function getEditor(): any {
    return (document.querySelector(".ProseMirror") as any)?.editor ?? null;
}

function getCurrentConversationId(): string | undefined {
    return RoutingStore.useRoutingStore.getState().route?.conversationId ?? undefined;
}

function clickInternalLink(path: string): boolean {
    const link = document.querySelector(`a[href="${path}"]`) as HTMLElement | null;
    if (link) {
        link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
        return true;
    }

    const fallback = document.querySelector('a[href*="/c/"]') ?? document.querySelector('a[href="/"]');
    if (!fallback) return false;

    const orig = fallback.getAttribute("href")!;
    fallback.setAttribute("href", path);
    fallback.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    fallback.setAttribute("href", orig);
    return true;
}

async function navigateToChat(conversationId?: string): Promise<void> {
    const currentConvId = getCurrentConversationId();

    if (conversationId) {
        if (currentConvId === conversationId) return;
    } else {
        if (!currentConvId) return;
    }

    const target = conversationId ? `/c/${conversationId}` : "/";
    if (!clickInternalLink(target)) return;
    await new Promise(r => setTimeout(r, 500));
}

function waitForEditor(timeoutMs = 5000): Promise<any> {
    const editor = getEditor();
    if (editor) return Promise.resolve(editor);

    return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
            const ed = getEditor();
            if (ed) {
                clearInterval(interval);
                resolve(ed);
            } else if (Date.now() - start > timeoutMs) {
                clearInterval(interval);
                reject(new Error("Editor not ready"));
            }
        }, 200);
    });
}

function submitEditor() {
    const pm = document.querySelector(".ProseMirror");
    if (!pm) throw new Error("ProseMirror element not found");
    pm.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true, cancelable: true }));
}

function findLatestAssistantResponse(responses: any[], afterIndex: number): any | null {
    for (let i = responses.length - 1; i > afterIndex; i--) {
        const r = responses[i];
        if (r.sender === "assistant" && !r.responseId?.startsWith("optimistic_")) return r;
    }
    return null;
}

function waitForResponse(conversationId: string | undefined, beforeCount: number, timeoutMs: number): Promise<{ conversationId: string; responseId: string; message: string; thinkingTrace?: string }> {
    return new Promise((resolve, reject) => {
        const state = { done: false };

        const timer = setTimeout(() => {
            if (state.done) return;
            state.done = true;
            unsub();
            reject(new Error("Timeout waiting for response"));
        }, timeoutMs);

        const finish = (result: { conversationId: string; responseId: string; message: string; thinkingTrace?: string }) => {
            state.done = true;
            clearTimeout(timer);
            unsub();
            resolve(result);
        };

        const fail = (error: string) => {
            state.done = true;
            clearTimeout(timer);
            unsub();
            reject(new Error(error));
        };

        const check = () => {
            if (state.done) return;

            const convId = conversationId || ChatPageStore.useChatPageStore.getState().conversationId;
            if (!convId) return;

            const { isRateLimited, isUnauthenticated } = ChatPageStore.useChatPageStore.getState();
            if (isRateLimited) return fail(typeof isRateLimited === "string" ? isRateLimited : "Rate limited");
            if (isUnauthenticated) return fail("Authentication required");

            const responses = ResponseStore.useResponseStore.getState().byConversationId?.[convId] as any[] | undefined;
            if (!responses || responses.length <= beforeCount) return;

            const lastResp = findLatestAssistantResponse(responses, beforeCount - 1);
            if (!lastResp || lastResp.state === "streaming" || lastResp.partial) return;

            finish({
                conversationId: convId,
                responseId: lastResp.responseId,
                message: (lastResp.message || "").slice(0, GROK.MAX_RESPONSE_LENGTH),
                thinkingTrace: lastResp.thinkingTrace ? lastResp.thinkingTrace.slice(0, GROK.MAX_THINKING_LENGTH) : undefined,
            });
        };

        const unsub = ResponseStore.useResponseStore.subscribe(check);
        check();
    });
}

async function handleSend(args: GrokArgs): Promise<unknown> {
    const { message, model, conversationId, reasoningMode = "none" } = args;
    if (!message) return { error: "Provide a message to send." };

    try {
        if (conversationId) {
            await navigateToChat(conversationId);
        } else if (getCurrentConversationId()) {
            await navigateToChat();
        }

        const chatPageState = ChatPageStore.useChatPageStore.getState();

        if (chatPageState.isRateLimited) return { error: typeof chatPageState.isRateLimited === "string" ? chatPageState.isRateLimited : "Rate limited" };
        if (chatPageState.isUnauthenticated) return { error: "Authentication required" };

        if (model) chatPageState.setActiveModelId(model);
        if (reasoningMode === "think") chatPageState.setReasoningMode("think");
        else if (reasoningMode === "deepsearch") chatPageState.setReasoningMode("deepsearch");

        const editor = await waitForEditor();

        const convId = conversationId || chatPageState.conversationId;
        const beforeCount = convId ? (ResponseStore.useResponseStore.getState().byConversationId?.[convId]?.length ?? 0) : 0;

        editor.commands.setContent(message);
        editor.commands.focus();
        await new Promise(r => setTimeout(r, 100));
        submitEditor();

        const result = await waitForResponse(convId, beforeCount, GROK.SEND_TIMEOUT);
        return {
            conversationId: result.conversationId,
            responseId: result.responseId,
            model: model || chatPageState.activeModelId,
            message: result.message,
            thinkingTrace: result.thinkingTrace,
        };
    } catch (err: any) {
        return { error: err?.message ?? String(err) };
    }
}

function formatResponse(r: any, maxLength = GROK.MAX_RESPONSE_LENGTH) {
    return {
        responseId: r.responseId,
        sender: r.sender,
        model: r.model,
        message: r.message?.slice(0, maxLength),
        thinkingTrace: r.thinkingTrace?.slice(0, GROK.MAX_THINKING_LENGTH) || undefined,
        state: r.state,
        ...(r.partial && { partial: true }),
        ...(r.createTime && { createdAt: r.createTime }),
    };
}

function isRealResponse(r: any): boolean {
    return r.responseId && !r.responseId.startsWith("optimistic_");
}

async function handleRead(args: GrokArgs): Promise<unknown> {
    const { conversationId, responseId } = args;
    if (!conversationId && !responseId) return { error: "Provide conversationId or responseId." };

    if (responseId) {
        const cached = ResponseStore.useResponseStore.getState().byId?.[responseId];
        if (cached) return formatResponse(cached);
    }

    if (conversationId && responseId) {
        try {
            const data = await ApiClients.chatApi.chatLoadResponses({ conversationId, body: { responseIds: [responseId] } });
            const resp = data.responses?.[0];
            if (!resp) return { error: "Response not found." };
            return formatResponse(resp);
        } catch (err: any) {
            return { error: err?.message ?? String(err) };
        }
    }

    if (!conversationId) return { error: "Provide conversationId to list responses or get latest." };

    const responses = ResponseStore.useResponseStore.getState().byConversationId?.[conversationId] as any[] | undefined;
    if (!responses?.length) return { error: "No responses found. Is the conversation loaded?" };

    const real = responses.filter(isRealResponse);

    const latest = findLatestAssistantResponse(real, -1);

    return {
        conversationId,
        latest: latest ? formatResponse(latest) : undefined,
        responses: real.map((r: any) => ({
            responseId: r.responseId,
            sender: r.sender,
            model: r.model,
            message: r.message?.slice(0, 500),
        })),
    };
}

async function handleModels(): Promise<unknown> {
    const { models, unavailableModels } = ModelsStore.useModelsStore.getState();
    const allModels = [...(models || []), ...(unavailableModels || [])];

    const results = await Promise.all(allModels.map(async (m: any) => {
        try {
            const rl = await ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: m.modelId, requestKind: "DEFAULT" } });
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
