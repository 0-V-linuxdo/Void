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
import type { GrokRoute, RoutingStoreState } from "@grok-types/stores/RoutingStore";
import { React, useEffect, useLayoutEffect, useRef, useState } from "@turbopack/common/react";
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
}).withPrivateSettings<{ visits: string[]; titles: Record<string, string> }>();

const ui = createExternalStore();

interface Topic {
    id: string;
    title: string;
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

function writeVisits(next: string[]) {
    const prev = readVisits();
    if (next.length === prev.length && next.every((id, i) => id === prev[i])) return;
    const titles = settings.plain.titles ?? {};
    const keep: Record<string, string> = {};
    for (const id of next) {
        if (titles[id]) keep[id] = titles[id];
    }
    settings.store.visits = next;
    settings.store.titles = keep;
    ui.notify();
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

function bump(id: string) {
    if (!id && !settings.store.includeHome) return;
    const conv = id ? lookup(id) : undefined;
    rememberTitle(id, conv?.title || (id === currentVisit() ? pageTitle() : undefined));
    writeVisits(capVisits([id, ...readVisits()]));
}

function hydrate() {
    const current = currentVisit();
    const merged = current == null
        ? [...idsFromHistory(), ...readVisits()]
        : [current, ...idsFromHistory(), ...readVisits()];
    writeVisits(capVisits(merged));
    if (current) rememberTitle(current, lookup(current)?.title || pageTitle());
}

function topics(): Topic[] {
    return capVisits(readVisits()).map(id => ({ id, title: titleOf(id) }));
}

function navigateTo(id: string) {
    try {
        const routing = RoutingStore.useRoutingStore.getState();
        const { route } = routing;
        const teamId = route.teamId ?? null;
        if (id) {
            if (route.conversationId === id) return;
            routing.push({ page: "chat", conversationId: id, teamId });
            return;
        }
        if (route.page === "main" || (route.page === "chat" && !route.conversationId)) return;
        routing.push({ page: "main", teamId });
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

    if (e.isComposing) return;

    if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopImmediatePropagation();
        cancel();
        return;
    }

    if (open && (e.key === "Enter" || e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowUp")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key === "Enter") commit();
        else cycle(e.key === "ArrowLeft" || e.key === "ArrowUp");
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

function syncDialog(el: HTMLDialogElement | null, shouldOpen: boolean) {
    if (!el) return;
    try {
        if (shouldOpen && !el.open) el.showModal();
        else if (!shouldOpen && el.open) el.close();
    } catch (e) {
        logger.debug("dialog:", e);
        el.toggleAttribute("open", shouldOpen);
    }
}

function Switcher() {
    useExternalStore(ui);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        syncDialog(dialogRef.current, open);
    }, [open]);

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
        <dialog
            ref={dialogRef}
            className={cl("root")}
            aria-label="Recent conversations"
            onCancel={e => { e.preventDefault(); cancel(); }}
            onClick={e => { if (e.target === e.currentTarget) cancel(); }}
        >
            <div className={cl("hud")}>
                {items.length
                    ? (
                        <div ref={stageRef} className={cl("stage")}>
                            {items.map((topic, i) => (
                                <button
                                    key={topic.id || "home"}
                                    type="button"
                                    tabIndex={-1}
                                    aria-label={topic.title}
                                    aria-current={i === selected}
                                    className={classes(cl("card"), i === selected && cl("card-on"))}
                                    onMouseEnter={() => { selected = i; ui.notify(); }}
                                    onClick={() => pick(i)}
                                >
                                    <span className={cl("bar")} aria-hidden>
                                        <span className={cl("dots")}>
                                            <span />
                                            <span />
                                            <span />
                                        </span>
                                        <span className={cl("tab")}>{topic.title}</span>
                                    </span>
                                    <span className={cl("shot")} aria-hidden>
                                        <span className={cl("bubble")} />
                                        <span className={cl("bubble")} />
                                        <span className={cl("bubble")} />
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
                {active ? <div className={cl("caption")}>{active.title}</div> : null}
                <div className={cl("hint")}>{hint}</div>
            </div>
        </dialog>
    );
}

const Overlay = ErrorBoundary.wrap(Switcher, null);
let taken = false;

function LeadOverlay() {
    const [isLead] = useState(() => {
        if (taken) return false;
        taken = true;
        return true;
    });
    useEffect(() => () => {
        if (isLead) taken = false;
    }, [isLead]);
    if (!isLead) return null;
    return <Overlay key="void-recent-topics" />;
}

function mountHost() {
    waitFor(filters.byProps("createRoot"), (mod: { createRoot: (el: Element) => ReactRoot }) => {
        if (root) return;
        host = document.createElement("div");
        host.id = "void-rt-host";
        (document.body ?? document.documentElement).appendChild(host);
        root = mod.createRoot(host);
        root.render(<LeadOverlay />);
    });
}

function unmountHost() {
    try { root?.unmount(); } catch (e) { logger.debug("unmount:", e); }
    host?.remove();
    host = null;
    root = null;
    taken = false;
}

export default definePlugin({
    name: "RecentTopics",
    description: "Switch recently opened conversations with Ctrl+` like Arc's tab switcher.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings,
    managedStyle: "recentTopics",

    _Overlay() {
        return <LeadOverlay />;
    },

    start() {
        try {
            hydrate();
            const current = currentVisit();
            if (current != null) bump(current);
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
            },
        },
        ChatPageStore: {
            selector: (s: ChatPageStoreState) => s.conversationId ?? null,
            handler(id: string | null) {
                if (open || id == null) return;
                bump(id);
            },
        },
    },

    patches: [
        {
            find: "\"chat-page\")",
            replacement: {
                match: /(children:\[)((?:\i,){2,8}\i\]\},"chat-page"\))/,
                replace: "$1$self._Overlay(),$2",
            },
        },
        {
            find: "data-query-bar-mode-select",
            all: true,
            noWarn: true,
            replacement: {
                match: /\},"mode-select"\),/,
                replace: "$&$self._Overlay(),",
            },
        },
    ],
});
