/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { errorMessage } from "@utils/misc";
import type { ServerWebSocket } from "bun";

import pkg from "../../../package.json";
import { MCP } from "./tools/constants";
import { TOOL_DEFINITIONS } from "./tools/schemas";

const logger = new Logger("MCP", MCP.LOG_COLOR);
const { SLOW_THRESHOLD, REQUEST_TIMEOUT, WS_OPEN, PROTOCOL_VERSION } = MCP;

const PORT = Number(process.env.MCP_PORT) || MCP.PORT;

const SUPPORTED_VERSIONS = new Set<string>(MCP.SUPPORTED_PROTOCOL_VERSIONS);

interface PendingRequest {
    resolve: (result: unknown) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
}

interface JsonRpcRequest {
    id?: string | number;
    method?: string;
    params?: { name?: string; arguments?: Record<string, unknown>; protocolVersion?: string };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

const pending = new Map<number, PendingRequest>();
let pageSocket: ServerWebSocket<unknown> | null = null;
let connectedAt: number | null = null;
let totalCalls = 0;
let nextBridgeId = 1;

function jsonRpc(id: string | number | null | undefined, result?: unknown, error?: { code: number; message: string }) {
    const res: Record<string, unknown> = { jsonrpc: "2.0", id };
    if (error) res.error = error;
    else res.result = result;
    return res;
}

function forwardToPage(tool: string, args: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
        if (!pageSocket || pageSocket.readyState !== WS_OPEN) {
            reject(new Error("Page not connected. Open grok.com with Void extension loaded."));
            return;
        }

        const bridgeId = nextBridgeId++;
        const timer = setTimeout(() => {
            pending.delete(bridgeId);
            reject(new Error(`Request timed out after ${REQUEST_TIMEOUT / 1000}s`));
        }, REQUEST_TIMEOUT);

        pending.set(bridgeId, { resolve, reject, timer });
        try {
            pageSocket.send(JSON.stringify({ id: bridgeId, tool, arguments: args }));
        } catch (err: unknown) {
            clearTimeout(timer);
            pending.delete(bridgeId);
            reject(new Error(`Failed to send to page: ${errorMessage(err)}`));
        }
    });
}

function isAllowedOrigin(origin: string): boolean {
    return origin === "https://grok.com" || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");
}

const isAllowedWsOrigin = (origin: string): boolean => !origin || origin === "null" || isAllowedOrigin(origin);

function corsFor(req: Request) {
    const origin = req.headers.get("origin") ?? "";
    return {
        "Access-Control-Allow-Origin": isAllowedOrigin(origin) ? origin : "https://grok.com",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Private-Network": "true",
    } as const;
}

function negotiateVersion(requested: string | undefined): string {
    return requested && SUPPORTED_VERSIONS.has(requested) ? requested : PROTOCOL_VERSION;
}

const server = Bun.serve({
    port: PORT,
    idleTimeout: REQUEST_TIMEOUT / 1000 + MCP.IDLE_GRACE_S,
    async fetch(req): Promise<Response> {
        if (req.headers.get("upgrade") === "websocket") {
            if (!isAllowedWsOrigin(req.headers.get("origin") ?? "")) return new Response("Forbidden origin", { status: 403 });
            if (server.upgrade(req)) return undefined as unknown as Response;
            return new Response("Upgrade failed", { status: 400 });
        }

        const headers = corsFor(req);

        if (req.method === "OPTIONS") return new Response(null, { headers });
        if (req.method !== "POST") return new Response(null, { status: 405, headers });

        let body: JsonRpcRequest;
        try {
            const parsed = await req.json();
            if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                return Response.json(jsonRpc(null, undefined, { code: -32600, message: "Request must be a JSON object" }), { headers });
            }
            body = parsed;
        } catch {
            return Response.json(jsonRpc(null, undefined, { code: -32700, message: "Parse error" }), { headers });
        }

        const { id, method, params } = body;

        if (method === "initialize")
            return Response.json(jsonRpc(id, { protocolVersion: negotiateVersion(params?.protocolVersion), serverInfo: { name: "void-mcp", version: pkg.version }, capabilities: { tools: {} } }), { headers });

        if (method?.startsWith("notifications/")) return new Response(null, { status: 202, headers });

        if (method === "ping") return Response.json(jsonRpc(id, {}), { headers });

        if (method === "tools/list") return Response.json(jsonRpc(id, { tools: TOOL_DEFINITIONS }), { headers });

        if (method === "tools/call") {
            const tool = params?.name;
            if (!tool) return Response.json(jsonRpc(id, undefined, { code: -32602, message: "Missing tool name" }), { headers });
            if (id == null) return Response.json(jsonRpc(null, undefined, { code: -32600, message: "Missing request id" }), { headers });

            totalCalls++;
            const start = performance.now();

            try {
                const result = await forwardToPage(tool, params?.arguments ?? {});
                const elapsed = (performance.now() - start).toFixed(0);
                const text = typeof result === "string" ? result : JSON.stringify(result);
                const ms = Number(elapsed);
                if (ms > SLOW_THRESHOLD) logger.warn(`${tool} ${elapsed} ms (${text.length} chars)`);
                else logger.info(`${tool} ${elapsed} ms (${text.length} chars)`);
                const isError = isObj(result) && "error" in result;
                const payload: Record<string, unknown> = { content: [{ type: "text", text }] };
                if (isObj(result)) payload.structuredContent = result;
                if (isError) payload.isError = true;
                return Response.json(jsonRpc(id, payload), { headers });
            } catch (err: unknown) {
                const message = errorMessage(err);
                logger.error(`${tool} FAILED: ${message}`);
                return Response.json(jsonRpc(id, { content: [{ type: "text", text: message }], isError: true }), { headers });
            }
        }

        return Response.json(jsonRpc(id, undefined, { code: -32601, message: `Unknown method: ${method}` }), { headers });
    },

    websocket: {
        open(ws) {
            if (pageSocket) {
                logger.warn("New page connection replacing existing one");
                for (const [, req] of pending) {
                    clearTimeout(req.timer);
                    req.reject(new Error("Page reconnected, previous session ended"));
                }
                pending.clear();
                try { pageSocket.close(1000, "Replaced by new connection"); } catch (e) { logger.debug("Old socket already closed", e); }
            }
            pageSocket = ws;
            connectedAt = Date.now();
            logger.info("Page connected");
        },
        message(_ws, message) {
            try {
                const data = JSON.parse(String(message)) as { id: number; result?: unknown; error?: unknown };
                const req = pending.get(data.id);
                if (!req) return;
                clearTimeout(req.timer);
                pending.delete(data.id);
                if (data.error) req.reject(new Error(typeof data.error === "string" ? data.error : JSON.stringify(data.error)));
                else req.resolve(data.result ?? null);
            } catch (e) {
                logger.warn("Malformed WebSocket message", e);
            }
        },
        close(ws) {
            if (ws !== pageSocket) return;
            const uptime = connectedAt ? `${((Date.now() - connectedAt) / 1000).toFixed(0)}s uptime, ` : "";
            logger.info(`Page disconnected (${uptime}${totalCalls} total calls)`);
            pageSocket = null;
            connectedAt = null;
            for (const [, req] of pending) {
                clearTimeout(req.timer);
                req.reject(new Error("Page disconnected"));
            }
            pending.clear();
        },
    },
});

logger.info(`Listening on http://localhost:${PORT}`);
