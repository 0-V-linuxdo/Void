/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, test } from "bun:test";

import { canonicalizeMatch, countCaptureGroups } from "./patches";

describe("countCaptureGroups", () => {
    test("counts only real capturing groups", () => {
        expect(countCaptureGroups(String.raw`(a)(b)`)).toBe(2);
        expect(countCaptureGroups(String.raw`(?:a)(b)`)).toBe(1);
        expect(countCaptureGroups(String.raw`(?<name>a)(b)`)).toBe(2);
        expect(countCaptureGroups(String.raw`(?=a)(b)`)).toBe(1);
        expect(countCaptureGroups(String.raw`(?!a)(b)`)).toBe(1);
        expect(countCaptureGroups(String.raw`\(\)`)).toBe(0);
        expect(countCaptureGroups(String.raw`[()](c)`)).toBe(1);
    });
});

describe("canonicalizeMatch", () => {
    test("string i18n token becomes a quoted key (no dot escaping)", () => {
        const input: string = "#{i18n::user.name}";
        expect(canonicalizeMatch(input)).toBe('"user.name"');
    });

    test("plain strings pass through unchanged (i/jsx tokens are regex-only)", () => {
        const raw = String.raw`\i\.foo`;
        expect(canonicalizeMatch(raw)).toBe(raw);
        expect(canonicalizeMatch("plain")).toBe("plain");
    });

    test("regex i18n token becomes a quoted, dot-escaped key", () => {
        expect(canonicalizeMatch(/#{i18n::user.name}/).source).toBe(String.raw`"user\.name"`);
    });

    test("regex \\jsx token expands to the jsx call shape", () => {
        expect(canonicalizeMatch(new RegExp(String.raw`\jsx\{Foo\}`)).source).toBe(String.raw`\(0,(?:[A-Za-z_$][\w$]*)\.jsxs?\)\(\{Foo\}`);
    });
});
