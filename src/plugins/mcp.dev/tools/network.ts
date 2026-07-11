/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NETWORK } from "./constants";
import type { NetworkArgs } from "./types";
import { clampCaptureConfig, dispatch, errorMessage, parseRegexPattern, truncate } from "./utils";

interface NetCapture {
    t: number;
    kind: "fetch" | "xhr" | "ws-send" | "ws-recv";
    method: string;
    url: string;
    status?: number;
    reqBody?: string;
    resBody?: string;
    ms?: number;
    error?: string;
}

interface NetSession {
    startTime: number;
    captures: NetCapture[];
    urlFilter: string | null;
    filterRe: RegExp | null;
    maxCaptures: number;
    restore: Array<() => void>;
    timer: ReturnType<typeof setTimeout>;
}

let session: NetSession | null = null;

const absUrl = (u: string): string => {
    try { return new URL(u, location.href).href; } catch { return u; }
};

function bodyToString(body: unknown): string {
    if (typeof body === "string") return body;
    if (body instanceof URLSearchParams) return body.toString();
    if (body instanceof ArrayBuffer) return `[ArrayBuffer ${body.byteLength}b]`;
    if (body instanceof Blob) return `[Blob ${body.size}b ${body.type}]`;
    if (body instanceof FormData) {
        const parts: string[] = [];
        for (const [k, v] of body) parts.push(`${k}=${typeof v === "string" ? v : "[file]"}`);
        return parts.join("&");
    }
    try { return String(body); } catch { return "[unserializable]"; }
}

function matchesFilter(url: string): boolean {
    if (!session) return false;
    if (session.filterRe) {
        session.filterRe.lastIndex = 0;
        return session.filterRe.test(url);
    }
    if (session.urlFilter) return url.includes(session.urlFilter);
    return true;
}

function push(partial: Omit<NetCapture, "t">): NetCapture {
    const cap: NetCapture = { t: session ? Math.round(performance.now() - session.startTime) : 0, ...partial };
    if (session && session.captures.length < session.maxCaptures) session.captures.push(cap);
    return cap;
}

function patchFetch(restore: Array<() => void>): void {
    const orig = window.fetch;
    const wrapped = function (this: unknown, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        let url = "";
        let method = "GET";
        try {
            url = absUrl(typeof input === "string" ? input : (input instanceof URL ? input.href : input.url));
            method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
        } catch {}
        if (!matchesFilter(url)) return orig.call(this, input, init);
        const cap = push({ kind: "fetch", method, url, reqBody: init?.body != null ? truncate(bodyToString(init.body), NETWORK.MAX_BODY_LENGTH) : undefined });
        const start = performance.now();
        return orig.call(this, input, init).then(
            res => {
                try {
                    cap.status = res.status;
                    cap.ms = Math.round(performance.now() - start);
                    res.clone().text().then(text => { cap.resBody = truncate(text, NETWORK.MAX_BODY_LENGTH); }, () => {});
                } catch {}
                return res;
            },
            (err: unknown) => {
                cap.error = errorMessage(err);
                cap.ms = Math.round(performance.now() - start);
                throw err;
            },
        );
    };
    window.fetch = wrapped as typeof window.fetch;
    restore.push(() => { window.fetch = orig; });
}

function patchXHR(restore: Array<() => void>): void {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    const meta = new WeakMap<XMLHttpRequest, { method: string; url: string }>();

    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]): void {
        try { meta.set(this, { method: String(method).toUpperCase(), url: absUrl(String(url)) }); } catch {}
        return (origOpen as (...a: unknown[]) => void).call(this, method, url, ...rest);
    };
    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null): void {
        const m = meta.get(this);
        if (m && matchesFilter(m.url)) {
            const cap = push({ kind: "xhr", method: m.method, url: m.url, reqBody: body != null ? truncate(bodyToString(body), NETWORK.MAX_BODY_LENGTH) : undefined });
            const start = performance.now();
            this.addEventListener("loadend", () => {
                try {
                    cap.status = this.status;
                    cap.ms = Math.round(performance.now() - start);
                    if (this.responseType === "" || this.responseType === "text") cap.resBody = truncate(this.responseText, NETWORK.MAX_BODY_LENGTH);
                } catch {}
            });
        }
        return origSend.call(this, body);
    };
    restore.push(() => { XMLHttpRequest.prototype.open = origOpen; XMLHttpRequest.prototype.send = origSend; });
}

function patchWS(restore: Array<() => void>): void {
    const orig = window.WebSocket;
    window.WebSocket = new Proxy(orig, {
        construct(target, args: unknown[]) {
            const ws = Reflect.construct(target, args) as WebSocket;
            try {
                const url = absUrl(String(args[0] ?? ""));
                if (matchesFilter(url)) {
                    const send = ws.send.bind(ws);
                    ws.send = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
                        try { push({ kind: "ws-send", method: "WS", url, reqBody: truncate(bodyToString(data), NETWORK.MAX_BODY_LENGTH) }); } catch {}
                        return send(data);
                    };
                    ws.addEventListener("message", ev => { try { push({ kind: "ws-recv", method: "WS", url, resBody: truncate(bodyToString(ev.data), NETWORK.MAX_BODY_LENGTH) }); } catch {} });
                }
            } catch {}
            return ws;
        },
    });
    restore.push(() => { window.WebSocket = orig; });
}

function stopSession(): NetCapture[] {
    if (!session) return [];
    clearTimeout(session.timer);
    for (const r of session.restore) { try { r(); } catch {} }
    const caps = session.captures;
    session = null;
    return caps;
}

export function clearNetwork(): void {
    stopSession();
}

function actionStart(args: NetworkArgs): unknown {
    stopSession();
    const { duration, maxCaptures } = clampCaptureConfig(args, { dur: { default: NETWORK.DEFAULT_DURATION, min: NETWORK.MIN_DURATION, max: NETWORK.MAX_DURATION }, cap: { default: NETWORK.DEFAULT_CAPTURES, max: NETWORK.MAX_CAPTURES } });
    const filterRe = args.urlFilter ? parseRegexPattern(args.urlFilter) : null;
    const restore: Array<() => void> = [];
    session = { startTime: performance.now(), captures: [], urlFilter: args.urlFilter ?? null, filterRe, maxCaptures, restore, timer: setTimeout(stopSession, duration) };
    patchFetch(restore);
    patchXHR(restore);
    patchWS(restore);
    return { ok: true, capturing: true, filter: args.urlFilter ?? "all", durationMs: duration, maxCaptures };
}

function selectCaptures(caps: NetCapture[], urlFilter: string | undefined): NetCapture[] {
    if (!urlFilter) return caps;
    const regex = parseRegexPattern(urlFilter);
    return caps.filter(c => {
        if (!regex) return c.url.includes(urlFilter);
        regex.lastIndex = 0;
        return regex.test(c.url);
    });
}

function actionGet(args: NetworkArgs): unknown {
    if (!session) return { error: "Not capturing. Use action:start first." };
    const filtered = selectCaptures(session.captures, args.urlFilter);
    return { capturing: true, total: session.captures.length, shown: Math.min(filtered.length, NETWORK.GET_LIMIT), captures: filtered.slice(-NETWORK.GET_LIMIT) };
}

function actionStop(args: NetworkArgs): unknown {
    if (!session) return { error: "Not capturing." };
    const total = session.captures.length;
    const filtered = selectCaptures(session.captures, args.urlFilter);
    stopSession();
    return { ok: true, capturing: false, total, captures: filtered.slice(-NETWORK.GET_LIMIT) };
}

function actionClear(): unknown {
    if (!session) return { error: "Not capturing." };
    session.captures = [];
    return { ok: true, cleared: true };
}

function actionStatus(): unknown {
    if (!session) return { capturing: false };
    return { capturing: true, total: session.captures.length, elapsedMs: Math.round(performance.now() - session.startTime), filter: session.urlFilter ?? "all", maxCaptures: session.maxCaptures };
}

const NETWORK_ACTIONS: Record<NetworkArgs["action"], (args: NetworkArgs) => unknown> = {
    start: actionStart,
    get: actionGet,
    stop: actionStop,
    clear: actionClear,
    status: actionStatus,
};

export const handleNetwork = (args: NetworkArgs): unknown => dispatch(NETWORK_ACTIONS, args);
