/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { LayoutGridIcon } from "@components/icons";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import type { GrokConversation } from "@grok-types/stores/ConversationStore";
import type { ResponseStoreState } from "@grok-types/stores/ResponseStore";
import type { GrokRoute, RoutingStoreState } from "@grok-types/stores/RoutingStore";
import type { GrokResponse } from "@grok-types";
import { React } from "@turbopack/common/react";
import { ChatPageStore, ConversationStore, ResponseStore, RoutingStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("RecentTopics");
const cl = classNameFactory("void-rt-");
const HOME_ID = "";
const TRIGGER_CODES = new Set(["Backquote", "IntlBackslash"]);
const TRIGGER_KEYS = new Set(["`", "~", "·", "｀", "～", "Dead", "Process"]);
const TITLE_TAIL = /\s*[·|—–-]\s*Grok.*$/i;
const SKIP_LABEL = /^(more|history|today|yesterday|projects|new chat|new conversation)$/i;
const SKIP_NOISE = /^(copy|share|retry|edit|more|thinking|analyzing|searching|continue from here|what can i help with\??)$/i;
const TIME_TOKEN = /(?:^|\s)\d{1,2}:\d{2}\s*(?:am|pm)\b/gi;
const STATUS_TOKEN = /\b(?:connected to computer|continuing the(?: task)?|worked for \d+\s*m(?:\s*\d+\s*s)?|worked for \d+\s*s)\b/gi;
const COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => ({ label: String(n), value: n, default: n === 5 }));

const settings = definePluginSettings({
    maxRecent: {
        type: OptionType.SELECT,
        description: "How many recently opened conversations to show.",
        options: COUNT_OPTIONS,
    },
    includeHome: {
        type: OptionType.BOOLEAN,
        description: "Include the new-chat home page in the switcher.",
        default: true,
    },
}).withPrivateSettings<{
    visits: string[];
    titles: Record<string, string>;
    workspaceByConv: Record<string, string>;
    projectNames: Record<string, string>;
    pages: Record<string, string>;
}>();

interface PageLine {
    role: "user" | "assistant";
    text: string;
}

interface PageSnap {
    title: string;
    theme: "dark" | "light";
    lines: PageLine[];
}

const thumbs = new Map<string, PageSnap>();
const wsNames: Record<string, string> = {};

interface Topic {
    id: string;
    title: string;
    project: string;
}

let open = false;
let selected = 0;
let held = false;
let ctrlHeld = false;
let keys: AbortController | null = null;
let host: HTMLDivElement | null = null;
let paintedKey = "";

function unique(ids: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        out.push(id);
    }
    return out;
}

function readVisits(): string[] {
    return settings.plain.visits ?? [];
}

function maxCount(): number {
    const n = Number(settings.store.maxRecent);
    return Number.isFinite(n) && n > 0 ? n : 5;
}

function capVisits(ids: string[]): string[] {
    const allowHome = settings.store.includeHome;
    return unique(ids).filter(id => id || allowHome).slice(0, maxCount());
}

function pruneRecord(source: Record<string, string> | undefined, ids: string[]): Record<string, string> {
    const keep: Record<string, string> = {};
    if (!source) return keep;
    for (const id of ids) {
        if (source[id]) keep[id] = source[id];
    }
    return keep;
}

function sameList(a: string[], b: string[]) {
    return a.length === b.length && a.every((id, i) => id === b[i]);
}

function sameRecord(a: Record<string, string> | undefined, b: Record<string, string>) {
    const src = a ?? {};
    const keys = Object.keys(b);
    if (Object.keys(src).length !== keys.length) return false;
    return keys.every(k => src[k] === b[k]);
}

function assignRecord(key: "titles" | "workspaceByConv" | "projectNames" | "pages", next: Record<string, string>) {
    if (sameRecord(settings.plain[key], next)) return false;
    settings.store[key] = next;
    return true;
}

let writing = false;

function writeVisits(next: string[]) {
    if (writing) return;
    writing = true;
    try {
        const visits = capVisits(next);
        const rawWs = pruneRecord(settings.plain.workspaceByConv, visits);
        const workspaceByConv: Record<string, string> = {};
        for (const [id, value] of Object.entries(rawWs)) {
            const ws = asWorkspaceId(value);
            if (ws) workspaceByConv[id] = ws;
        }
        const pages = pruneRecord(settings.plain.pages, visits);
        const usedWs = new Set(Object.values(workspaceByConv));
        const keepProjects: Record<string, string> = {};
        for (const [id, name] of Object.entries(settings.plain.projectNames ?? {})) {
            if (usedWs.has(id)) keepProjects[id] = name;
        }
        let changed = false;
        if (!sameList(readVisits(), visits)) {
            settings.store.visits = visits;
            changed = true;
        }
        if (assignRecord("titles", pruneRecord(settings.plain.titles, visits))) changed = true;
        if (assignRecord("workspaceByConv", workspaceByConv)) changed = true;
        if (assignRecord("pages", pages)) changed = true;
        if (assignRecord("projectNames", keepProjects)) changed = true;
        if (changed && open) paint();
    } finally {
        writing = false;
    }
}

function rememberTitle(id: string, title?: string) {
    const t = title?.trim();
    if (!id || !t) return;
    const prev = settings.plain.titles ?? {};
    if (prev[id] === t) return;
    settings.store.titles = { ...prev, [id]: t };
}

function routeConvId(route?: GrokRoute | null): string | null {
    if (!route) return null;
    if (route.conversationId) return route.conversationId;
    if (typeof route.chat === "string" && route.chat) return route.chat;
    if (route.page === "main") return HOME_ID;
    return null;
}

function projectIdFromUrl(): string {
    const m = location.pathname.match(/^\/project\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i)
        ?? location.pathname.match(/^\/project\/(deepsearch)(?:\/|$)/i);
    return m?.[1] ?? "";
}

function chatIdFromUrl(): string {
    try {
        return new URLSearchParams(location.search).get("chat") ?? "";
    } catch {
        return "";
    }
}

const WS_ID = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|deepsearch)$/i;

function asWorkspaceId(value: unknown): string {
    if (typeof value === "string") {
        const s = value.trim();
        return WS_ID.test(s) ? s : "";
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            const id = asWorkspaceId(item);
            if (id) return id;
        }
        return "";
    }
    if (value && typeof value === "object") {
        const rec = value as Record<string, unknown>;
        return asWorkspaceId(rec.workspaceId ?? rec.id ?? rec.projectId);
    }
    return "";
}

function hrefFor(id: string, workspaceId?: string): string {
    const ws = asWorkspaceId(workspaceId);
    if (!id) return ws ? `/project/${ws}` : "/";
    if (ws) return `/project/${ws}?chat=${encodeURIComponent(id)}`;
    return `/c/${encodeURIComponent(id)}`;
}

function currentVisit(): string | null {
    try {
        const id = ChatPageStore.useChatPageStore.getState().conversationId;
        if (id) return id;
    } catch (e) {
        logger.debug("ChatPageStore unavailable:", e);
    }
    try {
        const id = routeConvId(RoutingStore.useRoutingStore.getState().route);
        if (id != null) return id;
    } catch (e) {
        logger.debug("RoutingStore unavailable:", e);
    }
    return chatIdFromUrl() || null;
}

function idsFromHistory(): string[] {
    try {
        const { route, historyStack } = RoutingStore.useRoutingStore.getState();
        const ids: string[] = [];
        const add = (r?: GrokRoute) => {
            const id = routeConvId(r);
            if (id != null) ids.push(id);
        };
        add(route);
        for (let i = (historyStack?.length ?? 0) - 1; i >= 0; i--) add(historyStack[i]);
        return unique(ids);
    } catch (e) {
        logger.debug("historyStack unavailable:", e);
        return [];
    }
}

function pageTitle(): string {
    const raw = document.title.replace(TITLE_TAIL, "").trim();
    if (!raw || /^grok$/i.test(raw)) return "";
    return raw;
}

function lookup(id: string): GrokConversation | undefined {
    try {
        const { byId, byIdWithWorkspaces, list } = ConversationStore.useConversationStore.getState();
        return byId[id] ?? byIdWithWorkspaces[id] ?? list.find(c => c.conversationId === id);
    } catch (e) {
        logger.debug("Conversation lookup failed:", e);
        return undefined;
    }
}

function titleOf(id: string): string {
    if (!id) return "New chat";
    const conv = lookup(id);
    if (conv?.title?.trim()) return conv.title.trim();
    const cached = settings.plain.titles?.[id];
    if (cached) return cached;
    if (id === currentVisit()) return pageTitle() || "Untitled";
    return "Untitled";
}

function liveWorkspaceId(): string {
    try {
        const pid = asWorkspaceId(ChatPageStore.useChatPageStore.getState().projectId);
        if (pid) return pid;
    } catch {}
    try {
        const { workspaceId } = RoutingStore.useRoutingStore.getState().route;
        const id = asWorkspaceId(workspaceId);
        if (id) return id;
    } catch {}
    return asWorkspaceId(projectIdFromUrl());
}

function workspaceFromHistory(id: string): string {
    try {
        const { route, historyStack } = RoutingStore.useRoutingStore.getState();
        if (routeConvId(route) === id) {
            const ws = asWorkspaceId(route.workspaceId);
            if (ws) return ws;
        }
        for (let i = (historyStack?.length ?? 0) - 1; i >= 0; i--) {
            const r = historyStack[i];
            if (routeConvId(r) === id) {
                const ws = asWorkspaceId(r?.workspaceId);
                if (ws) return ws;
            }
        }
    } catch {}
    return "";
}

function convWorkspaceId(id: string): string {
    try {
        const { byId, byIdWithWorkspaces } = ConversationStore.useConversationStore.getState();
        const resolved = ConversationStore.resolveConversationProjectWorkspaceId?.(byId[id], byIdWithWorkspaces[id]);
        const fromResolver = asWorkspaceId(resolved);
        if (fromResolver) return fromResolver;
        const conv = byId[id] ?? byIdWithWorkspaces[id];
        return asWorkspaceId(conv?.workspaceId) || asWorkspaceId(conv?.workspaces);
    } catch (e) {
        logger.debug("convWorkspaceId failed:", e);
        return asWorkspaceId(lookup(id)?.workspaceId) || asWorkspaceId(lookup(id)?.workspaces);
    }
}

function workspaceFromDom(id: string): string {
    if (!id) return "";
    try {
        for (const a of document.querySelectorAll<HTMLAnchorElement>("a[href]")) {
            const href = a.getAttribute("href");
            if (!href || !href.includes(id)) continue;
            const u = new URL(href, location.origin);
            if (u.searchParams.get("chat") !== id && !u.pathname.includes(id)) continue;
            const ws = asWorkspaceId(u.pathname.match(/^\/project\/([^/?#]+)/i)?.[1]);
            if (ws) return ws;
        }
    } catch {}
    return "";
}

function workspaceOf(id: string): string {
    if (!id) return "";
    if (id === currentVisit()) {
        const live = liveWorkspaceId();
        if (live) return live;
    }
    return convWorkspaceId(id)
        || asWorkspaceId(settings.plain.workspaceByConv?.[id])
        || workspaceFromHistory(id)
        || workspaceFromDom(id);
}

function labelText(el: Element): string {
    return (el.textContent ?? "").replaceAll(/\s+/g, " ").trim();
}

function readOpenProjectName(): string {
    const sidebar = document.querySelector("[data-sidebar=sidebar]");
    if (!sidebar) return "";
    const nodes = [...sidebar.querySelectorAll("a, button, [role='button']")];
    let afterProjects = false;
    for (const el of nodes) {
        const t = labelText(el);
        if (!t) continue;
        if (/^projects$/i.test(t)) {
            afterProjects = true;
            continue;
        }
        if (!afterProjects) continue;
        if (SKIP_LABEL.test(t)) break;
        if (t.length < 2 || t.length > 64) continue;
        if (el.querySelector("svg")) return t;
    }
    return "";
}

function projectNameOf(id: string): string {
    if (!id) return "";
    const ws = workspaceOf(id);
    if (!ws) return "";
    return wsNames[ws] || settings.plain.projectNames?.[ws] || (id === currentVisit() ? readOpenProjectName() : "") || "";
}

function rememberProject(id: string) {
    if (!id) return;
    const ws = workspaceOf(id);
    if (!ws) return;
    const prevWs = settings.plain.workspaceByConv ?? {};
    if (prevWs[id] !== ws) settings.store.workspaceByConv = { ...prevWs, [id]: ws };
    const name = wsNames[ws] || readOpenProjectName() || settings.plain.projectNames?.[ws] || "";
    if (!name) return;
    wsNames[ws] = name;
    const prevNames = settings.plain.projectNames ?? {};
    if (prevNames[ws] !== name) settings.store.projectNames = { ...prevNames, [ws]: name };
}

function chatPane(): HTMLElement | null {
    const main = document.querySelector("main");
    if (!main) return null;
    let best: HTMLElement | null = null;
    let bestScore = 0;
    for (const n of main.querySelectorAll<HTMLElement>("[class*='overflow-y-auto'], [class*='overflow-auto']")) {
        if (n.closest("[data-sidebar], .void-rt-root, #void-rt-host")) continue;
        const r = n.getBoundingClientRect();
        if (r.width < 240 || r.height < 120) continue;
        const score = r.width * r.height;
        if (score > bestScore) {
            best = n;
            bestScore = score;
        }
    }
    return best;
}

function messageList(pane: HTMLElement): HTMLElement {
    let node = pane;
    for (let i = 0; i < 8; i++) {
        const kids = [...node.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
        if (kids.length === 1 && kids[0].children.length > 1) {
            node = kids[0];
            continue;
        }
        break;
    }
    return node;
}

function chromeOff(el: HTMLElement): HTMLElement {
    const clone = el.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("button, .void-timestamp, time, nav, svg, [class*='timestamp']").forEach(n => n.remove());
    return clone;
}

function userBubble(root: HTMLElement): HTMLElement | null {
    const tagged = root.querySelector<HTMLElement>("[data-void-rt-role='user'], .void-rt-user-msg");
    if (tagged) return tagged;
    const cands = [...root.querySelectorAll<HTMLElement>("[class*='justify-end'], [class*='self-end'], [class*='ml-auto'], [class*='ms-auto'], [class*='items-end']")];
    if (/justify-end|self-end|ml-auto|ms-auto|items-end/.test(root.className)) cands.unshift(root);
    if (!cands.length) return null;
    const inner = cands.filter(el => !cands.some(other => other !== el && el.contains(other)));
    inner.sort((a, b) => (a.innerText?.length ?? 0) - (b.innerText?.length ?? 0));
    return inner[0] ?? null;
}

function extractTurn(kid: HTMLElement): PageLine[] {
    const bubble = userBubble(kid);
    const userText = bubble ? scrubText(chromeOff(bubble).innerText ?? "") : "";
    const rest = chromeOff(kid);
    if (bubble && bubble !== kid) {
        rest.querySelectorAll("[class*='justify-end'], [class*='self-end'], [class*='ml-auto']").forEach(n => n.remove());
    }
    let asstText = scrubText(rest.innerText ?? "");
    if (userText && asstText.includes(userText)) asstText = scrubText(asstText.replace(userText, " "));
    const lines: PageLine[] = [];
    if (userText) lines.push({ role: "user", text: userText });
    if (asstText && asstText !== userText) lines.push({ role: "assistant", text: asstText });
    return lines;
}

function extractMarks(root: ParentNode): PageLine[] {
    const marks = [...root.querySelectorAll<HTMLElement>(".void-rt-mark")];
    if (!marks.length) return [];
    const out: PageLine[] = [];
    for (const m of marks) {
        const role = m.getAttribute("data-role") === "user" ? "user" : "assistant";
        const text = scrubText(m.textContent ?? "");
        if (text) out.push({ role, text });
    }
    return lastRound(out);
}

function extractLines(pane: HTMLElement): PageLine[] {
    const fromMarks = extractMarks(pane);
    if (fromMarks.length) return fromMarks;
    const source = messageList(pane);
    const kids = [...source.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    const out: PageLine[] = [];
    for (const kid of kids) out.push(...extractTurn(kid));
    return lastRound(out);
}

function scrubText(raw: string): string {
    let t = raw.replaceAll(/\s+/g, " ").trim();
    t = t.replace(TIME_TOKEN, " ").replace(STATUS_TOKEN, " ");
    t = t.replaceAll(/\s+/g, " ").trim();
    if (!t || SKIP_NOISE.test(t)) return "";
    return t;
}

function plainText(md: string): string {
    const t = md
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/[*_~]{1,3}/g, "")
        .replace(/^>\s+/gm, "");
    return scrubText(t);
}

function clipLine(text: string, max: number): string {
    const t = scrubText(text);
    if (t.length <= max) return t;
    return `${t.slice(0, Math.max(1, max - 1))}…`;
}

function lastRound(lines: PageLine[]): PageLine[] {
    const cleaned = lines
        .map(line => ({ role: line.role, text: scrubText(line.text) }))
        .filter((line): line is PageLine => !!line.text);
    if (!cleaned.length) return [];
    let asst = -1;
    let user = -1;
    for (let i = cleaned.length - 1; i >= 0; i--) {
        if (asst < 0 && cleaned[i].role === "assistant") asst = i;
        if (user < 0 && cleaned[i].role === "user") user = i;
        if (asst >= 0 && user >= 0) break;
    }
    const pick: PageLine[] = user >= 0 && asst >= 0 && user < asst
        ? [cleaned[user], cleaned[asst]]
        : user >= 0 && (asst < 0 || user > asst)
            ? [cleaned[user]]
            : asst >= 0
                ? [cleaned[asst]]
                : cleaned.slice(-1);
    return pick.map(line => ({
        role: line.role,
        text: clipLine(line.text, line.role === "user" ? 72 : 140),
    }));
}

function pickUserText(query: string, message: string): string {
    const q = plainText(query);
    const m = plainText(message);
    if (q && m) {
        if (m.startsWith(q) && m.length > q.length) return q;
        return q.length <= m.length ? q : m;
    }
    return q || m;
}

function walkThread(startId: string | undefined): GrokResponse[] {
    if (!startId) return [];
    try {
        const { byId } = ResponseStore.useResponseStore.getState();
        const out: GrokResponse[] = [];
        const seen = new Set<string>();
        let id: string | undefined = startId;
        while (id && !seen.has(id) && out.length < 50) {
            seen.add(id);
            const r = byId[id];
            if (!r) break;
            out.unshift(r);
            id = r.parentResponseId;
        }
        return out;
    } catch {
        return [];
    }
}

function responsesOf(id: string): GrokResponse[] {
    const { byConversationId, byId, nodesByConversationId } = ResponseStore.useResponseStore.getState();
    const nodes = nodesByConversationId[id] ?? [];
    if (nodes.length) {
        const list = nodes.map(n => byId[n.responseId]).filter((r): r is GrokResponse => !!r);
        if (list.length) return list;
        const walked = walkThread(nodes.at(-1)?.responseId);
        if (walked.length) return walked;
    }
    const cached = byConversationId[id];
    if (cached?.length) return [...cached].sort((a, b) => String(a.createTime ?? "").localeCompare(String(b.createTime ?? "")));
    try {
        const chat = ChatPageStore.useChatPageStore.getState();
        if (chat.conversationId === id) {
            return walkThread(chat.lastMessageId ?? chat.streamedMessageId ?? chat.optimisticMessageId);
        }
    } catch { /* ignore */ }
    return [];
}

function responsesToLines(list: GrokResponse[]): PageLine[] {
    const out: PageLine[] = [];
    for (const r of list) {
        if (!r || r.isControl) continue;
        const sender = String(r.sender ?? "").toLowerCase();
        const human = sender === "human" || sender === "user";
        if (human) {
            const text = pickUserText(r.query || "", r.message || "");
            if (text) out.push({ role: "user", text });
            continue;
        }
        const query = pickUserText(r.query || "", "");
        let message = plainText(r.message || "");
        if (query && message.startsWith(query) && message.length > query.length) {
            message = scrubText(message.slice(query.length));
        }
        if (query && out.at(-1)?.text !== query) out.push({ role: "user", text: query });
        if (message && message !== query) out.push({ role: "assistant", text: message });
    }
    return lastRound(out);
}

function linesFromStore(id: string): PageLine[] {
    if (!id) return [];
    try {
        return responsesToLines(responsesOf(id));
    } catch (e) {
        logger.debug("ResponseStore snapshot failed:", e);
        return [];
    }
}

function betterLines(store: PageLine[], dom: PageLine[]): PageLine[] {
    const pair = (lines: PageLine[]) =>
        lines.some(l => l.role === "user") && lines.some(l => l.role === "assistant");
    if (pair(store)) return store;
    if (pair(dom)) return dom;
    return store.length ? store : dom;
}

function parseSnap(raw: string | undefined): PageSnap | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as PageSnap;
        if (!parsed || !Array.isArray(parsed.lines) || !parsed.lines.length) return null;
        return {
            title: typeof parsed.title === "string" ? parsed.title : "",
            theme: parsed.theme === "light" ? "light" : "dark",
            lines: lastRound(parsed.lines.filter((line): line is PageLine =>
                !!line && (line.role === "user" || line.role === "assistant") && typeof line.text === "string")),
        };
    } catch {
        return null;
    }
}

function snapOf(id: string): PageSnap | null {
    return thumbs.get(id) ?? parseSnap(settings.plain.pages?.[id]);
}

function rememberPage(id: string, snap: PageSnap) {
    const json = JSON.stringify(snap);
    const prev = settings.plain.pages ?? {};
    if (prev[id] === json) return;
    settings.store.pages = { ...prev, [id]: json };
}

function applyLineStyle(el: HTMLElement, role: "user" | "assistant", theme: "dark" | "light") {
    el.style.display = "-webkit-box";
    el.style.webkitBoxOrient = "vertical";
    el.style.overflow = "hidden";
    el.style.width = "fit-content";
    el.style.overflowWrap = "anywhere";
    el.style.fontSize = "11px";
    el.style.lineHeight = "1.35";
    if (role === "user") {
        el.style.alignSelf = "flex-end";
        el.style.maxWidth = "78%";
        el.style.padding = "6px 9px";
        el.style.borderRadius = "14px 14px 4px 14px";
        el.style.background = theme === "light" ? "#e8e6e0" : "#2f2f2f";
        el.style.color = theme === "light" ? "#171717" : "#fff";
        el.style.webkitLineClamp = "2";
    } else {
        el.style.alignSelf = "flex-start";
        el.style.maxWidth = "94%";
        el.style.padding = "0";
        el.style.background = "transparent";
        el.style.color = theme === "light" ? "#3f3f3f" : "#c4c4c4";
        el.style.webkitLineClamp = "4";
    }
}

function buildPageShot(snap: PageSnap): HTMLElement {
    const page = node("span", cl("page"));
    page.dataset.theme = snap.theme;
    for (const line of lastRound(snap.lines)) {
        const el = node("span", cl("page-line", line.role === "user" && "page-line-user"), line.text);
        el.dataset.role = line.role;
        applyLineStyle(el, line.role, snap.theme);
        page.append(el);
    }
    return page;
}

function captureId(id: string) {
    if (!id) return;
    const fromStore = linesFromStore(id);
    let fromDom: PageLine[] = [];
    if (id === currentVisit()) {
        const pane = chatPane();
        if (pane) fromDom = extractLines(pane);
    }
    const lines = betterLines(fromStore, fromDom);
    if (!lines.length) return;
    const snap: PageSnap = {
        title: titleOf(id),
        theme: detectTheme(),
        lines: lastRound(lines),
    };
    thumbs.set(id, snap);
    rememberPage(id, snap);
}

let capturing = false;

function captureCurrent() {
    if (capturing || open) return;
    capturing = true;
    try {
        const current = currentVisit();
        if (current) captureId(current);
        for (const id of capVisits(readVisits())) {
            if (id && id !== current) captureId(id);
        }
    } catch (e) {
        logger.debug("snapshot failed:", e);
    } finally {
        capturing = false;
    }
}

function scheduleCapture() {
    if (open) return;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (!open) captureCurrent();
        });
    });
}

function bump(id: string) {
    if (!id && !settings.store.includeHome) return;
    writeVisits(capVisits([id, ...readVisits()]));
    const conv = id ? lookup(id) : undefined;
    rememberTitle(id, conv?.title || (id === currentVisit() ? pageTitle() : undefined));
    if (id) rememberProject(id);
}

function hydrate() {
    const current = currentVisit();
    const merged = current == null
        ? [...idsFromHistory(), ...readVisits()]
        : [current, ...idsFromHistory(), ...readVisits()];
    writeVisits(capVisits(merged));
    if (current) {
        rememberTitle(current, lookup(current)?.title || pageTitle());
        rememberProject(current);
    }
}

function topics(): Topic[] {
    return capVisits(readVisits()).map(id => ({
        id,
        title: titleOf(id),
        project: projectNameOf(id),
    }));
}

function parseHref(href: string): GrokRoute | null {
    try {
        const u = new URL(href, location.origin);
        const parsed = RoutingStore.urlToRoute(u.pathname, new URLSearchParams(u.search), u.hash.replace(/^#/, ""));
        if (parsed?.page && parsed.page !== "unknown") return parsed;
    } catch (e) {
        logger.debug("urlToRoute failed:", e);
    }
    return null;
}

function applyChatPage(id: string, workspaceId?: string) {
    try {
        const chat = ChatPageStore.useChatPageStore.getState();
        chat.setConversationId(id || undefined);
        chat.setProjectId(asWorkspaceId(workspaceId) || undefined);
    } catch (e) {
        logger.debug("ChatPageStore update failed:", e);
    }
}

function navigateTo(id: string) {
    try {
        const routing = RoutingStore.useRoutingStore.getState();
        const { route } = routing;
        const teamId = route.teamId ?? null;
        if (!id) {
            if (route.page === "main" || (route.page === "chat" && !route.conversationId && !projectIdFromUrl())) return;
            routing.push({ page: "main", teamId });
            applyChatPage("");
            return;
        }

        const workspaceId = workspaceOf(id);
        const href = hrefFor(id, workspaceId);
        const parsed = parseHref(href);

        // Mirror Grok's useGrokRouter.routeToConversation:
        // workspace chats MUST be { page:"workspace", workspaceId:STRING, tab:"conversations", conversationId }.
        // page:"workspaces" (plural) is the /project list — never push that for a chat.
        const dest: GrokRoute = workspaceId
            ? {
                page: "workspace",
                workspaceId,
                tab: "conversations",
                conversationId: id,
                teamId,
            }
            : {
                page: "chat",
                conversationId: id,
                temporary: lookup(id)?.temporary ?? false,
                teamId,
            };

        if (parsed?.page === "workspace" && asWorkspaceId(parsed.workspaceId)) {
            dest.page = "workspace";
            dest.workspaceId = asWorkspaceId(parsed.workspaceId);
            dest.conversationId = parsed.conversationId || id;
            dest.tab = parsed.tab || "conversations";
            if (parsed.filePath) dest.filePath = parsed.filePath;
        } else if (parsed?.page === "chat" && parsed.conversationId && !workspaceId) {
            dest.page = "chat";
            dest.conversationId = parsed.conversationId;
            dest.temporary = parsed.temporary ?? dest.temporary;
        }

        if (dest.page === "workspaces" || (dest.page === "workspace" && !asWorkspaceId(dest.workspaceId))) {
            dest.page = "chat";
            dest.conversationId = id;
            delete dest.workspaceId;
            delete dest.tab;
        }

        if (
            routeConvId(route) === dest.conversationId
            && (asWorkspaceId(route.workspaceId) || "") === (asWorkspaceId(dest.workspaceId) || "")
            && route.page === dest.page
        ) return;

        routing.push(dest);
        applyChatPage(id, asWorkspaceId(dest.workspaceId));

        // Same upgrade Grok does: if we had to open /c/{id}, fetch workspace and replace.
        if (dest.page !== "workspace") {
            try {
                const { fetchGetConversationWithWorkspaces, fetchGetConversation } = ConversationStore.useConversationStore.getState();
                const fetchConv = fetchGetConversationWithWorkspaces ?? fetchGetConversation;
                fetchConv?.(id).then(conv => {
                    const ws = asWorkspaceId(ConversationStore.resolveConversationProjectWorkspaceId?.(conv)) || convWorkspaceId(id);
                    if (!ws) return;
                    const now = RoutingStore.useRoutingStore.getState();
                    if (routeConvId(now.route) !== id) return;
                    now.replace({
                        page: "workspace",
                        workspaceId: ws,
                        tab: "conversations",
                        conversationId: id,
                        teamId,
                    });
                    applyChatPage(id, ws);
                    rememberProject(id);
                }).catch(e => logger.debug("workspace resolve failed:", e));
            } catch (e) {
                logger.debug("workspace fetch skipped:", e);
            }
        }
    } catch (e) {
        logger.error("Failed to navigate:", e);
        try {
            location.assign(hrefFor(id, workspaceOf(id) || undefined));
        } catch (navErr) {
            logger.error("Fallback navigation failed:", navErr);
        }
    }
}

function isTrigger(e: KeyboardEvent) {
    if (TRIGGER_CODES.has(e.code) || e.keyCode === 192) return true;
    return TRIGGER_KEYS.has(e.key);
}

function isCtrlKey(e: KeyboardEvent) {
    return e.key === "Control" || e.code === "ControlLeft" || e.code === "ControlRight";
}

function begin(reverse: boolean, fromHold: boolean) {
    held = fromHold;
    open = false;
    captureCurrent();
    open = true;
    selected = 0;
    try {
        hydrate();
        const current = currentVisit();
        if (current != null) bump(current);
        if (topics().length > 1) selected = reverse ? topics().length - 1 : 1;
    } catch (e) {
        logger.error("Failed to open switcher:", e);
    }
    paint();
}

function cycle(reverse: boolean) {
    const { length } = topics();
    if (!length) return;
    selected = (selected + (reverse ? -1 : 1) + length) % length;
    paint();
}

function commit() {
    if (!open) return;
    const target = topics()[selected];
    open = false;
    held = false;
    paint();
    if (target) navigateTo(target.id);
}

function cancel() {
    if (!open) return;
    open = false;
    held = false;
    paint();
}

function onKeyDown(e: KeyboardEvent) {
    if (isCtrlKey(e)) {
        ctrlHeld = true;
        return;
    }

    const combo = (e.ctrlKey || ctrlHeld) && !e.altKey && !e.metaKey && isTrigger(e) && !e.repeat;
    if (combo) {
        e.preventDefault();
        e.stopImmediatePropagation();
        try {
            if (open) cycle(e.shiftKey);
            else begin(e.shiftKey, true);
        } catch (err) {
            logger.error("Hotkey failed:", err);
        }
        return;
    }

    if (!open) return;
    if (e.key === "Escape") {
        e.preventDefault();
        cancel();
        return;
    }
    if (e.key === "Tab" && (e.ctrlKey || ctrlHeld)) {
        e.preventDefault();
        cycle(e.shiftKey);
    }
}

function onKeyUp(e: KeyboardEvent) {
    if (!isCtrlKey(e)) return;
    ctrlHeld = false;
    if (open && held) commit();
}

function onBeforeInput(e: Event) {
    if (!ctrlHeld && !open) return;
    const { data } = (e as InputEvent);
    if (data && TRIGGER_KEYS.has(data)) e.preventDefault();
}

function onWindowBlur() {
    ctrlHeld = false;
}

function onVisibility() {
    if (document.hidden) {
        ctrlHeld = false;
        cancel();
    }
}

function pick(index: number) {
    selected = index;
    commit();
}

function node(tag: string, className?: string, text?: string) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
}

function fillShot(box: HTMLElement, id: string) {
    const snap = snapOf(id);
    if (!snap) {
        const fallback = node("span", cl("fallback"));
        fallback.append(faviconImg(cl("favicon")));
        box.append(fallback);
        return;
    }
    const shot = node("span", cl("shot"));
    shot.append(buildPageShot(snap));
    box.append(shot);
}

const GROK_BG_PATH = "M0 256C0 166.392 0 121.587 17.439 87.3615C32.7787 57.2556 57.2556 32.7787 87.3615 17.439C121.587 0 166.392 0 256 0C345.608 0 390.413 0 424.638 17.439C454.744 32.7787 479.221 57.2556 494.561 87.3615C512 121.587 512 166.392 512 256C512 345.608 512 390.413 494.561 424.638C479.221 454.744 454.744 479.221 424.638 494.561C390.413 512 345.608 512 256 512C166.392 512 121.587 512 87.3615 494.561C57.2556 479.221 32.7787 454.744 17.439 424.638C0 390.413 0 345.608 0 256Z";
const GROK_MARK_P1 = "M210.484 312.759L343.465 210.383C349.984 205.364 359.302 207.322 362.408 215.117C378.758 256.231 371.454 305.64 338.925 339.563C306.397 373.487 261.137 380.927 219.768 363.983L174.577 385.803C239.394 432.008 318.104 420.581 367.289 369.251C406.303 328.564 418.386 273.104 407.088 223.091L407.19 223.198C390.807 149.726 411.218 120.359 453.03 60.3072C454.02 58.8833 455.01 57.4595 456 56L400.978 113.382V113.204L210.45 312.794";
const GROK_MARK_P2 = "M183.042 337.641C136.519 291.294 144.54 219.567 184.236 178.203C213.59 147.59 261.683 135.096 303.666 153.464L348.755 131.75C340.632 125.627 330.221 119.042 318.275 114.414C264.277 91.2407 199.63 102.774 155.735 148.516C113.513 192.549 100.236 260.254 123.036 318.027C140.069 361.206 112.148 391.748 84.0229 422.575C74.0561 433.503 64.0553 444.431 56 456L183.007 337.677";
const GROK_ICON_DATA = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="${GROK_BG_PATH}" fill="#050505"/><path d="${GROK_MARK_P1}" fill="#FCFCFC"/><path d="${GROK_MARK_P2}" fill="#FCFCFC"/></svg>`)}`;
const ACCENTS = [
    "rgb(37, 99, 235)",
    "rgb(14, 165, 233)",
    "rgb(20, 184, 166)",
    "rgb(249, 115, 22)",
    "rgb(100, 116, 139)",
];

function accentOf(id: string): string {
    if (!id) return ACCENTS[4];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return ACCENTS[hash % ACCENTS.length];
}

function detectTheme(): "dark" | "light" {
    const html = document.documentElement;
    const { body } = document;
    const tokens = `${html.className} ${body?.className ?? ""} ${html.getAttribute("data-theme") ?? ""} ${html.getAttribute("data-color-scheme") ?? ""}`.toLowerCase();
    if (/(^|[\s_-])(dark|night)([\s_-]|$)/.test(tokens) || html.classList.contains("dark") || html.getAttribute("dark") != null) return "dark";
    if (/(^|[\s_-])(light|day)([\s_-]|$)/.test(tokens) || html.classList.contains("light")) return "light";
    try {
        const bg = getComputedStyle(body || html).backgroundColor;
        const m = bg.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
        if (m) {
            const r = Number(m[1]) / 255;
            const g = Number(m[2]) / 255;
            const b = Number(m[3]) / 255;
            const lin = [r, g, b].map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
            const lum = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
            return lum < 0.42 ? "dark" : "light";
        }
    } catch {}
    const scheme = getComputedStyle(html).colorScheme;
    if (scheme.includes("light") && !scheme.includes("dark")) return "light";
    return "dark";
}

function grokFaviconSrc(): string {
    try {
        if (/\.grok\.com$|^grok\.com$/.test(location.hostname)) {
            const link = document.querySelector<HTMLLinkElement>('link[rel*="icon"]:not(#void-chat-state-favicon)');
            const href = link?.href;
            if (href && !href.startsWith("data:")) return href;
            return `${location.origin}/images/favicon.svg`;
        }
    } catch {}
    return GROK_ICON_DATA;
}

function faviconImg(className: string): HTMLImageElement {
    const img = document.createElement("img");
    img.className = className;
    img.alt = "";
    img.draggable = false;
    img.src = grokFaviconSrc();
    img.addEventListener("error", () => {
        if (img.src === GROK_ICON_DATA) {
            img.dataset.broken = "true";
            return;
        }
        img.src = GROK_ICON_DATA;
    });
    return img;
}

function folderIcon(): SVGSVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", cl("folder"));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z");
    svg.append(path);
    return svg;
}

function applyTheme(panel: HTMLElement) {
    const theme = detectTheme();
    panel.setAttribute("data-theme", theme);
    panel.style.colorScheme = theme;
}

function buildHost(): HTMLDivElement {
    const root = node("div", cl("root")) as HTMLDivElement;
    root.id = "void-rt-host";
    root.setAttribute("role", "presentation");
    root.addEventListener("click", cancel);

    const panel = node("div", cl("panel"));
    panel.setAttribute("role", "listbox");
    panel.setAttribute("aria-label", "Recent conversations");
    panel.addEventListener("click", e => e.stopPropagation());
    panel.append(node("div", cl("list")));
    root.append(panel);
    return root;
}

function renderList(items: Topic[]) {
    if (!host) return;
    const panel = host.querySelector(`.${cl("panel")}`) as HTMLElement | null;
    if (!panel) return;

    let list = panel.querySelector(`.${cl("list")}`) as HTMLElement | null;
    if (!list) {
        panel.replaceChildren();
        list = node("div", cl("list"));
        panel.append(list);
    }
    list.replaceChildren();

    items.forEach((topic, i) => {
        const btn = node("button", cl("card")) as HTMLButtonElement;
        btn.type = "button";
        btn.tabIndex = -1;
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-label", topic.project ? `${topic.title}, ${topic.project}` : topic.title);
        btn.style.setProperty("--void-rt-card-accent", accentOf(topic.id));
        btn.addEventListener("pointerenter", () => {
            if (selected === i) return;
            selected = i;
            syncActive();
        });
        btn.addEventListener("focus", () => {
            if (selected === i) return;
            selected = i;
            syncActive();
        });
        btn.addEventListener("click", () => pick(i));

        const shot = node("span", cl("thumb"));
        shot.setAttribute("aria-hidden", "true");
        fillShot(shot, topic.id);

        const meta = node("span", cl("meta"));
        meta.append(node("span", cl("name"), topic.title));
        if (topic.project) {
            const proj = node("span", cl("host"));
            proj.append(folderIcon(), node("span", cl("host-name"), topic.project));
            meta.append(proj);
        }

        btn.append(shot, meta);
        list!.append(btn);
    });
}

function syncActive() {
    if (!host) return;
    const cards = host.querySelectorAll<HTMLElement>(`.${cl("card")}`);
    cards.forEach((card, i) => {
        const on = i === selected;
        card.setAttribute("data-active", on ? "true" : "false");
        card.setAttribute("aria-selected", on ? "true" : "false");
        card.tabIndex = on ? 0 : -1;
        if (on) card.setAttribute("aria-current", "true");
        else card.removeAttribute("aria-current");
    });
    cards[selected]?.scrollIntoView({ inline: "nearest", block: "nearest" });
}

function paint() {
    document.documentElement.classList.toggle("void-rt-open", open);
    if (!open) {
        detachHost();
        return;
    }

    const items = topics();
    const key = items.map(t => `${t.id}\0${t.title}\0${t.project}`).join("|") || "__empty__";

    if (!host) {
        host = buildHost();
        mountOverlay(host);
    }

    const panel = host.querySelector(`.${cl("panel")}`) as HTMLElement | null;
    if (!panel) return;

    applyTheme(panel);
    panel.style.setProperty("--void-rt-count", String(Math.max(1, items.length)));

    if (!items.length) {
        if (paintedKey !== "__empty__") {
            panel.replaceChildren(node("div", cl("empty"), "Open a few chats, then hold Ctrl+` to switch."));
            paintedKey = "__empty__";
        }
        requestAnimationFrame(() => panel.setAttribute("data-visible", "true"));
        return;
    }

    if (paintedKey === "__empty__" || !panel.querySelector(`.${cl("list")}`)) {
        panel.replaceChildren(node("div", cl("list")));
        paintedKey = "";
    }

    if (paintedKey !== key) {
        renderList(items);
        paintedKey = key;
    }
    syncActive();
    requestAnimationFrame(() => panel.setAttribute("data-visible", "true"));
}

function detachHost() {
    document.documentElement.classList.remove("void-rt-open");
    paintedKey = "";
    if (host) {
        try { host.hidePopover(); } catch {}
        host.remove();
        host = null;
    }
    document.getElementById("void-rt-host")?.remove();
    document.querySelectorAll("dialog.void-rt-root, [popover].void-rt-root").forEach(el => {
        const p = el as HTMLElement & { hidePopover?: () => void; close?: () => void };
        try { p.hidePopover?.(); } catch {}
        try { p.close?.(); } catch {}
        el.remove();
    });
}

function mountOverlay(root: HTMLElement) {
    root.style.cssText = "position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:none;overflow:hidden;z-index:2147483647;display:block;background:transparent;pointer-events:auto;";
    document.documentElement.append(root);
    document.documentElement.classList.add("void-rt-open");
    if (typeof root.showPopover !== "function") return;
    root.setAttribute("popover", "manual");
    try {
        root.showPopover();
    } catch {
        root.removeAttribute("popover");
    }
}

export default definePlugin({
    name: "RecentTopics",
    icon: LayoutGridIcon,
    description: "Switch recently opened conversations with Ctrl+` like Arc's tab switcher.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings,
    managedStyle: "recentTopics",

    _mark({ response }: { response: GrokResponse }) {
        try {
            if (!response || response.isControl) return null;
            const sender = String(response.sender ?? "").toLowerCase();
            const human = sender === "human" || sender === "user";
            const text = human
                ? pickUserText(response.query || "", response.message || "")
                : plainText(response.message || "");
            if (!text) return null;
            return React.createElement("span", {
                className: "void-rt-mark",
                "data-role": human ? "user" : "assistant",
                hidden: true,
            }, text);
        } catch {
            return null;
        }
    },

    patches: [
        {
            find: "response-family:handleEditSave",
            all: true,
            replacement: {
                match: /\(0,\i\.jsx\)\(\i\.MessageBubble,\{isUser:\i,isIncognito:\i,responseId:(\i)\.responseId/,
                replace: "$self._mark({response:$1}),$&",
            },
        },
    ],

    start() {
        detachHost();
        open = false;
        held = false;
        ctrlHeld = false;
        try {
            hydrate();
            const current = currentVisit();
            if (current != null) bump(current);
            scheduleCapture();
        } catch (e) {
            logger.error("Hydrate failed:", e);
        }
        if (!keys) {
            keys = new AbortController();
            const { signal } = keys;
            window.addEventListener("keydown", onKeyDown, { capture: true, signal });
            window.addEventListener("keyup", onKeyUp, { capture: true, signal });
            window.addEventListener("blur", onWindowBlur, { signal });
            document.addEventListener("visibilitychange", onVisibility, { signal });
            document.addEventListener("beforeinput", onBeforeInput, { capture: true, signal });
        }
    },

    stop() {
        keys?.abort();
        keys = null;
        open = false;
        held = false;
        ctrlHeld = false;
        thumbs.clear();
        detachHost();
    },

    onSettingsChange() {
        try {
            writeVisits(capVisits(readVisits()));
        } catch (e) {
            logger.error("Settings update failed:", e);
        }
    },

    zustand: {
        RoutingStore: {
            selector: (s: RoutingStoreState) => routeConvId(s.route),
            handler(id: string | null) {
                if (open || id == null) return;
                bump(id);
                scheduleCapture();
            },
        },
        ChatPageStore: {
            selector: (s: ChatPageStoreState) => `${s.conversationId ?? ""}|${s.projectId ?? ""}`,
            handler() {
                if (open) return;
                const id = currentVisit();
                if (id == null) return;
                bump(id);
                scheduleCapture();
            },
        },
        ResponseStore: {
            selector: (s: ResponseStoreState) => {
                const id = currentVisit();
                if (!id) return "";
                const list = s.byConversationId[id];
                const last = list?.[list.length - 1];
                return last ? `${last.responseId}:${last.message?.length ?? 0}` : "";
            },
            handler() {
                if (open) return;
                scheduleCapture();
            },
        },
    },
});
