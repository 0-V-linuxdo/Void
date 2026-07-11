/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import { errorMessage, randomId } from "@utils/misc";

const logger = new Logger("Cookies");

const GROK_URL = "https://grok.com";
const XAI_URL = "https://x.ai";
const XAI_ACCOUNTS_URL = "https://accounts.x.ai";
const ALLOWED_ORIGINS = [GROK_URL, XAI_URL, XAI_ACCOUNTS_URL] as const;

const ALLOWED_HOSTS = [".grok.com", ".x.ai"] as const;
const BRIDGE_TIMEOUT_MS = 5000;
const DOMAIN_DOT_PREFIX = /^\./;
const ALLOWED_BARE_HOSTS = ALLOWED_HOSTS.map(h => h.replace(DOMAIN_DOT_PREFIX, ""));
const NO_BRIDGE_MSG = "AccountSwitcher needs the Void browser extension. Install or reload it after the cookies permission was added.";

interface CookiePartitionKey {
    readonly topLevelSite?: string;
}

interface CookieData {
    readonly name: string;
    readonly value: string;
    readonly domain: string;
    readonly path: string;
    readonly secure: boolean;
    readonly httpOnly: boolean;
    readonly sameSite?: "no_restriction" | "lax" | "strict" | "unspecified";
    readonly expirationDate?: number;
    readonly hostOnly?: boolean;
    readonly session?: boolean;
    readonly partitionKey?: CookiePartitionKey;
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
    for (const bare of ALLOWED_BARE_HOSTS) {
        if (d === bare || d.endsWith(`.${bare}`)) return;
    }
    throw new CookieAccessError(`Refusing cookie for non-allowed domain: ${cookie.domain}`);
}

function ensureAllowedUrl(url: string) {
    if (!ALLOWED_ORIGINS.includes(url as typeof ALLOWED_ORIGINS[number])) {
        throw new CookieAccessError(`Refusing cookie op for non-allowed url: ${url}`);
    }
}

async function listCookies(url: string): Promise<CookieData[]> {
    ensureAllowedUrl(url);
    return bridgeRequest<CookieData[]>("list", { url });
}

async function setCookie(cookie: CookieData, url: string): Promise<void> {
    ensureAllowedUrl(url);
    ensureAllowedDomain(cookie);
    await bridgeRequest<unknown>("set", { url, ...cookie });
}

async function deleteCookie(cookie: CookieData, url: string): Promise<void> {
    ensureAllowedUrl(url);
    await bridgeRequest<unknown>("remove", { url, name: cookie.name, partitionKey: cookie.partitionKey });
}

interface CookieSwapResult {
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

    const tally = (op: "delete" | "set", url: string, cookies: readonly CookieData[], results: PromiseSettledResult<unknown>[]) => {
        let ok = 0;
        results.forEach((r, i) => {
            if (r.status === "rejected") {
                failures.push(`${op} ${url}/${cookies[i].name}: ${errorMessage(r.reason)}`);
                logger.warn(`${op} failed`, url, cookies[i].name, r.reason);
            } else ok++;
        });
        return ok;
    };

    for (const { url, cookies: next } of snapshots) {
        const current = await listCookies(url);
        deleted += tally("delete", url, current, await Promise.allSettled(current.map(c => deleteCookie(c, url))));
        set += tally("set", url, next, await Promise.allSettled(next.map(c => setCookie(c, url))));
    }

    return { deleted, set, failures };
}
