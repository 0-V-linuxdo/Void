/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { addChatBarButton } from "@api/ChatBarButtons";
import { definePluginSettings } from "@api/Settings";
import { WandSparklesIcon } from "@components/icons";
import { Spinner } from "@turbopack/common/components";
import { createElement } from "@turbopack/common/react";
import { ApiClients, Toaster } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { getEditor, getEditorText } from "@utils/editor";
import { Logger } from "@utils/Logger";
import { errorMessage } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("PromptEnhancer");

const PLUGIN_NAME = "PromptEnhancer";

interface StreamLine {
    result?: {
        conversation?: { conversationId?: string };
        response?: { token?: string; isSoftStop?: boolean };
    };
}

const DEFAULT_INSTRUCTIONS = "Rewrite this prompt to be clearer, more specific, and more effective. Fix grammar and spelling. If something is vague, clarify it. Keep it concise, human, and to the point — no filler.";

const settings = definePluginSettings({
    customInstructions: {
        type: OptionType.STRING,
        description: "Custom instructions for how Grok should enhance your prompts.",
        default: DEFAULT_INSTRUCTIONS,
        multiline: true,
    },
});

function buildSystemPrompt(): string {
    const instructions = settings.store.customInstructions?.trim() || DEFAULT_INSTRUCTIONS;
    return `${instructions} Do NOT add any preamble, commentary, labels, or quotes. Output ONLY the rewritten prompt text and absolutely nothing else.\n\nOriginal prompt:\n`;
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
                message: buildSystemPrompt() + originalText,
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
            try {
                const obj: StreamLine = JSON.parse(line);
                if (obj.result?.conversation?.conversationId) convId = obj.result.conversation.conversationId;
                if (obj.result?.response?.token) message += obj.result.response.token;
            } catch { continue; }
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

        editor.commands.setContent(improved ?? originalText);
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
    description: "Enhance and rewrite your prompts with one click.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings,

    chatBarButton: {
        icon: () => WandSparklesIcon({ size: 18 }),
        tooltip: "Enhance prompt",
        onClick: enhance,
        order: 100,
        className: "text-fg-primary",
    },
});
