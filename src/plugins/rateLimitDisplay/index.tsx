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
import type { CreditQuotaStoreState, ImagineCreditBucket, ImagineCreditQuota } from "@grok-types/stores/CreditQuotaStore";
import type { ModesStoreState } from "@grok-types/stores/ModesStore";
import { React, useEffect, useState } from "@turbopack/common/react";
import { CreditQuotaStore, ModesStore, RoutingStore } from "@turbopack/common/stores";
import { ApiClients } from "@turbopack/common/utils";
import { findExportedComponentLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore, formatCountdown, formatDuration } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("RateLimitDisplay");
const cl = classNameFactory("void-rld-");

const UsageProgressIcon = findExportedComponentLazy("UsageProgressIcon");

const settings = definePluginSettings({
    hideTotal: {
        type: OptionType.BOOLEAN,
        description: "Show only remaining queries instead of remaining/total.",
        default: true,
    },
});

const MODES = ["auto", "fast", "expert", "heavy", "grok-420-computer-use-sa"] as const;
type ModeName = typeof MODES[number];

const MODE_LABELS: Record<ModeName, string> = {
    "auto": "auto",
    "fast": "fast",
    "expert": "expert",
    "heavy": "heavy",
    "grok-420-computer-use-sa": "grok 4.3",
};

interface RateLimitData {
    windowSizeSeconds: number;
    remainingQueries: number;
    totalQueries: number;
    waitTimeSeconds?: number;
}

type LimitsMap = Partial<Record<ModeName, RateLimitData>>;

const IMAGINE_BUCKETS: readonly ImagineCreditBucket[] = ["image", "imagePro", "imageEdit", "video", "video720p"] as const;

const IMAGINE_LABELS: Record<ImagineCreditBucket, string> = {
    image: "Speed Images",
    imagePro: "Quality Images",
    imageEdit: "Image Edits",
    video: "Videos 480p",
    video720p: "Videos 720p",
};

const UNLIMITED_THRESHOLD = Number.MAX_SAFE_INTEGER;

const store = createExternalStore();
let limits: LimitsMap = {};

async function fetchLimit(mode: ModeName): Promise<RateLimitData | null> {
    try {
        return await ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: mode } }) as RateLimitData;
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
    const results = await Promise.all(MODES.map(async m => [m, await fetchLimit(m)] as const));
    const next = { ...limits };
    for (const [m, data] of results) {
        if (data) next[m] = data;
    }
    limits = next;
    store.notify();
}

const useMode = (): ModeName => (ModesStore.useModesStore(s => s.selectedModeId) as ModeName) ?? "auto";
const useIsImagine = (): boolean => RoutingStore.useRoutingStore(s => typeof s.route.page === "string" && s.route.page.startsWith("imagine"));
const useImagineQuotas = (): CreditQuotaStoreState["quotas"] => CreditQuotaStore.useCreditQuotaStore(s => s.quotas);

function isLimited(mode: ModeName): boolean {
    if (mode === "auto") return limits.expert?.remainingQueries === 0 || limits.fast?.remainingQueries === 0;
    return limits[mode]?.remainingQueries === 0;
}

function ButtonIcon() {
    useExternalStore(store);
    const mode = useMode();
    const isImagine = useIsImagine();
    const quotas = useImagineQuotas();
    const limited = isImagine ? isImagineLimited(quotas) : isLimited(mode);

    useEffect(() => { refresh(); }, []);

    const icon = limited
        ? <ClockAlertIcon width={18} height={20} className={cl("icon-limited")} />
        : <UsageProgressIcon width={18} height={18} />;

    return (
        <span className={cl("trigger")}>
            {icon}
            {isImagine ? <ImagineButtonLabel quotas={quotas} /> : <ButtonLabel mode={mode} />}
        </span>
    );
}

function isImagineLimited(quotas: CreditQuotaStoreState["quotas"] | undefined): boolean {
    if (!quotas) return false;
    return IMAGINE_BUCKETS.some(b => {
        const d = quotas[b];
        return d != null && d.available && d.remainingQueries === 0;
    });
}

function formatImagineCount(data: ImagineCreditQuota | undefined): string {
    if (!data || !data.available) return "—";
    if (data.remainingQueries >= UNLIMITED_THRESHOLD) return "—";
    return String(data.remainingQueries);
}

function ImagineButtonLabel({ quotas }: { quotas: CreditQuotaStoreState["quotas"] | undefined }) {
    const img = quotas?.image;
    if (!img) return null;
    return <span className="truncate text-sm font-semibold">{formatImagineCount(img)}</span>;
}

function renderRemaining(data: RateLimitData | undefined, hideTotal: boolean) {
    if (!data) return <span className="truncate text-sm font-semibold">—</span>;
    if (data.remainingQueries === 0 && data.waitTimeSeconds) return <CountdownTimer seconds={data.waitTimeSeconds} />;
    return <span className="truncate text-sm font-semibold">{hideTotal ? data.remainingQueries : `${data.remainingQueries}/${data.totalQueries}`}</span>;
}

function ButtonLabel({ mode }: { mode: ModeName }) {
    useExternalStore(store);
    const { hideTotal } = settings.use(["hideTotal"]);

    if (mode === "auto") {
        const { expert, fast } = limits;
        if (!expert && !fast) return null;
        return (
            <span className={cl("auto-label")}>
                {renderRemaining(expert, hideTotal)}
                <span className="truncate text-sm font-semibold">·</span>
                {renderRemaining(fast, hideTotal)}
            </span>
        );
    }

    const data = limits[mode];
    if (!data) return null;
    if (data.remainingQueries === 0 && data.waitTimeSeconds) return <CountdownTimer seconds={data.waitTimeSeconds} />;
    return <span className="truncate text-sm font-semibold">{hideTotal ? data.remainingQueries : `${data.remainingQueries}/${data.totalQueries}`}</span>;
}

function CountdownTimer({ seconds }: { seconds: number }) {
    const [left, setLeft] = useState(seconds);

    useEffect(() => {
        setLeft(seconds);
        const start = Date.now();
        const id = setInterval(() => {
            const remaining = Math.max(0, seconds - Math.floor((Date.now() - start) / 1000));
            setLeft(remaining);
            if (remaining <= 0) {
                clearInterval(id);
                refresh();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [seconds]);

    return <span className="truncate text-sm font-semibold">{formatCountdown(left)}</span>;
}

function ModeRow({ mode, data, active }: { mode: ModeName; data?: RateLimitData; active: boolean }) {
    const { hideTotal } = settings.use(["hideTotal"]);
    const limited = data != null && data.remainingQueries === 0;

    return (
        <Flex flexDirection="column" gap={0} className={classes(cl("row"), active && cl("row-active"))}>
            <Flex justifyContent="space-between" alignItems="center" gap={8}>
                <Text size="sm" weight={active ? "semibold" : "medium"} className={cl("mode-label")}>
                    {MODE_LABELS[mode]}
                </Text>
                {data ? (
                    limited && data.waitTimeSeconds
                        ? <CountdownTimer seconds={data.waitTimeSeconds} />
                        : <Text size="xs" color="secondary">{hideTotal ? data.remainingQueries : `${data.remainingQueries}/${data.totalQueries}`}</Text>
                ) : (
                    <Text size="xs" color="muted">—</Text>
                )}
            </Flex>
            {data && <Text size="xs" color="muted">Resets in {formatDuration(data.windowSizeSeconds)}</Text>}
        </Flex>
    );
}

function TooltipPanel() {
    useExternalStore(store);
    const mode = useMode();
    const isImagine = useIsImagine();
    const quotas = useImagineQuotas();

    if (isImagine) return <ImagineTooltipPanel quotas={quotas} />;

    return (
        <Flex flexDirection="column" gap={2} className={cl("panel")}>
            {MODES.map(m => (
                <ModeRow key={m} mode={m} data={limits[m]} active={m === mode} />
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
                            ? <NextAvailableCountdown ts={data.nextAvailableAt} />
                            : <Text size="xs" color={!data?.available ? "muted" : "secondary"}>{formatImagineCount(data)}</Text>}
                    </Flex>
                );
            })}
            {windowSec > 0 && <Text size="xs" color="muted">Rolling window: {formatDuration(windowSec)}</Text>}
        </Flex>
    );
}

function NextAvailableCountdown({ ts }: { ts: number }) {
    const [left, setLeft] = useState(Math.max(0, Math.floor((ts - Date.now()) / 1000)));

    useEffect(() => {
        setLeft(Math.max(0, Math.floor((ts - Date.now()) / 1000)));
        const id = setInterval(() => {
            const remaining = Math.max(0, Math.floor((ts - Date.now()) / 1000));
            setLeft(remaining);
            if (remaining <= 0) {
                clearInterval(id);
                refreshImagineQuota();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [ts]);

    return <Text size="xs" color="secondary">{formatCountdown(left)}</Text>;
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
        limits = {};
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
