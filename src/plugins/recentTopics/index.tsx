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
import { classes, classNameFactory } from "@utils/css";
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

const thumbs = new Map<string, HTMLElement>();
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
        const workspaceByConv = pruneRecord(settings.plain.workspaceByConv, visits);
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
    const m = location.pathname.match(/^\/project\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
    return m?.[1] ?? "";
}

function chatIdFromUrl(): string {
    try {
        return new URLSearchParams(location.search).get("chat") ?? "";
    } catch {
        return "";
    }
}

function hrefFor(id: string, workspaceId?: string): string {
    if (!id) return workspaceId ? `/project/${workspaceId}` : "/";
    if (workspaceId) return `/project/${workspaceId}?chat=${encodeURIComponent(id)}`;
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
        const pid = ChatPageStore.useChatPageStore.getState().projectId;
        if (pid) return pid;
    } catch {}
    try {
        const { workspaceId } = RoutingStore.useRoutingStore.getState().route;
        if (workspaceId) return workspaceId;
    } catch {}
    return projectIdFromUrl();
}

function workspaceFromHistory(id: string): string {
    try {
        const { route, historyStack } = RoutingStore.useRoutingStore.getState();
        if (routeConvId(route) === id && route.workspaceId) return route.workspaceId;
        for (let i = (historyStack?.length ?? 0) - 1; i >= 0; i--) {
            const r = historyStack[i];
            if (routeConvId(r) === id && r?.workspaceId) return r.workspaceId;
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
    const conv = lookup(id);
    if (conv?.workspaces?.[0]) return conv.workspaces[0];
    const cached = settings.plain.workspaceByConv?.[id];
    if (cached) return cached;
    return workspaceFromHistory(id);
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
    let page: string | undefined;
    try {
        const { route } = RoutingStore.useRoutingStore.getState();
        if (routeConvId(route) === id || id === currentVisit()) page = route.page;
    } catch {}
    if (!page && projectIdFromUrl()) page = "workspace";
    if (page) {
        const prevPages = settings.plain.pages ?? {};
        if (prevPages[id] !== page) settings.store.pages = { ...prevPages, [id]: page };
    }
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

function trimClone(rootEl: HTMLElement) {
    rootEl.querySelectorAll("script, iframe, video, textarea, input, canvas, .void-rt-root, #void-rt-host").forEach(n => n.remove());
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
        const source = messageList(pane);
        const shell = source.cloneNode(false) as HTMLElement;
        const keep = [...source.children].slice(-6);
        for (const kid of keep) shell.appendChild(kid.cloneNode(true));
        trimClone(shell);
        thumbs.set(id, shell);
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

function navigateTo(id: string) {
    try {
        const routing = RoutingStore.useRoutingStore.getState();
        const { route } = routing;
        const teamId = route.teamId ?? null;
        if (!id) {
            if (route.page === "main" || (route.page === "chat" && !route.conversationId && !projectIdFromUrl())) return;
            routing.push({ page: "main", teamId });
            return;
        }
        const workspaceId = workspaceOf(id) || undefined;
        const href = hrefFor(id, workspaceId);
        // Never push a workspace route without an id — Grok turns that into /project.
        const next: GrokRoute = workspaceId
            ? { page: "workspace", conversationId: id, workspaceId, chat: id, teamId }
            : { page: "chat", conversationId: id, teamId };
        if (
            routeConvId(route) === id
            && (route.workspaceId || "") === (workspaceId || "")
            && (workspaceId ? route.page === "workspace" : route.page === "chat")
        ) return;
        let dest = next;
        try {
            const parsed = RoutingStore.urlToRoute?.(href);
            if (parsed?.page) {
                if (teamId != null && parsed.teamId == null) parsed.teamId = teamId;
                if (workspaceId && !parsed.workspaceId) parsed.workspaceId = workspaceId;
                if (id && !parsed.conversationId) parsed.conversationId = id;
                if (workspaceId && parsed.page !== "workspace") parsed.page = "workspace";
                dest = parsed;
            }
        } catch (e) {
            logger.debug("urlToRoute failed:", e);
        }
        if (dest.page === "workspace" && !dest.workspaceId) {
            dest = workspaceId
                ? { ...dest, workspaceId, conversationId: dest.conversationId || id }
                : { page: "chat", conversationId: id, teamId };
        }
        routing.push(dest);
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
    const thumb = thumbs.get(id);
    if (!thumb) {
        box.append(node("span", cl("bubble")), node("span", cl("bubble")), node("span", cl("bubble")));
        return;
    }
    const mini = node("span", cl("mini"));
    mini.append(thumb.cloneNode(true));
    box.append(mini);
}

function paint() {
    detachHost();
    document.documentElement.classList.toggle("void-rt-open", open);
    if (!open) return;

    const items = topics();
    const active = items[selected];
    let hint = "Esc to cancel";
    if (active && held) hint = "Release Ctrl to switch";
    else if (active) hint = "Click to switch";

    const root = node("div", cl("root"));
    root.id = "void-rt-host";
    root.setAttribute("role", "presentation");

    const backdrop = node("div", cl("backdrop"));
    backdrop.addEventListener("click", cancel);

    const hud = node("div", cl("hud"));
    hud.setAttribute("role", "dialog");
    hud.setAttribute("aria-modal", "true");
    hud.setAttribute("aria-label", "Recent conversations");
    hud.addEventListener("click", e => e.stopPropagation());

    if (!items.length) {
        hud.append(node("div", cl("empty"), "Open a few chats, then hold Ctrl+` to switch."));
    } else {
        const stage = node("div", cl("stage"));
        items.forEach((topic, i) => {
            const btn = node("button", classes(cl("item"), i === selected && cl("item-on"))) as HTMLButtonElement;
            btn.type = "button";
            btn.tabIndex = -1;
            btn.setAttribute("aria-label", topic.project ? `${topic.title}, ${topic.project}` : topic.title);
            if (i === selected) btn.setAttribute("aria-current", "true");
            btn.addEventListener("mouseenter", () => {
                if (selected === i) return;
                selected = i;
                paint();
            });
            btn.addEventListener("click", () => pick(i));

            const win = node("span", cl("window"));
            const bar = node("span", cl("bar"));
            bar.setAttribute("aria-hidden", "true");
            const dots = node("span", cl("dots"));
            dots.append(node("span"), node("span"), node("span"));
            bar.append(dots);
            const shot = node("span", cl("shot"));
            shot.setAttribute("aria-hidden", "true");
            fillShot(shot, topic.id);
            win.append(bar, shot);

            const meta = node("span", cl("meta"));
            meta.append(node("span", cl("name"), topic.title));
            if (topic.project) meta.append(node("span", cl("project"), topic.project));
            btn.append(win, meta);
            stage.append(btn);
        });
        hud.append(stage);
        stage.querySelector("[aria-current=true]")?.scrollIntoView({ inline: "center", block: "nearest" });
    }

    hud.append(node("div", cl("hint"), hint));
    root.append(backdrop, hud);
    host = root as HTMLDivElement;
    mountOverlay(host);
}

function detachHost() {
    document.documentElement.classList.remove("void-rt-open");
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
    root.style.cssText = "position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:none;overflow:hidden;z-index:2147483647;display:grid;place-items:center;background:rgba(0,0,0,.16);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);pointer-events:auto;";
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
