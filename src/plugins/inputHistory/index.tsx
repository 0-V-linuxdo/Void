/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { type ModalProps, openModal } from "@api/Modals";
import { definePluginSettings } from "@api/Settings";
import { Button, ButtonWithTooltip, ConfirmDialog, DialogClose, DialogHeader, DialogTitle, Flex, Input, Paragraph } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { CopyIcon, Cross2Icon, HistoryIcon, TextCursorInputIcon, Trash2Icon } from "@components/icons";
import { React, useState } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { clamp, copyToClipboard } from "@utils/misc";
import { pluralize } from "@utils/text";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("InputHistory");
const cl = classNameFactory("void-ih-");

const EDITOR_SEL = ".query-bar .tiptap.ProseMirror[contenteditable=\"true\"]";
const ZWSP = /\u200B/g;
const MAX_MIN = 10;
const MAX_MAX = 500;
const MAX_DEFAULT = 100;
const HUD_GAP_PX = 8;
const APPLY_QUIET_MS = 120;
const CAPTURE_DEDUPE_MS = 2000;

interface PrivateSettings {
    entries: string[];
}

const settings = definePluginSettings({
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
let recalling = false;
let applying = false;
let applyGen = 0;
let keys: AbortController | null = null;
let applyTimer: ReturnType<typeof setTimeout> | undefined;
let applyEl: HTMLElement | null = null;
let applyAtStart = true;

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
    recalling = false;
    hideHud();
}

function chatEditor(t: EventTarget | null): HTMLElement | null {
    if (t instanceof Text) return t.parentElement?.closest<HTMLElement>(EDITOR_SEL) ?? null;
    if (t instanceof Element) return t.closest<HTMLElement>(EDITOR_SEL) ?? null;
    return null;
}

function editorText(el: HTMLElement): string {
    const blocks = el.querySelectorAll(":scope > *");
    const raw = blocks.length
        ? Array.from(blocks, b => b.textContent ?? "").join("\n")
        : (el.innerText ?? el.textContent ?? "");
    return normalize(raw);
}

function spanHeight(range: Range): number {
    const rects = range.getClientRects();
    let top = Infinity;
    let bottom = -Infinity;
    for (const r of rects) {
        if (r.height === 0 && r.width === 0) continue;
        if (r.top < top) top = r.top;
        if (r.bottom > bottom) bottom = r.bottom;
    }
    if (top === Infinity) return range.getBoundingClientRect().height;
    return bottom - top;
}

function caretOnEdge(el: HTMLElement): { first: boolean; last: boolean } {
    const sel = window.getSelection();
    if (!sel?.rangeCount || !sel.isCollapsed) return { first: false, last: false };
    const caret = sel.getRangeAt(0);
    if (!el.contains(caret.startContainer)) return { first: false, last: false };
    if (!el.innerText?.trim()) return { first: true, last: true };

    const before = document.createRange();
    before.selectNodeContents(el);
    before.setEnd(caret.startContainer, caret.startOffset);
    const after = document.createRange();
    after.selectNodeContents(el);
    after.setStart(caret.startContainer, caret.startOffset);

    const { lineHeight, fontSize } = getComputedStyle(el);
    const lh = parseFloat(lineHeight);
    const fs = parseFloat(fontSize) || 16;
    const budget = (lh > 0 ? lh : fs * 1.5) * 1.5;

    return {
        first: spanHeight(before) <= budget,
        last: spanHeight(after) <= budget,
    };
}

function matchesRecall(el: HTMLElement): boolean {
    if (!recalling) return false;
    const list = getEntries();
    const expected = cursor < list.length ? list[cursor] : draft;
    return editorText(el) === expected || normalize(el.innerText ?? "") === expected;
}

function dropRecall(el: HTMLElement) {
    cursor = getEntries().length;
    draft = editorText(el);
    recalling = false;
    hideHud();
}

function placeCaret(el: HTMLElement, atStart: boolean) {
    try {
        const view = (el as unknown as { pmViewDesc?: { view?: {
            state: {
                doc: unknown;
                selection: { constructor: { atStart(doc: unknown): unknown; atEnd(doc: unknown): unknown } };
                tr: { setSelection(sel: unknown): { scrollIntoView(): unknown } };
            };
            dispatch(tr: unknown): void;
        } } }).pmViewDesc?.view;
        if (view) {
            const Sel = view.state.selection.constructor;
            const pmSel = atStart ? Sel.atStart(view.state.doc) : Sel.atEnd(view.state.doc);
            view.dispatch(view.state.tr.setSelection(pmSel).scrollIntoView());
            return;
        }
    } catch (err) {
        logger.debug("placeCaret pm failed:", err);
    }
    const native = window.getSelection();
    if (!native) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(atStart);
    native.removeAllRanges();
    native.addRange(range);
}

function scheduleApplyEnd(gen: number) {
    clearTimeout(applyTimer);
    applyTimer = setTimeout(() => {
        if (gen !== applyGen) return;
        applying = false;
        const el = applyEl;
        if (!el) return;
        if (recalling && !matchesRecall(el)) dropRecall(el);
        else placeCaret(el, applyAtStart);
    }, APPLY_QUIET_MS);
}

function setEditorText(el: HTMLElement, text: string, atStart: boolean) {
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    sel.removeAllRanges();
    sel.addRange(range);
    applying = true;
    applyEl = el;
    applyAtStart = atStart;
    const gen = ++applyGen;
    try {
        if (!text) document.execCommand("delete");
        else document.execCommand("insertText", false, text);
    } catch (err) {
        logger.debug("insertText failed:", err);
    }
    placeCaret(el, atStart);
    scheduleApplyEnd(gen);
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
}

function pushEntry(text: string) {
    const value = normalize(text);
    if (!value) return;

    const now = Date.now();
    const prev = recentAt.get(value);
    if (prev != null && now - prev < CAPTURE_DEDUPE_MS) return;
    recentAt.set(value, now);

    const list = getEntries();
    if (list[list.length - 1] === value) {
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
    recalling = true;
    setEditorText(el, next === list.length ? draft : list[next], older);
    if (next < list.length) showHud(`${next + 1} / ${list.length}`, el);
    else hideHud();
}

function onKeyDown(e: KeyboardEvent) {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.ctrlKey || e.metaKey) return;

    const el = chatEditor(e.target);
    if (!el) return;

    if (e.key === "Escape" && recalling && !e.altKey && !e.shiftKey) {
        dropRecall(el);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }

    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
        pushEntry(editorText(el));
        return;
    }

    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    if (e.shiftKey) return;

    const older = e.key === "ArrowUp";
    const force = e.altKey;
    const list = getEntries();
    if (!force) {
        const edge = caretOnEdge(el);
        if ((older && !edge.first) || (!older && !edge.last)) return;
    }

    if (older && (!list.length || cursor <= 0)) return;
    if (!older && cursor >= list.length) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    cycle(older, el);
}

function onPointerDown(e: PointerEvent) {
    if (!recalling || applying) return;
    const el = chatEditor(e.target);
    if (!el) return;
    dropRecall(el);
}

function onInput(e: Event) {
    const el = chatEditor(e.target);
    if (!el) return;

    if (applying) {
        scheduleApplyEnd(applyGen);
        return;
    }

    if (matchesRecall(el)) return;
    dropRecall(el);
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

function removeEntry(index: number) {
    const list = getEntries();
    if (index < 0 || index >= list.length) return;
    const next = list.filter((_, i) => i !== index);
    setEntries(next);
    resetBrowse(next.length);
}

function fillComposer(text: string, index: number) {
    const el = document.querySelector<HTMLElement>(EDITOR_SEL);
    if (!el) return false;
    const list = getEntries();
    cursor = index;
    recalling = true;
    setEditorText(el, text, false);
    if (index < list.length) showHud(`${index + 1} / ${list.length}`, el);
    return true;
}

function openHistory() {
    openModal(props => <SafeHistoryModal {...props} />, { modalKey: "void-ih-history" });
}

function HistoryModal({ onClose }: ModalProps) {
    const { entries } = settings.use(["entries"]);
    const list = entries ?? [];
    const [query, setQuery] = useState("");
    const [openId, setOpenId] = useState<number | null>(null);
    const needle = query.trim().toLowerCase();
    const visible = list
        .map((text, index) => ({ text, index }))
        .filter(row => !needle || row.text.toLowerCase().includes(needle))
        .reverse();
    const canFill = document.querySelector(EDITOR_SEL) != null;

    return (
        <div className={cl("modal")}>
            <DialogClose asChild>
                <Button variant="tertiary" size="sm" shape="square" aria-label="Close" className={cl("modal-close")}>
                    <Cross2Icon />
                </Button>
            </DialogClose>
            <DialogHeader>
                <DialogTitle>Input history</DialogTitle>
                <Paragraph>{pluralize(list.length, "stored prompt")} on this device.</Paragraph>
            </DialogHeader>
            {list.length > 0 && (
                <Input
                    type="text"
                    placeholder="Search prompts"
                    value={query}
                    onChange={(e: { target: { value: string } }) => setQuery(e.target.value)}
                    className={cl("search")}
                />
            )}
            {list.length === 0 && <Paragraph>No stored prompts.</Paragraph>}
            {list.length > 0 && visible.length === 0 && <Paragraph>No matches.</Paragraph>}
            {visible.length > 0 && (
                <div className={cl("list")}>
                    {visible.map(row => {
                        const lines = row.text.split("\n").length;
                        const expanded = openId === row.index;
                        return (
                            <div key={row.index} className={cl("item")}>
                                <div
                                    className={cl("main")}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setOpenId(expanded ? null : row.index)}
                                    onKeyDown={e => {
                                        if (e.key !== "Enter" && e.key !== " ") return;
                                        e.preventDefault();
                                        setOpenId(expanded ? null : row.index);
                                    }}
                                >
                                    <span className={cl("body", !expanded && "clamp")}>{row.text}</span>
                                    {lines > 1 && <span className={cl("lines")}>{lines}</span>}
                                </div>
                                <Flex className={cl("actions")} gap="0.125rem">
                                    <ButtonWithTooltip
                                        variant="tertiary"
                                        size="xs"
                                        shape="square"
                                        tooltipContent="Copy"
                                        aria-label="Copy"
                                        onClick={() => { copyToClipboard(row.text).catch(err => logger.error("copy failed:", err)); }}
                                    >
                                        <CopyIcon size={14} />
                                    </ButtonWithTooltip>
                                    <ButtonWithTooltip
                                        variant="tertiary"
                                        size="xs"
                                        shape="square"
                                        tooltipContent="Insert"
                                        aria-label="Insert"
                                        disabled={!canFill}
                                        onClick={() => { if (fillComposer(row.text, row.index)) onClose(); }}
                                    >
                                        <TextCursorInputIcon size={14} />
                                    </ButtonWithTooltip>
                                    <ButtonWithTooltip
                                        variant="tertiary"
                                        size="xs"
                                        shape="square"
                                        tooltipContent="Delete"
                                        aria-label="Delete"
                                        onClick={() => {
                                            if (openId === row.index) setOpenId(null);
                                            removeEntry(row.index);
                                        }}
                                    >
                                        <Trash2Icon size={14} />
                                    </ButtonWithTooltip>
                                </Flex>
                            </div>
                        );
                    })}
                </div>
            )}
            <Button variant="secondary" size="sm" shape="rectangle" onClick={onClose}>Close</Button>
        </div>
    );
}

const SafeHistoryModal = ErrorBoundary.wrap(HistoryModal);

function ClearHistory() {
    const { entries } = settings.use(["entries"]);
    const list = entries ?? [];
    const [open, setOpen] = useState(false);

    return (
        <Flex flexDirection="column" gap="0.5rem">
            <Paragraph>{pluralize(list.length, "stored prompt")}.</Paragraph>
            <Flex gap="0.5rem">
                <Button variant="secondary" size="sm" shape="rectangle" onClick={openHistory}>
                    View history
                </Button>
                <Button variant="secondary" size="sm" shape="rectangle" disabled={!list.length} onClick={() => setOpen(true)}>
                    Clear history
                </Button>
            </Flex>
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
        recalling = false;
        keys = new AbortController();
        const { signal } = keys;
        document.addEventListener("keydown", onKeyDown, { capture: true, signal });
        document.addEventListener("input", onInput, { capture: true, signal });
        document.addEventListener("submit", onSubmit, { capture: true, signal });
        document.addEventListener("click", onClick, { capture: true, signal });
        document.addEventListener("pointerdown", onPointerDown, { capture: true, signal });
    },

    stop() {
        keys?.abort();
        keys = null;
        hideHud();
        recentAt.clear();
        clearTimeout(applyTimer);
        applying = false;
        applyEl = null;
        recalling = false;
    },

    onSettingsChange() {
        const current = getEntries();
        const next = cap(current);
        if (next.length !== current.length) setEntries(next);
        if (cursor > next.length) cursor = next.length;
    },
});
