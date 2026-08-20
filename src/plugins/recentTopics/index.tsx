/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Text } from "@components/Text";
import type { ConversationStoreState, GrokConversation } from "@grok-types/stores/ConversationStore";
import type { RoutingStoreState } from "@grok-types/stores/RoutingStore";
import { React, useEffect, useRef, useState } from "@turbopack/common/react";
import { ChatPageStore, ConversationStore, RoutingStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes,classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("RecentTopics");
const cl = classNameFactory("void-rt-");
const HOME_ID = "";
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const TRIGGER_CODES = new Set(["Backquote", "IntlBackslash"]);
const TRIGGER_KEYS = new Set(["`", "~", "·", "｀", "～", "Dead", "Process"]);

const settings = definePluginSettings({
    maxRecent: {
        type: OptionType.SLIDER,
        description: "How many recent conversations to show.",
        min: 3,
        max: 12,
        default: 5,
    },
    includeHome: {
        type: OptionType.BOOLEAN,
        description: "Include the new-chat home page in the switcher.",
        default: true,
    },
}).withPrivateSettings<{ mru: string[] }>();

const ui = createExternalStore();

interface Topic {
    id: string;
    title: string;
    starred: boolean;
    time: string;
}

let open = false;
let selected = 0;
let held = false;
let ctrlHeld = false;
let keys: AbortController | null = null;

function readMru(): string[] {
    return settings.plain.mru ?? [];
}

function writeMru(next: string[]) {
    const prev = readMru();
    if (next.length === prev.length && next.every((id, i) => id === prev[i])) return;
    settings.store.mru = next;
    ui.notify();
}

function capMru(ids: string[]): string[] {
    const allowHome = settings.store.includeHome;
    return ids.filter(id => id || allowHome).slice(0, settings.store.maxRecent);
}

function bump(id: string) {
    if (!id && !settings.store.includeHome) return;
    writeMru(capMru([id, ...readMru().filter(x => x !== id)]));
}

function prune(alive: Set<string>) {
    writeMru(readMru().filter(id => !id || alive.has(id)));
}

function activeId(): string {
    try {
        const { route } = RoutingStore.useRoutingStore.getState();
        if (route?.page === "chat") return route.conversationId ?? HOME_ID;
        if (route?.page === "main") return HOME_ID;
    } catch (e) {
        logger.debug("RoutingStore unavailable:", e);
    }
    try {
        return ChatPageStore.useChatPageStore.getState().conversationId ?? HOME_ID;
    } catch (e) {
        logger.debug("ChatPageStore unavailable:", e);
        return HOME_ID;
    }
}

function conversationList(): GrokConversation[] {
    try {
        return ConversationStore.useConversationStore.getState().list ?? [];
    } catch (e) {
        logger.debug("ConversationStore unavailable:", e);
        return [];
    }
}

function seedIfEmpty() {
    if (readMru().length) return;
    const current = activeId();
    const rest = conversationList().map(c => c.conversationId).filter(id => id !== current);
    writeMru(capMru([current, ...rest]));
}

function lookup(id: string): GrokConversation | undefined {
    try {
        const { byId, list } = ConversationStore.useConversationStore.getState();
        return byId[id] ?? list.find(c => c.conversationId === id);
    } catch (e) {
        logger.debug("Conversation lookup failed:", e);
        return undefined;
    }
}

function topics(): Topic[] {
    return capMru(readMru()).map(id => {
        if (!id) return { id: HOME_ID, title: "New chat", starred: false, time: "" };
        const conv = lookup(id);
        return {
            id,
            title: conv?.title?.trim() || "Untitled",
            starred: !!conv?.starred,
            time: conv?.modifyTime || conv?.createTime || "",
        };
    });
}

function formatRelative(iso: string): string {
    if (!iso) return "";
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 0) return "";
    if (ms < MINUTE) return "Just now";
    if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m ago`;
    if (ms < DAY) return `${Math.floor(ms / HOUR)}h ago`;
    const d = Math.floor(ms / DAY);
    return d === 1 ? "Yesterday" : `${d}d ago`;
}

function navigateTo(id: string) {
    try {
        const routing = RoutingStore.useRoutingStore.getState();
        const { route } = routing;
        const teamId = route.teamId ?? null;
        if (id) {
            if (route.page === "chat" && route.conversationId === id) return;
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
    seedIfEmpty();
    const items = topics();
    selected = 0;
    if (items.length > 1) selected = reverse ? items.length - 1 : 1;
    held = fromHold;
    open = true;
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
        if (open) cycle(e.shiftKey);
        else begin(e.shiftKey, true);
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

function onBlur() {
    ctrlHeld = false;
    cancel();
}

function pick(index: number) {
    selected = index;
    commit();
}

function RecentIcon() {
    return (
        <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
            <rect x="3" y="6" width="10" height="14" rx="1.5" />
            <rect x="11" y="4" width="10" height="14" rx="1.5" />
        </svg>
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
    let hint = "Click a conversation · Esc cancel";
    if (active && held) hint = `Release Ctrl to open ${active.title}`;
    else if (active) hint = `Click to open ${active.title}`;

    return (
        <div className={cl("root")} role="dialog" aria-modal="true" aria-label="Recent conversations">
            <div className={cl("backdrop")} onClick={cancel} />
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
                                className={classes(cl("card"), i === selected && cl("card-on"), topic.starred && cl("card-starred"))}
                                onMouseEnter={() => { selected = i; ui.notify(); }}
                                onClick={() => pick(i)}
                            >
                                <span className={cl("chrome")} aria-hidden>
                                    <span />
                                    <span />
                                    <span />
                                </span>
                                <span className={cl("index")}>{String(i + 1).padStart(2, "0")}</span>
                                <span className={cl("title")}>{topic.title}</span>
                                <span className={cl("preview")} aria-hidden>
                                    <span />
                                    <span />
                                    <span />
                                </span>
                                <span className={cl("time")}>{formatRelative(topic.time) || (topic.id ? "" : "Home")}</span>
                            </button>
                        ))}
                    </div>
                )
                : (
                    <div className={cl("empty")}>
                        <Text size="sm">No recent conversations yet.</Text>
                    </div>
                )}
            <div className={cl("hint")}>{hint}</div>
        </div>
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

export default definePlugin({
    name: "RecentTopics",
    description: "Switch recent conversations with Ctrl+` like Arc's tab switcher.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings,
    managedStyle: "recentTopics",
    dependencies: ["ChatBarButtonAPI"],

    _Overlay() {
        return <LeadOverlay />;
    },

    chatBarButton: {
        icon: () => <RecentIcon />,
        tooltip: "Recent conversations (Ctrl+`)",
        onClick() { begin(false, false); },
        order: 2,
        "aria-label": "Recent conversations",
        locations: ["chat"],
    },

    start() {
        seedIfEmpty();
        if (keys) return;
        keys = new AbortController();
        const { signal } = keys;
        window.addEventListener("keydown", onKeyDown, { capture: true, signal });
        window.addEventListener("keyup", onKeyUp, { capture: true, signal });
        window.addEventListener("blur", onBlur, { signal });
        document.addEventListener("beforeinput", onBeforeInput, { capture: true, signal });
    },

    stop() {
        keys?.abort();
        keys = null;
        open = false;
        held = false;
        ctrlHeld = false;
    },

    onSettingsChange() {
        writeMru(capMru(readMru()));
    },

    zustand: {
        RoutingStore: {
            selector: (s: RoutingStoreState) => {
                const page = s.route?.page;
                if (page === "chat") return `c:${s.route.conversationId ?? ""}`;
                if (page === "main") return "m:";
                return "";
            },
            handler(key: string) {
                if (open || !key) return;
                bump(key === "m:" ? HOME_ID : key.slice(2));
            },
        },
        ConversationStore: {
            selector: (s: ConversationStoreState) => s.list,
            handler(list: GrokConversation[]) {
                prune(new Set(list.map(c => c.conversationId)));
                seedIfEmpty();
                if (open) ui.notify();
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
