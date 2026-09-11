/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Button, ButtonWithTooltip, ConfirmDialog, Flex, Input, Paragraph } from "@components";
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, HistoryIcon, Trash2Icon } from "@components/icons";
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
const CAPTURE_DEDUPE_MS = 2000;
const PAGE_SIZE = 10;

interface PrivateSettings {
    entries: string[];
}

interface PmDoc {
    content: { size: number };
}

type PmSelection = {
    empty: boolean;
    from: number;
    constructor: { atStart(doc: PmDoc): PmSelection; atEnd(doc: PmDoc): PmSelection };
};

interface PmTransaction {
    doc: PmDoc;
    replaceWith(from: number, to: number, nodes: unknown[]): PmTransaction;
    setSelection(sel: PmSelection): PmTransaction;
    scrollIntoView(): PmTransaction;
}

interface TiptapEditor {
    state: {
        doc: PmDoc;
        selection: PmSelection;
        tr: PmTransaction;
        schema: { nodes: { paragraph: { create(attrs: null, content: unknown): unknown } }; text(text: string): unknown };
    };
    view: { dom: HTMLElement; composing: boolean; dispatch(tr: PmTransaction): void };
    getText(options: { blockSeparator: string }): string;
}

const settings = definePluginSettings({
    maxEntries: {
        type: OptionType.SLIDER,
        description: "Maximum stored prompts.",
        min: MAX_MIN,
        max: MAX_MAX,
        default: MAX_DEFAULT,
    },
    history: {
        type: OptionType.COMPONENT,
        component: HistoryPanel,
    },
}).withPrivateSettings<PrivateSettings>();

const recentAt = new Map<string, number>();

let cursor = 0;
let draft = "";
let recalling = false;
let composing = false;
let keys: AbortController | null = null;

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

function imeEvent(e: Event): boolean {
    if (composing) return true;
    if (e instanceof InputEvent && e.isComposing) return true;
    if (e instanceof KeyboardEvent && (e.isComposing || e.keyCode === 229)) return true;
    return false;
}

function resetBrowse(length: number) {
    cursor = length;
    draft = "";
    recalling = false;
    hideHud();
}

function chatEditor(t: EventTarget | null): TiptapEditor | null {
    const el = t instanceof Text ? t.parentElement : (t instanceof Element ? t : null);
    return el?.closest<HTMLElement & { editor?: TiptapEditor }>(EDITOR_SEL)?.editor ?? null;
}

function editorText(editor: TiptapEditor): string {
    return normalize(editor.getText({ blockSeparator: "\n" }));
}

function caretAtStart({ state: { selection, doc } }: TiptapEditor): boolean {
    return selection.empty && selection.from === selection.constructor.atStart(doc).from;
}

function dropRecall(editor: TiptapEditor) {
    cursor = getEntries().length;
    draft = editorText(editor);
    recalling = false;
    hideHud();
}

function setEditorText(editor: TiptapEditor, text: string) {
    const { schema, doc, tr, selection } = editor.state;
    const blocks = text.split("\n").map(line => schema.nodes.paragraph.create(null, line ? schema.text(line) : null));
    tr.replaceWith(0, doc.content.size, blocks);
    editor.view.dispatch(tr.setSelection(selection.constructor.atEnd(tr.doc)).scrollIntoView());
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

function showHud(label: string, editor: TiptapEditor) {
    const bar = editor.view.dom.closest(".query-bar");
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

function cycle(older: boolean, editor: TiptapEditor) {
    const list = getEntries();
    if (cursor >= list.length) {
        draft = editorText(editor);
        cursor = list.length;
    }
    const next = older ? cursor - 1 : cursor + 1;
    if (next < 0 || next > list.length) return;
    cursor = next;
    recalling = true;
    setEditorText(editor, next === list.length ? draft : list[next]);
    if (next < list.length) showHud(`${next + 1} / ${list.length}`, editor);
    else hideHud();
}

function onKeyDown(e: KeyboardEvent) {
    if (imeEvent(e) || e.ctrlKey || e.metaKey) return;

    const editor = chatEditor(e.target);
    if (!editor) return;

    if (e.key === "Escape" && recalling) {
        dropRecall(editor);
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
    }

    if (e.key === "Enter" && !e.shiftKey && !e.altKey) {
        pushEntry(editorText(editor));
        return;
    }

    if ((e.key !== "ArrowUp" && e.key !== "ArrowDown") || e.shiftKey) return;

    const older = e.key === "ArrowUp";
    if (older ? cursor <= 0 : cursor >= getEntries().length) return;
    if (!recalling && !e.altKey && !caretAtStart(editor)) return;
    if (editor.view.composing) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    cycle(older, editor);
}

function onPointerDown(e: PointerEvent) {
    if (!recalling) return;
    const editor = chatEditor(e.target);
    if (editor) dropRecall(editor);
}

function onCompositionStart(e: Event) {
    const editor = chatEditor(e.target);
    if (!editor) return;
    composing = true;
    if (recalling) dropRecall(editor);
}

function onCompositionEnd() {
    composing = false;
}

function onInput(e: Event) {
    if (!recalling || imeEvent(e)) return;
    const editor = chatEditor(e.target);
    if (editor) dropRecall(editor);
}

function onSubmit(e: Event) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    const editor = chatEditor(form.querySelector(EDITOR_SEL));
    if (editor) pushEntry(editorText(editor));
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
    const editor = chatEditor(bar.querySelector(EDITOR_SEL));
    if (editor) pushEntry(editorText(editor));
}

function removeEntry(index: number) {
    const list = getEntries();
    if (index < 0 || index >= list.length) return;
    const next = list.filter((_, i) => i !== index);
    setEntries(next);
    resetBrowse(next.length);
}

function HistoryPanel() {
    const { entries } = settings.use(["entries"]);
    const list = entries ?? [];
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(0);
    const [openId, setOpenId] = useState<number | null>(null);
    const [confirm, setConfirm] = useState(false);
    const needle = query.trim().toLowerCase();
    const visible = list
        .map((text, index) => ({ text, index }))
        .filter(row => !needle || row.text.toLowerCase().includes(needle))
        .toReversed();
    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const current = Math.min(page, pageCount - 1);
    const slice = visible.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

    return (
        <Flex flexDirection="column" gap="0.65rem" className={cl("panel")}>
            <Flex className={cl("head")} alignItems="center" justifyContent="space-between" gap="0.75rem">
                <Paragraph>
                    {needle
                        ? pluralize(visible.length, "match", "matches")
                        : pluralize(list.length, "stored prompt")}
                </Paragraph>
                <Button variant="secondary" size="sm" shape="rectangle" disabled={!list.length} onClick={() => setConfirm(true)}>
                    Clear history
                </Button>
            </Flex>
            {list.length > 0 && (
                <Input
                    type="text"
                    placeholder="Search prompts"
                    value={query}
                    onChange={(e: { target: { value: string } }) => {
                        setQuery(e.target.value);
                        setPage(0);
                    }}
                    className={cl("search")}
                />
            )}
            {list.length === 0 && <Paragraph className={cl("empty")}>No stored prompts.</Paragraph>}
            {list.length > 0 && visible.length === 0 && <Paragraph className={cl("empty")}>No matches.</Paragraph>}
            {slice.length > 0 && (
                <div className={cl("list")}>
                    {slice.map(row => {
                        const lines = row.text.split("\n").length;
                        const expanded = openId === row.index;
                        return (
                            <div key={row.index} className={cl("item", expanded && "item-on")}>
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
                                </div>
                                <div className={cl("side")}>
                                    {lines > 1 && <span className={cl("lines")}>{lines}</span>}
                                    <div className={cl("actions")}>
                                        <ButtonWithTooltip
                                            variant="tertiary"
                                            size="sm"
                                            shape="square"
                                            tooltipContent="Copy"
                                            aria-label="Copy"
                                            onClick={() => { copyToClipboard(row.text).catch(err => logger.error("copy failed:", err)); }}
                                        >
                                            <CopyIcon size={18} />
                                        </ButtonWithTooltip>
                                        <ButtonWithTooltip
                                            variant="tertiary"
                                            size="sm"
                                            shape="square"
                                            tooltipContent="Delete"
                                            aria-label="Delete"
                                            onClick={() => {
                                                if (openId === row.index) setOpenId(null);
                                                removeEntry(row.index);
                                            }}
                                        >
                                            <Trash2Icon size={18} />
                                        </ButtonWithTooltip>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {visible.length > PAGE_SIZE && (
                <Flex className={cl("pager")} alignItems="center" justifyContent="center" gap="0.5rem">
                    <Button
                        variant="tertiary"
                        size="sm"
                        shape="square"
                        aria-label="Previous page"
                        disabled={current <= 0}
                        onClick={() => setPage(current - 1)}
                    >
                        <ChevronLeftIcon size={18} />
                    </Button>
                    <span className={cl("page")}>{current + 1} / {pageCount}</span>
                    <Button
                        variant="tertiary"
                        size="sm"
                        shape="square"
                        aria-label="Next page"
                        disabled={current >= pageCount - 1}
                        onClick={() => setPage(current + 1)}
                    >
                        <ChevronRightIcon size={18} />
                    </Button>
                </Flex>
            )}
            <ConfirmDialog
                open={confirm}
                onOpenChange={setConfirm}
                title="Clear input history"
                description="Delete all stored prompts? This cannot be undone."
                confirmText="Clear"
                danger
                onConfirm={() => {
                    setEntries([]);
                    resetBrowse(0);
                    setOpenId(null);
                    setQuery("");
                    setPage(0);
                }}
            />
        </Flex>
    );
}

export default definePlugin({
    name: "InputHistory",
    icon: HistoryIcon,
    description: "Press Arrow Up at the start of the input to recall previous prompts, then browse with Arrow Up and Arrow Down. Alt forces a step; Esc, a click or an edit leaves history.",
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
        composing = false;
        keys = new AbortController();
        const { signal } = keys;
        document.addEventListener("keydown", onKeyDown, { capture: true, signal });
        document.addEventListener("input", onInput, { capture: true, signal });
        document.addEventListener("compositionstart", onCompositionStart, { capture: true, signal });
        document.addEventListener("compositionend", onCompositionEnd, { capture: true, signal });
        document.addEventListener("submit", onSubmit, { capture: true, signal });
        document.addEventListener("click", onClick, { capture: true, signal });
        document.addEventListener("pointerdown", onPointerDown, { capture: true, signal });
    },

    stop() {
        keys?.abort();
        keys = null;
        hideHud();
        recentAt.clear();
        composing = false;
        recalling = false;
    },

    onSettingsChange() {
        const current = getEntries();
        const next = cap(current);
        if (next.length !== current.length) setEntries(next);
        if (cursor > next.length) cursor = next.length;
    },
});
