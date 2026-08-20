/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoidEventMap } from "@api/Events";
import { definePluginSettings } from "@api/Settings";
import type { ChatPageStoreModule, ChatPageStoreState } from "@grok-types/stores";
import { ChatPageStore, ResponseStore } from "@turbopack/common/stores";
import { filters, waitFor } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import { buildIcons, type FaviconKind, type IconStyle, isIconStyle, STYLE_OPTIONS } from "./icons";

const logger = new Logger("ChatStateFavicons");
const ICON_ID = "void-chat-state-favicon";
const EDITOR_SEL = '.tiptap.ProseMirror[contenteditable="true"]';
const STOP_SEL = 'button[aria-label="Stop model response"], button[aria-label*="Stop" i]';

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
let lastWasError = false;
let lastConv: string | undefined;
let observer: MutationObserver | null = null;
let composerObs: MutationObserver | null = null;
let inputCtrl: AbortController | null = null;
let unsubPage: (() => void) | null = null;
let cancelWait: (() => void) | null = null;
let raf = 0;

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

function getPage(): ChatPageStoreState | null {
    try {
        const { getState } = ChatPageStore.useChatPageStore;
        if (typeof getState !== "function") return null;
        return getState();
    } catch (e) {
        logger.debug("ChatPageStore unavailable:", e);
        return null;
    }
}

function isVisible(el: Element): boolean {
    if (!(el instanceof HTMLElement)) return false;
    if (el.getClientRects().length === 0) return false;
    const style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function composerRoot(): Element {
    const editor = document.querySelector(EDITOR_SEL);
    return editor?.closest("form") ?? editor?.closest("div.relative") ?? document.body;
}

function stopButtonVisible(): boolean {
    const root = composerRoot();
    for (const btn of root.querySelectorAll(STOP_SEL)) {
        if (isVisible(btn)) return true;
    }
    return false;
}

function isInputEmpty(): boolean {
    const editor = document.querySelector<HTMLElement>(EDITOR_SEL);
    if (!editor?.isConnected) return true;
    if (editor.querySelector("p.is-empty.is-editor-empty")) return true;
    return (editor.textContent ?? "").replaceAll("\u200B", "").trim().length === 0;
}

function isStreaming(page: ChatPageStoreState | null): boolean {
    if (page?.streamedMessageId) return true;
    if (page?.showStreamingIndicator) return true;
    return stopButtonVisible();
}

function evaluate() {
    const page = getPage();
    const conversationId = page?.conversationId;
    const streaming = isStreaming(page);
    const sameConv = lastConv == null || conversationId == null || lastConv === conversationId;

    if (streaming) {
        wasStreaming = true;
        justFinished = false;
        lastConv = conversationId ?? lastConv;
        setKind("rotate");
        return;
    }

    if (lastWasError && sameConv) {
        if (!isInputEmpty()) {
            lastWasError = false;
            justFinished = false;
            wasStreaming = false;
            setKind("ready");
            return;
        }
        setKind("error");
        return;
    }

    if (wasStreaming) {
        wasStreaming = false;
        if (sameConv) {
            justFinished = !lastWasError;
            setKind(lastWasError ? "error" : "done");
            return;
        }
        justFinished = false;
        lastWasError = false;
    }

    if (justFinished && sameConv) {
        if (!isInputEmpty()) {
            justFinished = false;
            lastWasError = false;
            setKind("ready");
            return;
        }
        setKind(lastWasError ? "error" : "done");
        return;
    }

    justFinished = false;
    lastWasError = false;
    setKind(isInputEmpty() ? "wait" : "ready");
}

function scheduleEvaluate() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        evaluate();
    });
}

function onStreamEnd({ responseId }: VoidEventMap["streamEnd"]) {
    let error = false;
    try {
        const response = ResponseStore.useResponseStore.getState().byId[responseId];
        error = response?.state === "error" || response?.error != null;
    } catch (e) {
        logger.debug("ResponseStore unavailable:", e);
    }
    lastConv = getPage()?.conversationId ?? lastConv;
    lastWasError = error;
    justFinished = !error;
    wasStreaming = true;
    evaluate();
}

function startGuard() {
    observer?.disconnect();
    const { head } = document;
    if (!head) return;
    observer = new MutationObserver(list => {
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
    observer.observe(head, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["href", "rel"],
    });
}

function startInputWatch() {
    inputCtrl?.abort();
    inputCtrl = new AbortController();
    const { signal } = inputCtrl;
    document.addEventListener("input", scheduleEvaluate, { capture: true, passive: true, signal });
    document.addEventListener("compositionend", scheduleEvaluate, { capture: true, passive: true, signal });
}

function startComposerWatch() {
    composerObs?.disconnect();
    const target = composerRoot();
    if (!target) return;
    composerObs = new MutationObserver(() => scheduleEvaluate());
    composerObs.observe(target, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["aria-label", "type", "disabled", "aria-disabled", "hidden", "class"],
    });
}

function pageSignature(s: ChatPageStoreState) {
    return `${s.streamedMessageId ?? ""}|${s.conversationId ?? ""}|${s.showStreamingIndicator ? 1 : 0}|${s.optimisticMessageId ?? ""}`;
}

function attachStore(mod?: ChatPageStoreModule) {
    unsubPage?.();
    const store = mod?.useChatPageStore ?? ChatPageStore.useChatPageStore;
    if (typeof store?.subscribe !== "function") return false;

    try {
        unsubPage = store.subscribe(pageSignature, () => scheduleEvaluate());
    } catch (e) {
        logger.debug("selector subscribe failed, using full subscribe:", e);
        unsubPage = store.subscribe(() => scheduleEvaluate());
    }
    evaluate();
    return true;
}

function restoreOfficial() {
    observer?.disconnect();
    observer = null;
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
        officialHref = captureOfficial();
        rebuildIcons();
        startGuard();
        startInputWatch();
        startComposerWatch();
        if (attachStore()) return;
        cancelWait = waitFor<ChatPageStoreModule>(filters.byProps("useChatPageStore"), mod => {
            attachStore(mod);
        });
        evaluate();
    },

    stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        cancelWait?.();
        cancelWait = null;
        unsubPage?.();
        unsubPage = null;
        inputCtrl?.abort();
        inputCtrl = null;
        composerObs?.disconnect();
        composerObs = null;
        wasStreaming = false;
        justFinished = false;
        lastWasError = false;
        lastConv = undefined;
        restoreOfficial();
    },

    onSettingsChange: rebuildIcons,

    events: {
        streamEnd: onStreamEnd,
    },
});
