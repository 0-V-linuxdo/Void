/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { GrokResponse, RateLimitResponse } from "@grok-types";

import { findByPropsLazy } from "../turbopack";

export const ApiClients: {
    chatApi: {
        chatListResponses(a: { conversationId: string }): Promise<{ responses: GrokResponse[] }>;
        chatShareConversation(a: { conversationId: string; body: { responseId: string; allowIndexing: boolean } }): Promise<{ shareLinkId: string }>;
        chatCloneConversation(a: { shareLinkId: string; body: object }): Promise<{ conversation?: { conversationId: string } }>;
        chatDeleteShareLink(a: { shareLinkId: string }): Promise<unknown>;
    };
    rateLimitsApi: { rateLimitsGetRateLimits(a: { body: { modelName: string } }): Promise<RateLimitResponse> };
} = findByPropsLazy("chatApi", "modelsApi");

export const Toaster: {
    Toaster: import("react").ComponentType;
    toast: import("@grok-types").ToastFn;
} = findByPropsLazy("Toaster", "toast");

export const ClassNames: {
    cn: (...inputs: unknown[]) => string;
    middleTruncate: (text: string, maxLength: number) => string;
} = findByPropsLazy("cn", "middleTruncate");

export const FileUtils: {
    downloadBlob: (blob: Blob, filename: string) => Promise<void>;
} = findByPropsLazy("downloadBlob");
