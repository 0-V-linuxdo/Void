/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Text } from "@components/Text";
import { ClockIcon } from "@components/icons";
import type { GrokResponse } from "@grok-types";
import { React } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { createExternalStore, debounce } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

import { asRecord, chooseTime, harvestResponses, pickTimes, shouldKeepStored, uuidTime } from "./time";

const logger = new Logger("MessageTimestamps");
const STAMP_MAX = 5000;
const RESPONSE_URL = /\/(?:load-responses|share_links)(?:\/|\?|$)/i;

const settings = definePluginSettings({
    showDate: {
        type: OptionType.BOOLEAN,
        description: "Show the full date for messages older than today.",
        default: true,
    },
    hideOwnMessages: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "Hide timestamps on your own messages.",
    },
}).withPrivateSettings<{ stamps: Record<string, number> }>();

const tick = createExternalStore();
let cache: Map<string, number> | null = null;
let origFetch: typeof fetch | null = null;
let hookedWindow: Window | null = null;

function pageWindow(): Window {
    return (typeof unsafeWindow !== "undefined" ? unsafeWindow : window) as Window;
}

function stamps(): Map<string, number> {
    if (cache) return cache;
    cache = new Map();
    const raw = settings.plain.stamps;
    if (raw && typeof raw === "object") {
        for (const [id, ms] of Object.entries(raw)) {
            if (typeof ms === "number" && Number.isFinite(ms)) cache.set(id, ms);
        }
    }
    return cache;
}

function persistNow() {
    const next: Record<string, number> = {};
    for (const [id, ms] of stamps()) next[id] = ms;
    settings.store.stamps = next;
}

const persist = debounce(persistNow, 400);

function remember(id: string, ms: number): boolean {
    const map = stamps();
    const prev = map.get(id);
    if (prev != null && shouldKeepStored(prev, ms)) return false;
    if (map.has(id)) map.delete(id);
    map.set(id, ms);
    while (map.size > STAMP_MAX) {
        const oldest = map.keys().next().value;
        if (oldest == null) break;
        map.delete(oldest);
    }
    persist();
    return prev !== ms;
}

function resolveMs(response: GrokResponse): number | null {
    const rec = asRecord(response);
    if (!rec) return null;
    const { responseId } = rec;
    const id = typeof responseId === "string" ? responseId : "";
    const stored = id ? stamps().get(id) ?? null : null;
    const ms = chooseTime({
        fieldTimes: pickTimes(rec),
        stored,
        uuid: uuidTime(id),
    });
    if (id && ms != null) remember(id, ms);
    return ms;
}

function ingest(value: unknown) {
    let changed = false;
    for (const { id, ms } of harvestResponses(value)) {
        if (remember(id, ms)) changed = true;
    }
    if (changed) tick.notify();
}

function requestUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    try {
        return input.url;
    } catch {
        return "";
    }
}

function hookFetch() {
    if (origFetch) return;
    const w = pageWindow();
    origFetch = w.fetch;
    hookedWindow = w;
    w.fetch = function voidMessageTimestampsFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        const url = requestUrl(input);
        const promise = origFetch!.call(w, input, init);
        if (!RESPONSE_URL.test(url)) return promise;
        return promise.then(res => {
            try {
                res.clone().json().then(ingest, () => {});
            } catch {}
            return res;
        });
    };
}

function unhookFetch() {
    if (!origFetch || !hookedWindow) return;
    hookedWindow.fetch = origFetch;
    origFetch = null;
    hookedWindow = null;
}

function formatTimestamp(ms: number, showDate: boolean) {
    const date = new Date(ms);
    const now = new Date();
    const today = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (!showDate || today) return time;
    return date.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + time;
}

export default definePlugin({
    name: "MessageTimestamps",
    icon: ClockIcon,
    description: "Shows timestamps on chat messages.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings,

    start() {
        try {
            hookFetch();
        } catch (e) {
            logger.warn("Failed to hook fetch", e);
        }
    },

    stop() {
        unhookFetch();
        persistNow();
    },

    _renderTimestamp: ErrorBoundary.wrap(({ response }: { response: GrokResponse }) => {
        useExternalStore(tick);
        if (settings.store.hideOwnMessages && response.sender === "human") return null;
        const ms = resolveMs(response);
        if (ms == null) return null;
        return (
            <Text as="span" size="xs" color="muted" className="void-timestamp">
                {formatTimestamp(ms, settings.store.showDate)}
            </Text>
        );
    }),

    patches: [
        {
            find: "response-family:handleEditSave",
            all: true,
            replacement: {
                match: /\(0,\i\.jsx\)\(\i\.MessageBubble,\{isUser:\i,isIncognito:\i,responseId:(\i)\.responseId/,
                replace: "$self._renderTimestamp({response:$1}),$&",
            },
        },
    ],
});
