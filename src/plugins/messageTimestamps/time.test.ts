/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, test } from "bun:test";

import {
    BORROW_MS,
    chooseTime,
    FRESH_MS,
    harvestResponses,
    isHumanSender,
    neighborTime,
    parseTime,
    recordId,
    shouldKeepStored,
    shouldPersistStamp,
    uuidTime,
} from "./time";

const NOW = Date.UTC(2026, 8, 12, 4, 0, 0);
const HOUR_AGO = NOW - 60 * 60 * 1000;
const ISO_HOUR_AGO = new Date(HOUR_AGO).toISOString();
const ISO_NOW = new Date(NOW).toISOString();
const HUMAN_V4 = "550e8400-e29b-41d4-a716-446655440000";

function v7(ms: number): string {
    const hex = ms.toString(16).padStart(12, "0");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-7000-8000-0123456789ab`;
}

describe("parseTime", () => {
    test("reads ISO strings", () => {
        expect(parseTime(ISO_HOUR_AGO, NOW)).toBe(HOUR_AGO);
    });

    test("reads unix seconds and milliseconds", () => {
        expect(parseTime(HOUR_AGO / 1000, NOW)).toBe(HOUR_AGO);
        expect(parseTime(HOUR_AGO, NOW)).toBe(HOUR_AGO);
        expect(parseTime(String(HOUR_AGO / 1000), NOW)).toBe(HOUR_AGO);
    });

    test("reads protobuf Timestamp and mongo $date", () => {
        expect(parseTime({ seconds: HOUR_AGO / 1000, nanos: 0 }, NOW)).toBe(HOUR_AGO);
        expect(parseTime({ seconds: String(HOUR_AGO / 1000), nanos: 0 }, NOW)).toBe(HOUR_AGO);
        expect(parseTime({ $date: { $numberLong: String(HOUR_AGO) } }, NOW)).toBe(HOUR_AGO);
    });

    test("does not treat proto objects or unix-seconds as now", () => {
        expect(parseTime({ seconds: HOUR_AGO / 1000, nanos: 0 }, NOW)).not.toBe(NOW);
        expect(parseTime(HOUR_AGO / 1000, NOW)).not.toBe(NOW);
    });

    test("rejects empty, invalid, and out-of-range values", () => {
        expect(parseTime(undefined, NOW)).toBeNull();
        expect(parseTime("", NOW)).toBeNull();
        expect(parseTime("not a date", NOW)).toBeNull();
        expect(parseTime(1_000, NOW)).toBeNull();
        expect(parseTime({}, NOW)).toBeNull();
    });
});

describe("uuidTime", () => {
    test("extracts unix ms from UUID v7", () => {
        expect(uuidTime(v7(HOUR_AGO), NOW)).toBe(HOUR_AGO);
    });

    test("ignores UUID v4", () => {
        expect(uuidTime(HUMAN_V4, NOW)).toBeNull();
    });
});

describe("recordId and isHumanSender", () => {
    test("prefers responseId then _id", () => {
        expect(recordId({ responseId: "a", _id: "b" })).toBe("a");
        expect(recordId({ _id: "b" })).toBe("b");
        expect(recordId({})).toBe("");
    });

    test("detects human senders", () => {
        expect(isHumanSender("human")).toBe(true);
        expect(isHumanSender("USER")).toBe(true);
        expect(isHumanSender("assistant")).toBe(false);
    });
});

describe("chooseTime", () => {
    test("keeps stored old time when the field was rewritten to now", () => {
        expect(chooseTime({
            fieldTimes: [NOW],
            stored: HOUR_AGO,
            uuid: null,
            now: NOW,
        })).toBe(HOUR_AGO);
    });

    test("uses a real field time when nothing is stored", () => {
        expect(chooseTime({
            fieldTimes: [HOUR_AGO],
            stored: null,
            uuid: null,
            now: NOW,
        })).toBe(HOUR_AGO);
    });

    test("falls back to UUID v7 when the field is load-now", () => {
        expect(chooseTime({
            fieldTimes: [NOW],
            stored: null,
            uuid: HOUR_AGO,
            now: NOW,
        })).toBe(HOUR_AGO);
    });

    test("live send keeps the field time when everything is fresh", () => {
        expect(chooseTime({
            fieldTimes: [NOW],
            stored: null,
            uuid: NOW - 10,
            now: NOW,
        })).toBe(NOW);
    });

    test("reload within the freshness window still prefers the first stored stamp", () => {
        const sent = NOW - 10_000;
        expect(chooseTime({
            fieldTimes: [NOW],
            stored: sent,
            uuid: sent,
            now: NOW,
        })).toBe(sent);
    });

    test("returns null when nothing is usable", () => {
        expect(chooseTime({
            fieldTimes: [],
            stored: null,
            uuid: null,
            now: NOW,
        })).toBeNull();
    });
});

describe("shouldKeepStored", () => {
    test("rejects a later now-like overwrite", () => {
        expect(shouldKeepStored(HOUR_AGO, NOW, NOW)).toBe(true);
        expect(shouldKeepStored(NOW - 5_000, NOW, NOW)).toBe(true);
    });

    test("accepts an older server stamp over a fresh optimistic one", () => {
        expect(shouldKeepStored(NOW, HOUR_AGO, NOW)).toBe(false);
    });
});

describe("shouldPersistStamp", () => {
    test("does not persist a first-seen fresh human stamp", () => {
        expect(shouldPersistStamp("human", NOW, null, NOW)).toBe(false);
        expect(shouldPersistStamp("assistant", NOW, null, NOW)).toBe(true);
        expect(shouldPersistStamp("human", HOUR_AGO, null, NOW)).toBe(true);
    });

    test("overwrites a poisoned now with a trusted older stamp", () => {
        expect(shouldPersistStamp("human", HOUR_AGO, NOW, NOW)).toBe(true);
        expect(shouldPersistStamp("human", NOW, HOUR_AGO, NOW)).toBe(false);
    });
});

describe("neighborTime", () => {
    test("borrows a child assistant thinkingStartTime", () => {
        const child = v7(HOUR_AGO);
        expect(neighborTime(HUMAN_V4, [
            { responseId: HUMAN_V4, sender: "human", createTime: ISO_NOW },
            { responseId: child, sender: "assistant", parentResponseId: HUMAN_V4, createTime: ISO_NOW, thinkingStartTime: ISO_HOUR_AGO },
        ], NOW)).toBe(HOUR_AGO - BORROW_MS);
    });

    test("falls back to the next sibling", () => {
        expect(neighborTime(HUMAN_V4, [
            { responseId: HUMAN_V4, sender: "human", createTime: ISO_NOW },
            { responseId: v7(HOUR_AGO), sender: "assistant", createTime: ISO_HOUR_AGO },
        ], NOW)).toBe(HOUR_AGO - BORROW_MS);
    });

    test("ignores a fresh-only neighbor", () => {
        expect(neighborTime(HUMAN_V4, [
            { responseId: HUMAN_V4, sender: "human", createTime: ISO_NOW },
            { responseId: "child", sender: "assistant", parentResponseId: HUMAN_V4, createTime: ISO_NOW },
        ], NOW)).toBeNull();
    });
});

describe("harvestResponses", () => {
    test("walks load-responses payloads", () => {
        const hits = harvestResponses({
            responses: [
                { responseId: "a", createTime: ISO_HOUR_AGO },
                { responseId: "b", create_time: { seconds: HOUR_AGO / 1000, nanos: 0 } },
            ],
        }, NOW);
        expect(hits).toEqual([
            { id: "a", ms: HOUR_AGO },
            { id: "b", ms: HOUR_AGO },
        ]);
    });

    test("treats _id as a responseId alias", () => {
        const hits = harvestResponses({
            responses: [{ _id: "legacy", createTime: ISO_HOUR_AGO }],
        }, NOW);
        expect(hits).toEqual([{ id: "legacy", ms: HOUR_AGO }]);
    });

    test("borrows assistant time for a human row rewritten to now", () => {
        const child = v7(HOUR_AGO);
        const hits = harvestResponses({
            responses: [
                { responseId: HUMAN_V4, sender: "human", createTime: ISO_NOW },
                { responseId: child, sender: "assistant", parentResponseId: HUMAN_V4, createTime: ISO_NOW, thinkingStartTime: ISO_HOUR_AGO },
            ],
        }, NOW);
        expect(hits).toContainEqual({ id: HUMAN_V4, ms: HOUR_AGO - BORROW_MS });
        expect(hits).toContainEqual({ id: child, ms: HOUR_AGO });
    });

    test("omits a fresh human with no trusted neighbor", () => {
        const hits = harvestResponses({
            responses: [
                { responseId: HUMAN_V4, sender: "human", createTime: ISO_NOW },
            ],
        }, NOW);
        expect(hits).toEqual([]);
    });
});

describe("FRESH_MS", () => {
    test("is two minutes", () => {
        expect(FRESH_MS).toBe(120_000);
    });
});
