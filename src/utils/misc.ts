/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isObject } from "./guards";

export function mergeDefaults<T extends object>(target: T, defaults: T): T {
    for (const key in defaults) {
        if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
        const value = target[key];
        if (isObject(value)) {
            mergeDefaults(value as Record<string, any>, defaults[key] as Record<string, any>);
        } else if (value === undefined) {
            target[key] = defaults[key];
        }
    }
    return target;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        if (typeof GM_setClipboard === "function") {
            GM_setClipboard(text);
        }
    }
}

export function onlyOnce<T extends (...args: never[]) => any>(fn: T): T {
    let result: any;
    let f: T | null = fn;
    return ((...args: any[]) => {
        if (!f) return result;
        result = f(...(args as never[]));
        f = null;
        return result;
    }) as unknown as T;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T & { cancel(): void; flush(): void } {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastArgs: any[] | undefined;
    const debounced = ((...args: any[]) => {
        lastArgs = args;
        clearTimeout(timer);
        timer = setTimeout(() => { lastArgs = undefined; fn(...(args as never[])); }, ms);
    }) as any as T & { cancel(): void; flush(): void };
    debounced.cancel = () => { clearTimeout(timer); lastArgs = undefined; };
    debounced.flush = () => { if (lastArgs) { clearTimeout(timer); const a = lastArgs; lastArgs = undefined; fn(...(a as never[])); } };
    return debounced;
}

export function fetchExternal(url: string): Promise<Response> {
    if (IS_EXTENSION || typeof GM_xmlhttpRequest === "undefined") return fetch(url);

    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: "GET",
            url,
            responseType: "blob",
            onload(resp: any) {
                const blob: Blob = resp.response;
                resolve(new Response(blob, {
                    status: resp.status,
                    statusText: resp.statusText,
                }));
            },
            ontimeout() { reject(new Error("fetch timeout")); },
            onerror() { reject(new Error("fetch error")); },
            onabort() { reject(new Error("fetch aborted")); },
        });
    });
}

export interface ExternalStore {
    notify(): void;
    subscribe(callback: () => void): () => void;
    getSnapshot(): number;
}

export function createExternalStore(): ExternalStore {
    const listeners = new Set<() => void>();
    let version = 0;

    return {
        notify() {
            version++;
            for (const fn of listeners) fn();
        },
        subscribe(callback: () => void) {
            listeners.add(callback);
            return () => { listeners.delete(callback); };
        },
        getSnapshot() {
            return version;
        },
    };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function formatCountdown(totalSeconds: number): string {
    if (totalSeconds <= 0) return "0:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function formatDuration(totalSeconds: number): string {
    if (totalSeconds <= 0) return "0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    return h > 0 ? `${h}h` : `${m}m`;
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function errorMessage(err: any): string {
    return err instanceof Error ? err.message : String(err);
}

export function sanitizeFilename(title: string, fallback = "file"): string {
    return title.replace(/[<>:"/\\|?*\x00-\x1f]/g, "").trim().replace(/\s+/g, "-") || fallback;
}

export function sendBrowserNotification(title: string, body: string, icon = "/favicon.ico"): void {
    if (Notification.permission === "granted") {
        new Notification(title, { body, icon });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => { if (p === "granted") new Notification(title, { body, icon }); }).catch(() => {});
    }
}
