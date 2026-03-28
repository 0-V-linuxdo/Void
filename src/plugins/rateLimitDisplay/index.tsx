/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Flex } from "@components/Flex";
import { GaugeIcon } from "@components/icons";
import { Text } from "@components/Text";
import { Popover, PopoverContent, PopoverTrigger } from "@turbopack/common/components";
import { React, useCallback, useEffect, useState } from "@turbopack/common/react";
import { ModesStore } from "@turbopack/common/stores";
import { ApiClients } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { classes,classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore, formatCountdown, formatDuration } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { StartAt } from "@utils/types";

const logger = new Logger("RateLimitDisplay");
const cl = classNameFactory("void-rld-");

const MODES = ["auto", "fast", "expert", "heavy"] as const;
type ModeName = typeof MODES[number];

interface RateLimitData {
    windowSizeSeconds: number;
    remainingQueries: number;
    totalQueries: number;
    waitTimeSeconds?: number;
}

type LimitsMap = Partial<Record<ModeName, RateLimitData>>;

const store = createExternalStore();
let limits: LimitsMap = {};
let pollTimer: ReturnType<typeof setInterval> | null = null;

const getMode = (): ModeName => (ModesStore.useModesStore?.getState().selectedModeId as ModeName) ?? "auto";

async function fetchLimit(mode: ModeName): Promise<RateLimitData | null> {
    try {
        return await ApiClients.rateLimitsApi.rateLimitsGetRateLimits({ body: { modelName: mode } }) as RateLimitData;
    } catch (e) {
        logger.warn("Failed to fetch rate limits for", mode, e);
        return null;
    }
}

async function fetchCurrent() {
    const mode = getMode();
    const data = await fetchLimit(mode);
    if (!data) return;
    limits = { ...limits, [mode]: data };
    store.notify();
}

async function fetchAll() {
    const results = await Promise.all(MODES.map(async m => [m, await fetchLimit(m)] as const));
    const next = { ...limits };
    for (const [mode, data] of results) {
        if (data) next[mode] = data;
    }
    limits = next;
    store.notify();
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
                fetchCurrent();
            }
        }, 1000);
        return () => clearInterval(id);
    }, [seconds]);

    return <span className={cl("countdown")}>{formatCountdown(left)}</span>;
}

function barColor(pct: number): string {
    if (pct > 0.5) return "var(--color-success)";
    if (pct > 0.2) return "var(--color-warning)";
    return "var(--color-destructive)";
}

function ModeRow({ mode, data, active }: { mode: ModeName; data?: RateLimitData; active: boolean }) {
    const limited = data != null && data.remainingQueries === 0;
    const pct = data ? data.remainingQueries / Math.max(data.totalQueries, 1) : 1;

    return (
        <Flex flexDirection="column" gap={4} className={classes(cl("row"), active && cl("row-active"))}>
            <Flex justifyContent="space-between" alignItems="center" gap={8}>
                <Text size="sm" weight={active ? "semibold" : "medium"} className={cl("mode-label")}>
                    {mode}
                </Text>
                {data ? (
                    limited && data.waitTimeSeconds
                        ? <CountdownTimer seconds={data.waitTimeSeconds} />
                        : <Text size="xs" color="secondary">{data.remainingQueries}/{data.totalQueries}</Text>
                ) : (
                    <Text size="xs" color="muted">—</Text>
                )}
            </Flex>
            {data && (
                <div className={cl("bar-track")}>
                    <div className={cl("bar-fill")} style={{ width: `${pct * 100}%`, backgroundColor: barColor(pct) }} />
                </div>
            )}
            {data && <Text size="xs" color="muted">Resets in {formatDuration(data.windowSizeSeconds)}</Text>}
        </Flex>
    );
}

function Widget() {
    useExternalStore(store);
    const [open, setOpen] = useState(false);
    const mode = (ModesStore.useModesStore(s => s.selectedModeId) as ModeName) ?? "auto";
    const data = limits[mode];
    const limited = data != null && data.remainingQueries === 0;

    const onOpenChange = useCallback((v: boolean) => {
        setOpen(v);
        if (v) fetchAll();
    }, []);

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                <Flex gap={4} alignItems="center" className={cl("trigger")}>
                    <GaugeIcon size={18} className={limited ? cl("icon-limited") : undefined} />
                    {data && (
                        <Text size="xs" weight="medium" color={limited ? "muted" : "secondary"}>
                            {data.remainingQueries}/{data.totalQueries}
                        </Text>
                    )}
                </Flex>
            </PopoverTrigger>
            <PopoverContent side="top" align="center" className={cl("popover")}>
                <Flex flexDirection="column" gap={8}>
                    <Text size="sm" weight="semibold">Rate Limits</Text>
                    {MODES.map(m => (
                        <ModeRow key={m} mode={m} data={limits[m]} active={m === mode} />
                    ))}
                </Flex>
            </PopoverContent>
        </Popover>
    );
}

export default definePlugin({
    name: "RateLimitDisplay",
    description: "Shows rate limit usage for the current model mode in the chat bar.",
    authors: [Devs.Prism],
    tags: ["chat"],
    startAt: StartAt.TurbopackReady,

    chatBarButton: {
        icon: () => <Widget />,
        tooltip: "Rate limits",
        order: 100,
    },

    start() {
        fetchCurrent();
        pollTimer = setInterval(fetchCurrent, 60_000);
    },

    stop() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
        limits = {};
    },

    zustand: {
        ModesStore: {
            selector: (s: { selectedModeId: string }) => s.selectedModeId,
            handler() { fetchCurrent(); },
        },
    },
});
