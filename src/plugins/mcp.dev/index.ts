/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { isObject } from "@utils/guards";
import { Logger } from "@utils/Logger";
import { errorMessage } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";

import { toolHandlers } from "./tools";
import { MCP as MCP_CONSTANTS } from "./tools/constants";
import { clearAllIntercepts } from "./tools/intercept";
import { clearWhereUsedCache } from "./tools/module";
import { clearStoreCache } from "./tools/store";
import { clearFactoryCaches } from "./tools/utils";
const settings = definePluginSettings({
    logToolCalls: {
        type: OptionType.BOOLEAN,
        description: "Log tool call names and timing to the browser console.",
        default: true,
    },
});
const logger = new Logger("MCP", "#ca9ee6");
const MCP_URL = `ws://localhost:${MCP_CONSTANTS.PORT}`;
const { SLOW_THRESHOLD, MAX_RESULT_SIZE, INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY } = MCP_CONSTANTS;
interface WsMessage {
    id: string | number;
    tool: string;
    arguments?: Record<string, unknown>;
}
interface WsResponse {
    id: string | number;
    result?: unknown;
    error?: string;
}
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay: number = INITIAL_RECONNECT_DELAY;
let connectingLock = false;
function truncateResult(result: unknown): unknown {
    if (Array.isArray(result)) {
        const showing = Math.min(result.length, Math.max(MCP_CONSTANTS.MIN_TRUNCATED_ITEMS, Math.floor(result.length / 2)));
        return [...result.slice(0, showing), { _truncated: true, total: result.length, showing, hint: "Use narrower query, limit, or pagination to see more" }];
    }
    if (isObject(result)) {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(result as Record<string, unknown>)) {
            if (Array.isArray(v) && v.length > 0) {
                try {
                    const sampleSize = JSON.stringify(v[0]).length;
                    if (sampleSize * v.length > MCP_CONSTANTS.TRUNCATION_THRESHOLD) {
                        const showing = Math.min(v.length, Math.max(MCP_CONSTANTS.MIN_TRUNCATED_NESTED, Math.floor(v.length / 2)));
                        out[k] = [...v.slice(0, showing), { _truncated: true, total: v.length, showing }];
                        continue;
                    }
                } catch {
                    out[k] = `[Unserializable array (${v.length} items)]`;
                    continue;
                }
            }
            out[k] = v;
        }
        out._warning = "Result auto-truncated. Use narrower queries, filters, or pagination.";
        return out;
    }
    return result;
}
function safeSend(json: string) {
    if (ws?.readyState === WebSocket.OPEN) {
        try {
            ws.send(json);
        } catch {}
    }
}
function send(data: WsResponse) {
    try {
        let json = JSON.stringify(data);
        if (json.length > MAX_RESULT_SIZE && data.result != null) {
            data.result = truncateResult(data.result);
            json = JSON.stringify(data);
            if (json.length > MAX_RESULT_SIZE) {
                safeSend(JSON.stringify({ id: data.id, error: `Result too large (${json.length} chars) even after auto-truncation. Use narrower queries or pagination.` }));
                return;
            }
        }
        safeSend(json);
    } catch (err: unknown) {
        safeSend(JSON.stringify({ id: data.id, error: `Serialization failed: ${errorMessage(err)}` }));
    }
}
function connect() {
    if (connectingLock || ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;
    connectingLock = true;
    try {
        ws = new WebSocket(MCP_URL);
    } catch {
        connectingLock = false;
        scheduleReconnect();
        return;
    }
    ws.onopen = () => {
        connectingLock = false;
        reconnectDelay = INITIAL_RECONNECT_DELAY;
        const toolCount = Object.keys(toolHandlers).length;
        logger.info(`Connected to MCP session with ${toolCount} tools ready`);
    };
    ws.onmessage = (event: MessageEvent) => {
        let msg: WsMessage;
        try {
            msg = JSON.parse(event.data as string);
        } catch (err: unknown) {
            logger.error("Failed to parse WebSocket message", err);
            return;
        }
        const { id, tool, arguments: args } = msg;
        if (id == null || !tool) return;
        const handler = toolHandlers[tool as keyof typeof toolHandlers];
        if (!handler) {
            logger.error(`Unknown tool: ${tool}`);
            send({ id, error: `Unknown tool: ${tool}` });
            return;
        }
        const start = performance.now();
        const logCall = (failed = false) => {
            if (!settings.store.logToolCalls && !failed) return;
            const elapsed = performance.now() - start;
            const ms = elapsed.toFixed(2);
            if (failed) logger.error(`${tool} ${ms} ms (failed)`);
            else if (elapsed > SLOW_THRESHOLD) logger.warn(`${tool} ${ms} ms (slow)`);
            else logger.info(`${tool} ${ms} ms`);
        };
        try {
            const result = handler(args ?? {});
            if (result != null && typeof (result as Promise<unknown>).then === "function") {
                (result as Promise<unknown>).then(
                    val => {
                        logCall();
                        send({ id, result: val });
                    },
                    (err: unknown) => {
                        logCall(true);
                        send({ id, error: errorMessage(err) });
                    },
                );
            } else {
                logCall();
                send({ id, result });
            }
        } catch (err: unknown) {
            logCall(true);
            send({ id, error: errorMessage(err) });
        }
    };
    ws.onclose = () => {
        ws = null;
        connectingLock = false;
        scheduleReconnect();
    };
    ws.onerror = () => {
        connectingLock = false;
        ws?.close();
    };
}
function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
}
function disconnect() {
    connectingLock = false;
    reconnectDelay = INITIAL_RECONNECT_DELAY;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.onclose = null;
        ws.close();
        ws = null;
    }
}
export default definePlugin({
    name: "MCP",
    description: "Connects AI coding agents to Grok via WebSocket for live inspection.",
    authors: [Devs.Prism],
    dev: true,
    settings,
    start() {
        connect();
    },
    stop() {
        disconnect();
        clearAllIntercepts();
        clearFactoryCaches();
        clearWhereUsedCache();
        clearStoreCache();
    },
});
