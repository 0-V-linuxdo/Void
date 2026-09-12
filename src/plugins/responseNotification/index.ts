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
import { sendBrowserNotification } from "@utils/misc";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const logger = new Logger("ResponseNotification");

const LIVE_STATES = new Set(["streaming", "optimistic", "reconnecting"]);
const RETRY_MS = 80;
const CHIME_LOW = 523.25;
const CHIME_HIGH = 659.25;
const CHIME_GAIN = 0.18;

function PreviewSound() {
    return createElement(
        Flex,
        { flexDirection: "column", gap: "0.5rem" },
        createElement(Paragraph, null, "Preview the default Cursor-style chime."),
        createElement(
            Button,
            {
                size: "sm",
                variant: "secondary",
                onClick() {
                    markGestured();
                    playChime();
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
        description: "Custom sound URL. Leave empty for the Cursor-style chime.",
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
    if (ctx?.state === "suspended") void ctx.resume();
}

function tone(ctx: AudioContext, freq: number, when: number, dur: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(CHIME_GAIN, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.start(when);
    osc.stop(when + dur);
}

function playChime() {
    if (!userGestured) return;
    const ctx = getCtx();
    if (!ctx) return;
    const start = () => {
        const t = ctx.currentTime;
        tone(ctx, CHIME_LOW, t, 0.12);
        tone(ctx, CHIME_HIGH, t + 0.09, 0.2);
    };
    if (ctx.state === "suspended") void ctx.resume().then(start, () => logger.debug("AudioContext resume failed"));
    else start();
}

function playSound() {
    if (!userGestured) {
        logger.debug("sound skipped, no user gesture yet");
        return;
    }
    const url = settings.store.soundUrl?.trim();
    if (url) {
        const audio = new Audio(url);
        audio.volume = 0.3;
        audio.play().catch(() => playChime());
    } else {
        playChime();
    }
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
    logger.debug("notify", responseId, state ?? "unset", "permission", Notification.permission);
    if (settings.store.onlyWhenHidden && document.visibilityState === "visible") return;
    if (settings.store.sound) playSound();
    if (settings.store.browserNotification) sendBrowserNotification("Grok", "Response complete.");
}

function onStreamEnd({ responseId }: VoidPPEventMap["streamEnd"]) {
    if (retryTimer) clearTimeout(retryTimer);
    const attempt = (retried: boolean) => {
        let response: { state?: string; error?: unknown } | undefined;
        try {
            response = ResponseStore.useResponseStore.getState().byId[responseId];
        } catch (e) {
            logger.debug("ResponseStore unavailable:", e);
        }
        if (shouldNotify(response)) {
            notify(responseId, response?.state);
            return;
        }
        if (isErrorResponse(response)) {
            logger.debug("skip error", responseId);
            return;
        }
        if (!retried && (!response || isLiveResponse(response))) {
            retryTimer = setTimeout(() => attempt(true), RETRY_MS);
            return;
        }
        if (!response) {
            notify(responseId, "missing");
            return;
        }
        logger.debug("skip", responseId, response.state ?? "unset");
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
        if (audioCtx && audioCtx.state !== "closed") void audioCtx.close();
        audioCtx = null;
    },

    events: {
        streamEnd: onStreamEnd,
    },
});
