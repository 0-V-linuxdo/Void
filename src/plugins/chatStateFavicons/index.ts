/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoidEventMap } from "@api/Events";
import { definePluginSettings } from "@api/Settings";
import { ChatPageStore, ResponseStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import {
    contextKeyFromUrl,
    conversationToken,
    getActiveEditor,
    getComposerRoot,
    getStopButton,
    isInputEmpty,
    submitIsVisible,
} from "./detect";
import { buildIcons, type FaviconKind, type IconStyle, isIconStyle, STYLE_OPTIONS } from "./icons";

const logger = new Logger("ChatStateFavicons");
const ICON_ID = "void-chat-state-favicon";

const settings = definePluginSettings({
    style: {
        type: OptionType.SELECT,
        description: "How the Grok mark is overlaid with chat state.",
        options: STYLE_OPTIONS,
    },
});

let officialHref = "/images/favicon.svg";
let icons = buildIcons("badge", officialHref);
let kind: FaviconKind = "wait";
let wasStreaming = false;
let justFinished = false;
let streamContext: string | null = null;
let lockedToken = "";
let lastWasError = false;
let faviconObs: MutationObserver | null = null;
let globalObs: MutationObserver | null = null;
let composerObs: MutationObserver | null = null;
let buttonObs: MutationObserver | null = null;
let inputCtrl: AbortController | null = null;
let raf = 0;
let started = false;

function currentStyle(): IconStyle {
    const value = settings.store.style;
    return isIconStyle(value) ? value : "badge";
}

function captureOfficial(): string {
    const existing = document.querySelector<HTMLLinkElement>(`link[rel~="icon"]:not(#${ICON_ID})`);
    const href = existing?.href;
    if (href && !href.startsWith("data:")) return href;
    return `${location.origin}/images/favicon.svg`;
}

function isIconLink(node: Node): node is HTMLLinkElement {
    return node instanceof HTMLLinkElement && (node.relList.contains("icon") || /\bicon\b/i.test(node.rel));
}

function stripCompetitors() {
    const { head } = document;
    if (!head) return;
    for (const node of head.querySelectorAll("link")) {
        if (node.id !== ICON_ID && isIconLink(node)) node.remove();
    }
}

function applyHref(href: string) {
    const { head } = document;
    if (!head) return;
    stripCompetitors();
    let link = document.getElementById(ICON_ID) as HTMLLinkElement | null;
    if (!link) {
        link = document.createElement("link");
        link.id = ICON_ID;
        link.rel = "icon shortcut icon";
        link.type = "image/svg+xml";
        link.setAttribute("sizes", "any");
        head.prepend(link);
    } else if (head.firstChild !== link) {
        head.prepend(link);
    }
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
}

function setKind(next: FaviconKind) {
    kind = next;
    applyHref(icons[next]);
}

function rebuildIcons() {
    icons = buildIcons(currentStyle(), officialHref);
    applyHref(icons[kind]);
}

function storeStreaming(): boolean {
    try {
        const page = ChatPageStore.useChatPageStore.getState();
        return !!(page.streamedMessageId || page.showStreamingIndicator);
    } catch (e) {
        logger.debug("ChatPageStore unavailable:", e);
        return false;
    }
}

function isStreaming(): boolean {
    if (getStopButton()) return true;
    return storeStreaming();
}

function getContextKey(): string {
    const token = conversationToken();
    if (getStopButton() || storeStreaming()) {
        if (!lockedToken && token) lockedToken = token;
        return contextKeyFromUrl(lockedToken);
    }
    lockedToken = "";
    return contextKeyFromUrl(token);
}

function hasError(): boolean {
    if (lastWasError) return true;
    try {
        const { byId } = ResponseStore.useResponseStore.getState();
        const page = ChatPageStore.useChatPageStore.getState();
        const id = page.streamedMessageId ?? page.lastMessageId;
        if (!id) return false;
        const response = byId[id];
        return response?.state === "error" || response?.error != null;
    } catch (e) {
        logger.debug("ResponseStore unavailable:", e);
        return false;
    }
}

function evaluateState() {
    if (!started) return;
    const contextKey = getContextKey();

    if (hasError() && !isStreaming()) {
        setKind("error");
        wasStreaming = false;
        justFinished = false;
        streamContext = null;
        lastWasError = false;
        return;
    }

    if (isStreaming()) {
        wasStreaming = true;
        justFinished = false;
        lastWasError = false;
        streamContext = contextKey;
        setKind("rotate");
        return;
    }

    if (wasStreaming) {
        const sameContext = !streamContext || !contextKey || streamContext === contextKey;
        wasStreaming = false;
        if (sameContext && submitIsVisible()) {
            justFinished = true;
            setKind("done");
            return;
        }
        justFinished = false;
        streamContext = null;
    }

    if (justFinished) {
        const contextChanged = !!(streamContext && contextKey && streamContext !== contextKey);
        if (contextChanged) {
            justFinished = false;
            streamContext = null;
        } else {
            if (!isInputEmpty()) {
                setKind("ready");
                justFinished = false;
            }
            return;
        }
    }

    streamContext = null;
    lastWasError = false;
    setKind(isInputEmpty() ? "wait" : "ready");
}

function scheduleEvaluate() {
    if (!started || raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        if (!started) return;
        bindEditorInput();
        observeComposer();
        observeButtons();
        evaluateState();
    });
}

function onStreamEnd({ responseId }: VoidEventMap["streamEnd"]) {
    try {
        const response = ResponseStore.useResponseStore.getState().byId[responseId];
        lastWasError = response?.state === "error" || response?.error != null;
    } catch (e) {
        logger.debug("ResponseStore unavailable:", e);
    }
}

function startFaviconGuard() {
    faviconObs?.disconnect();
    const { head } = document;
    if (!head) return;
    faviconObs = new MutationObserver(list => {
        for (const m of list) {
            if (m.type === "attributes" && isIconLink(m.target) && m.target.id !== ICON_ID) {
                applyHref(icons[kind]);
                return;
            }
            for (const node of m.addedNodes) {
                if (isIconLink(node) && node.id !== ICON_ID) {
                    applyHref(icons[kind]);
                    return;
                }
            }
        }
    });
    faviconObs.observe(head, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["href", "rel"],
    });
}

function bindEditorInput() {
    const editor = getActiveEditor();
    if (!editor || editor.dataset.voidCsfBound === "1") return;
    editor.dataset.voidCsfBound = "1";
    editor.addEventListener("input", scheduleEvaluate, { passive: true });
    editor.addEventListener("compositionend", scheduleEvaluate, { passive: true });
}

function observeComposer() {
    composerObs?.disconnect();
    const root = getComposerRoot();
    composerObs = new MutationObserver(scheduleEvaluate);
    composerObs.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["aria-disabled", "disabled", "data-testid", "class"],
    });
}

function observeButtons() {
    buttonObs?.disconnect();
    const target = getComposerRoot();
    buttonObs = new MutationObserver(list => {
        for (const m of list) {
            if (m.type === "attributes") {
                const t = m.target;
                if (t instanceof HTMLElement && t.tagName === "BUTTON") {
                    scheduleEvaluate();
                    return;
                }
            } else if (m.addedNodes.length || m.removedNodes.length) {
                scheduleEvaluate();
                return;
            }
        }
    });
    buttonObs.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-label", "type", "disabled", "aria-disabled", "class"],
    });
}

function restoreOfficial() {
    faviconObs?.disconnect();
    faviconObs = null;
    document.getElementById(ICON_ID)?.remove();
    const { head } = document;
    if (!head) return;
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = officialHref;
    head.prepend(link);
}

export default definePlugin({
    name: "ChatStateFavicons",
    description: "Show streaming, done, ready, and error states on the tab favicon.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings,
    startAt: StartAt.TurbopackReady,
    cleanupSelectors: [`#${ICON_ID}`],

    start() {
        started = true;
        officialHref = captureOfficial();
        rebuildIcons();
        startFaviconGuard();
        inputCtrl?.abort();
        inputCtrl = new AbortController();
        window.addEventListener("popstate", scheduleEvaluate, { signal: inputCtrl.signal });
        globalObs?.disconnect();
        globalObs = new MutationObserver(scheduleEvaluate);
        globalObs.observe(document.body, { childList: true, subtree: true });
        bindEditorInput();
        observeComposer();
        observeButtons();
        evaluateState();
    },

    stop() {
        started = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        inputCtrl?.abort();
        inputCtrl = null;
        globalObs?.disconnect();
        globalObs = null;
        composerObs?.disconnect();
        composerObs = null;
        buttonObs?.disconnect();
        buttonObs = null;
        wasStreaming = false;
        justFinished = false;
        streamContext = null;
        lockedToken = "";
        lastWasError = false;
        restoreOfficial();
    },

    onSettingsChange: rebuildIcons,

    events: {
        streamEnd: onStreamEnd,
    },
});
