/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { z } from "zod";

import { EVAL, INTERCEPT, NETWORK, REACT, RECON, REQUEST, SEARCH, STORE } from "./constants";

interface ToolAnnotations {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
}

interface ToolMeta<S extends z.ZodType = z.ZodType> {
    description: string;
    input: S;
    annotations?: ToolAnnotations;
}

const tool = <S extends z.ZodType>(meta: ToolMeta<S>): ToolMeta<S> => meta;

const filterShape = {
    props: z.array(z.string()).optional(),
    code: z.array(z.string()).optional(),
    displayName: z.string().optional(),
    storeName: z.string().optional(),
    componentByCode: z.boolean().optional(),
};

export const toolSchemas = {
    module: tool({
        description: "Turbopack module operations. find: by props/code/displayName/storeName. findAll/findBulk: multi-result. findComponent: by name or code. findModuleId/findByFactory: by factory source. exports: keys+types. stats: counts. source: factory code. diff: patched vs original. load/loadChunks: instantiate. mapMangled: map obfuscated keys. css: class modules. unloaded: not-yet-loaded. whereUsed: reverse deps. suggest: patch anchors. functionAt: extract fn body. imports/namedExports: deps+exports.",
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        input: z.object({
            action: z.enum(["find", "findAll", "findBulk", "findComponent", "findModuleId", "exports", "stats", "source", "diff", "imports", "namedExports", "load", "loadChunks", "findByFactory", "mapMangled", "css", "unloaded", "whereUsed", "suggest", "functionAt"]),
            props: z.array(z.string()).optional().describe("Export prop names."),
            code: z.array(z.string()).optional().describe("Find/findAll: exported fn source. findModuleId/findByFactory/mapMangled/loadChunks: factory source."),
            displayName: z.string().optional(),
            storeName: z.string().optional().describe("Short name OK, e.g. 'chat' → useChatPageStore."),
            componentByCode: z.boolean().optional(),
            id: z.number().optional(),
            offset: z.number().default(0),
            limit: z.number().optional(),
            patched: z.boolean().default(false),
            search: z.string().optional().describe("Jump to string in source, overrides offset."),
            async: z.boolean().default(false),
            mappers: z.record(z.string(), z.string()).optional().describe("Map of {name: filterType}. Types: fn/string/number/boolean/object/array/component/hasProps:a,b/code:x."),
            pattern: z.string().optional().describe("Locate in source (functionAt)."),
            filters: z.array(z.object(filterShape)).optional().describe("For findBulk: 2+ filters."),
        }),
    }),
    search: tool({
        description: "Search factory source across all modules. Plain text or /regex/flags. With id: all matches in one module. Use this for factory code — module find+code only checks exported fn toString(). filter: loaded/unloaded/patched.",
        annotations: { readOnlyHint: true, openWorldHint: false },
        input: z.object({
            pattern: z.string().optional(),
            and: z.array(z.string()).optional().describe("All must match same module."),
            id: z.number().optional().describe("Single module."),
            max: z.number().default(SEARCH.DEFAULT_MAX),
            context: z.number().default(SEARCH.DEFAULT_CONTEXT),
            filter: z.enum(["loaded", "unloaded", "patched"]).optional(),
            count: z.boolean().default(false),
        }),
    }),
    evaluateCode: tool({
        description: "Run JS in page context. Has window.Void, DOM. Supports await/import(). Auto-returns last expression.",
        annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
        input: z.object({
            code: z.string().describe(`Max ${EVAL.MAX_CODE_LENGTH} chars.`),
        }),
    }),
    patch: tool({
        description: "Patch ops. test: validate find+match+replace. analyze: find uniqueness. list: all patches+status. conflicts: multi-plugin modules. broken: failed patches. lint: regex quality. context: source neighborhood+anchors. bench: regex speed (median/p95/max over 50 runs). report: full patch system summary with orphaned/pending separation. validate: reporter-style audit of all registered patches — flags find::no-module, find::ambiguous, replace::match-miss, replace::backref-invalid, replace::regex-invalid, replace::syntax-error, group::failed. Use plugin to scope to one plugin, severity to filter issues.",
        annotations: { readOnlyHint: true, openWorldHint: false },
        input: z.object({
            action: z.enum(["test", "analyze", "list", "conflicts", "broken", "lint", "context", "bench", "report", "validate"]),
            find: z.union([z.string(), z.array(z.string())]).optional().describe("Module locator string or array of strings."),
            match: z.string().optional().describe("Regex as plain string. \\i=minified var, .{0,N}=bounded gap."),
            replace: z.string().optional().describe("Supports $1, $&, $self."),
            flags: z.string().optional(),
            window: z.number().default(1200),
            context: z.number().default(120),
            plugin: z.string().optional().describe("validate: restrict audit to one plugin name."),
            severity: z.enum(["error", "warn", "all"]).default("error").describe("validate: filter issues by severity."),
        }),
    }),
    plugin: tool({
        description: "Plugin management. list/enable/disable/toggle/settings/setSetting.",
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        input: z.object({
            action: z.enum(["list", "enable", "disable", "toggle", "settings", "setSetting"]),
            name: z.string().optional(),
            key: z.string().optional(),
            value: z.unknown().optional(),
        }),
    }),
    react: tool({
        description: "React/DOM inspector. find: components by name. root: all components. query: CSS selector→elements+rects. fiber: walk up. props/hooks/state: component internals. tree: DOM subtree. owner: debug owner chain.",
        annotations: { readOnlyHint: true, openWorldHint: false },
        input: z.object({
            action: z.enum(["find", "root", "query", "fiber", "props", "hooks", "state", "tree", "owner"]),
            selector: z.string().optional(),
            componentName: z.string().optional(),
            depth: z.number().default(REACT.DEFAULT_DEPTH),
            limit: z.number().default(REACT.DEFAULT_LIMIT),
            includeProps: z.boolean().default(false),
            breadth: z.number().default(REACT.DEFAULT_BREADTH),
        }),
    }),
    store: tool({
        description: "Zustand store inspector. list/get/keys/methods/call/subscribe. Query by name (partial match, shows alternatives) or module ID. call returns stateChanged diff.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        input: z.object({
            action: z.enum(["list", "get", "keys", "methods", "call", "subscribe"]),
            query: z.union([z.string(), z.number()]).optional(),
            path: z.string().optional().describe("Dot path into state."),
            depth: z.number().default(STORE.DEFAULT_DEPTH),
            method: z.string().optional(),
            callArgs: z.array(z.unknown()).optional(),
            duration: z.number().default(STORE.DEFAULT_DURATION),
            maxCaptures: z.number().default(STORE.DEFAULT_CAPTURES),
        }),
    }),
    intercept: tool({
        description: `Intercept function calls on module exports. set: start capturing (only configurable properties). get: read captures. stop: restore original and return last captures. stopAll: clear all intercepts. list: active. exportKey supports nested paths like 'default.functionName'. Auto-expires after duration (default ${INTERCEPT.DEFAULT_DURATION / 1000}s, max ${INTERCEPT.MAX_DURATION / 1000}s). maxCaptures limits stored calls (default ${INTERCEPT.DEFAULT_CAPTURES}, max ${INTERCEPT.MAX_CAPTURES}).`,
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        input: z.object({
            action: z.enum(["set", "get", "stop", "stopAll", "list"]),
            moduleId: z.number().optional(),
            exportKey: z.string().default("default"),
            id: z.number().optional(),
            duration: z.number().default(INTERCEPT.DEFAULT_DURATION),
            maxCaptures: z.number().default(INTERCEPT.DEFAULT_CAPTURES),
        }),
    }),
    network: tool({
        description: `Capture live network traffic (fetch/XHR/WebSocket) for reverse-engineering and security recon. start: begin capturing (optional urlFilter substring or /regex/ to scope). get: read recent captures — method, url, status, request/response bodies, timing. stop: stop, restore, and return captures. clear: empty the buffer but keep capturing. status: capture state. Inert until start; auto-expires (default ${NETWORK.DEFAULT_DURATION / 1000}s, max ${NETWORK.MAX_DURATION / 1000}s). Read-only observation — never modifies traffic.`,
        annotations: { readOnlyHint: true, openWorldHint: true },
        input: z.object({
            action: z.enum(["start", "get", "stop", "clear", "status"]),
            urlFilter: z.string().optional().describe("Substring or /regex/ on the URL. start: scope which requests to capture; get/stop: filter results."),
            duration: z.number().default(NETWORK.DEFAULT_DURATION),
            maxCaptures: z.number().default(NETWORK.DEFAULT_CAPTURES),
        }),
    }),
    request: tool({
        description: "Authenticated same-origin request harness for cross-account IDOR/BOLA testing. Runs in THIS browser's logged-in grok.com session, so drive account A on its bridge (port 7890) and account B on the other (7891) and compare. `send`: one credentialed request → {status, ok, ms, size, empty, json}. `idor`: run up to 10 labelled requests (role: target = suspected-vuln request run as the attacker with the victim's id; baseline = same object via a properly-authorized path, should deny; control = target with a fake id, should be empty) → per-request results plus a heuristic verdict (target 2xx-with-data while baseline denies and control empty ⇒ LIKELY-VULNERABLE). Same-origin grok.com only (won't send your cookie off-site); non-GET requires allowWrite:true to avoid accidental state changes. Prefer this over hand-built evaluateCode fetches for authz testing.",
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
        input: z.object({
            action: z.enum(["send", "idor"]),
            method: z.string().default("GET").describe("send: HTTP method. Non-GET/HEAD/OPTIONS requires allowWrite:true."),
            path: z.string().optional().describe("send: relative (/rest/...) or absolute grok.com URL."),
            headers: z.record(z.string(), z.string()).optional().describe("send: extra request headers, e.g. {\"x-team-id\": \"<A_teamId>\"}."),
            body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional().describe("send: request body; an object is JSON-encoded with a JSON content-type."),
            requests: z.array(z.object({
                label: z.string().optional(),
                role: z.enum(["target", "baseline", "control"]).optional().describe("target=suspected-vuln request; baseline=same object via an authorized path (expect deny); control=target with a non-existent id (expect empty)."),
                method: z.string().default("GET"),
                path: z.string(),
                headers: z.record(z.string(), z.string()).optional(),
                body: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
            })).optional().describe(`idor: 1-${REQUEST.MAX_REQUESTS} labelled requests to run in this session.`),
            emptyMarker: z.string().optional().describe("idor: substring meaning \"no data\" in a body (e.g. '\"assets\":[]'). Sharpens empty-detection."),
            allowWrite: z.boolean().default(false).describe("Permit non-GET methods (POST/PUT/PATCH/DELETE). Off by default to avoid accidental state changes."),
            timeout: z.number().default(REQUEST.DEFAULT_TIMEOUT).describe(`Per-request timeout ms (max ${REQUEST.MAX_TIMEOUT}).`),
        }),
    }),
    recon: tool({
        description: "Static security recon over the loaded bundle — scans all factory sources for security-relevant artifacts, grouped by category: endpoints (URLs / API paths), secrets (JWT, Google AIza / AWS AKIA / Slack / GitHub / GitLab / Google-OAuth keys, PEM private keys, labeled api-key/secret/token), flags (feature flags), sinks (innerHTML / eval / new Function / postMessage / document.write), graphql (operation names), storage (localStorage / cookie / indexedDB access). Read-only static scan of LOADED modules; hits deduped per category (pass a high `limit` to dump the full endpoint map). Use `search` for arbitrary patterns and `network` for live traffic.",
        annotations: { readOnlyHint: true, openWorldHint: false },
        input: z.object({
            categories: z.array(z.enum(["endpoints", "secrets", "flags", "sinks", "graphql", "storage"])).optional().describe("Which categories to scan. Default: all."),
            limit: z.number().default(RECON.DEFAULT_LIMIT).describe("Max deduped hits per category."),
            moduleId: z.number().optional().describe("Scope the scan to one module's source."),
        }),
    }),
} satisfies Record<string, ToolMeta>;

export type ToolName = keyof typeof toolSchemas;

export type ToolArgsFor<K extends ToolName> = z.output<(typeof toolSchemas)[K]["input"]>;

export type ModuleArgs = ToolArgsFor<"module">;
export type SearchArgs = ToolArgsFor<"search">;
export type EvalArgs = ToolArgsFor<"evaluateCode">;
export type PatchArgs = ToolArgsFor<"patch">;
export type PluginArgs = ToolArgsFor<"plugin">;
export type ReactArgs = ToolArgsFor<"react">;
export type StoreArgs = ToolArgsFor<"store">;
export type InterceptArgs = ToolArgsFor<"intercept">;
export type NetworkArgs = ToolArgsFor<"network">;
export type ReconArgs = ToolArgsFor<"recon">;
export type RequestArgs = ToolArgsFor<"request">;

export interface ToolDefinition {
    name: ToolName;
    description: string;
    inputSchema: Record<string, unknown>;
    annotations?: ToolAnnotations;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = (Object.entries(toolSchemas) as [ToolName, ToolMeta][]).map(([name, meta]) => ({
    name,
    description: meta.description,
    inputSchema: z.toJSONSchema(meta.input, { io: "input" }) as Record<string, unknown>,
    ...(meta.annotations && { annotations: meta.annotations }),
}));
