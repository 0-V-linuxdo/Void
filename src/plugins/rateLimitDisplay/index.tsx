/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ChatBarButtonRenderProps } from "@api/ChatBarButtons";
import { definePluginSettings } from "@api/Settings";
import { ChatBarButton, Separator } from "@components";
import { ClockIcon, GaugeIcon } from "@components/icons";
import type { RateLimitResponse } from "@grok-types";
import type { ModelMode } from "@grok-types/enums";
import { React, useEffect, useMemo } from "@turbopack/common/react";
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
    waitSeconds: number | null;
}

const EMPTY: Usage = { remaining: -1, total: -1, waitSeconds: null };

function ceilWait(seconds?: number): number | null {
    return seconds != null && seconds > 0 ? Math.ceil(seconds) : null;
}

function parse(data: RateLimitResponse, mode: ModelMode): { single: Usage; fast: Usage; expert: Usage; windowSeconds: number } {
    const windowSeconds = data.windowSizeSeconds;
    const tokenBudget = data.totalTokens ?? 0;

    if (tokenBudget > 0) {
        const fast = data.lowEffortRateLimits
            ? { remaining: data.lowEffortRateLimits.remainingQueries, total: Math.floor(tokenBudget / data.lowEffortRateLimits.cost), waitSeconds: ceilWait(data.lowEffortRateLimits.waitTimeSeconds) }
            : EMPTY;
        const expert = data.highEffortRateLimits
            ? { remaining: data.highEffortRateLimits.remainingQueries, total: Math.floor(tokenBudget / data.highEffortRateLimits.cost), waitSeconds: ceilWait(data.highEffortRateLimits.waitTimeSeconds) }
            : EMPTY;

        const single = mode === "fast" ? fast : expert;
        return { single, fast, expert, windowSeconds };
    }

    const single = data.totalQueries > 0
        ? { remaining: data.remainingQueries, total: data.totalQueries, waitSeconds: ceilWait(data.waitTimeSeconds) }
        : EMPTY;

    return { single, fast: EMPTY, expert: EMPTY, windowSeconds };
}

function formatLabel(u: Usage, wait: number | null, short?: boolean): string {
    if (wait != null && wait > 0) return formatCountdown(wait);
    if (u.total < 0) return "...";
    if (u.total === 0) return "\u221e";
    return short || !settings.store.showMaxCount ? String(u.remaining) : `${u.remaining}/${u.total}`;
}

function RateLimitIndicator(_props: ChatBarButtonRenderProps) {
    const modelMode = ChatPageStore.useChatPageStore(s => s.modelMode);
    const reasoningMode = ChatPageStore.useChatPageStore(s => s.reasoningMode);
    const conversationId = ChatPageStore.useChatPageStore(s => s.conversationId);
    const lastMessageId = ChatPageStore.useChatPageStore(s => s.lastMessageId);
    const streaming = ChatPageStore.useChatPageStore(s => !!s.streamedMessageId);
    const modelByMode = ModelsStore.useModelsStore(s => s.modelByMode);

    const requestKind = ReasoningModeUtils.reasoningModeToRequestKind?.(reasoningMode) ?? "DEFAULT";
    const modelId = modelByMode?.[modelMode === "auto" ? "expert" : modelMode]?.modelId;

    const { data, refetch } = TanStackQuery.useQuery<RateLimitResponse>({
        queryKey: ["void-rate-limits"],
        queryFn: () => ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: modelId, requestKind } }),
        enabled: !!modelId && !streaming,
        staleTime: 10_000,
        placeholderData: (prev: RateLimitResponse | undefined) => prev,
    });

    useEffect(() => { if (modelId && !streaming) refetch().catch(() => {}); }, [modelId, requestKind, conversationId, lastMessageId, streaming]);

    const { single, fast, expert, windowSeconds } = useMemo(
        () => data ? parse(data, modelMode) : { single: EMPTY, fast: EMPTY, expert: EMPTY, windowSeconds: 0 },
        [data, modelMode],
    );

    const singleWait = useCountdown(single.waitSeconds);
    const fastWait = useCountdown(fast.waitSeconds);
    const expertWait = useCountdown(expert.waitSeconds);

    const isAuto = modelMode === "auto" && fast !== EMPTY && expert !== EMPTY;
    const limited = isAuto ? (fastWait ?? 0) > 0 || (expertWait ?? 0) > 0 : (singleWait ?? 0) > 0;
    const icon = limited ? <ClockIcon size={18} /> : <GaugeIcon size={18} />;
    const className = limited ? "text-fg-danger" : undefined;
    const reset = windowSeconds > 0 ? formatDuration(windowSeconds) : "";

    if (isAuto) {
        const tooltip = `Fast ${formatLabel(fast, fastWait)} \u00b7 Expert ${formatLabel(expert, expertWait)}${reset ? ` \u00b7 resets every ${reset}` : ""}`;
        return (
            <ChatBarButton icon={icon} tooltip={tooltip} className={className}>
                {formatLabel(fast, fastWait, true)}
                <Separator orientation="vertical" className="mx-1 h-3 w-0.5" />
                {formatLabel(expert, expertWait, true)}
            </ChatBarButton>
        );
    }

    return (
        <ChatBarButton icon={icon} tooltip={reset ? `Resets every ${reset}` : undefined} className={className}>
            {formatLabel(single, singleWait)}
        </ChatBarButton>
    );
}

export default definePlugin({
    name: "RateLimitDisplay",
    description: "Shows rate limit usage next to the chat input.",
    authors: [Devs.Prism],
    settings,
    chatBarButton: { render: RateLimitIndicator },
});
