/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, test } from "bun:test";

import { parseStoredSettings, STORAGE_KEY, STORAGE_KEYS } from "./SettingsStore";

describe("parseStoredSettings", () => {
    test("returns objects as-is", () => {
        const raw = { plugins: { NoDictation: { enabled: true } } };
        expect(parseStoredSettings(raw)).toEqual(raw);
    });

    test("parses a JSON string", () => {
        const raw = { plugins: { UsageDisplay: { enabled: true, usageStats: false } } };
        expect(parseStoredSettings(JSON.stringify(raw))).toEqual(raw);
    });

    test("parses a double-encoded JSON string", () => {
        const raw = { plugins: { Settings: { enabled: true } } };
        expect(parseStoredSettings(JSON.stringify(JSON.stringify(raw)))).toEqual(raw);
    });

    test("returns null for empty, invalid, or non-object values", () => {
        expect(parseStoredSettings(null)).toBe(null);
        expect(parseStoredSettings(undefined)).toBe(null);
        expect(parseStoredSettings("")).toBe(null);
        expect(parseStoredSettings("not json")).toBe(null);
        expect(parseStoredSettings("[]")).toBe(null);
        expect(parseStoredSettings(42)).toBe(null);
    });
});

describe("storage keys", () => {
    test("prefers VoidPPSettings and still writes the legacy VoidSettings key", () => {
        expect(STORAGE_KEY).toBe("VoidPPSettings");
        expect(STORAGE_KEYS).toEqual(["VoidPPSettings", "VoidSettings"]);
    });
});
