/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoidEventMap } from "@api/Events";
import { definePluginSettings } from "@api/Settings";
import type { ChatPageStoreModule, ChatPageStoreState } from "@grok-types/stores";
import { ChatPageStore, ResponseStore, RoutingStore } from "@turbopack/common/stores";
import { filters, waitFor } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import { buildIcons, type FaviconKind, type IconStyle, isIconStyle, STYLE_OPTIONS } from "./icons";

const logger = new Logger("ChatStateFavicons");
const ICON_ID = "void-chat-state-favicon";
const EDITOR_SEL = '.tiptap.ProseMirror[contenteditable="true"]';
const STOP_SELECTORS = [
    'button[aria-label="Stop model response"]',
    'button[aria-label*="Stop" i]',
];
const SEND_SELECTORS = [
    'button[aria-label*="Send" i]',
    'button[aria-label*="Submit" i]',
    'button[type="submit"]',
];

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
let streamContext: string | undefined;
let observer: MutationObserver | null = null;
let composerObs: MutationObserver | null = null;
let inputCtrl: AbortController | null = null;
let unsubPage: (() => void) | null = null;
let unsubRoute: (() => void) | null = null;
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

function contextKey(): string {
    try {
        const { route } = RoutingStore.useRoutingStore.getState();
        if (route.conversationId) return `c:${route.conversationId}`;
        if (route.page) return `p:${route.page}`;
    } catch (e) {
        logger.debug("RoutingStore unavailable:", e);
    }
    const page = getPage();
    if (page?.conversationId) return `c:${page.conversationId}`;
    const lastSeg = location.pathname.split("/").filter(Boolean).slice(-1)[0] ?? "";
    if (/^[a-z0-9_-]{8,}$/i.test(lastSeg)) return `c:${lastSeg}`;
    return `p:${location.pathname}`;
}

function lockStreamContext(key: string) {
    if (!streamContext) {
        streamContext = key;
        return;
    }
    if (streamContext.startsWith("p:") && key.startsWith("c:")) streamContext = key;
}

function sameStreamContext(key: string): boolean {
    if (!streamContext) return true;
    if (streamContext === key) return true;
    return streamContext.startsWith("p:") && key.startsWith("c:");
}

function isVisible(el: Element): boolean {
    if (!(el instanceof HTMLElement) || !el.isConnected) return false;
    if (el.getClientRects().length === 0) return false;
    const style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
}

function composerRoot(): Element {
    const editor = document.querySelector(EDITOR_SEL);
    if (!editor) return document.body;
    return editor.closest("form")
        ?? editor.closest('[class*="composer" i]')
        ?? editor.parentElement
        ?? document.body;
}

function firstVisibleButton(root: ParentNode, selectors: readonly string[]): HTMLElement | null {
    for (const sel of selectors) {
        for (const node of root.querySelectorAll(sel)) {
            if (isVisible(node)) return node as HTMLElement;
        }
    }
    return null;
}

function getStopButton(): HTMLElement | null {
    const root = composerRoot();
    const local = firstVisibleButton(root, STOP_SELECTORS);
    if (local) return local;

    const global = firstVisibleButton(document, STOP_SELECTORS);
    if (global) return global;

    for (const btn of root.querySelectorAll("button")) {
        const label = btn.getAttribute("aria-label") ?? "";
        const text = btn.textContent ?? "";
        if (/stop/i.test(label) || /\bstop\b/i.test(text)) {
            if (isVisible(btn)) return btn as HTMLElement;
        }
    }
    return null;
}

function sendButtonVisible(): boolean {
    const root = composerRoot();
    return !!(firstVisibleButton(root, SEND_SELECTORS) ?? firstVisibleButton(document, SEND_SELECTORS));
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
    return getStopButton() != null;
}

function evaluate() {
    const page = getPage();
    const key = contextKey();
    const streaming = isStreaming(page);
    const sameContext = sameStreamContext(key);

    if (streaming) {
        wasStreaming = true;
        justFinished = false;
        lockStreamContext(key);
        setKind("rotate");
        return;
    }

    if (lastWasError && sameContext) {
        if (!isInputEmpty()) {
            lastWasError = false;
            justFinished = false;
            wasStreaming = false;
            streamContext = undefined;
            setKind("ready");
            return;
        }
        setKind("error");
        return;
    }

    if (wasStreaming) {
        if (!sameContext) {
            wasStreaming = false;
            justFinished = false;
            lastWasError = false;
            streamContext = undefined;
        } else if (getStopButton() || !sendButtonVisible()) {
            setKind("rotate");
            return;
        } else {
            wasStreaming = false;
            justFinished = !lastWasError;
            setKind(lastWasError ? "error" : "done");
            return;
        }
    }

    if (justFinished && sameContext) {
        if (!isInputEmpty()) {
            justFinished = false;
            lastWasError = false;
            streamContext = undefined;
            setKind("ready");
        }
        return;
    }

    justFinished = false;
    lastWasError = false;
    streamContext = undefined;
    setKind(isInputEmpty() ? "wait" : "ready");
}

function scheduleEvaluate() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        evaluate();
    });
}

function onComposerInput() {
    if (kind === "rotate" || wasStreaming) return;
    scheduleEvaluate();
}

function onStreamEnd({ responseId }: VoidEventMap["streamEnd"]) {
    let error = false;
    try {
        const response = ResponseStore.useResponseStore.getState().byId[responseId];
        error = response?.state === "error" || response?.error != null;
    } catch (e) {
        logger.debug("ResponseStore unavailable:", e);
    }
    lastWasError = error;
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
    document.addEventListener("input", onComposerInput, { capture: true, passive: true, signal });
    document.addEventListener("compositionend", onComposerInput, { capture: true, passive: true, signal });
    window.addEventListener("popstate", scheduleEvaluate, { signal });
}

function isButtonNode(node: Node): boolean {
    if (!(node instanceof HTMLElement)) return false;
    return node.tagName === "BUTTON" || node.querySelector("button") != null;
}

function startComposerWatch() {
    composerObs?.disconnect();
    const target = composerRoot();
    if (!target) return;
    composerObs = new MutationObserver(list => {
        for (const m of list) {
            if (m.type === "attributes") {
                if (m.target instanceof HTMLElement && m.target.tagName === "BUTTON") {
                    scheduleEvaluate();
                    return;
                }
                continue;
            }
            for (const node of m.addedNodes) {
                if (isButtonNode(node)) {
                    scheduleEvaluate();
                    return;
                }
            }
            for (const node of m.removedNodes) {
                if (isButtonNode(node)) {
                    scheduleEvaluate();
                    return;
                }
            }
        }
    });
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

    try {
        unsubRoute?.();
        const routeStore = RoutingStore.useRoutingStore;
        if (typeof routeStore?.subscribe === "function") {
            unsubRoute = routeStore.subscribe(() => scheduleEvaluate());
        }
    } catch (e) {
        logger.debug("RoutingStore subscribe failed:", e);
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
        unsubRoute?.();
        unsubRoute = null;
        inputCtrl?.abort();
        inputCtrl = null;
        composerObs?.disconnect();
        composerObs = null;
        wasStreaming = false;
        justFinished = false;
        lastWasError = false;
        streamContext = undefined;
        restoreOfficial();
    },

    onSettingsChange: rebuildIcons,

    events: {
        streamEnd: onStreamEnd,
    },
});
