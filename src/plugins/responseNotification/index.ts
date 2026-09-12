/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoidPPEventMap } from "@api/Events";
import { definePluginSettings } from "@api/Settings";
import { Button, Flex, Paragraph } from "@components";
import { BellIcon } from "@components/icons";
import { createElement } from "@turbopack/common/react";
import { ResponseStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { fetchExternal, sendBrowserNotification } from "@utils/misc";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import { DEFAULT_CHIME } from "./done1";

const logger = new Logger("ResponseNotification");

const LIVE_STATES = new Set(["streaming", "optimistic", "reconnecting"]);
const RETRY_MS = 80;
const SAMPLE_VOLUME = 0.5;

function PreviewSound() {
    return createElement(
        Flex,
        { flexDirection: "column", gap: "0.5rem" },
        createElement(Paragraph, null, "Preview the notification sound."),
        createElement(
            Button,
            {
                size: "sm",
                variant: "secondary",
                onClick() {
                    markGestured();
                    playSound();
                },
            },
            "Play preview",
        ),
    );
}

const settings = definePluginSettings({
    sound: {
        type: OptionType.BOOLEAN,
        description: "Play a notification sound.",
        default: true,
    },
    soundUrl: {
        type: OptionType.STRING,
        description: "Custom sound URL. Leave empty for the default done chime.",
        default: "",
        placeholder: "https://example.com/sound.mp3",
    },
    preview: {
        type: OptionType.COMPONENT,
        description: "Preview sound.",
        component: PreviewSound,
    },
    browserNotification: {
        type: OptionType.BOOLEAN,
        description: "Show a browser notification.",
        default: true,
    },
    onlyWhenHidden: {
        type: OptionType.BOOLEAN,
        description: "Only notify when the tab is hidden.",
        default: true,
    },
});

let userGestured = false;
let gestureCtrl: AbortController | null = null;
let audioCtx: AudioContext | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
const buffers = new Map<string, AudioBuffer>();
const notified = new Set<string>();

function getCtx(): AudioContext | null {
    if (audioCtx && audioCtx.state !== "closed") return audioCtx;
    try {
        audioCtx = new AudioContext();
        return audioCtx;
    } catch (e) {
        logger.debug("AudioContext unavailable:", e);
        audioCtx = null;
        return null;
    }
}

function markGestured() {
    userGestured = true;
    const ctx = getCtx();
    if (!ctx) return;
    const warm = () => { void loadBuffer(ctx, DEFAULT_CHIME); };
    if (ctx.state === "suspended") void ctx.resume().then(warm);
    else warm();
}

function dataUriToBuffer(uri: string): ArrayBuffer {
    const bin = atob(uri.slice(uri.indexOf(",") + 1));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
}

async function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
    const cached = buffers.get(url);
    if (cached) return cached;
    const raw = url.startsWith("data:")
        ? dataUriToBuffer(url)
        : await (await fetchExternal(url)).arrayBuffer();
    const buf = await ctx.decodeAudioData(raw.slice(0));
    buffers.set(url, buf);
    return buf;
}

function playBuffer(ctx: AudioContext, buf: AudioBuffer) {
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buf;
    gain.gain.value = SAMPLE_VOLUME;
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
}

function playUrl(ctx: AudioContext, url: string) {
    void loadBuffer(ctx, url).then(
        buf => playBuffer(ctx, buf),
        err => {
            logger.info("sample play failed:", err);
            if (url !== DEFAULT_CHIME) void loadBuffer(ctx, DEFAULT_CHIME).then(buf => playBuffer(ctx, buf), e => logger.info("default chime failed:", e));
        },
    );
}

function playSound() {
    if (!userGestured) {
        logger.info("sound skipped, no user gesture yet");
        return;
    }
    const ctx = getCtx();
    if (!ctx) return;
    const url = settings.store.soundUrl?.trim() || DEFAULT_CHIME;
    if (ctx.state === "suspended") void ctx.resume().then(() => playUrl(ctx, url), () => logger.info("AudioContext resume failed"));
    else playUrl(ctx, url);
}

function isErrorResponse(response: { state?: string; error?: unknown } | undefined) {
    return response?.state === "error" || response?.error != null;
}

function isLiveResponse(response: { state?: string } | undefined) {
    return !!response?.state && LIVE_STATES.has(response.state);
}

function shouldNotify(response: { state?: string; error?: unknown } | undefined) {
    if (!response || isErrorResponse(response) || isLiveResponse(response)) return false;
    return true;
}

function notify(responseId: string, state: string | undefined) {
    logger.info("notify", responseId, state ?? "unset", "permission", Notification.permission);
    if (settings.store.onlyWhenHidden && document.visibilityState === "visible") return;
    if (settings.store.sound) playSound();
    if (settings.store.browserNotification) sendBrowserNotification("Grok", "Response complete.");
}

function notifyOnce(responseId: string, state: string | undefined) {
    if (notified.has(responseId)) return;
    notified.add(responseId);
    if (notified.size > 80) notified.clear();
    notify(responseId, state);
}

function onResponses(current: { byId?: Record<string, { state?: string; error?: unknown }> } | undefined, prev: { byId?: Record<string, { state?: string; error?: unknown }> } | undefined) {
    const cur = current?.byId;
    const old = prev?.byId;
    if (!cur || !old) return;
    for (const id of Object.keys(cur)) {
        if (isLiveResponse(old[id]) && shouldNotify(cur[id])) notifyOnce(id, cur[id]?.state);
    }
}

function onStreamEnd({ responseId }: VoidPPEventMap["streamEnd"]) {
    logger.info("streamEnd", responseId);
    if (retryTimer) clearTimeout(retryTimer);
    const attempt = (retried: boolean) => {
        let response: { state?: string; error?: unknown } | undefined;
        try {
            response = ResponseStore.useResponseStore.getState().byId[responseId];
        } catch (e) {
            logger.info("ResponseStore unavailable:", e);
        }
        if (shouldNotify(response)) {
            notifyOnce(responseId, response?.state);
            return;
        }
        if (isErrorResponse(response)) {
            logger.info("skip error", responseId);
            return;
        }
        if (!retried && (!response || isLiveResponse(response))) {
            retryTimer = setTimeout(() => attempt(true), RETRY_MS);
            return;
        }
        if (!response) {
            notifyOnce(responseId, "missing");
            return;
        }
        logger.info("skip", responseId, response.state ?? "unset");
    };
    attempt(false);
}

export default definePlugin({
    name: "ResponseNotification",
    icon: BellIcon,
    description: "Notify when Grok finishes responding.",
    authors: [Devs.Prism],
    tags: ["chat"],
    settings,
    startAt: StartAt.TurbopackReady,

    start() {
        if (gestureCtrl) return;
        gestureCtrl = new AbortController();
        const { signal } = gestureCtrl;
        for (const evt of ["pointerdown", "keydown", "touchstart"] as const) {
            addEventListener(evt, markGestured, { capture: true, passive: true, signal });
        }
    },

    stop() {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = undefined;
        gestureCtrl?.abort();
        gestureCtrl = null;
        buffers.clear();
        notified.clear();
        if (audioCtx && audioCtx.state !== "closed") void audioCtx.close();
        audioCtx = null;
    },

    events: {
        streamEnd: onStreamEnd,
    },

    zustand: {
        ResponseStore: {
            handler: onResponses,
        },
    },
});
