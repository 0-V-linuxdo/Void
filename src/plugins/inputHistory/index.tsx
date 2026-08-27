/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Button, ConfirmDialog, Flex, Paragraph } from "@components";
import { HistoryIcon } from "@components/icons";
import { React, useState } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { clamp } from "@utils/misc";
import { pluralize } from "@utils/text";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("InputHistory");
const cl = classNameFactory("void-ih-");

const EDITOR_SEL = ".query-bar .tiptap.ProseMirror[contenteditable=\"true\"]";
const ZWSP = /\u200B/g;
const MAX_MIN = 10;
const MAX_MAX = 500;
const MAX_DEFAULT = 100;
const HUD_HIDE_MS = 1200;
const HUD_GAP_PX = 8;
const LINE_SLOP_PX = 8;
const CAPTURE_DEDUPE_MS = 2000;

interface PrivateSettings {
    entries: string[];
}

const settings = definePluginSettings({
    edgeOnly: {
        type: OptionType.BOOLEAN,
        description: "Only cycle history when the caret is on the first or last line.",
        default: true,
    },
    skipDuplicates: {
        type: OptionType.BOOLEAN,
        description: "Skip consecutive duplicate prompts.",
        default: true,
    },
    maxEntries: {
        type: OptionType.SLIDER,
        description: "Maximum stored prompts.",
        min: MAX_MIN,
        max: MAX_MAX,
        default: MAX_DEFAULT,
    },
    clear: {
        type: OptionType.COMPONENT,
        component: ClearHistory,
    },
}).withPrivateSettings<PrivateSettings>();

const recentAt = new Map<string, number>();

let cursor = 0;
let draft = "";
let applying = false;
let keys: AbortController | null = null;
let hudTimer: ReturnType<typeof setTimeout> | undefined;

function getEntries(): string[] {
    const raw = settings.plain.entries;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
}

function cap(entries: string[]): string[] {
    const max = clamp(settings.store.maxEntries ?? MAX_DEFAULT, MAX_MIN, MAX_MAX);
    return entries.length > max ? entries.slice(entries.length - max) : entries;
}

function setEntries(entries: string[]) {
    settings.store.entries = entries;
}

function normalize(text: string): string {
    return text.replaceAll(ZWSP, "").replace(/\n$/, "").trim();
}

function resetBrowse(length: number) {
    cursor = length;
    draft = "";
    hideHud();
}

function chatEditor(t: EventTarget | null): HTMLElement | null {
    if (!(t instanceof HTMLElement) || !t.isContentEditable) return null;
    if (!t.classList.contains("ProseMirror")) return null;
    return t.closest(".query-bar") ? t : null;
}

function editorText(el: HTMLElement): string {
    const blocks = el.querySelectorAll(":scope > *");
    const raw = blocks.length
        ? Array.from(blocks, b => b.textContent ?? "").join("\n")
        : (el.innerText ?? el.textContent ?? "");
    return normalize(raw);
}

function caretOnEdge(el: HTMLElement): { first: boolean; last: boolean } {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !sel.isCollapsed) return { first: false, last: false };
    const caret = sel.getRangeAt(0);
    if (!el.contains(caret.startContainer)) return { first: false, last: false };

    const start = document.createRange();
    start.selectNodeContents(el);
    start.collapse(true);
    const end = document.createRange();
    end.selectNodeContents(el);
    end.collapse(false);

    const c = caret.getBoundingClientRect();
    const s = start.getBoundingClientRect();
    const e = end.getBoundingClientRect();
    if (c.height === 0 && !el.innerText?.trim()) return { first: true, last: true };

    return {
        first: Math.abs(c.top - s.top) <= LINE_SLOP_PX || c.top <= s.top + LINE_SLOP_PX,
        last: Math.abs(c.top - e.top) <= LINE_SLOP_PX || c.bottom >= e.bottom - LINE_SLOP_PX,
    };
}

function setEditorText(el: HTMLElement, text: string) {
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    applying = true;
    try {
        if (!text) document.execCommand("delete");
        else document.execCommand("insertText", false, text);
    } catch (err) {
        logger.debug("insertText failed:", err);
    } finally {
        queueMicrotask(() => { applying = false; });
    }
}

function hudEl(): HTMLElement {
    let el = document.querySelector<HTMLElement>(`.${cl("hud")}`);
    if (el) return el;
    el = document.createElement("div");
    el.className = cl("hud");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
    return el;
}

function hideHud() {
    clearTimeout(hudTimer);
    document.querySelector(`.${cl("hud")}`)?.classList.remove(cl("hud-on"));
}

function showHud(label: string, editor: HTMLElement) {
    const bar = editor.closest(".query-bar");
    if (!bar) return;
    const el = hudEl();
    el.textContent = label;
    requestAnimationFrame(() => {
        const r = bar.getBoundingClientRect();
        el.style.left = `${r.left + r.width / 2}px`;
        el.style.top = `${r.top - HUD_GAP_PX}px`;
        el.classList.add(cl("hud-on"));
    });
    clearTimeout(hudTimer);
    hudTimer = setTimeout(hideHud, HUD_HIDE_MS);
}

function pushEntry(text: string) {
    const value = normalize(text);
    if (!value) return;

    const now = Date.now();
    const prev = recentAt.get(value);
    if (prev != null && now - prev < CAPTURE_DEDUPE_MS) return;
    recentAt.set(value, now);

    const list = getEntries();
    if (settings.store.skipDuplicates && list[list.length - 1] === value) {
        resetBrowse(list.length);
        return;
    }
    const next = cap([...list, value]);
    setEntries(next);
    resetBrowse(next.length);
}

function cycle(older: boolean, el: HTMLElement) {
    const list = getEntries();
    if (!list.length && older) return;
    if (cursor >= list.length) {
        draft = editorText(el);
        cursor = list.length;
    }
    const next = older ? cursor - 1 : cursor + 1;
    if (next < 0 || next > list.length) return;
    cursor = next;
    setEditorText(el, next === list.length ? draft : list[next]);
    if (next < list.length) showHud(`${next + 1} / ${list.length}`, el);
    else hideHud();
}

function onKeyDown(e: KeyboardEvent) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const el = chatEditor(e.target);
    if (!el) return;

    if (e.key === "Enter" && !e.shiftKey) {
        pushEntry(editorText(el));
        return;
    }

    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (e.shiftKey) return;

    if (settings.store.edgeOnly) {
        const edge = caretOnEdge(el);
        if ((e.key === "ArrowUp" && !edge.first) || (e.key === "ArrowDown" && !edge.last)) return;
    }

    const list = getEntries();
    if (e.key === "ArrowUp" && !list.length) return;
    if (e.key === "ArrowDown" && cursor >= list.length) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    cycle(e.key === "ArrowUp", el);
}

function onInput(e: Event) {
    if (applying) return;
    const el = chatEditor(e.target);
    if (!el) return;
    cursor = getEntries().length;
    draft = editorText(el);
    hideHud();
}

function onSubmit(e: Event) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    const editor = form.querySelector(EDITOR_SEL);
    if (editor instanceof HTMLElement) pushEntry(editorText(editor));
}

function onClick(e: MouseEvent) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const ctrl = t.closest("button, [role='button']");
    if (!ctrl) return;
    const bar = ctrl.closest(".query-bar");
    if (!bar || ctrl.closest("[data-query-bar-mode-select]")) return;
    const label = (ctrl.getAttribute("aria-label") ?? "").toLowerCase();
    const submit = ctrl instanceof HTMLButtonElement && ctrl.type === "submit";
    if (!submit && !label.includes("send") && !label.includes("submit")) return;
    const editor = bar.querySelector(EDITOR_SEL);
    if (editor instanceof HTMLElement) pushEntry(editorText(editor));
}

function ClearHistory() {
    const { entries } = settings.use(["entries"]);
    const list = entries ?? [];
    const [open, setOpen] = useState(false);

    return (
        <Flex flexDirection="column" gap="0.5rem">
            <Paragraph>{pluralize(list.length, "stored prompt")}.</Paragraph>
            <Button variant="secondary" size="sm" shape="rectangle" disabled={!list.length} onClick={() => setOpen(true)}>
                Clear history
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Clear input history"
                description="Delete all stored prompts? This cannot be undone."
                confirmText="Clear"
                danger
                onConfirm={() => {
                    setEntries([]);
                    resetBrowse(0);
                }}
            />
        </Flex>
    );
}

export default definePlugin({
    name: "InputHistory",
    icon: HistoryIcon,
    description: "Recall previous chat prompts with Arrow Up and Arrow Down, like a shell.",
    authors: [Devs.p],
    tags: ["chat"],
    enabledByDefault: true,
    settings,
    managedStyle: "inputHistory",
    cleanupSelectors: [".void-ih-hud"],

    start() {
        if (keys) return;
        cursor = getEntries().length;
        keys = new AbortController();
        const { signal } = keys;
        document.addEventListener("keydown", onKeyDown, { capture: true, signal });
        document.addEventListener("input", onInput, { capture: true, signal });
        document.addEventListener("submit", onSubmit, { capture: true, signal });
        document.addEventListener("click", onClick, { capture: true, signal });
    },

    stop() {
        keys?.abort();
        keys = null;
        hideHud();
        recentAt.clear();
    },

    onSettingsChange() {
        const current = getEntries();
        const next = cap(current);
        if (next.length !== current.length) setEntries(next);
        if (cursor > next.length) cursor = next.length;
    },
});
