/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ContextMenuLocationMap } from "@api/ContextMenus";
import { DropdownMenuItem } from "@components";
import type { GrokConversation, GrokResponse } from "@grok-types";
import { ApiClients, FileUtils } from "@turbopack/common";
import { React } from "@turbopack/common/react";
import { ConversationStore } from "@turbopack/common/stores";
import { findExportedComponentLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { sanitizeFilename } from "@utils/misc";
import definePlugin from "@utils/types";

const DownloadIcon = findExportedComponentLazy("DownloadIcon");

function buildExportMessage(r: GrokResponse) {
    return {
        id: r.responseId,
        sender: r.sender,
        message: r.message,
        query: r.query,
        createTime: r.createTime,
        model: r.requestMetadata?.model ?? r.model,
        ...(r.thinkingTrace && { thinkingTrace: r.thinkingTrace }),
        ...(r.webSearchResults?.length && { webSearchResults: r.webSearchResults }),
        ...(r.generatedImageUrls?.length && { generatedImageUrls: r.generatedImageUrls }),
        ...(r.fileAttachments?.length && { fileAttachments: r.fileAttachments }),
        ...(r.steps?.length && { steps: r.steps }),
    };
}

async function exportChat(conversationId: string) {
    const { responses } = await ApiClients.chatApi.chatListResponses({ conversationId }) ?? {};
    if (!responses?.length) return;

    const conversation: GrokConversation | undefined = ConversationStore.useConversationStore.getState().byId[conversationId];
    const title = conversation?.title ?? "Untitled Chat";

    await FileUtils.downloadBlob(
        new Blob([JSON.stringify({ conversationId, title, exportedAt: new Date().toISOString(), messages: responses.map(buildExportMessage) }, null, 2)], { type: "application/json" }),
        `${sanitizeFilename(title, "chat")}.json`,
    );
}

function ExportItem({ conversationId }: ContextMenuLocationMap["conversation"]) {
    return (
        <DropdownMenuItem onSelect={() => exportChat(conversationId)}>
            <DownloadIcon size={16} className="me-2" />
            Export
        </DropdownMenuItem>
    );
}

export default definePlugin({
    name: "ExportChat",
    description: "Export conversations as JSON from the right-click menu.",
    authors: [Devs.Prism],

    contextMenuItems: {
        conversation: {
            label: "Export",
            render: ExportItem,
        },
    },
});
