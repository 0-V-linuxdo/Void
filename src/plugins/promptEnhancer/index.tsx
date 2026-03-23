/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addChatBarButton } from "@api/ChatBarButtons";
import { WandSparklesIcon } from "@components/icons";
import { Spinner } from "@turbopack/common/components";
import { createElement } from "@turbopack/common/react";
import { ApiClients, Toaster } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { errorMessage } from "@utils/misc";
import definePlugin from "@utils/types";

const logger = new Logger("PromptEnhancer");

const PLUGIN_NAME = "PromptEnhancer";

interface TiptapEditor {
    commands: { setContent(content: string): void; focus(): void };
}

interface StreamLine {
    result?: {
        conversation?: { conversationId?: string };
        response?: { token?: string; isSoftStop?: boolean };
    };
}

const ENHANCE_PROMPT = `Rewrite this prompt to be clearer, more specific, and more effective. Fix grammar and spelling. If something is vague, clarify it. Keep it concise, human, and to the point — no filler. Do NOT add any preamble, commentary, labels, or quotes. Output ONLY the rewritten prompt text and absolutely nothing else.

Original prompt:
`;

function getEditor(): TiptapEditor | null {
    return (document.querySelector(".ProseMirror") as HTMLElement & { editor?: TiptapEditor })?.editor ?? null;
}

function getEditorText(): string {
    return document.querySelector(".ProseMirror")?.textContent?.trim() ?? "";
}

function updateButton(loading: boolean) {
    addChatBarButton(PLUGIN_NAME, {
        icon: () => loading
            ? createElement(Spinner, { size: "xs" })
            : WandSparklesIcon({ size: 18 }),
        tooltip: "Enhance prompt",
        onClick: enhance,
    });
}

let _enhancing = false;

async function enhance() {
    if (_enhancing) return;

    const originalText = getEditorText();
    if (!originalText) {
        Toaster.toast.error("Type a prompt first.");
        return;
    }

    _enhancing = true;
    updateButton(true);

    try {
        const response = await ApiClients.chatApi.request({
            path: "/rest/app-chat/conversations/new",
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: {
                message: ENHANCE_PROMPT + originalText,
                temporary: true,
                disableSearch: true,
                disableMemory: true,
                forceConcise: true,
            },
        });

        const text = await response.text();
        const lines = text.split("\n").filter((l: string) => l.trim());

        let convId = "";
        let message = "";
        for (const line of lines) {
            const obj: StreamLine = JSON.parse(line);
            if (obj.result?.conversation?.conversationId) convId = obj.result.conversation.conversationId;
            if (obj.result?.response?.token) message += obj.result.response.token;
        }

        const improved = message.trim();

        if (convId) {
            ApiClients.chatApi.chatSoftDeleteConversation({ conversationId: convId })
                .catch((e: unknown) => logger.warn("Failed to delete throwaway conversation:", e));
        }

        const editor = getEditor();
        if (!editor) {
            Toaster.toast.error("Editor not found.");
            return;
        }

        editor.commands.setContent(improved || originalText);
        editor.commands.focus();

        if (improved) Toaster.toast.success("Prompt enhanced!");
        else Toaster.toast.error("Got empty response, restored original.");
    } catch (err: unknown) {
        Toaster.toast.error(`Enhancement failed: ${errorMessage(err)}`);
    } finally {
        _enhancing = false;
        updateButton(false);
    }
}

export default definePlugin({
    name: PLUGIN_NAME,
    description: "Sends your prompt to Grok for improvement, then replaces it with the enhanced version.",
    authors: [Devs.Prism],
    tags: ["chat"],

    chatBarButton: {
        icon: () => WandSparklesIcon({ size: 18 }),
        tooltip: "Enhance prompt",
        onClick: enhance,
    },
});
