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
import { React, useMemo } from "@turbopack/common/react";
import { ChatPageStore, ModelsStore } from "@turbopack/common/stores";
import { ApiClients, TanStackQuery } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { createExternalStore, formatCountdown, formatDuration } from "@utils/misc";
import { useCountdown, useExternalStore } from "@utils/react";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const cl = classNameFactory("void-ratelimit-");

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

const EMPTY: Usage = { remaining: -1, total: -1, waitSeconds: null, windowSeconds: 0 };

const usageStore = createExternalStore();

const sendTimestamps = new Map<string, number[]>();

function recordSend(modelId: string) {
    const list = sendTimestamps.get(modelId) ?? [];
    list.push(Date.now());
    sendTimestamps.set(modelId, list);
    usageStore.notify();
}

function getUsedCount(modelId: string, windowSeconds: number): number {
    const list = sendTimestamps.get(modelId);
    if (!list?.length) return 0;
    const cutoff = Date.now() - windowSeconds * 1000;
    const fresh = list.filter(ts => ts > cutoff);
    if (fresh.length !== list.length) sendTimestamps.set(modelId, fresh);
    return fresh.length;
}

function getOldestSendTs(modelId: string, windowSeconds: number): number | null {
    const list = sendTimestamps.get(modelId);
    if (!list?.length) return null;
    const cutoff = Date.now() - windowSeconds * 1000;
    for (const ts of list) {
        if (ts > cutoff) return ts;
    }
    return null;
}

function toUsage(data: RateLimitResponse | undefined, modelId?: string): Usage {
    if (!data || data.totalQueries <= 0) return EMPTY;
    const windowSeconds = data.windowSizeSeconds;
    const used = modelId ? getUsedCount(modelId, windowSeconds) : 0;
    const remaining = Math.max(0, data.totalQueries - used);
    const apiWait = data.waitTimeSeconds;
    let waitSeconds: number | null = null;
    if (apiWait != null && apiWait > 0) {
        waitSeconds = Math.ceil(apiWait);
    } else if (remaining === 0 && modelId) {
        const oldest = getOldestSendTs(modelId, windowSeconds);
        if (oldest) {
            const seconds = Math.ceil((oldest + windowSeconds * 1000 - Date.now()) / 1000);
            waitSeconds = seconds > 0 ? seconds : null;
        }
    }
    return { remaining, total: data.totalQueries, waitSeconds, windowSeconds };
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
    const streaming = ChatPageStore.useChatPageStore(s => !!s.streamedMessageId);

    const { data } = TanStackQuery.useQuery<RateLimitResponse>({
        queryKey: ["void-rate-limits", key, modelId],
        queryFn: () => ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: modelId!, requestKind: "DEFAULT" } }),
        enabled: enabled && !!modelId && !streaming,
        staleTime: 10_000,
    });

    return data;
}

function RateLimitIndicator(_props: ChatBarButtonRenderProps) {
    useExternalStore(usageStore);

    const modelMode = ChatPageStore.useChatPageStore(s => s.modelMode);
    const activeModelId = ChatPageStore.useChatPageStore(s => s.activeModelId);
    const modelByMode = ModelsStore.useModelsStore(s => s.modelByMode);

    const isAuto = modelMode === "auto";
    const singleModelId = modelByMode?.[modelMode]?.modelId || activeModelId;
    const fastModelId = modelByMode?.fast?.modelId;
    const expertModelId = modelByMode?.expert?.modelId;

    const singleData = useLimits(singleModelId, "single", !isAuto);
    const fastData = useLimits(fastModelId, "fast", isAuto);
    const expertData = useLimits(expertModelId, "expert", isAuto);

    const single = useMemo(() => toUsage(singleData, singleModelId), [singleData, singleModelId]);
    const fast = useMemo(() => toUsage(fastData, fastModelId), [fastData, fastModelId]);
    const expert = useMemo(() => toUsage(expertData, expertModelId), [expertData, expertModelId]);

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

let unsubStreaming: (() => void) | undefined;

export default definePlugin({
    name: "RateLimitDisplay",
    description: "Shows rate limit usage next to the chat input.",
    authors: [Devs.Prism],
    settings,
    startAt: StartAt.TurbopackReady,
    chatBarButton: { render: RateLimitIndicator },
    start() {
        let prevStreaming = false;
        let prevModelId: string | undefined;
        unsubStreaming = ChatPageStore.useChatPageStore.subscribe(s => {
            const streaming = !!s.streamedMessageId;
            if (prevStreaming && !streaming && prevModelId) {
                recordSend(prevModelId);
            }
            prevStreaming = streaming;
            prevModelId = s.activeModelId;
        });
    },
    stop() {
        unsubStreaming?.();
        sendTimestamps.clear();
    },
    patches: [{
        find: "chat-page-store:checkRateLimits",
        replacement: {
            match: /rateLimitsGetRateLimits\(\{body:(\i)\}\)\.then\((\i)=>\{/,
            replace: "rateLimitsGetRateLimits({body:$1}).then($2=>{$self._onRateLimitCheck($2,$1);",
        },
        all: true,
    }],
    _onRateLimitCheck(res: RateLimitResponse, _req: { modelName: string }) {
        if (res.waitTimeSeconds && res.waitTimeSeconds > 0) usageStore.notify();
    },
});
