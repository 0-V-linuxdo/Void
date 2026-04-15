/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { randomId } from "@utils/misc";

const logger = new Logger("Cookies");

export const GROK_URL = "https://grok.com";
export const XAI_ACCOUNTS_URL = "https://accounts.x.ai";
export const ALLOWED_ORIGINS = [GROK_URL, XAI_ACCOUNTS_URL] as const;

const ALLOWED_HOSTS = [".grok.com", ".x.ai"] as const;
const BRIDGE_TIMEOUT_MS = 5000;
const DOMAIN_DOT_PREFIX = /^\./;
const NO_BRIDGE_MSG = "AccountSwitcher needs the Void browser extension. Install or reload it after the cookies permission was added.";

export interface CookieData {
    readonly name: string;
    readonly value: string;
    readonly domain: string;
    readonly path: string;
    readonly secure: boolean;
    readonly httpOnly: boolean;
    readonly sameSite?: "no_restriction" | "lax" | "strict" | "unspecified";
    readonly expirationDate?: number;
}

export interface CookieDomainSnapshot {
    readonly url: string;
    readonly cookies: readonly CookieData[];
}

export class CookieAccessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CookieAccessError";
    }
}

interface BridgeResponse<T> {
    ok: boolean;
    result?: T;
    error?: string;
}

function bridgeRequest<T>(op: "list" | "set" | "remove", payload: unknown): Promise<T> {
    const requestId = randomId();

    return new Promise((resolve, reject) => {
        const ac = new AbortController();
        const timer = setTimeout(() => {
            ac.abort();
            reject(new CookieAccessError(NO_BRIDGE_MSG));
        }, BRIDGE_TIMEOUT_MS);

        window.addEventListener("message", (event: MessageEvent) => {
            if (event.source !== window) return;
            const { data } = event;
            if (!data || data.source !== "void-cookies" || data.direction !== "res" || data.requestId !== requestId) return;
            clearTimeout(timer);
            ac.abort();
            const response = data.response as BridgeResponse<T> | undefined;
            if (!response?.ok) reject(new CookieAccessError(response?.error ?? "Unknown extension error."));
            else resolve(response.result as T);
        }, { signal: ac.signal });

        window.postMessage({ source: "void-cookies", direction: "req", requestId, op, payload }, window.location.origin);
    });
}

function ensureAllowedDomain(cookie: { domain?: string }) {
    const d = (cookie.domain ?? "").replace(DOMAIN_DOT_PREFIX, "");
    if (!d) return;
    for (const host of ALLOWED_HOSTS) {
        const bare = host.replace(DOMAIN_DOT_PREFIX, "");
        if (d === bare || d.endsWith(host)) return;
    }
    throw new CookieAccessError(`Refusing cookie for non-allowed domain: ${cookie.domain}`);
}

function ensureAllowedUrl(url: string) {
    if (!ALLOWED_ORIGINS.includes(url as typeof ALLOWED_ORIGINS[number])) {
        throw new CookieAccessError(`Refusing cookie op for non-allowed url: ${url}`);
    }
}

export async function listCookies(url: string): Promise<CookieData[]> {
    ensureAllowedUrl(url);
    return bridgeRequest<CookieData[]>("list", { url });
}

export async function setCookie(cookie: CookieData, url: string): Promise<void> {
    ensureAllowedUrl(url);
    ensureAllowedDomain(cookie);
    await bridgeRequest<unknown>("set", { url, ...cookie });
}

export async function deleteCookie(name: string, url: string): Promise<void> {
    ensureAllowedUrl(url);
    await bridgeRequest<unknown>("remove", { url, name });
}

export interface CookieSwapResult {
    readonly deleted: number;
    readonly set: number;
    readonly failures: readonly string[];
}

export async function captureSnapshots(): Promise<CookieDomainSnapshot[]> {
    return Promise.all(ALLOWED_ORIGINS.map(async url => ({ url, cookies: await listCookies(url) })));
}

export async function replaceAllCookies(snapshots: readonly CookieDomainSnapshot[]): Promise<CookieSwapResult> {
    const failures: string[] = [];
    let deleted = 0;
    let set = 0;

    for (const { url, cookies: next } of snapshots) {
        const current = await listCookies(url);
        const deletes = await Promise.allSettled(current.map(c => deleteCookie(c.name, url)));
        deletes.forEach((r, i) => {
            if (r.status === "rejected") {
                failures.push(`delete ${url}/${current[i].name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
                logger.warn("delete failed", url, current[i].name, r.reason);
            } else deleted++;
        });

        const sets = await Promise.allSettled(next.map(c => setCookie(c, url)));
        sets.forEach((r, i) => {
            if (r.status === "rejected") {
                failures.push(`set ${url}/${next[i].name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
                logger.warn("set failed", url, next[i].name, r.reason);
            } else set++;
        });
    }

    return { deleted, set, failures };
}
