/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import type { ChatBarButtonRenderProps } from "@api/ChatBarButtons";
import { definePluginSettings } from "@api/Settings";
import { ChatBarButton } from "@components";
import { GaugeIcon } from "@components/icons";
import type { RateLimitResponse } from "@grok-types";
import { React } from "@turbopack/common/react";
import { ChatPageStore } from "@turbopack/common/stores";
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

function formatLabel(u: Usage, wait: number | null): string {
    if (u.total < 0) return "...";
    if (u.total === 0) return "\u221e";
    if (wait != null && wait > 0) return formatCountdown(wait);
    return settings.store.showMaxCount ? `${u.remaining}/${u.total}` : String(u.remaining);
}

function RateLimitIndicator(_props: ChatBarButtonRenderProps) {
    useExternalStore(usageStore);

    const activeModelId = ChatPageStore.useChatPageStore(s => s.activeModelId);
    const streaming = ChatPageStore.useChatPageStore(s => !!s.streamedMessageId);

    const { data } = TanStackQuery.useQuery<RateLimitResponse>({
        queryKey: ["void-rate-limits", activeModelId],
        queryFn: () => ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: activeModelId!, requestKind: "DEFAULT" } }),
        enabled: !!activeModelId && !streaming,
        staleTime: 10_000,
    });

    const usage = toUsage(data, activeModelId);
    const wait = useCountdown(usage.waitSeconds);
    const reset = usage.windowSeconds > 0 ? formatDuration(usage.windowSeconds) : "";
    const limited = (wait ?? 0) > 0;

    return (
        <ChatBarButton icon={<GaugeIcon size={18} />} tooltip={reset ? `Resets every ${reset}` : undefined} className={limited ? cl("danger") : undefined}>
            <span className={limited ? cl("danger") : undefined}>{formatLabel(usage, wait)}</span>
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
        unsubStreaming = ChatPageStore.useChatPageStore.subscribe(s => {
            const streaming = !!s.streamedMessageId;
            if (prevStreaming && !streaming && s.activeModelId) {
                recordSend(s.activeModelId);
            }
            prevStreaming = streaming;
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
