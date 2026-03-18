/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { showToast, ToastType } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Chip } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import type { RateLimitResponse } from "@grok-types/common/RateLimit";
import type { ModelConfigModelMode, RequestKind } from "@grok-types/enums";
import { Tooltip, TooltipContent, TooltipTrigger } from "@turbopack/common/components";
import { React } from "@turbopack/common/react";
import { ApiClients } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore, sendBrowserNotification } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const cl = classNameFactory("void-query-tracker-");
const logger = new Logger("QueryTracker");

const settings = definePluginSettings({
    toastNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show a toast when model quotas or availability change.",
        default: true,
    },
    browserNotifications: {
        type: OptionType.BOOLEAN,
        description: "Show a browser notification when model quotas or availability change.",
        default: true,
    },
});

function notify(message: string) {
    if (settings.store.toastNotifications) showToast(message, ToastType.INFO);
    if (settings.store.browserNotifications) sendBrowserNotification("Grok Query Tracker", message);
}

interface ModelSnapshot {
    modelId: string;
    name: string;
    description?: string;
    modelMode?: ModelConfigModelMode;
    promptingBackend?: string;
    tags?: string[];
}

interface ModelQuota {
    totalQueries: number;
    totalTokens?: number;
    windowSizeSeconds: number;
    lowEffortQueries?: number;
    highEffortQueries?: number;
}

interface TrackedModel {
    model: ModelSnapshot;
    quota: ModelQuota | null;
}

const STORAGE_KEY = "void-query-tracker";
const REFETCH_COOLDOWN = 5 * 60_000;

let trackedModels: Record<string, TrackedModel> = {};
let lastFetchTime = 0;
const store = createExternalStore();

function formatWindow(seconds: number): string {
    const hours = seconds / 3600;
    if (hours >= 1) return `${hours}h`;
    return `${Math.round(seconds / 60)}m`;
}

function getEffectiveQueries(quota: ModelQuota): number {
    if (quota.totalTokens && quota.highEffortQueries) return quota.highEffortQueries;
    return quota.totalQueries;
}

function parseQuota(res: RateLimitResponse): ModelQuota {
    return {
        totalQueries: res.totalQueries,
        totalTokens: res.totalTokens,
        windowSizeSeconds: res.windowSizeSeconds,
        lowEffortQueries: res.lowEffortRateLimits && res.totalTokens
            ? Math.floor(res.totalTokens / res.lowEffortRateLimits.cost)
            : undefined,
        highEffortQueries: res.highEffortRateLimits && res.totalTokens
            ? Math.floor(res.totalTokens / res.highEffortRateLimits.cost)
            : undefined,
    };
}

async function fetchRateLimit(modelName: string, requestKind: RequestKind = "DEFAULT"): Promise<RateLimitResponse | null> {
    try {
        return await ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName, requestKind } });
    } catch (e) {
        logger.warn("Failed to fetch rate limit for", modelName, e);
        return null;
    }
}

function loadPreviousSnapshot(): Record<string, TrackedModel> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveSnapshot(snapshot: Record<string, TrackedModel>): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
    } catch (e) {
        logger.warn("Failed to save snapshot:", e);
    }
}

function diffSnapshots(prev: Record<string, TrackedModel>, curr: Record<string, TrackedModel>): void {
    for (const id of Object.keys(curr)) {
        if (!prev[id]) {
            notify(`New model: ${curr[id].model.name}`);
            continue;
        }
        const pq = prev[id].quota;
        const cq = curr[id].quota;
        if (!pq || !cq) continue;
        const pEff = getEffectiveQueries(pq);
        const cEff = getEffectiveQueries(cq);
        if (pEff !== cEff || pq.windowSizeSeconds !== cq.windowSizeSeconds) {
            notify(`${curr[id].model.name} quota: ${pEff}/${formatWindow(pq.windowSizeSeconds)} \u2192 ${cEff}/${formatWindow(cq.windowSizeSeconds)}`);
        }
    }
    for (const id of Object.keys(prev)) {
        if (!curr[id]) notify(`Model removed: ${prev[id].model.name}`);
    }
}

async function fetchAllModels(): Promise<void> {
    const now = Date.now();
    if (now - lastFetchTime < REFETCH_COOLDOWN) return;
    lastFetchTime = now;

    try {
        const res = await ApiClients.modelsApi.modelsGetModels({ body: { locale: "en" } });
        const allModels = [...(res.models ?? []), ...(res.unavailableModels ?? [])];
        const prev = loadPreviousSnapshot();
        const next: Record<string, TrackedModel> = {};

        const quotas = await Promise.all(allModels.map((m: any) => fetchRateLimit(m.modelId)));

        for (let i = 0; i < allModels.length; i++) {
            const m = allModels[i] as any;
            next[m.modelId] = {
                model: {
                    modelId: m.modelId,
                    name: m.name ?? m.modelId,
                    description: m.description,
                    modelMode: m.modelMode,
                    promptingBackend: m.promptingBackend,
                    tags: m.tags,
                },
                quota: quotas[i] ? parseQuota(quotas[i]!) : null,
            };
        }

        if (Object.keys(prev).length > 0) diffSnapshots(prev, next);
        trackedModels = next;
        saveSnapshot(next);
        store.notify();
    } catch (e) {
        logger.error("Failed to fetch models:", e);
    }
}

function onVisibilityChange(): void {
    if (document.visibilityState === "visible") fetchAllModels();
}

const MODE_TO_CONFIG: Record<string, ModelConfigModelMode> = {
    fast: "MODEL_MODE_FAST",
    expert: "MODEL_MODE_EXPERT",
    heavy: "MODEL_MODE_HEAVY",
    auto: "MODEL_MODE_AUTO",
    "grok-4-mini-thinking": "MODEL_MODE_GROK_4_MINI_THINKING",
    "grok-4-1": "MODEL_MODE_GROK_4_1",
    "grok-4-1-thinking": "MODEL_MODE_GROK_4_1_THINKING",
    "grok-4-1-nightly": "MODEL_MODE_GROK_4_1_NIGHTLY",
    "grok-420": "MODEL_MODE_GROK_420",
};

function resolveTracked(id: string): TrackedModel | undefined {
    const configMode = MODE_TO_CONFIG[id];
    if (configMode) return Object.values(trackedModels).find(t => t.model.modelMode === configMode);
    return trackedModels[id] ?? Object.values(trackedModels).find(t => t.model.modelId === id);
}

function QuotaChip({ modelId }: { modelId: string }): React.ReactNode {
    useExternalStore(store);
    const tracked = resolveTracked(modelId);
    if (!tracked?.quota) return null;
    if (tracked.model.modelMode === "MODEL_MODE_AUTO") return null;
    const eff = getEffectiveQueries(tracked.quota);
    if (!eff) return null;
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cl("chip-wrapper")}>
                    <Chip>{eff}/{formatWindow(tracked.quota.windowSizeSeconds)}</Chip>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <div>{eff} queries / {formatWindow(tracked.quota.windowSizeSeconds)}</div>
                {!!tracked.quota.totalTokens && <div>Token budget: {tracked.quota.totalTokens}</div>}
                {!!tracked.quota.lowEffortQueries && <div>Fast: {tracked.quota.lowEffortQueries} queries</div>}
                {!!tracked.quota.highEffortQueries && <div>Expert: {tracked.quota.highEffortQueries} queries</div>}
            </TooltipContent>
        </Tooltip>
    );
}

export default definePlugin({
    name: "QueryTracker",
    description: "Show query quotas in the model selector and notify on changes.",
    authors: [Devs.Prism],
    settings,
    startAt: StartAt.TurbopackReady,

    start() {
        if (settings.store.browserNotifications && Notification.permission === "default") Notification.requestPermission();
        fetchAllModels();
        document.addEventListener("visibilitychange", onVisibilityChange);
    },

    stop() {
        document.removeEventListener("visibilitychange", onVisibilityChange);
        trackedModels = {};
        lastFetchTime = 0;
    },

    _renderQuotaChip: ErrorBoundary.wrap(QuotaChip),

    patches: [
        {
            find: "model-mode-select-upsell",
            replacement: {
                match: /label:(\i)\.prettyModeName/,
                replace: "label:[$1.prettyModeName,$self._renderQuotaChip({modelId:$1.mode})]",
            },
        },
        {
            find: "mode-select.search-placeholder",
            all: true,
            replacement: {
                match: /"font-semibold text-sm",children:null!=\((\i)=(\i)\.title\)\?\1:""\}/,
                replace: '"font-semibold text-sm",children:[null!=($1=$2.title)?$1:"",$self._renderQuotaChip({modelId:$2.id})]}',
            },
        },
    ],
});
