/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoidEventMap } from "@api/Events";
import { definePluginSettings } from "@api/Settings";
import { BellIcon } from "@components/icons";
import { ResponseStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { sendBrowserNotification } from "@utils/misc";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const settings = definePluginSettings({
    sound: {
        type: OptionType.BOOLEAN,
        description: "Play a notification sound.",
        default: true,
    },
    soundUrl: {
        type: OptionType.STRING,
        description: "Custom sound URL (leave empty for default beep).",
        default: "",
        placeholder: "https://example.com/sound.mp3",
    },
    browserNotification: {
        type: OptionType.BOOLEAN,
        description: "Show a browser notification.",
        default: true,
    },
    onlyWhenHidden: {
        type: OptionType.BOOLEAN,
        description: "Only notify when the tab is not focused.",
        default: true,
    },
});

let userGestured = false;
let gestureCtrl: AbortController | null = null;

function playBeep() {
    const ctx = new AudioContext();
    const start = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.value = 0.15;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        osc.onended = () => ctx.close();
    };
    if (ctx.state === "suspended") ctx.resume().then(start, () => ctx.close());
    else start();
}

function playSound() {
    if (!userGestured) return;
    const url = settings.store.soundUrl?.trim();
    if (url) {
        const audio = new Audio(url);
        audio.volume = 0.3;
        audio.play().catch(() => playBeep());
    } else {
        playBeep();
    }
}

function onStreamEnd({ responseId }: VoidEventMap["streamEnd"]) {
    const response = ResponseStore.useResponseStore.getState().byId[responseId];
    if (!response || response.state !== "closed") return;

    if (settings.store.onlyWhenHidden && document.visibilityState === "visible") return;

    if (settings.store.sound) playSound();
    if (settings.store.browserNotification) sendBrowserNotification("Grok", "Response complete.");
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
        const markGestured = () => { userGestured = true; gestureCtrl?.abort(); gestureCtrl = null; };
        for (const evt of ["pointerdown", "keydown", "touchstart"] as const) {
            addEventListener(evt, markGestured, { capture: true, passive: true, signal: gestureCtrl.signal });
        }
    },

    stop() {
        gestureCtrl?.abort();
        gestureCtrl = null;
    },

    events: {
        streamEnd: onStreamEnd,
    },
});
