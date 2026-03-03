/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ChatBarButtonRenderProps } from "@api/ChatBarButtons";
import { definePluginSettings } from "@api/Settings";
import { ChatBarButton, Separator, Skeleton } from "@components";
import { ClockIcon, GaugeIcon } from "@components/icons";
import type { EffortRateLimits, RateLimitResponse } from "@grok-types";
import type { ModelId, ModelMode, RequestKind } from "@grok-types/enums";
import { React, useEffect, useState } from "@turbopack/common/react";
import { ChatPageStore, ModelsStore } from "@turbopack/common/stores";
import { ApiClients, ReasoningModeUtils } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { formatCountdown, formatDuration } from "@utils/misc";
import { useCountdown } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("RateLimitDisplay", "#ef9f76");

const settings = definePluginSettings({
    showMaxCount: {
        type: OptionType.BOOLEAN,
        description: "Show the maximum count alongside remaining.",
        default: true,
    },
});

interface Usage {
    remaining: number;
    total: number;
    windowSeconds: number;
    waitSeconds: number | null;
}

const EMPTY: Usage = { remaining: -1, total: -1, windowSeconds: 0, waitSeconds: null };

function ceilWait(seconds?: number) {
    return seconds != null && seconds > 0 ? Math.ceil(seconds) : null;
}

function effortToUsage(effort: EffortRateLimits, totalTokens: number, windowSeconds: number): Usage {
    return {
        remaining: effort.remainingQueries,
        total: Math.floor(totalTokens / effort.cost),
        windowSeconds,
        waitSeconds: ceilWait(effort.waitTimeSeconds),
    };
}

function parse(data: RateLimitResponse, mode?: ModelMode): Usage {
    const windowSeconds = data.windowSizeSeconds;
    const tokenBudget = data.totalTokens ?? 0;

    if (tokenBudget > 0) {
        if (mode === "fast" && data.lowEffortRateLimits) return effortToUsage(data.lowEffortRateLimits, tokenBudget, windowSeconds);
        if (mode === "expert" && data.highEffortRateLimits) return effortToUsage(data.highEffortRateLimits, tokenBudget, windowSeconds);
        if (data.highEffortRateLimits) return effortToUsage(data.highEffortRateLimits, tokenBudget, windowSeconds);
        if (data.lowEffortRateLimits) return effortToUsage(data.lowEffortRateLimits, tokenBudget, windowSeconds);
        return { remaining: data.remainingTokens ?? 0, total: tokenBudget, windowSeconds, waitSeconds: ceilWait(data.waitTimeSeconds) };
    }

    if (data.totalQueries > 0) {
        return { remaining: data.remainingQueries, total: data.totalQueries, windowSeconds, waitSeconds: ceilWait(data.waitTimeSeconds) };
    }

    return { ...EMPTY, windowSeconds };
}

const responseCache = new Map<string, RateLimitResponse>();

function cacheKey(modelId: ModelId, requestKind: RequestKind) {
    return `${modelId}:${requestKind}`;
}

async function fetchForModel(modelId: ModelId, requestKind: RequestKind) {
    const data: RateLimitResponse = await ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: modelId, requestKind } });
    responseCache.set(cacheKey(modelId, requestKind), data);
    return data;
}

function getCached(modelId: ModelId, requestKind: RequestKind, mode?: ModelMode): Usage {
    const data = responseCache.get(cacheKey(modelId, requestKind));
    return data ? parse(data, mode) : EMPTY;
}

function formatLabel(u: Usage, short?: boolean) {
    if (u.waitSeconds != null && u.waitSeconds > 0) return formatCountdown(u.waitSeconds);
    if (u.total < 0) return "...";
    if (u.total === 0) return "\u221e";
    return short || !settings.store.showMaxCount ? String(u.remaining) : `${u.remaining}/${u.total}`;
}

function SingleDisplay({ usage, iconOnly }: { usage: Usage; iconOnly: boolean }) {
    const wait = useCountdown(usage.waitSeconds);
    const limited = wait != null && wait > 0;
    const u = limited ? { ...usage, waitSeconds: wait } : usage;
    const reset = usage.windowSeconds > 0 ? `Resets every ${formatDuration(usage.windowSeconds)}` : "";
    const tooltip = iconOnly ? [formatLabel(u), reset].filter(Boolean).join(" \u00b7 ") : reset || undefined;

    return (
        <ChatBarButton icon={limited ? <ClockIcon size={18} /> : <GaugeIcon size={18} />} tooltip={tooltip} className={limited ? "text-fg-danger" : undefined} iconOnly={iconOnly}>
            {u.total < 0 ? <Skeleton className="h-4 w-3 rounded" /> : formatLabel(u)}
        </ChatBarButton>
    );
}

function AutoDisplay({ fast, expert, iconOnly }: { fast: Usage; expert: Usage; iconOnly: boolean }) {
    const fw = useCountdown(fast.waitSeconds);
    const ew = useCountdown(expert.waitSeconds);
    const fLimited = fw != null && fw > 0;
    const eLimited = ew != null && ew > 0;
    const limited = fLimited || eLimited;
    const f = fLimited ? { ...fast, waitSeconds: fw } : fast;
    const e = eLimited ? { ...expert, waitSeconds: ew } : expert;
    const windowSeconds = fast.windowSeconds ?? expert.windowSeconds;
    const reset = windowSeconds > 0 ? ` \u00b7 resets every ${formatDuration(windowSeconds)}` : "";

    return (
        <ChatBarButton
            icon={limited ? <ClockIcon size={18} /> : <GaugeIcon size={18} />}
            tooltip={`Fast ${formatLabel(f)} \u00b7 Expert ${formatLabel(e)}${reset}`}
            className={limited ? "text-fg-danger" : undefined}
            iconOnly={iconOnly}
        >
            {f.total < 0 ? <Skeleton className="h-4 w-3 rounded" /> : formatLabel(f, true)}
            <Separator orientation="vertical" className="mx-1 h-3 w-0.5" />
            {e.total < 0 ? <Skeleton className="h-4 w-3 rounded" /> : formatLabel(e, true)}
        </ChatBarButton>
    );
}

function RateLimitIndicator({ iconOnly }: ChatBarButtonRenderProps) {
    const modelMode = ChatPageStore.useChatPageStore(s => s.modelMode);
    const reasoningMode = ChatPageStore.useChatPageStore(s => s.reasoningMode);
    const conversationId = ChatPageStore.useChatPageStore(s => s.conversationId);
    const lastMessageId = ChatPageStore.useChatPageStore(s => s.lastMessageId);
    const streaming = ChatPageStore.useChatPageStore(s => !!s.streamedMessageId);
    const modelByMode = ModelsStore.useModelsStore(s => s.modelByMode);

    const requestKind = ReasoningModeUtils.reasoningModeToRequestKind?.(reasoningMode) ?? "DEFAULT";
    const fastId = modelByMode?.fast?.modelId;
    const expertId = modelByMode?.expert?.modelId;
    const singleId = modelMode !== "auto" ? modelByMode?.[modelMode]?.modelId : undefined;

    const [fast, setFast] = useState(() => fastId ? getCached(fastId, requestKind, "fast") : EMPTY);
    const [expert, setExpert] = useState(() => expertId ? getCached(expertId, requestKind, "expert") : EMPTY);
    const [single, setSingle] = useState(() => singleId ? getCached(singleId, requestKind, modelMode) : EMPTY);

    useEffect(() => {
        if (modelMode === "auto" && streaming) return;

        let cancelled = false;

        if (modelMode === "auto") {
            if (!fastId && !expertId) return;

            if (fastId) setFast(getCached(fastId, requestKind, "fast"));
            if (expertId) setExpert(getCached(expertId, requestKind, "expert"));

            const sharedModel = fastId === expertId;
            const targetId = fastId ?? expertId;

            if (sharedModel && targetId) {
                fetchForModel(targetId, requestKind)
                    .then(data => {
                        if (cancelled) return;
                        setFast(parse(data, "fast"));
                        setExpert(parse(data, "expert"));
                    })
                    .catch(e => logger.error("Failed to fetch rate limits", e));
            } else {
                Promise.all([fastId ? fetchForModel(fastId, requestKind) : null, expertId ? fetchForModel(expertId, requestKind) : null])
                    .then(([f, e]) => {
                        if (cancelled) return;
                        if (f) setFast(parse(f, "fast"));
                        if (e) setExpert(parse(e, "expert"));
                    })
                    .catch(e => logger.error("Failed to fetch rate limits", e));
            }
        } else {
            if (!singleId) return;

            setSingle(getCached(singleId, requestKind, modelMode));

            fetchForModel(singleId, requestKind)
                .then(result => {
                    if (cancelled) return;
                    setSingle(parse(result, modelMode));
                })
                .catch(e => logger.error("Failed to fetch rate limits", e));
        }

        return () => { cancelled = true; };
    }, [modelMode, reasoningMode, conversationId, lastMessageId, streaming, fastId, expertId, singleId, requestKind]);

    if (modelMode === "auto") return <AutoDisplay fast={fast} expert={expert} iconOnly={iconOnly} />;
    return <SingleDisplay usage={single} iconOnly={iconOnly} />;
}

export default definePlugin({
    name: "RateLimitDisplay",
    description: "Shows rate limit usage next to the chat input.",
    authors: [Devs.Prism],
    settings,
    chatBarButton: { render: RateLimitIndicator },
});
