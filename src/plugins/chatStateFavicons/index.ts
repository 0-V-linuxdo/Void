/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { VoidEventMap } from "@api/Events";
import { definePluginSettings } from "@api/Settings";
import type { ChatPageStoreState } from "@grok-types/stores";
import { ChatPageStore, ResponseStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import { buildIcons, type FaviconKind, type IconStyle, isIconStyle, STYLE_OPTIONS } from "./icons";

const ICON_ID = "void-chat-state-favicon";
const EDITOR_SEL = '.tiptap.ProseMirror[contenteditable="true"]';

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
let justFinished = false;
let lastWasError = false;
let lastConv: string | undefined;
let observer: MutationObserver | null = null;
let inputCtrl: AbortController | null = null;
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
    for (const node of document.head.querySelectorAll("link")) {
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

function isInputEmpty(): boolean {
    const { conversationId, queryByConversationId } = ChatPageStore.useChatPageStore.getState();
    const draft = (conversationId ? queryByConversationId[conversationId] : queryByConversationId[""]) ?? "";
    if (draft.replaceAll("\u200B", "").trim()) return false;

    const editor = document.querySelector<HTMLElement>(EDITOR_SEL);
    if (!editor?.isConnected) return true;
    if (editor.querySelector("p.is-empty.is-editor-empty")) return true;
    return (editor.textContent ?? "").replaceAll("\u200B", "").trim().length === 0;
}

function evaluate() {
    const { streamedMessageId, conversationId } = ChatPageStore.useChatPageStore.getState();

    if (streamedMessageId) {
        justFinished = false;
        lastWasError = false;
        lastConv = conversationId;
        setKind("rotate");
        return;
    }

    const sameConv = lastConv === conversationId;

    if (lastWasError && sameConv) {
        if (!isInputEmpty()) {
            lastWasError = false;
            justFinished = false;
            setKind("ready");
            return;
        }
        setKind("error");
        return;
    }

    if (justFinished && sameConv) {
        if (!isInputEmpty()) {
            justFinished = false;
            setKind("ready");
            return;
        }
        setKind("done");
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
    const response = ResponseStore.useResponseStore.getState().byId[responseId];
    lastConv = ChatPageStore.useChatPageStore.getState().conversationId;
    lastWasError = response?.state === "error" || response?.error != null;
    justFinished = !lastWasError;
    evaluate();
}

function startGuard() {
    observer?.disconnect();
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
    observer.observe(document.head, {
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

function restoreOfficial() {
    observer?.disconnect();
    observer = null;
    document.getElementById(ICON_ID)?.remove();
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = officialHref;
    document.head.prepend(link);
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
        evaluate();
    },

    stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        inputCtrl?.abort();
        inputCtrl = null;
        justFinished = false;
        lastWasError = false;
        lastConv = undefined;
        restoreOfficial();
    },

    onSettingsChange: rebuildIcons,

    zustand: {
        ChatPageStore: {
            selector: (s: ChatPageStoreState) => `${s.streamedMessageId ?? ""}|${s.conversationId ?? ""}`,
            handler: evaluate,
        },
    },

    events: {
        streamEnd: onStreamEnd,
    },
});
