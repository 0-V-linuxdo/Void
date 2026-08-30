/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import type { VoidEventMap } from "@api/Events";
import { LoaderCircleIcon } from "@components/icons";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import type { GrokResponse, ResponseStoreState } from "@grok-types/stores/ResponseStore";
import { ChatPageStore, ResponseStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { type Fiber, getFiber, walkFiberUp } from "@utils/react";
import definePlugin, { StartAt } from "@utils/types";

const logger = new Logger("ChatListStatus");
const MARK = "void-cls";
const LIVE = new Set(["streaming", "optimistic", "reconnecting"]);
const SIDEBAR = '[data-sidebar="sidebar"]';
const BUTTON = '[data-sidebar="menu-button"]';
const SPIN_PATH = "M21 12a9 9 0 1 1-6.219-8.56";

type Kind = "streaming" | "done" | "error";

const marks = new Map<string, Kind>();
const rowById = new Map<string, HTMLElement>();
let raf = 0;
let started = false;
let obs: MutationObserver | null = null;

function isLiveResponse(r: GrokResponse | undefined): boolean {
    if (!r) return false;
    if (r.partial) return true;
    return LIVE.has(r.state ?? "");
}

function isErrorResponse(r: GrokResponse | undefined): boolean {
    return !!r && (r.state === "error" || r.error != null);
}

function isConvId(value: unknown): value is string {
    return typeof value === "string" && value.length >= 8 && /^[a-z0-9_-]+$/i.test(value);
}

function liveIds(): Set<string> {
    const ids = new Set<string>();
    try {
        const page = ChatPageStore.useChatPageStore.getState();
        const current = page.conversationId || page.optimisticConversationId || "";
        if (current && (page.streamedMessageId || page.showStreamingIndicator)) ids.add(current);
        const { byId, byConversationId, inflightPromisesByConversationId } = ResponseStore.useResponseStore.getState();
        if (current && (isLiveResponse(byId[page.streamedMessageId ?? ""]) || isLiveResponse(byId[page.lastMessageId ?? ""]))) {
            ids.add(current);
        }
        for (const id of Object.keys(inflightPromisesByConversationId ?? {})) ids.add(id);
        for (const [id, list] of Object.entries(byConversationId ?? {})) {
            if (list?.some(isLiveResponse)) ids.add(id);
        }
    } catch (e) {
        logger.debug("stream stores unavailable:", e);
    }
    return ids;
}

function errorOf(id: string): boolean {
    try {
        const { byConversationId, byId } = ResponseStore.useResponseStore.getState();
        const list = byConversationId[id];
        if (list?.length) {
            for (let i = list.length - 1; i >= 0; i--) {
                const r = list[i];
                if (String(r.sender ?? "").toLowerCase() === "human") continue;
                return isErrorResponse(r);
            }
        }
        const page = ChatPageStore.useChatPageStore.getState();
        if ((page.conversationId === id || page.optimisticConversationId === id) && page.lastMessageId) {
            return isErrorResponse(byId[page.lastMessageId]);
        }
    } catch (e) {
        logger.debug("error lookup failed:", e);
    }
    return false;
}

function refreshMarks() {
    const live = liveIds();
    for (const id of live) marks.set(id, "streaming");
    for (const [id, kind] of marks) {
        if (kind !== "streaming" || live.has(id)) continue;
        marks.set(id, errorOf(id) ? "error" : "done");
    }
}

function convOfResponse(responseId: string): string {
    try {
        const { byConversationId } = ResponseStore.useResponseStore.getState();
        for (const [id, list] of Object.entries(byConversationId ?? {})) {
            if (list?.some(r => r.responseId === responseId)) return id;
        }
        const page = ChatPageStore.useChatPageStore.getState();
        return page.conversationId || page.optimisticConversationId || "";
    } catch (e) {
        logger.debug("conv lookup failed:", e);
        return "";
    }
}

function onStreamEnd({ responseId }: VoidEventMap["streamEnd"]) {
    const cid = convOfResponse(responseId);
    if (!cid) return;
    try {
        const response = ResponseStore.useResponseStore.getState().byId[responseId];
        marks.set(cid, isErrorResponse(response) ? "error" : "done");
    } catch (e) {
        logger.debug("streamEnd failed:", e);
        marks.set(cid, "done");
    }
    schedule();
}

function hrefId(el: Element): string {
    const a = el instanceof HTMLAnchorElement ? el : el.querySelector("a[href]");
    const href = a?.getAttribute("href") ?? el.getAttribute("href") ?? "";
    if (!href) return "";
    try {
        const u = new URL(href, location.origin);
        return u.searchParams.get("chat") || u.pathname.match(/^\/c\/([^/?#]+)/i)?.[1] || "";
    } catch {
        return "";
    }
}

function idFromProps(props: Record<string, unknown> | null | undefined): string {
    if (!props) return "";
    const { route } = props;
    if (route && typeof route === "object") {
        const r = route as Record<string, unknown>;
        if (isConvId(r.conversationId)) return r.conversationId;
        if (isConvId(r.chat)) return r.chat;
        if (r.page === "workspace") return "";
        if (r.page === "chat" && isConvId(props.id)) return props.id;
    }
    if (isConvId(props.conversationId)) return props.conversationId;
    return "";
}

function idFromRow(el: Element): string {
    const fromHref = hrefId(el);
    if (fromHref) return fromHref;
    try {
        const fiber = getFiber(el);
        const hit = walkFiberUp(fiber, 18, (f: Fiber) => !!idFromProps(f.memoizedProps));
        return idFromProps(hit?.memoizedProps);
    } catch (e) {
        logger.debug("fiber id failed:", e);
        return "";
    }
}

function spinSvg(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2.5");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", SPIN_PATH);
    svg.append(path);
    return svg;
}

function ensureMark(btn: HTMLElement, kind: Kind) {
    let mark = btn.querySelector<HTMLElement>(`:scope > .${MARK}`);
    if (!mark) {
        mark = document.createElement("span");
        mark.className = MARK;
        mark.setAttribute("aria-hidden", "true");
        btn.prepend(mark);
    }
    if (mark.dataset.kind === kind && (kind !== "streaming" || mark.querySelector("svg"))) return;
    mark.dataset.kind = kind;
    mark.replaceChildren();
    if (kind === "streaming") mark.append(spinSvg());
}

function clearMark(btn: HTMLElement) {
    btn.querySelector(`:scope > .${MARK}`)?.remove();
}

function activeButton(sidebar: Element): HTMLElement | null {
    return sidebar.querySelector<HTMLElement>(`${BUTTON}[data-active="true"], ${BUTTON}[aria-current="page"], ${BUTTON}[data-state="active"]`);
}

function paint() {
    if (!started) return;
    refreshMarks();
    const sidebar = document.querySelector(SIDEBAR);
    if (!sidebar) return;

    const usedIds = new Set<string>();
    for (const btn of sidebar.querySelectorAll<HTMLElement>(BUTTON)) {
        const id = idFromRow(btn);
        if (!id) {
            clearMark(btn);
            continue;
        }
        usedIds.add(id);
        rowById.set(id, btn);
        const kind = marks.get(id);
        if (kind) ensureMark(btn, kind);
        else clearMark(btn);
    }

    for (const [id, el] of rowById) {
        if (!el.isConnected || !usedIds.has(id)) rowById.delete(id);
    }

    try {
        const page = ChatPageStore.useChatPageStore.getState();
        const activeId = [page.conversationId, page.optimisticConversationId].find(id => id && marks.has(id)) ?? "";
        if (!activeId || rowById.has(activeId)) return;
        const active = activeButton(sidebar);
        const kind = marks.get(activeId);
        if (active && kind) {
            rowById.set(activeId, active);
            ensureMark(active, kind);
        }
    } catch (e) {
        logger.debug("active row fallback failed:", e);
    }
}

function schedule() {
    if (!started || raf) return;
    raf = requestAnimationFrame(() => {
        raf = 0;
        if (started) paint();
    });
}

function ownMutation(list: MutationRecord[]): boolean {
    if (!list.length) return false;
    for (const m of list) {
        const { target } = m;
        if (target instanceof Element && (target.classList.contains(MARK) || target.closest(`.${MARK}`))) continue;
        for (const n of m.addedNodes) {
            if (n instanceof Element && (n.classList.contains(MARK) || n.querySelector(`.${MARK}`))) continue;
            return false;
        }
        for (const n of m.removedNodes) {
            if (n instanceof Element && n.classList.contains(MARK)) continue;
            return false;
        }
        if (m.type === "attributes") return false;
    }
    return true;
}

function observe() {
    obs?.disconnect();
    const root = document.querySelector(SIDEBAR) ?? document.body;
    obs = new MutationObserver(list => {
        if (ownMutation(list)) return;
        schedule();
    });
    obs.observe(root, { childList: true, subtree: true });
}

function pageKey(s: ChatPageStoreState): string {
    return `${s.conversationId ?? ""}|${s.optimisticConversationId ?? ""}|${s.streamedMessageId ?? ""}|${s.showStreamingIndicator ? 1 : 0}`;
}

function responseKey(s: ResponseStoreState): string {
    const inflight = Object.keys(s.inflightPromisesByConversationId ?? {}).join(",");
    const live: string[] = [];
    for (const [id, list] of Object.entries(s.byConversationId ?? {})) {
        if (list?.some(isLiveResponse)) live.push(id);
    }
    return `${inflight}|${live.join(",")}`;
}

export default definePlugin({
    name: "ChatListStatus",
    icon: LoaderCircleIcon,
    description: "Show Grok reply status on sidebar chats: spinner, blue dot, or error.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    startAt: StartAt.TurbopackReady,
    managedStyle: "chatListStatus",
    cleanupSelectors: [`.${MARK}`],

    start() {
        started = true;
        observe();
        schedule();
    },

    stop() {
        started = false;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        obs?.disconnect();
        obs = null;
        for (const el of document.querySelectorAll(`.${MARK}`)) el.remove();
        marks.clear();
        rowById.clear();
    },

    events: {
        streamEnd: onStreamEnd,
    },

    zustand: {
        ChatPageStore: {
            selector: pageKey,
            handler: schedule,
        },
        ResponseStore: {
            selector: responseKey,
            handler: schedule,
        },
    },
});
