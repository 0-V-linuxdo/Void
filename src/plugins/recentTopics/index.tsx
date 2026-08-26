/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import type { GrokConversation } from "@grok-types/stores/ConversationStore";
import type { GrokRoute, RoutingStoreState } from "@grok-types/stores/RoutingStore";
import { ChatPageStore, ConversationStore, RoutingStore } from "@turbopack/common/stores";
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
    nav: string[];
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

function extractLines(pane: HTMLElement): PageLine[] {
    const source = messageList(pane);
    const kids = [...source.children].filter((c): c is HTMLElement => c instanceof HTMLElement);
    const out: PageLine[] = [];
    const seen = new Set<string>();
    for (const kid of kids) {
        const raw = (kid.innerText ?? kid.textContent ?? "").replaceAll(/\s+/g, " ").trim();
        if (raw.length < 4) continue;
        if (/^(more|copy|share|retry|edit|\d{1,2}:\d{2}\s*(am|pm))$/i.test(raw)) continue;
        const text = raw.length > 220 ? `${raw.slice(0, 217)}…` : raw;
        if (seen.has(text)) continue;
        seen.add(text);
        const cls = `${kid.className} ${kid.getAttribute("class") ?? ""}`;
        const isUser = /justify-end|items-end|self-end/.test(cls)
            || !!kid.querySelector("[class*='justify-end'], [class*='self-end']");
        out.push({ role: isUser ? "user" : "assistant", text });
    }
    return out.slice(-4);
}

function sidebarTitles(activeId: string): string[] {
    const fromDom: string[] = [];
    try {
        const sidebar = document.querySelector("[data-sidebar=content], [data-sidebar=sidebar]");
        if (sidebar) {
            for (const a of sidebar.querySelectorAll<HTMLAnchorElement>("a[href]")) {
                const href = a.getAttribute("href") ?? "";
                if (!/\/c\/|chat=/.test(href)) continue;
                const t = labelText(a);
                if (!t || SKIP_LABEL.test(t) || t.length > 64) continue;
                if (!fromDom.includes(t)) fromDom.push(t);
                if (fromDom.length >= 6) break;
            }
        }
    } catch {}
    if (fromDom.length) return fromDom;
    const names = capVisits(readVisits()).map(id => titleOf(id)).filter(Boolean);
    const active = titleOf(activeId);
    return unique([active, ...names]).slice(0, 6);
}

function parseSnap(raw: string | undefined): PageSnap | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw) as PageSnap;
        if (!parsed || !Array.isArray(parsed.lines) || !parsed.lines.length) return null;
        return {
            title: typeof parsed.title === "string" ? parsed.title : "",
            theme: parsed.theme === "light" ? "light" : "dark",
            lines: parsed.lines.filter((line): line is PageLine =>
                !!line && (line.role === "user" || line.role === "assistant") && typeof line.text === "string"),
            nav: Array.isArray(parsed.nav)
                ? parsed.nav.filter((item): item is string => typeof item === "string" && !!item.trim()).slice(0, 6)
                : [],
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

function buildPageShot(snap: PageSnap): HTMLElement {
    const page = node("span", cl("page"));
    page.dataset.theme = snap.theme;

    const side = node("span", cl("page-side"));
    const brand = node("span", cl("page-brand"));
    const mark = node("span", cl("page-mark"));
    mark.append(faviconImg(""));
    brand.append(mark, node("span", cl("page-word")));
    const nav = node("span", cl("page-nav"));
    const labels = snap.nav.length ? snap.nav : ["", "", "", "", "", ""];
    labels.slice(0, 6).forEach((label, i) => {
        const item = node("span", cl("page-nav-item"), label);
        if (i === 0 || label === snap.title) item.dataset.on = "true";
        nav.append(item);
    });
    side.append(brand, node("span", cl("page-new")), nav);

    const main = node("span", cl("page-main"));
    const bar = node("span", cl("page-bar"));
    bar.append(node("span", cl("page-bar-title"), snap.title));
    const body = node("span", cl("page-body"));
    for (const line of snap.lines) {
        body.append(node("span", cl("page-line", line.role === "user" && "page-line-user"), line.text));
    }
    main.append(bar, body, node("span", cl("page-composer")));
    page.append(side, main);
    return page;
}

let capturing = false;

function captureCurrent() {
    if (capturing || open) return;
    const id = currentVisit();
    if (id == null) return;
    capturing = true;
    try {
        const pane = chatPane();
        if (!pane) return;
        const lines = extractLines(pane);
        if (!lines.length) return;
        const snap: PageSnap = {
            title: titleOf(id),
            theme: detectTheme(),
            lines,
            nav: sidebarTitles(id),
        };
        thumbs.set(id, snap);
        rememberPage(id, snap);
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
    const fallback = node("span", cl("fallback"));
    fallback.append(faviconImg(cl("favicon")));
    box.append(fallback);
    const snap = snapOf(id);
    if (!snap) return;
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

function siteHost(): string {
    try {
        return location.hostname.replace(/^www\./i, "") || "grok.com";
    } catch {
        return "grok.com";
    }
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
        const row = node("span", cl("name-row"));
        row.append(faviconImg(cl("title-favicon")), node("span", cl("name"), topic.title));
        meta.append(row);
        meta.append(node("span", cl("host"), siteHost()));

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
    description: "Switch recently opened conversations with Ctrl+` like Arc's tab switcher.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings,
    managedStyle: "recentTopics",

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
    },
});
