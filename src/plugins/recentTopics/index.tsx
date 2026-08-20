/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Text } from "@components/Text";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import type { GrokConversation } from "@grok-types/stores/ConversationStore";
import type { GrokPage, GrokRoute, RoutingStoreState } from "@grok-types/stores/RoutingStore";
import { React, useEffect, useLayoutEffect, useRef } from "@turbopack/common/react";
import { ChatPageStore, ConversationStore, RoutingStore } from "@turbopack/common/stores";
import { filters, waitFor } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore } from "@utils/misc";
import { useExternalStore } from "@utils/react";
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

const ui = createExternalStore();
const thumbs = new Map<string, HTMLElement>();
const wsNames: Record<string, string> = {};

interface Topic {
    id: string;
    title: string;
    project: string;
}

interface ReactRoot {
    render(node: unknown): void;
    unmount(): void;
}

let open = false;
let selected = 0;
let held = false;
let ctrlHeld = false;
let keys: AbortController | null = null;
let host: HTMLDivElement | null = null;
let root: ReactRoot | null = null;

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
        if (changed) ui.notify();
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
    if (route.page === "main") return HOME_ID;
    return null;
}

function currentVisit(): string | null {
    try {
        const id = ChatPageStore.useChatPageStore.getState().conversationId;
        if (id) return id;
    } catch (e) {
        logger.debug("ChatPageStore unavailable:", e);
    }
    try {
        return routeConvId(RoutingStore.useRoutingStore.getState().route);
    } catch (e) {
        logger.debug("RoutingStore unavailable:", e);
        return null;
    }
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
    return settings.plain.workspaceByConv?.[id] ?? "";
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
        if (route.conversationId === id) page = route.page;
    } catch {}
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
            if (route.page === "main" || (route.page === "chat" && !route.conversationId)) return;
            routing.push({ page: "main", teamId });
            return;
        }
        const workspaceId = workspaceOf(id) || undefined;
        const savedPage = settings.plain.pages?.[id];
        const page: GrokPage = savedPage === "workspace" || (workspaceId && route.page === "workspace")
            ? "workspace"
            : "chat";
        if (route.conversationId === id && (route.workspaceId || "") === (workspaceId || "") && route.page === page) return;
        const next: GrokRoute = { page, conversationId: id, teamId };
        if (workspaceId) next.workspaceId = workspaceId;
        routing.push(next);
    } catch (e) {
        logger.error("Failed to navigate:", e);
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
    ui.notify();
}

function cycle(reverse: boolean) {
    const { length } = topics();
    if (!length) return;
    selected = (selected + (reverse ? -1 : 1) + length) % length;
    ui.notify();
}

function commit() {
    if (!open) return;
    const target = topics()[selected];
    open = false;
    held = false;
    ui.notify();
    if (target) navigateTo(target.id);
}

function cancel() {
    if (!open) return;
    open = false;
    held = false;
    ui.notify();
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

function Shot({ id }: { id: string }) {
    const boxRef = useRef<HTMLSpanElement>(null);
    const has = thumbs.has(id);
    useLayoutEffect(() => {
        const box = boxRef.current;
        if (!box) return;
        box.replaceChildren();
        const node = thumbs.get(id);
        if (node) box.appendChild(node.cloneNode(true));
        return () => { box.replaceChildren(); };
    }, [id, has, open]);
    return (
        <span className={cl("shot")} aria-hidden>
            {has
                ? <span ref={boxRef} className={cl("mini")} />
                : (
                    <>
                        <span className={cl("bubble")} />
                        <span className={cl("bubble")} />
                        <span className={cl("bubble")} />
                    </>
                )}
        </span>
    );
}

function Switcher() {
    useExternalStore(ui);
    const stageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        stageRef.current?.querySelector("[aria-current=true]")?.scrollIntoView({ inline: "center", block: "nearest" });
    }, [open, selected]);

    if (!open) return null;

    const items = topics();
    const active = items[selected];
    let hint = "Esc to cancel";
    if (active && held) hint = "Release Ctrl to switch";
    else if (active) hint = "Click to switch";

    return (
        <div className={cl("root")} role="presentation">
            <div className={cl("backdrop")} onClick={cancel} />
            <div
                className={cl("hud")}
                role="dialog"
                aria-modal="true"
                aria-label="Recent conversations"
                onClick={e => e.stopPropagation()}
            >
                {items.length
                    ? (
                        <div ref={stageRef} className={cl("stage")}>
                            {items.map((topic, i) => (
                                <button
                                    key={topic.id || "home"}
                                    type="button"
                                    tabIndex={-1}
                                    aria-label={topic.project ? `${topic.title}, ${topic.project}` : topic.title}
                                    aria-current={i === selected}
                                    className={classes(cl("item"), i === selected && cl("item-on"))}
                                    onMouseEnter={() => { selected = i; ui.notify(); }}
                                    onClick={() => pick(i)}
                                >
                                    <span className={cl("window")}>
                                        <span className={cl("bar")} aria-hidden>
                                            <span className={cl("dots")}>
                                                <span />
                                                <span />
                                                <span />
                                            </span>
                                        </span>
                                        <Shot id={topic.id} />
                                    </span>
                                    <span className={cl("meta")}>
                                        <span className={cl("name")}>{topic.title}</span>
                                        {topic.project ? <span className={cl("project")}>{topic.project}</span> : null}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )
                    : (
                        <div className={cl("empty")}>
                            <Text size="sm">Open a few chats, then hold Ctrl+` to switch.</Text>
                        </div>
                    )}
                <div className={cl("hint")}>{hint}</div>
            </div>
        </div>
    );
}

const Overlay = ErrorBoundary.wrap(Switcher, null);

function mountHost() {
    waitFor(filters.byProps("createRoot"), (mod: { createRoot: (el: Element) => ReactRoot }) => {
        if (root) return;
        document.getElementById("void-rt-host")?.remove();
        host = document.createElement("div");
        host.id = "void-rt-host";
        host.style.cssText = "display:contents;pointer-events:none;";
        (document.body ?? document.documentElement).appendChild(host);
        root = mod.createRoot(host);
        root.render(<Overlay />);
    });
}

function unmountHost() {
    try { root?.unmount(); } catch (e) { logger.debug("unmount:", e); }
    host?.remove();
    document.getElementById("void-rt-host")?.remove();
    document.querySelectorAll("dialog.void-rt-root").forEach(el => {
        const d = el as HTMLDialogElement;
        try { if (d.open) d.close(); } catch {}
        d.remove();
    });
    host = null;
    root = null;
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
        unmountHost();
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
        mountHost();
    },

    stop() {
        keys?.abort();
        keys = null;
        open = false;
        held = false;
        ctrlHeld = false;
        thumbs.clear();
        unmountHost();
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
