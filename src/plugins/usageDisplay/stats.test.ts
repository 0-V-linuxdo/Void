/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, test } from "bun:test";

import {
    applySnapshot,
    clearStats,
    dayDelta,
    emptyDay,
    formatDelta,
    localDateKey,
    pruneDays,
    recordChat,
    recordSnapshot,
    RETAIN_DEFAULT,
    RESET_DROP_PERCENT,
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

describe("recordSnapshot and recordChat", () => {
    const userId = "stats-test-user";

    test("writes a day, counts chats once per response, and clears", () => {
        clearStats(userId);
        const now = noon(2026, 8, 27);
        const snap = recordSnapshot(userId, 10, 100, RETAIN_DEFAULT, now);
        expect(snap?.startPercent).toBe(10);
        const first = recordChat(userId, "r1", RETAIN_DEFAULT, now);
        const again = recordChat(userId, "r1", RETAIN_DEFAULT, now);
        const second = recordChat(userId, "r2", RETAIN_DEFAULT, now);
        expect(first?.chats).toBe(1);
        expect(again?.chats).toBe(1);
        expect(second?.chats).toBe(2);
        clearStats(userId);
        expect(recordChat(userId, "r1", RETAIN_DEFAULT, now)?.chats).toBe(1);
        clearStats(userId);
    });
});
