/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import type { ChatBarButtonRenderProps } from "@api/ChatBarButtons";
import { definePluginSettings } from "@api/Settings";
import { ChatBarButton, Separator } from "@components";
import { GaugeIcon } from "@components/icons";
import type { RateLimitResponse } from "@grok-types";
import { React, useCallback, useEffect, useRef, useState } from "@turbopack/common/react";
import { ChatPageStore, ModelsStore } from "@turbopack/common/stores";
import { ApiClients, TanStackQuery } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore, formatCountdown, formatDuration } from "@utils/misc";
import { useCountdown, useExternalStore } from "@utils/react";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const cl = classNameFactory("void-ratelimit-");

const logger = new Logger("RateLimitDisplay");

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
    windowSeconds: number;
}

interface ModelUsage {
    model: string;
    count: number;
    oldestTs: number;
}

const EMPTY: Usage = { remaining: -1, total: -1, waitSeconds: null, windowSeconds: 0 };

const usageStore = createExternalStore();

const usageCache = new Map<string, ModelUsage>();

async function fetchUsageFromHistory(modelId: string, windowSeconds: number): Promise<number> {
    const cached = usageCache.get(modelId);
    const windowMs = windowSeconds * 1000;
    const cutoff = Date.now() - windowMs;

    if (cached && cached.oldestTs > cutoff) return cached.count;

    try {
        const { conversations } = await ApiClients.chatApi.chatListConversations({});
        let count = 0;
        let oldestTs = Date.now();

        const recentConvos = conversations.filter(
            (c: any) => new Date(c.modifyTime ?? c.createTime).getTime() > cutoff
        );

        const responses = await Promise.all(
            recentConvos.map((c: any) =>
                ApiClients.chatApi.chatListResponses({ conversationId: c.conversationId }).catch(() => ({ responses: [] }))
            )
        );

        for (const resp of responses) {
            for (const r of resp.responses ?? []) {
                if (r.sender !== "assistant" || r.model !== modelId) continue;
                const ts = new Date(r.createTime).getTime();
                if (ts <= cutoff) continue;
                count++;
                if (ts < oldestTs) oldestTs = ts;
            }
        }

        usageCache.set(modelId, { model: modelId, count, oldestTs });
        return count;
    } catch (e) {
        logger.error("Failed to fetch usage history:", e);
        return usageCache.get(modelId)?.count ?? 0;
    }
}

function computeWait(modelId: string, windowSeconds: number): number | null {
    const cached = usageCache.get(modelId);
    if (!cached) return null;
    const resetAt = cached.oldestTs + windowSeconds * 1000;
    const seconds = Math.ceil((resetAt - Date.now()) / 1000);
    return seconds > 0 ? seconds : null;
}

function toUsage(data: RateLimitResponse | undefined, used: number, modelId?: string): Usage {
    if (!data || data.totalQueries <= 0) return EMPTY;
    const remaining = Math.max(0, data.totalQueries - used);
    const apiWait = data.waitTimeSeconds;
    const waitSeconds = apiWait != null && apiWait > 0
        ? Math.ceil(apiWait)
        : remaining === 0 && modelId ? computeWait(modelId, data.windowSizeSeconds) : null;
    return { remaining, total: data.totalQueries, waitSeconds, windowSeconds: data.windowSizeSeconds };
}

function formatLabel(u: Usage, wait: number | null, short?: boolean): string {
    if (u.total < 0) return "...";
    if (u.total === 0) return "\u221e";
    if (wait != null && wait > 0) return formatCountdown(wait);
    return short || !settings.store.showMaxCount ? String(u.remaining) : `${u.remaining}/${u.total}`;
}

function Label({ usage, wait, short }: { usage: Usage; wait: number | null; short?: boolean }) {
    const text = formatLabel(usage, wait, short);
    const danger = wait != null && wait > 0;
    return danger ? <span className={cl("danger")}>{text}</span> : <>{text}</>;
}

function useLimits(modelId: string | undefined, key: string, enabled: boolean) {
    const conversationId = ChatPageStore.useChatPageStore(s => s.conversationId);
    const lastMessageId = ChatPageStore.useChatPageStore(s => s.lastMessageId);
    const streaming = ChatPageStore.useChatPageStore(s => !!s.streamedMessageId);

    const { data } = TanStackQuery.useQuery<RateLimitResponse>({
        queryKey: ["void-rate-limits", key, modelId],
        queryFn: () => ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: modelId!, requestKind: "DEFAULT" } }),
        enabled: enabled && !!modelId && !streaming,
        staleTime: 10_000,
    });

    const [used, setUsed] = useState(0);
    const fetchRef = useRef(0);

    const refreshUsage = useCallback(() => {
        if (!enabled || !modelId || !data || streaming) return;
        const id = ++fetchRef.current;
        fetchUsageFromHistory(modelId, data.windowSizeSeconds).then(count => {
            if (id === fetchRef.current) setUsed(count);
        }).catch(() => {});
    }, [enabled, modelId, data?.windowSizeSeconds, streaming]);

    useEffect(refreshUsage, [refreshUsage, conversationId, lastMessageId]);

    return { data, used };
}

function RateLimitIndicator(_props: ChatBarButtonRenderProps) {
    useExternalStore(usageStore);

    const modelMode = ChatPageStore.useChatPageStore(s => s.modelMode);
    const activeModelId = ChatPageStore.useChatPageStore(s => s.activeModelId);
    const modelByMode = ModelsStore.useModelsStore(s => s.modelByMode);
    const rateLimited = ChatPageStore.useChatPageStore(s => s.isRateLimited === "user");

    const isAuto = modelMode === "auto";
    const singleModelId = modelByMode?.[modelMode]?.modelId || activeModelId;
    const fastModelId = modelByMode?.fast?.modelId;
    const expertModelId = modelByMode?.expert?.modelId;

    const singleLimits = useLimits(singleModelId, "single", !isAuto);
    const fastLimits = useLimits(fastModelId, "fast", isAuto);
    const expertLimits = useLimits(expertModelId, "expert", isAuto);

    const single = toUsage(singleLimits.data, singleLimits.used, singleModelId);
    const fast = toUsage(fastLimits.data, fastLimits.used, fastModelId);
    const expert = toUsage(expertLimits.data, expertLimits.used, expertModelId);

    const singleWait = useCountdown(single.waitSeconds);
    const fastWait = useCountdown(fast.waitSeconds);
    const expertWait = useCountdown(expert.waitSeconds);

    const windowSeconds = single.windowSeconds || fast.windowSeconds || expert.windowSeconds;
    const reset = windowSeconds > 0 ? formatDuration(windowSeconds) : "";

    if (isAuto && fast !== EMPTY && expert !== EMPTY) {
        const tooltip = `Fast ${formatLabel(fast, fastWait)} \u00b7 Expert ${formatLabel(expert, expertWait)}${reset ? ` \u00b7 resets every ${reset}` : ""}`;

        return (
            <ChatBarButton icon={<GaugeIcon size={18} />} tooltip={tooltip}>
                <Label usage={fast} wait={fastWait} short />
                <Separator orientation="vertical" className={cl("separator")} />
                <Label usage={expert} wait={expertWait} short />
            </ChatBarButton>
        );
    }

    const limited = (singleWait ?? 0) > 0;

    return (
        <ChatBarButton icon={<GaugeIcon size={18} />} tooltip={reset ? `Resets every ${reset}` : undefined} className={limited ? cl("danger") : undefined}>
            <Label usage={single} wait={singleWait} />
        </ChatBarButton>
    );
}

let unsubRateLimited: (() => void) | undefined;

export default definePlugin({
    name: "RateLimitDisplay",
    description: "Shows rate limit usage next to the chat input.",
    authors: [Devs.Prism],
    settings,
    startAt: StartAt.TurbopackReady,
    chatBarButton: { render: RateLimitIndicator },
    start() {
        let prev = ChatPageStore.useChatPageStore.getState().isRateLimited === "user";
        unsubRateLimited = ChatPageStore.useChatPageStore.subscribe(s => {
            const limited = s.isRateLimited === "user";
            if (limited && !prev) usageStore.notify();
            prev = limited;
        });
    },
    stop() {
        unsubRateLimited?.();
        usageCache.clear();
    },
    patches: [{
        find: "chat-page-store:checkRateLimits",
        replacement: {
            match: /rateLimitsGetRateLimits\(\{body:(\i)\}\)\.then\((\i)=>\{/,
            replace: "rateLimitsGetRateLimits({body:$1}).then($2=>{$self._onRateLimitCheck($2,$1);",
        },
        all: true,
    }],
    _onRateLimitCheck(res: RateLimitResponse, req: { modelName: string }) {
        usageCache.delete(req.modelName);
        usageStore.notify();
    },
});
