/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, test } from "bun:test";

import { clamp, formatCountdown, formatDuration, safeUrl, sanitizeFilename } from "./misc";

describe("safeUrl (scheme guard)", () => {
    test("allows http, https, and mailto", () => {
        expect(safeUrl("https://x.ai")).toBe("https://x.ai");
        expect(safeUrl("http://localhost:3000")).toBe("http://localhost:3000");
        expect(safeUrl("mailto:a@b.com")).toBe("mailto:a@b.com");
    });

    test("blocks dangerous or invalid urls", () => {
        expect(safeUrl("javascript:alert(1)")).toBeNull();
        expect(safeUrl("data:text/html,<script>1</script>")).toBeNull();
        expect(safeUrl("not a url")).toBeNull();
    });
});

describe("misc formatting", () => {
    test("clamp bounds the value", () => {
        expect(clamp(5, 0, 3)).toBe(3);
        expect(clamp(-1, 0, 3)).toBe(0);
        expect(clamp(2, 0, 3)).toBe(2);
    });

    test("formatDuration", () => {
        expect(formatDuration(0)).toBe("0m");
        expect(formatDuration(90)).toBe("1m");
        expect(formatDuration(3661)).toBe("1h 1m");
    });

    test("formatCountdown", () => {
        expect(formatCountdown(0)).toBe("0:00");
        expect(formatCountdown(65)).toBe("1:05");
        expect(formatCountdown(3600)).toBe("1:00:00");
    });

    test("sanitizeFilename strips unsafe chars and falls back", () => {
        expect(sanitizeFilename("a/b:c*?.txt")).toBe("abc.txt");
        expect(sanitizeFilename("")).toBe("file");
    });
});
