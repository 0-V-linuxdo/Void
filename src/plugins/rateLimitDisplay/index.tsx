/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { ClockAlertIcon } from "@components/icons";
import { Text } from "@components/Text";
import type { RateLimitResponse } from "@grok-types";
import type { CreditQuotaStoreState, ImagineCreditBucket, ImagineCreditQuota } from "@grok-types/stores/CreditQuotaStore";
import type { ModesStoreState } from "@grok-types/stores/ModesStore";
import { React, useEffect, useMemo, useState } from "@turbopack/common/react";
import { CreditQuotaStore, ModesStore, RoutingStore } from "@turbopack/common/stores";
import { ApiClients } from "@turbopack/common/utils";
import { findExportedComponentLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { clamp, createExternalStore, formatCountdown, formatDuration } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("RateLimitDisplay");
const cl = classNameFactory("void-rld-");

const UsageProgressIcon = findExportedComponentLazy("UsageProgressIcon");

const settings = definePluginSettings({
    display: {
        type: OptionType.SELECT,
        description: "How to show the remaining usage in the chat bar.",
        options: [
            { label: "Count", value: "count", default: true },
            { label: "Fraction (remaining/total)", value: "fraction" },
            { label: "Percent remaining", value: "percent" },
            { label: "Progress ring", value: "ring" },
        ],
    },
});

const IMAGINE_BUCKETS: readonly ImagineCreditBucket[] = ["image", "imagePro", "imageEdit", "video", "video720p"] as const;

const IMAGINE_LABELS: Record<ImagineCreditBucket, string> = {
    image: "Speed Images",
    imagePro: "Quality Images",
    imageEdit: "Image Edits",
    video: "Videos 480p",
    video720p: "Videos 720p",
};

const UNLIMITED_THRESHOLD = Number.MAX_SAFE_INTEGER;
const RING_SIZE = 18;
const RING_RADIUS = 7;
const RING_CENTER = RING_SIZE / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const store = createExternalStore();
const limits = new Map<string, RateLimitResponse>();

const remainingOf = (d: RateLimitResponse) => d.remainingTokens ?? d.remainingQueries;
const totalOf = (d: RateLimitResponse) => d.totalTokens ?? d.totalQueries;
const fractionOf = (d: RateLimitResponse) => (totalOf(d) > 0 ? clamp(remainingOf(d) / totalOf(d), 0, 1) : 1);
const percentOf = (d: RateLimitResponse) => Math.round(fractionOf(d) * 100);

async function fetchLimit(mode: string): Promise<RateLimitResponse | null> {
    try {
        return await ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: mode } });
    } catch (e) {
        logger.warn("Failed to fetch rate limits for", mode, e);
        return null;
    }
}

function refreshImagineQuota() {
    CreditQuotaStore.useCreditQuotaStore.getState().fetchQuotas();
}

async function refresh() {
    refreshImagineQuota();
    const ids = ModesStore.useModesStore.getState().modes.map(m => m.id);
    const results = await Promise.all(ids.map(async id => [id, await fetchLimit(id)] as const));
    for (const [id, data] of results) if (data) limits.set(id, data);
    store.notify();
}

const useMode = () => ModesStore.useModesStore(s => s.selectedModeId);
const useIsImagine = () => RoutingStore.useRoutingStore(s => typeof s.route.page === "string" && s.route.page.startsWith("imagine"));
const useImagineQuotas = () => CreditQuotaStore.useCreditQuotaStore(s => s.quotas);

function isLimited(mode: string): boolean {
    const d = limits.get(mode);
    return d != null && remainingOf(d) === 0;
}

function isImagineLimited(quotas: CreditQuotaStoreState["quotas"] | undefined): boolean {
    if (!quotas) return false;
    return IMAGINE_BUCKETS.some(b => {
        const d = quotas[b];
        return d != null && d.available && d.remainingQueries === 0;
    });
}

function useCountdown(deadline: number, onExpire: () => void): number {
    const [left, setLeft] = useState(() => Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));

    useEffect(() => {
        setLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
        const id = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
            setLeft(remaining);
            if (remaining <= 0) {
                clearInterval(id);
                onExpire();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [deadline, onExpire]);

    return left;
}

function TriggerCountdown({ seconds }: { seconds: number }) {
    const deadline = useMemo(() => Date.now() + seconds * 1000, [seconds]);
    const left = useCountdown(deadline, refresh);
    return <span>{formatCountdown(left)}</span>;
}

function Countdown({ deadline, onExpire }: { deadline: number; onExpire: () => void }) {
    const left = useCountdown(deadline, onExpire);
    return <Text size="xs" color="secondary">{formatCountdown(left)}</Text>;
}

function ProgressRing({ fraction }: { fraction: number }) {
    return (
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} className={cl("ring")}>
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

function TriggerIcon({ limited, ring, fraction }: { limited: boolean; ring: boolean; fraction: number }) {
    if (limited) return <ClockAlertIcon width={18} height={20} className={cl("icon-limited")} />;
    if (ring) return <ProgressRing fraction={fraction} />;
    return <UsageProgressIcon width={18} height={18} />;
}

function ButtonLabel({ mode }: { mode: string }) {
    useExternalStore(store);
    const { display } = settings.use(["display"]);
    const data = limits.get(mode);
    if (!data) return null;
    if (remainingOf(data) === 0 && data.waitTimeSeconds) return <TriggerCountdown seconds={data.waitTimeSeconds} />;
    if (display === "fraction") return <span>{remainingOf(data)}/{totalOf(data)}</span>;
    if (display === "percent") return <span>{percentOf(data)}%</span>;
    return <span>{remainingOf(data)}</span>;
}

function formatImagineCount(data: ImagineCreditQuota | undefined): string {
    if (!data || !data.available) return "—";
    if (data.remainingQueries >= UNLIMITED_THRESHOLD) return "—";
    return String(data.remainingQueries);
}

function ImagineButtonLabel({ quotas }: { quotas: CreditQuotaStoreState["quotas"] | undefined }) {
    const img = quotas?.image;
    if (!img) return null;
    return <span>{formatImagineCount(img)}</span>;
}

function ButtonIcon() {
    useExternalStore(store);
    const mode = useMode();
    const isImagine = useIsImagine();
    const quotas = useImagineQuotas();
    const { display } = settings.use(["display"]);
    const data = limits.get(mode);
    const limited = isImagine ? isImagineLimited(quotas) : isLimited(mode);
    const ring = !isImagine && display === "ring" && data != null;

    useEffect(() => { refresh(); }, []);

    return (
        <span className={cl("trigger")}>
            <TriggerIcon limited={limited} ring={ring} fraction={data ? fractionOf(data) : 1} />
            {isImagine ? <ImagineButtonLabel quotas={quotas} /> : <ButtonLabel mode={mode} />}
        </span>
    );
}

function ModeStatus({ data, deadline }: { data?: RateLimitResponse; deadline: number }) {
    if (!data) return <Text size="xs" color="muted">—</Text>;
    if (remainingOf(data) === 0 && data.waitTimeSeconds) return <Countdown deadline={deadline} onExpire={refresh} />;
    return <Text size="xs" color="secondary">{remainingOf(data)}/{totalOf(data)} · {percentOf(data)}%</Text>;
}

function ModeRow({ title, data, active }: { title: string; data?: RateLimitResponse; active: boolean }) {
    const deadline = useMemo(() => Date.now() + (data?.waitTimeSeconds ?? 0) * 1000, [data?.waitTimeSeconds]);

    return (
        <Flex flexDirection="column" gap={0} className={classes(cl("row"), active && cl("row-active"))}>
            <Flex justifyContent="space-between" alignItems="center" gap={8}>
                <Text size="sm" weight={active ? "semibold" : "medium"} className={cl("mode-label")}>{title}</Text>
                <ModeStatus data={data} deadline={deadline} />
            </Flex>
            {data && <div className={cl("bar")}><div className={cl("bar-fill")} style={{ transform: `scaleX(${fractionOf(data)})` }} /></div>}
            {data && <Text size="xs" color="muted">Resets in {formatDuration(data.windowSizeSeconds)}</Text>}
        </Flex>
    );
}

function TooltipPanel() {
    useExternalStore(store);
    const mode = useMode();
    const isImagine = useIsImagine();
    const quotas = useImagineQuotas();
    const modes = ModesStore.useModesStore(s => s.modes);

    if (isImagine) return <ImagineTooltipPanel quotas={quotas} />;

    return (
        <Flex flexDirection="column" gap={2} className={cl("panel")}>
            {modes.map(m => (
                <ModeRow key={m.id} title={m.title} data={limits.get(m.id)} active={m.id === mode} />
            ))}
        </Flex>
    );
}

function ImagineTooltipPanel({ quotas }: { quotas: CreditQuotaStoreState["quotas"] | undefined }) {
    const windowSec = quotas?.image?.windowSizeSeconds ?? 0;

    return (
        <Flex flexDirection="column" gap={2} className={cl("panel")}>
            {IMAGINE_BUCKETS.map(b => {
                const data = quotas?.[b];
                const exhausted = data?.available && data.remainingQueries === 0;
                return (
                    <Flex key={b} justifyContent="space-between" alignItems="center" gap={8} className={cl("row")}>
                        <Text size="sm" weight="medium" className={cl("mode-label")}>{IMAGINE_LABELS[b]}</Text>
                        {exhausted && data?.nextAvailableAt
                            ? <Countdown deadline={data.nextAvailableAt} onExpire={refreshImagineQuota} />
                            : <Text size="xs" color={!data?.available ? "muted" : "secondary"}>{formatImagineCount(data)}</Text>}
                    </Flex>
                );
            })}
            {windowSec > 0 && <Text size="xs" color="muted">Rolling window: {formatDuration(windowSec)}</Text>}
        </Flex>
    );
}

export default definePlugin({
    name: "RateLimitDisplay",
    description: "Shows rate limit usage for the current model mode in the chat bar.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings,

    chatBarButton: {
        icon: () => <ButtonIcon />,
        tooltip: () => <TooltipPanel />,
        onClick: () => refresh(),
        order: 0,
        className: "text-fg-primary",
        locations: ["chat", "imagine"],
    },

    stop() {
        limits.clear();
    },

    zustand: {
        ModesStore: {
            selector: (s: ModesStoreState) => s.selectedModeId,
            handler() { refresh(); },
        },
        CreditQuotaStore: {
            selector: (s: CreditQuotaStoreState) => s.generationSeq,
            handler() { store.notify(); },
        },
    },

    events: {
        streamEnd() { refresh(); },
    },
});
