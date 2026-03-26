/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy } from "../turbopack";

export const ApiClients: {
    chatApi: any;
    modelsApi: any;
    mediaApi: any;
    settingsApi: any;
    subscriptionsApi: any;
    rateLimitsApi: any;
    grokTasksApi: any;
    notificationsApi: any;
    highlightsApi: any;
    voiceApi: any;
    livekitApi: any;
    githubApi: any;
    assetRepositoryApi: any;
    workspaceRepositoryApi: any;
    systemPromptRepositoryApi: any;
    sandboxEnvironmentsApi: any;
    authFrontendApi: any;
    authMgmtApi: any;
    devConfigApi: any;
    grokForTeamsApi: any;
    suggestionsApi: any;
} = findByPropsLazy("chatApi", "modelsApi");

export const Toaster: {
    Toaster: import("react").ComponentType;
    toast: import("@grok-types").ToastFn;
} = findByPropsLazy("Toaster", "toast");

export const ClassNames: {
    cn: (...inputs: any[]) => string;
    middleTruncate: (text: string, maxLength: number) => string;
} = findByPropsLazy("cn", "middleTruncate");

export const FileUtils: {
    downloadBlob: (blob: Blob, filename: string) => Promise<void>;
    downloadUri: (url: string, filename: string) => Promise<void>;
} = findByPropsLazy("downloadBlob", "downloadUri");
