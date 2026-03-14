/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ReasoningMode, RequestKind } from "@grok-types/enums";

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

export const ReasoningModeUtils: {
    reasoningModeToRequestKind: (mode: ReasoningMode) => RequestKind;
    reasoningModeToDeepsearchPreset: (mode: ReasoningMode) => string | undefined;
} = findByPropsLazy("reasoningModeToRequestKind", "reasoningModeToDeepsearchPreset");

export const zustandCreate: {
    <T>(initializer: (set: any, get: any, api: any) => T): any;
} = findByPropsLazy("create", "useStore");

export const i18n: {
    useTranslation: (namespace?: string) => { t: (key: string, values?: Record<string, any>) => string };
} = findByPropsLazy("useTranslation");

export const EnvUtils: {
    getEnv: (key: string) => string | undefined;
    useEnvironment: () => Record<string, string>;
} = findByPropsLazy("getEnv", "useEnvironment");

export const AssetUtils: {
    getAssetUrl: (assetServerUrl: string, key: string) => string | undefined;
    getCachedAssetUrl: (assetServerUrl: string, key: string) => string | undefined;
    getAssetKeyFromAssetUrl: (url: string) => string;
} = findByPropsLazy("getCachedAssetUrl", "getAssetUrl");

export const DownloadUtils: {
    downloadImage: (url: string, filename?: string, noCors?: boolean) => Promise<void>;
} = findByPropsLazy("downloadImage");

export const FileUtils: {
    downloadBlob: (blob: Blob, filename: string) => Promise<void>;
    downloadUri: (url: string, filename: string) => Promise<void>;
} = findByPropsLazy("downloadBlob", "downloadUri");

export const RateLimitUtils: {
    useRateLimits: () => {
        remainingQueries: number;
        totalQueries: number;
        waitTimeSeconds: number;
        windowSizeSeconds: number;
        prettyWaitTime: string;
        prettyWindowSize: string;
        isPending: boolean;
    };
} = findByPropsLazy("useRateLimits");

export const NextRouter: {
    useRouter: () => { push: (url: string, options?: any) => void; replace: (url: string, options?: any) => void; back: () => void; forward: () => void; refresh: () => void; prefetch: (url: string) => void };
    usePathname: () => string;
    useSearchParams: () => URLSearchParams;
    useParams: () => Record<string, string | string[]>;
    redirect: (url: string, type?: string) => never;
    notFound: () => never;
} = findByPropsLazy("useRouter", "usePathname");

export const TanStackQuery: {
    useQuery: <T = unknown>(options: { queryKey: any[]; queryFn: () => Promise<T>; enabled?: boolean; refetchInterval?: number; staleTime?: number; gcTime?: number; retry?: boolean | number; refetchOnWindowFocus?: boolean; placeholderData?: T | ((prev: T | undefined) => T | undefined) }) => { data: T | undefined; error: Error | null; isPending: boolean; isError: boolean; isSuccess: boolean; refetch: () => Promise<any> };
} = findByPropsLazy("useQuery", "useInfiniteQuery");

export const CopyUtils: {
    copyAndToast: (text: string, successMessage?: string) => void;
} = findByPropsLazy("copyAndToast");

export const MonacoModule: {
    initMonaco(): Promise<void>;
    monacoInstance: any;
} = findByPropsLazy("initMonaco");
