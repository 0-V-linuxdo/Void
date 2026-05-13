/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { ClockAlertIcon, GaugeIcon } from "@components/icons";
import { Text } from "@components/Text";
import type { ModesStoreState } from "@grok-types/stores/ModesStore";
import { React, useEffect, useState } from "@turbopack/common/react";
import { ModesStore } from "@turbopack/common/stores";
import { ApiClients } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore, formatCountdown, formatDuration } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("RateLimitDisplay");
const cl = classNameFactory("void-rld-");

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

async function refresh() {
    const results = await Promise.all(MODES.map(async m => [m, await fetchLimit(m)] as const));
    const next = { ...limits };
    for (const [m, data] of results) {
        if (data) next[m] = data;
    }
    limits = next;
    store.notify();
}

const useMode = (): ModeName => (ModesStore.useModesStore(s => s.selectedModeId) as ModeName) ?? "auto";

function isLimited(mode: ModeName): boolean {
    if (mode === "auto") return limits.expert?.remainingQueries === 0 || limits.fast?.remainingQueries === 0;
    return limits[mode]?.remainingQueries === 0;
}

function ButtonIcon() {
    useExternalStore(store);
    const mode = useMode();
    const limited = isLimited(mode);

    useEffect(() => { refresh(); }, []);

    return (
        <span className={cl("trigger")}>
            {limited
                ? <ClockAlertIcon width={18} height={20} className={cl("icon-limited")} />
                : <GaugeIcon width={20} height={20} />}
            <ButtonLabel mode={mode} />
        </span>
    );
}

function renderRemaining(data: RateLimitData | undefined) {
    if (!data) return <span className="truncate text-sm font-semibold">—</span>;
    if (data.remainingQueries === 0 && data.waitTimeSeconds) return <CountdownTimer seconds={data.waitTimeSeconds} />;
    return <span className="truncate text-sm font-semibold">{data.remainingQueries}</span>;
}

function ButtonLabel({ mode }: { mode: ModeName }) {
    useExternalStore(store);
    const { hideTotal } = settings.use(["hideTotal"]);

    if (mode === "auto") {
        const { expert, fast } = limits;
        if (!expert && !fast) return null;
        return (
            <span className={cl("auto-label")}>
                {renderRemaining(expert)}
                <span className="truncate text-sm font-semibold">·</span>
                {renderRemaining(fast)}
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

    return (
        <Flex flexDirection="column" gap={2} className={cl("panel")}>
            {MODES.map(m => (
                <ModeRow key={m} mode={m} data={limits[m]} active={m === mode} />
            ))}
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
        onClick: refresh,
        order: 0,
        className: "text-fg-primary",
    },

    stop() {
        limits = {};
    },

    zustand: {
        ModesStore: {
            selector: (s: ModesStoreState) => s.selectedModeId,
            handler() { refresh(); },
        },
    },

    events: {
        streamEnd() { refresh(); },
    },
});
