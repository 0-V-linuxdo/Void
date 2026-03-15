/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const TOOL_DEFINITIONS = [
    {
        name: "module",
        description: "Turbopack module operations. find: by props/code/displayName/storeName. findAll/findBulk: multi-result. findComponent: by name or code. findModuleId/findByFactory: by factory source. exports: keys+types. stats: counts. source: factory code. diff: patched vs original. load/loadChunks: instantiate. mapMangled: map obfuscated keys. css: class modules. unloaded: not-yet-loaded. whereUsed: reverse deps. suggest: patch anchors. functionAt: extract fn body. imports/namedExports: deps+exports.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["find", "findAll", "findBulk", "findComponent", "findModuleId", "exports", "stats", "source", "diff", "imports", "namedExports", "load", "loadChunks", "findByFactory", "mapMangled", "css", "unloaded", "whereUsed", "suggest", "functionAt"] },
                props: { type: "array", items: { type: "string" }, description: "Export prop names." },
                code: { type: "array", items: { type: "string" }, description: "find/findAll: exported fn source. findModuleId/findByFactory/mapMangled/loadChunks: factory source." },
                displayName: { type: "string" },
                storeName: { type: "string", description: "Short name OK, e.g. 'chat' → useChatPageStore." },
                componentByCode: { type: "boolean" },
                id: { type: "number" },
                offset: { type: "number", default: 0 },
                limit: { type: "number" },
                patched: { type: "boolean", default: false },
                search: { type: "string", description: "Jump to string in source, overrides offset." },
                async: { type: "boolean", default: false },
                mappers: { type: "object", description: "{name: filterType}. Types: fn/string/number/boolean/object/array/component/hasProps:a,b/code:x." },
                pattern: { type: "string", description: "Locate in source (functionAt)." },
                filters: { type: "array", items: { type: "object", properties: { props: { type: "array", items: { type: "string" } }, code: { type: "array", items: { type: "string" } } } }, description: "findBulk: 2+ filters." },
            },
            required: ["action"],
        },
    },
    {
        name: "search",
        description: "Search factory source across all modules. Plain text or /regex/flags. With id: all matches in one module. Use this for factory code — module find+code only checks exported fn toString().",
        inputSchema: {
            type: "object",
            properties: {
                pattern: { type: "string" },
                and: { type: "array", items: { type: "string" }, description: "All must match same module." },
                id: { type: "number", description: "Single module." },
                max: { type: "number", default: 10 },
                context: { type: "number", default: 50 },
                filter: { type: "string", enum: ["loaded", "unloaded"] },
                count: { type: "boolean", default: false },
            },
            required: [],
        },
    },
    {
        name: "evaluateCode",
        description: "Run JS in page context. Has window.Void, DOM. Supports await/import(). Auto-returns last expression.",
        inputSchema: {
            type: "object",
            properties: {
                code: { type: "string", description: "Max 10000 chars." },
            },
            required: ["code"],
        },
    },
    {
        name: "patch",
        description: "Patch ops. test: validate find+match+replace. analyze: find uniqueness. list: all patches+status. conflicts: multi-plugin modules. broken: failed patches. lint: regex quality. context: source neighborhood+anchors.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["test", "analyze", "list", "conflicts", "broken", "lint", "context"] },
                find: { type: "string", description: "Module locator string." },
                match: { type: "string", description: "Regex as plain string. \\i=minified var, .{0,N}=bounded gap." },
                replace: { type: "string", description: "Supports $1, $&, $self." },
                flags: { type: "string" },
                window: { type: "number", default: 1200 },
                context: { type: "number", default: 120 },
            },
            required: ["action"],
        },
    },
    {
        name: "plugin",
        description: "Plugin management. list/enable/disable/toggle/settings/setSetting.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["list", "enable", "disable", "toggle", "settings", "setSetting"] },
                name: { type: "string" },
                key: { type: "string" },
                value: {},
            },
            required: ["action"],
        },
    },
    {
        name: "react",
        description: "React/DOM inspector. find: components by name. root: all components. query: CSS selector→elements+rects. fiber: walk up. props/hooks/state: component internals. tree: DOM subtree. owner: debug owner chain.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["find", "root", "query", "fiber", "props", "hooks", "state", "tree", "owner"] },
                selector: { type: "string" },
                componentName: { type: "string" },
                depth: { type: "number", default: 10 },
                limit: { type: "number", default: 10 },
                includeProps: { type: "boolean", default: false },
                breadth: { type: "number", default: 5 },
            },
            required: ["action"],
        },
    },
    {
        name: "store",
        description: "Zustand store inspector. list/get/keys/methods/call/subscribe. Query by name (partial match) or module ID.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["list", "get", "keys", "methods", "call", "subscribe"] },
                query: { type: ["string", "number"] },
                path: { type: "string", description: "Dot path into state." },
                depth: { type: "number", default: 2 },
                method: { type: "string" },
                callArgs: { type: "array" },
                duration: { type: "number", default: 10000 },
                maxCaptures: { type: "number", default: 30 },
            },
            required: ["action"],
        },
    },
    {
        name: "intercept",
        description: "Intercept function calls on module exports. set: start capturing (only configurable properties). get: read captures. stop: restore original and return last captures. stopAll: clear all intercepts. list: active. exportKey supports nested paths like 'default.functionName'. Auto-expires after duration (default 30s, max 120s). maxCaptures limits stored calls (default 30, max 200).",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["set", "get", "stop", "stopAll", "list"] },
                moduleId: { type: "number" },
                exportKey: { type: "string", default: "default" },
                id: { type: "number" },
                duration: { type: "number", default: 30000 },
                maxCaptures: { type: "number", default: 30 },
            },
            required: ["action"],
        },
    },
    {
        name: "grok",
        description: "Chat with Grok AI via native UI. send: type message and submit through Grok's chat input (real-time, visible in UI). read: load response/conversation history. models: list available models with rate limits.",
        inputSchema: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["send", "read", "models"] },
                message: { type: "string", description: "Message to send (send action)." },
                model: { type: "string", description: "Model ID e.g. grok-3, grok-4. Default: current active model." },
                conversationId: { type: "string", description: "Existing conversation ID (send: follow-up, read: load history). Navigates to the conversation before sending." },
                responseId: { type: "string", description: "Response ID to read (read action)." },
                reasoningMode: { type: "string", enum: ["none", "think", "deepsearch"], default: "none" },
            },
            required: ["action"],
        },
    },
] as const;
