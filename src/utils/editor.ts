/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface TiptapEditor {
    commands: { setContent(content: string): void; focus(): void };
}

export function getEditor(): TiptapEditor | null {
    return (document.querySelector(".ProseMirror") as HTMLElement & { editor?: TiptapEditor })?.editor ?? null;
}

export function getEditorText(): string {
    return document.querySelector(".ProseMirror")?.textContent?.trim() ?? "";
}
