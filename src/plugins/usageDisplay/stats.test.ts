/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, test } from "bun:test";

import {
    CHART_SCALE_MIN,
    CHART_WINDOW,
    RETAIN_DEFAULT,
    RESET_DROP_PERCENT,
    applySnapshot,
    chartScale,
    clearStats,
    dayDelta,
    emptyDay,
    fillChartDays,
    formatDayLabel,
    formatDayNumber,
    formatDelta,
    localDateKey,
    pruneDays,
    recordSnapshot,
    shiftDateKey,
} from "./stats";

const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12, 0, 0).getTime();

describe("localDateKey", () => {
    test("uses the local calendar day", () => {
        expect(localDateKey(noon(2026, 8, 27))).toBe("2026-08-27");
    });
});

describe("applySnapshot", () => {
    test("sets start and last on the first snapshot", () => {
        const rec = applySnapshot(emptyDay("2026-08-27", 1), 12.5, 1_787_529_600_000, 2);
        expect(rec.startPercent).toBe(12.5);
        expect(rec.lastPercent).toBe(12.5);
        expect(rec.resetAt).toBe(1_787_529_600_000);
    });

    test("keeps start and raises last", () => {
        const first = applySnapshot(emptyDay("2026-08-27", 1), 12.5, 100, 2);
        const rec = applySnapshot(first, 18, 100, 3);
        expect(rec.startPercent).toBe(12.5);
        expect(rec.lastPercent).toBe(18);
    });

    test("treats a large percent drop as a week reset", () => {
        const first = applySnapshot(emptyDay("2026-08-27", 1), 80, 100, 2);
        const rec = applySnapshot(first, 80 - RESET_DROP_PERCENT - 1, 100, 3);
        expect(rec.startPercent).toBe(74);
        expect(rec.lastPercent).toBe(74);
    });

    test("resets start when resetAt changes", () => {
        const first = applySnapshot(emptyDay("2026-08-27", 1), 80, 100, 2);
        const rec = applySnapshot(first, 4, 200, 3);
        expect(rec.startPercent).toBe(4);
        expect(rec.lastPercent).toBe(4);
        expect(rec.resetAt).toBe(200);
    });

    test("ignores a null percent", () => {
        const first = applySnapshot(emptyDay("2026-08-27", 1), 12, 100, 2);
        const rec = applySnapshot(first, null, 100, 3);
        expect(rec.startPercent).toBe(12);
        expect(rec.lastPercent).toBe(12);
    });
});

describe("dayDelta", () => {
    test("returns null until both ends exist", () => {
        expect(dayDelta(emptyDay("2026-08-27", 1))).toBeNull();
    });

    test("is last minus start, floored at zero", () => {
        const rec = applySnapshot(emptyDay("2026-08-27", 1), 10, 100, 2);
        expect(dayDelta(applySnapshot(rec, 15.5, 100, 3))).toBe(5.5);
        expect(dayDelta(applySnapshot(rec, 9.5, 100, 3))).toBe(0);
    });
});

describe("formatDelta", () => {
    test("formats missing, zero, and positive", () => {
        expect(formatDelta(null)).toBe("—");
        expect(formatDelta(0)).toBe("0%");
        expect(formatDelta(4.2)).toBe("+4.2%");
    });
});

describe("pruneDays", () => {
    test("keeps retainDays calendar days including today", () => {
        const now = noon(2026, 8, 27);
        const days = {
            "2026-08-20": emptyDay("2026-08-20", 1),
            "2026-08-21": emptyDay("2026-08-21", 1),
            "2026-08-27": emptyDay("2026-08-27", 1),
        };
        const pruned = pruneDays(days, 7, now);
        expect(pruned["2026-08-20"]).toBeUndefined();
        expect(pruned["2026-08-21"]).toBeDefined();
        expect(pruned["2026-08-27"]).toBeDefined();
    });
});

describe("recordSnapshot", () => {
    const userId = "stats-test-user";

    test("writes a day and clears", () => {
        clearStats(userId);
        const now = noon(2026, 8, 27);
        const snap = recordSnapshot(userId, 10, 100, RETAIN_DEFAULT, now);
        expect(snap?.startPercent).toBe(10);
        expect(snap?.lastPercent).toBe(10);
        const next = recordSnapshot(userId, 14, 100, RETAIN_DEFAULT, now);
        expect(next?.startPercent).toBe(10);
        expect(next?.lastPercent).toBe(14);
        clearStats(userId);
        expect(recordSnapshot(userId, 8, 100, RETAIN_DEFAULT, now)?.startPercent).toBe(8);
        clearStats(userId);
    });
});

describe("shiftDateKey", () => {
    test("steps across month ends", () => {
        expect(shiftDateKey("2026-08-31", 1)).toBe("2026-09-01");
        expect(shiftDateKey("2026-08-29", 1 - CHART_WINDOW)).toBe("2026-08-23");
    });
});

describe("formatDayLabel", () => {
    test("stays in English", () => {
        const label = formatDayLabel("2026-08-29");
        expect(label).toContain("Aug");
        expect(label).toContain("29");
        expect(label).not.toMatch(/[月周]/);
    });
});

describe("formatDayNumber", () => {
    test("strips the leading zero", () => {
        expect(formatDayNumber("2026-08-09")).toBe("9");
        expect(formatDayNumber("2026-08-29")).toBe("29");
    });
});

describe("fillChartDays", () => {
    test("pads at least a week ending today", () => {
        const now = noon(2026, 8, 29);
        const rec = applySnapshot(applySnapshot(emptyDay("2026-08-29", 1), 10, 100, 2), 18, 100, 3);
        const bars = fillChartDays([rec], now);
        expect(bars).toHaveLength(CHART_WINDOW);
        expect(bars[0]?.date).toBe("2026-08-23");
        expect(bars[6]?.date).toBe("2026-08-29");
        expect(bars[6]?.lastPercent).toBe(18);
        expect(bars[0]?.startPercent).toBeNull();
    });

    test("extends left for older records", () => {
        const now = noon(2026, 8, 29);
        const bars = fillChartDays([
            emptyDay("2026-08-20", 1),
            applySnapshot(emptyDay("2026-08-29", 1), 10, 100, 2),
        ], now);
        expect(bars[0]?.date).toBe("2026-08-20");
        expect(bars.at(-1)?.date).toBe("2026-08-29");
        expect(bars).toHaveLength(10);
    });
});

describe("chartScale", () => {
    test("uses a 20 percent floor", () => {
        expect(chartScale([])).toBe(CHART_SCALE_MIN);
    });

    test("rounds max delta up to tens", () => {
        const rec = applySnapshot(applySnapshot(emptyDay("2026-08-29", 1), 10, 100, 2), 38, 100, 3);
        expect(dayDelta(rec)).toBe(28);
        expect(chartScale([rec])).toBe(30);
    });
});
