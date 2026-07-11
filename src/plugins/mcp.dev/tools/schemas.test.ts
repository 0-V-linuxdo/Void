/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { describe, expect, test } from "bun:test";

import { TOOL_DEFINITIONS, toolSchemas } from "./schemas";

describe("tool definitions", () => {
    test("exposes the expected tools", () => {
        expect(TOOL_DEFINITIONS.map(t => t.name).toSorted()).toEqual([
            "evaluateCode", "intercept", "module", "network", "patch", "plugin", "react", "recon", "request", "search", "store",
        ]);
    });

    test("every tool carries annotations and an object inputSchema", () => {
        for (const t of TOOL_DEFINITIONS) {
            expect(t.annotations).toBeDefined();
            expect((t.inputSchema as { type?: string }).type).toBe("object");
        }
    });

    test("module inputSchema requires action", () => {
        const mod = TOOL_DEFINITIONS.find(t => t.name === "module");
        if (!mod) throw new Error("module tool missing");
        expect((mod.inputSchema as { required?: string[] }).required).toContain("action");
    });
});

describe("schema validation + defaults", () => {
    test("patch applies its defaults", () => {
        const parsed = toolSchemas.patch.input.parse({ action: "list" });
        expect(parsed.window).toBe(1200);
        expect(parsed.context).toBe(120);
        expect(parsed.severity).toBe("error");
    });

    test("unknown action is rejected", () => {
        expect(toolSchemas.module.input.safeParse({ action: "bogus" }).success).toBe(false);
    });

    test("evaluateCode requires code", () => {
        expect(toolSchemas.evaluateCode.input.safeParse({}).success).toBe(false);
        expect(toolSchemas.evaluateCode.input.safeParse({ code: "1+1" }).success).toBe(true);
    });

    test("request applies its defaults and rejects unknown action", () => {
        const parsed = toolSchemas.request.input.parse({ action: "send", path: "/rest/assets" });
        expect(parsed.method).toBe("GET");
        expect(parsed.allowWrite).toBe(false);
        expect(parsed.timeout).toBe(15_000);
        expect(toolSchemas.request.input.safeParse({ action: "bogus" }).success).toBe(false);
    });
});
