/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ChatBarButtonRenderProps } from "@api/ChatBarButtons";
import { definePluginSettings } from "@api/Settings";
import { ChatBarButton, Separator } from "@components";
import { ClockIcon, GaugeIcon } from "@components/icons";
import type { EffortRateLimits, RateLimitResponse } from "@grok-types";
import type { ModelId, ModelMode, RequestKind } from "@grok-types/enums";
import { React, useMemo } from "@turbopack/common/react";
import { ChatPageStore, ModelsStore } from "@turbopack/common/stores";
import { ApiClients, ReasoningModeUtils, TanStackQuery } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { formatCountdown, formatDuration } from "@utils/misc";
import { useCountdown } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

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

function useRateLimitQuery(modelId: ModelId | undefined, requestKind: RequestKind, cacheKey: string | undefined, enabled: boolean) {
    return TanStackQuery.useQuery<RateLimitResponse>({
        queryKey: ["void-rate-limits", modelId, requestKind, cacheKey],
        queryFn: () => ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: modelId, requestKind } }),
        enabled: enabled && !!modelId,
        staleTime: 10_000,
        placeholderData: prev => prev,
    });
}

function formatLabel(u: Usage, short?: boolean) {
    if (u.waitSeconds != null && u.waitSeconds > 0) return formatCountdown(u.waitSeconds);
    if (u.total < 0) return "...";
    if (u.total === 0) return "\u221e";
    return short || !settings.store.showMaxCount ? String(u.remaining) : `${u.remaining}/${u.total}`;
}

function SingleDisplay({ usage }: { usage: Usage }) {
    const wait = useCountdown(usage.waitSeconds);
    const limited = wait != null && wait > 0;
    const u = limited ? { ...usage, waitSeconds: wait } : usage;
    const reset = usage.windowSeconds > 0 ? `Resets every ${formatDuration(usage.windowSeconds)}` : "";

    return (
        <ChatBarButton icon={limited ? <ClockIcon size={18} /> : <GaugeIcon size={18} />} tooltip={reset || undefined} className={limited ? "text-fg-danger" : undefined}>
            {formatLabel(u)}
        </ChatBarButton>
    );
}

function AutoDisplay({ fast, expert }: { fast: Usage; expert: Usage }) {
    const fw = useCountdown(fast.waitSeconds);
    const ew = useCountdown(expert.waitSeconds);
    const fLimited = fw != null && fw > 0;
    const eLimited = ew != null && ew > 0;
    const limited = fLimited || eLimited;
    const fastUsage = fLimited ? { ...fast, waitSeconds: fw } : fast;
    const expertUsage = eLimited ? { ...expert, waitSeconds: ew } : expert;
    const windowSeconds = fast.windowSeconds ?? expert.windowSeconds;
    const reset = windowSeconds > 0 ? ` \u00b7 resets every ${formatDuration(windowSeconds)}` : "";

    return (
        <ChatBarButton
            icon={limited ? <ClockIcon size={18} /> : <GaugeIcon size={18} />}
            tooltip={`Fast ${formatLabel(fastUsage)} \u00b7 Expert ${formatLabel(expertUsage)}${reset}`}
            className={limited ? "text-fg-danger" : undefined}
        >
            {formatLabel(fastUsage, true)}
            <Separator orientation="vertical" className="mx-1 h-3 w-0.5" />
            {formatLabel(expertUsage, true)}
        </ChatBarButton>
    );
}

function RateLimitIndicator(_props: ChatBarButtonRenderProps) {
    const modelMode = ChatPageStore.useChatPageStore(s => s.modelMode);
    const reasoningMode = ChatPageStore.useChatPageStore(s => s.reasoningMode);
    const conversationId = ChatPageStore.useChatPageStore(s => s.conversationId);
    const lastMessageId = ChatPageStore.useChatPageStore(s => s.lastMessageId);
    const streaming = ChatPageStore.useChatPageStore(s => !!s.streamedMessageId);
    const modelByMode = ModelsStore.useModelsStore(s => s.modelByMode);

    const requestKind = ReasoningModeUtils.reasoningModeToRequestKind?.(reasoningMode) ?? "DEFAULT";
    const isAuto = modelMode === "auto";
    const fastId = modelByMode?.fast?.modelId;
    const expertId = modelByMode?.expert?.modelId;
    const singleId = !isAuto ? modelByMode?.[modelMode]?.modelId : undefined;

    const cacheKey = `${conversationId}:${lastMessageId}`;
    const fastQuery = useRateLimitQuery(fastId, requestKind, cacheKey, isAuto && !streaming);
    const expertQuery = useRateLimitQuery(expertId, requestKind, cacheKey, isAuto && !streaming);
    const singleQuery = useRateLimitQuery(singleId, requestKind, cacheKey, !isAuto && !streaming);

    const fast = useMemo(() => fastQuery.data ? parse(fastQuery.data, "fast") : EMPTY, [fastQuery.data]);
    const expert = useMemo(() => expertQuery.data ? parse(expertQuery.data, "expert") : EMPTY, [expertQuery.data]);
    const single = useMemo(() => singleQuery.data ? parse(singleQuery.data, modelMode) : EMPTY, [singleQuery.data, modelMode]);

    if (isAuto) return <AutoDisplay fast={fast} expert={expert} />;
    return <SingleDisplay usage={single} />;
}

export default definePlugin({
    name: "RateLimitDisplay",
    description: "Shows rate limit usage next to the chat input.",
    authors: [Devs.Prism],
    settings,
    chatBarButton: { render: RateLimitIndicator },
});
