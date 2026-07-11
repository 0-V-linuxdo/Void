/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { REQUEST } from "./constants";
import type { RequestArgs } from "./types";
import { clampConfig, dispatch, errorMessage, serialize } from "./utils";

type Role = "target" | "baseline" | "control";

interface RequestSpec {
    label?: string;
    role?: Role;
    method?: string;
    path: string;
    headers?: Record<string, string>;
    body?: string | Record<string, unknown>;
}

interface RanRequest {
    label: string;
    role?: Role;
    method: string;
    url: string;
    status?: number;
    ok?: boolean;
    ms?: number;
    size?: number;
    empty?: boolean;
    contentType?: string | null;
    redirectedTo?: string;
    json?: unknown;
    body?: string;
    error?: string;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const DENIED_STATUS = new Set([401, 403, 404]);

function resolveSameOrigin(path: string): URL {
    const url = new URL(path, location.href);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(`Unsupported protocol: ${url.protocol}`);
    if (url.hostname !== location.hostname && !url.hostname.endsWith(".grok.com"))
        throw new Error(`Refusing cross-origin request to ${url.origin}. Only ${location.origin} (+ *.grok.com) is allowed.`);
    return url;
}

const hasHeader = (headers: Record<string, string>, name: string): boolean =>
    Object.keys(headers).some(k => k.toLowerCase() === name.toLowerCase());

function isEmptyData(v: unknown): boolean {
    if (v == null) return true;
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === "object") return Object.values(v as Record<string, unknown>).every(isEmptyData);
    if (typeof v === "string") return v.length === 0;
    return false;
}

function looksEmpty(json: unknown, text: string, marker?: string): boolean {
    if (marker && text.includes(marker)) return true;
    if (json === undefined) return text.trim().length === 0;
    return isEmptyData(json);
}

async function runOne(spec: RequestSpec, allowWrite: boolean, timeout: number, marker?: string): Promise<RanRequest> {
    const method = (spec.method ?? "GET").toUpperCase();
    const out: RanRequest = { label: spec.label ?? `${method} ${spec.path}`, role: spec.role, method, url: spec.path };

    if (!SAFE_METHODS.has(method) && !allowWrite) {
        out.error = `Refusing ${method} without allowWrite:true (avoids accidental state changes).`;
        return out;
    }

    let url: URL;
    try { url = resolveSameOrigin(spec.path); } catch (err: unknown) { out.error = errorMessage(err); return out; }
    out.url = url.href;

    const headers: Record<string, string> = { ...spec.headers };
    let body: string | undefined;
    if (spec.body != null) {
        if (typeof spec.body === "string") { body = spec.body; }
        else { body = JSON.stringify(spec.body); if (!hasHeader(headers, "content-type")) headers["Content-Type"] = "application/json"; }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const start = performance.now();
    try {
        const res = await fetch(url.href, { method, headers, body, credentials: "include", redirect: "follow", signal: controller.signal });
        out.status = res.status;
        out.ok = res.ok;
        out.ms = Math.round(performance.now() - start);
        out.contentType = res.headers.get("content-type");
        if (res.redirected && res.url !== url.href) out.redirectedTo = res.url;

        const text = await res.text();
        out.size = text.length;
        let json: unknown;
        if (out.contentType?.includes("json") || /^\s*[[{]/.test(text)) {
            try { json = JSON.parse(text); } catch {}
        }
        out.empty = looksEmpty(json, text, marker);
        if (json !== undefined) out.json = serialize(json, REQUEST.JSON_DEPTH);
        else out.body = text.length > REQUEST.MAX_BODY_LENGTH ? text.slice(0, REQUEST.MAX_BODY_LENGTH) + `…+${text.length - REQUEST.MAX_BODY_LENGTH}` : text;
    } catch (err: unknown) {
        out.error = errorMessage(err);
        out.ms = Math.round(performance.now() - start);
    } finally {
        clearTimeout(timer);
    }
    return out;
}

interface Verdict {
    verdict: "LIKELY-VULNERABLE" | "LIKELY-SAFE" | "INCONCLUSIVE" | "N/A";
    reasoning: string;
    note?: string;
}

function computeVerdict(results: RanRequest[]): Verdict {
    const target = results.find(r => r.role === "target");
    if (!target) return { verdict: "N/A", reasoning: "No request tagged role:\"target\" — returning raw results for you to judge." };

    const baseline = results.find(r => r.role === "baseline");
    const control = results.find(r => r.role === "control");
    const denied = (s?: number) => s != null && DENIED_STATUS.has(s);

    const target2xx = target.status != null && target.status >= 200 && target.status < 300;
    const targetHasData = target2xx && !target.error && !target.redirectedTo && target.empty === false;
    const baselineDenied = baseline ? denied(baseline.status) || baseline.empty === true : null;
    const controlEmpty = control ? denied(control.status) || control.empty === true : null;

    let targetState = "denied/failed";
    if (targetHasData) targetState = "returned data";
    else if (target.redirectedTo) targetState = "redirected (treated as denied)";
    else if (target2xx) targetState = "empty";
    const reasons = [`target ${target.status ?? "ERR"} ${targetState}`];
    if (baseline) reasons.push(`baseline ${baseline.status ?? "ERR"} ${baselineDenied ? "denied (authz present)" : "NOT denied"}`);
    if (control) reasons.push(`control ${control.status ?? "ERR"} ${controlEmpty ? "empty (fake id)" : "returned data"}`);

    const contradicted = baselineDenied === false || controlEmpty === false;
    const corroborated = baselineDenied === true || controlEmpty === true;

    let verdict: Verdict["verdict"];
    let note = "Heuristic only. Run the target as the ATTACKER account with the VICTIM's id and confirm the returned data actually belongs to the victim.";
    if (!targetHasData) verdict = "LIKELY-SAFE";
    else if (contradicted) verdict = "INCONCLUSIVE";
    else if (corroborated) verdict = "LIKELY-VULNERABLE";
    else {
        verdict = "INCONCLUSIVE";
        note += " Add a baseline (same object via an authorized path, should deny) and/or a control (target with a fake id, should be empty) to distinguish a real leak from an authorized read.";
    }

    return { verdict, reasoning: reasons.join("; "), note };
}

async function actionSend(args: RequestArgs): Promise<unknown> {
    if (!args.path) return { error: "Provide `path` for action:send (e.g. \"/rest/assets?assetIds=<id>\")." };
    const timeout = clampConfig(args.timeout, { default: REQUEST.DEFAULT_TIMEOUT, min: REQUEST.MIN_TIMEOUT, max: REQUEST.MAX_TIMEOUT });
    return runOne({ method: args.method, path: args.path, headers: args.headers, body: args.body }, args.allowWrite, timeout, args.emptyMarker);
}

async function actionIdor(args: RequestArgs): Promise<unknown> {
    const requests = args.requests ?? [];
    if (!requests.length) return { error: `Provide 1-${REQUEST.MAX_REQUESTS} \`requests\` for action:idor.` };
    if (requests.length > REQUEST.MAX_REQUESTS) return { error: `Too many requests: ${requests.length} (max ${REQUEST.MAX_REQUESTS}).` };
    const timeout = clampConfig(args.timeout, { default: REQUEST.DEFAULT_TIMEOUT, min: REQUEST.MIN_TIMEOUT, max: REQUEST.MAX_TIMEOUT });

    const results: RanRequest[] = [];
    for (const spec of requests) results.push(await runOne(spec, args.allowWrite, timeout, args.emptyMarker));

    return { results, ...computeVerdict(results) };
}

const REQUEST_ACTIONS: Record<RequestArgs["action"], (args: RequestArgs) => unknown> = {
    send: actionSend,
    idor: actionIdor,
};

export const handleRequest = (args: RequestArgs): unknown => dispatch(REQUEST_ACTIONS, args);
