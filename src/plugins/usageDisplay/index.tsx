/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import type { ChatBarButtonDef } from "@api/ChatBarButtons";
import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Text } from "@components/Text";
import type { GrokSubscription } from "@grok-types";
import type { XSubscriptionType } from "@grok-types/enums";
import { getPlanName } from "@turbopack/common/plan";
import { React, useEffect, useState } from "@turbopack/common/react";
import { SessionStore, SubscriptionsStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { clamp, createExternalStore, formatCountdown } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

import {
    fetchOfficialUsage,
    formatPercent,
    mergeNativeUsage,
    type NativeUsage,
    persistUsage,
    readNativeUsage,
    readStoredUsage,
    usageTone,
} from "./credits";

const logger = new Logger("UsageDisplay");
const cl = classNameFactory("void-ud-");

const settings = definePluginSettings({
    showPercent: {
        type: OptionType.BOOLEAN,
        description: "Show the used-percent label next to the ring.",
        default: false,
    },
});

const AUTO_REFRESH_MS = 60 * 1000;
const STALE_MS = 30 * 1000;
const DAY_SECONDS = 86_400;
const RING_SIZE = 18;
const RING_RADIUS = 7;
const RING_CENTER = RING_SIZE / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const store = createExternalStore();

interface UsageState {
    loading: boolean;
    lastFetchAt: number;
    lastUpdatedAt: number;
    usage: NativeUsage | null;
    userId: string;
}

const state: UsageState = {
    loading: false,
    lastFetchAt: 0,
    lastUpdatedAt: 0,
    usage: null,
    userId: "",
};

let refreshPromise: Promise<boolean> | null = null;

function currentUserId(): string {
    try {
        return SessionStore.getSessionStoreState?.()?.user?.userId ?? "";
    } catch {
        return "";
    }
}

function loadMemory(userId: string) {
    if (!userId || userId === state.userId) return;
    const stored = readStoredUsage(userId);
    state.userId = userId;
    state.usage = stored;
    state.lastUpdatedAt = stored ? Date.now() : 0;
    state.lastFetchAt = 0;
    store.notify();
}

function syncAccount() {
    const userId = currentUserId();
    if (!userId) return;
    loadMemory(userId);
}

async function refresh(reason = "manual"): Promise<boolean> {
    if (refreshPromise) return refreshPromise;
    if (reason === "poll" && Date.now() - state.lastFetchAt < STALE_MS) return false;

    syncAccount();
    state.loading = true;
    state.lastFetchAt = Date.now();
    store.notify();

    refreshPromise = (async () => {
        try {
            const pageUsage = readNativeUsage();
            const remote = await fetchOfficialUsage()
                .then(usage => ({ ok: true as const, usage }))
                .catch(error => {
                    logger.warn("Failed to fetch official usage", error);
                    return { ok: false as const };
                });
            const merged = mergeNativeUsage(state.usage, remote.ok ? remote.usage : null, pageUsage);
            if (merged) state.usage = merged;
            if (state.usage || pageUsage) state.lastUpdatedAt = Date.now();
            if (state.userId) persistUsage(state.userId, state.usage, state.lastUpdatedAt);
            return Boolean(state.usage);
        } finally {
            state.loading = false;
            refreshPromise = null;
            store.notify();
        }
    })();

    return refreshPromise;
}

function onVisibility() {
    if (!document.hidden && Date.now() - state.lastFetchAt > STALE_MS) void refresh("visible");
}

function readPlan() {
    let xSubscriptionType: XSubscriptionType | undefined;
    try {
        xSubscriptionType = SessionStore.getSessionStoreState?.()?.user?.xSubscriptionType;
    } catch {
        xSubscriptionType = undefined;
    }
    let bestSubscription: GrokSubscription["tier"];
    try {
        bestSubscription = SubscriptionsStore.useSubscriptionsStore.getState().bestSubscription;
    } catch {
        bestSubscription = undefined;
    }
    return getPlanName(bestSubscription, xSubscriptionType) === "Free";
}

function triggerLabel(isFree: boolean, percent: number | null, loading: boolean, showPercent: boolean): string | null {
    if (isFree) return "Free";
    if (!showPercent) return null;
    if (percent !== null) return formatPercent(percent);
    return loading ? "…" : "—";
}

function usedLabel(isFree: boolean, percent: number | null, loading: boolean): string {
    if (isFree) return "Free";
    if (percent !== null) return `${formatPercent(percent)} used`;
    return loading ? "…" : "—";
}

function formatResetCountdown(totalSeconds: number): string {
    if (totalSeconds <= 0) return formatCountdown(0);
    const days = Math.floor(totalSeconds / DAY_SECONDS);
    const rest = totalSeconds % DAY_SECONDS;
    return days > 0 ? `${days}d ${formatCountdown(rest)}` : formatCountdown(rest);
}

function ProgressRing({ percent, tone }: { percent: number | null; tone: ReturnType<typeof usageTone> }) {
    const fraction = percent === null ? 0 : clamp(percent, 0, 100) / 100;
    return (
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className={classes(cl("ring"), cl(`ring-${tone}`))}>
            <circle cx={RING_CENTER} cy={RING_CENTER} r={RING_RADIUS} className={cl("ring-track")} />
            <circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                className={cl("ring-fill")}
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
                transform={`rotate(-90 ${RING_CENTER} ${RING_CENTER})`}
            />
        </svg>
    );
}

function ButtonIcon() {
    useExternalStore(store);
    const { showPercent } = settings.use(["showPercent"]);
    const weekly = state.usage?.weekly;
    const percent = weekly?.usedPercent ?? null;
    const tone = usageTone(percent);
    const isFree = readPlan();
    const label = triggerLabel(isFree, percent, state.loading, showPercent);

    useEffect(() => {
        void refresh("initial");
        const id = window.setInterval(() => {
            if (!document.hidden) void refresh("poll");
        }, AUTO_REFRESH_MS);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            window.clearInterval(id);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <span className={classes(cl("trigger"), label == null && cl("icon-only"))}>
            <ProgressRing percent={isFree ? null : percent} tone={isFree ? "waiting" : tone} />
            {label != null && <span className={cl("label")}>{label}</span>}
        </span>
    );
}

function UsagePanel() {
    useExternalStore(store);
    const [now, setNow] = useState(Date.now);
    const weekly = state.usage?.weekly;
    const percent = weekly?.usedPercent ?? null;
    const isFree = readPlan();
    const resetAt = weekly?.resetAt ?? null;

    useEffect(() => {
        if (resetAt == null) return;
        const id = window.setInterval(() => setNow(Date.now()), 1000);
        return () => window.clearInterval(id);
    }, [resetAt]);

    const left = resetAt == null ? 0 : Math.max(0, Math.ceil((resetAt - now) / 1000));

    return (
        <Flex flexDirection="column" gap={2} className={cl("panel")}>
            <Text size="sm" weight="semibold" className={cl("used")}>{usedLabel(isFree, percent, state.loading)}</Text>
            {resetAt != null && <Text size="xs" color="muted">Resets in {formatResetCountdown(left)}</Text>}
        </Flex>
    );
}

const SafeButtonIcon = ErrorBoundary.wrap(ButtonIcon);
const SafeUsagePanel = ErrorBoundary.wrap(UsagePanel);

const BUTTON_BASE = {
    icon: () => <SafeButtonIcon />,
    onClick: () => { void refresh("manual"); },
    order: 1,
    className: "text-fg-primary",
    "aria-label": "Grok weekly usage",
    locations: ["chat", "imagine"],
} satisfies ChatBarButtonDef;

export default definePlugin({
    name: "UsageDisplay",
    description: "Shows official weekly SuperGrok usage in the chat bar.",
    authors: [Devs.p],
    tags: ["chat"],
    enabledByDefault: true,
    settings,

    chatBarButton: { ...BUTTON_BASE, tooltip: () => <SafeUsagePanel /> },

    events: {
        streamEnd() { void refresh("stream"); },
    },
});
