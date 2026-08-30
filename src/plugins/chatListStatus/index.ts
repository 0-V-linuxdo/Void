/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import type { VoidEventMap } from "@api/Events";
import { LoaderCircleIcon } from "@components/icons";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import type { ConversationStoreState, GrokConversation } from "@grok-types/stores/ConversationStore";
import type { GrokResponse, ResponseStoreState } from "@grok-types/stores/ResponseStore";
import type { RoutingStoreState } from "@grok-types/stores/RoutingStore";
import { ChatPageStore, ConversationStore, ResponseStore, RoutingStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { type Fiber, getFiber, walkFiberUp } from "@utils/react";
import definePlugin, { StartAt } from "@utils/types";

const logger = new Logger("ChatListStatus");
const MARK = "void-cls";
const LIVE = new Set(["streaming", "optimistic", "reconnecting"]);
const DEAD = new Set(["closed", "error", "done", "completed", "complete", "cancelled", "canceled", "aborted", "idle", "success"]);
const SIDEBAR = '[data-sidebar="sidebar"], [data-sidebar="content"]';
const HOST = '[data-sidebar="menu-button"], [data-sidebar="menu-sub-button"]';
const ROW = `${HOST}, a[href*="/c/"], a[href*="/chat/"], a[href*="chat="], a[href*="/project/"]`;
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
    const state = r.state ?? "";
    if (!state) return false;
    if (LIVE.has(state)) return true;
    return !DEAD.has(state.toLowerCase());
}

function isErrorResponse(r: GrokResponse | undefined): boolean {
    return !!r && (r.state === "error" || r.error != null);
}

function isLiveTask(task: Record<string, any> | undefined): boolean {
    if (!task) return false;
    const status = String(task.status ?? task.state ?? "").toLowerCase();
    if (!status) return false;
    return !DEAD.has(status);
}

function isConvId(value: unknown): value is string {
    return typeof value === "string" && value.length >= 8 && /^[a-z0-9_-]+$/i.test(value);
}

function currentIds(): string[] {
    const ids: string[] = [];
    try {
        const page = ChatPageStore.useChatPageStore.getState();
        if (isConvId(page.conversationId)) ids.push(page.conversationId);
        if (isConvId(page.optimisticConversationId)) ids.push(page.optimisticConversationId);
    } catch (e) {
        logger.debug("page ids unavailable:", e);
    }
    try {
        const { route } = RoutingStore.useRoutingStore.getState();
        if (isConvId(route.conversationId)) ids.push(route.conversationId);
        if (isConvId(route.chat)) ids.push(route.chat);
    } catch (e) {
        logger.debug("route ids unavailable:", e);
    }
    return ids;
}

function considerConversation(ids: Set<string>, conversation: GrokConversation | undefined) {
    if (!conversation?.conversationId) return;
    if (conversation.state === "open" || isLiveTask(conversation.taskResult)) ids.add(conversation.conversationId);
}

function liveIds(): Set<string> {
    const ids = new Set<string>();
    try {
        const page = ChatPageStore.useChatPageStore.getState();
        const currents = currentIds();
        if (page.streamedMessageId || page.showStreamingIndicator) {
            for (const id of currents) ids.add(id);
        }
        const { byId, byConversationId, inflightPromisesByConversationId } = ResponseStore.useResponseStore.getState();
        if (isLiveResponse(byId[page.streamedMessageId ?? ""]) || isLiveResponse(byId[page.lastMessageId ?? ""]) || isLiveResponse(byId[page.sidePanelResponseId ?? ""])) {
            for (const id of currents) ids.add(id);
        }
        for (const id of Object.keys(inflightPromisesByConversationId ?? {})) ids.add(id);
        for (const [id, list] of Object.entries(byConversationId ?? {})) {
            if (list?.some(isLiveResponse)) ids.add(id);
        }
    } catch (e) {
        logger.debug("stream stores unavailable:", e);
    }
    try {
        const { byId, byIdWithWorkspaces, list } = ConversationStore.useConversationStore.getState();
        for (const conversation of list ?? []) considerConversation(ids, conversation);
        for (const conversation of Object.values(byId ?? {})) considerConversation(ids, conversation);
        for (const conversation of Object.values(byIdWithWorkspaces ?? {})) considerConversation(ids, conversation);
    } catch (e) {
        logger.debug("conversation store unavailable:", e);
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
        return currentIds()[0] ?? "";
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

function idFromHref(href: string): string {
    if (!href) return "";
    try {
        const u = new URL(href, location.origin);
        return u.searchParams.get("chat")
            || u.searchParams.get("conversationId")
            || u.pathname.match(/^\/(?:c|chat)\/([^/?#]+)/i)?.[1]
            || "";
    } catch {
        return "";
    }
}

function hrefId(el: Element): string {
    const a = el instanceof HTMLAnchorElement ? el : el.querySelector("a[href]");
    return idFromHref(a?.getAttribute("href") ?? el.getAttribute("href") ?? "");
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
    if (isConvId(props.chat)) return props.chat;
    if (typeof props.href === "string") {
        const fromHref = idFromHref(props.href);
        if (fromHref) return fromHref;
    }
    return "";
}

function idFromRow(el: Element): string {
    const fromHref = hrefId(el);
    if (fromHref) return fromHref;
    try {
        const fiber = getFiber(el);
        const hit = walkFiberUp(fiber, 24, (f: Fiber) => !!idFromProps(f.memoizedProps));
        return idFromProps(hit?.memoizedProps);
    } catch (e) {
        logger.debug("fiber id failed:", e);
        return "";
    }
}

function rowHost(el: HTMLElement, root: Element): HTMLElement | null {
    if (el.classList.contains(MARK)) return null;
    const wrapped = el.closest<HTMLElement>(HOST);
    return wrapped && root.contains(wrapped) ? wrapped : el;
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

function roots(): Element[] {
    const found = [...document.querySelectorAll(SIDEBAR)];
    return found.length ? found : [document.body];
}

function activeButton(root: Element): HTMLElement | null {
    return root.querySelector<HTMLElement>(`${ROW}[data-active="true"], ${ROW}[aria-current="page"], ${ROW}[data-state="active"]`);
}

function paint() {
    if (!started) return;
    refreshMarks();
    const usedIds = new Set<string>();
    const seen = new Set<HTMLElement>();

    for (const root of roots()) {
        for (const el of root.querySelectorAll<HTMLElement>(ROW)) {
            const host = rowHost(el, root);
            if (!host || seen.has(host)) continue;
            seen.add(host);
            const id = idFromRow(host);
            if (!id) {
                clearMark(host);
                continue;
            }
            usedIds.add(id);
            rowById.set(id, host);
            const kind = marks.get(id);
            if (kind) ensureMark(host, kind);
            else clearMark(host);
        }
    }

    for (const [id, el] of rowById) {
        if (!el.isConnected || !usedIds.has(id)) rowById.delete(id);
    }

    const live = [...marks].filter(([, kind]) => kind === "streaming").map(([id]) => id);
    if (live.length && !usedIds.size) logger.debug("live ids with no rows", live);

    const activeId = currentIds().find(id => marks.has(id)) ?? "";
    if (!activeId || rowById.has(activeId)) return;
    const kind = marks.get(activeId);
    if (!kind) return;
    for (const root of roots()) {
        const active = activeButton(root);
        if (!active) continue;
        const host = rowHost(active, root) ?? active;
        rowById.set(activeId, host);
        ensureMark(host, kind);
        return;
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
    obs = new MutationObserver(list => {
        if (ownMutation(list)) return;
        schedule();
    });
    obs.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["href", "data-active", "aria-current", "data-state"],
    });
}

function pageKey(s: ChatPageStoreState): string {
    return `${s.conversationId ?? ""}|${s.optimisticConversationId ?? ""}|${s.streamedMessageId ?? ""}|${s.sidePanelResponseId ?? ""}|${s.showStreamingIndicator ? 1 : 0}`;
}

function responseKey(s: ResponseStoreState): string {
    const inflight = Object.keys(s.inflightPromisesByConversationId ?? {}).join(",");
    const live: string[] = [];
    for (const [id, list] of Object.entries(s.byConversationId ?? {})) {
        if (list?.some(isLiveResponse)) live.push(id);
    }
    return `${inflight}|${live.join(",")}`;
}

function conversationKey(s: ConversationStoreState): string {
    const live: string[] = [];
    const seen = new Set<string>();
    const consider = (conversation: GrokConversation | undefined) => {
        if (!conversation?.conversationId || seen.has(conversation.conversationId)) return;
        if (conversation.state !== "open" && !isLiveTask(conversation.taskResult)) return;
        seen.add(conversation.conversationId);
        live.push(conversation.conversationId);
    };
    for (const conversation of s.list ?? []) consider(conversation);
    for (const conversation of Object.values(s.byId ?? {})) consider(conversation);
    for (const conversation of Object.values(s.byIdWithWorkspaces ?? {})) consider(conversation);
    return live.join(",");
}

function routeKey(s: RoutingStoreState): string {
    const { route } = s;
    return `${route.conversationId ?? ""}|${route.chat ?? ""}|${route.workspaceId ?? ""}`;
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
        const sidebar = document.querySelector('[data-sidebar="sidebar"]');
        logger.debug(
            "sidebar", !!sidebar,
            "menu", sidebar?.querySelectorAll('[data-sidebar="menu-button"]').length ?? 0,
            "sub", sidebar?.querySelectorAll('[data-sidebar="menu-sub-button"]').length ?? 0,
            "links", sidebar?.querySelectorAll('a[href*="/c/"], a[href*="chat="], a[href*="/project/"]').length ?? 0,
        );
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
        ConversationStore: {
            selector: conversationKey,
            handler: schedule,
        },
        RoutingStore: {
            selector: routeKey,
            handler: schedule,
        },
    },
});
