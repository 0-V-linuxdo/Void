/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const enum NoticeType {
    INFO = "log",
    WARNING = "warn",
    ERROR = "error",
}

export interface NoticeOptions {
    message: string;
    type?: NoticeType;
    timeout?: number;
    link?: { url: string; label: string };
    suffix?: string;
}

let activeElement: HTMLElement | null = null;
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const ICON_PATHS: Record<string, string> = {
    [NoticeType.INFO]: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    [NoticeType.WARNING]: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    [NoticeType.ERROR]: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
};

function icon(type: NoticeType): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="flex-shrink-0">${ICON_PATHS[type]}</svg>`;
}

/**
 * Show a persistent banner notice at the top of the page.
 * Only one notice can be shown at a time — calling again replaces the previous one.
 */
export function showNotice(options: NoticeOptions): string {
    const id = `void-notice-${Date.now()}`;
    closeNotice();

    const type = options.type ?? NoticeType.INFO;

    const el = document.createElement("div");
    el.id = id;
    el.className = [
        "fixed top-4 left-1/2 -translate-x-1/2 z-[9999]",
        "flex items-center gap-3",
        "bg-popover rounded-2xl ring-1 ring-inset ring-toggle-border",
        "py-3 pl-4 pr-3 min-w-[300px] w-max max-w-[90vw]",
        "text-sm animate-in fade-in slide-in-from-top-2",
    ].join(" ");

    el.innerHTML = icon(type);

    const content = document.createElement("span");
    content.append(options.message);
    if (options.link) {
        const a = document.createElement("a");
        a.href = options.link.url;
        a.target = "_blank";
        a.rel = "noreferrer";
        a.textContent = options.link.label;
        a.className = "font-medium underline underline-offset-2";
        content.append(" ", a);
    }
    if (options.suffix) content.append(" ", options.suffix);
    el.appendChild(content);

    const btn = document.createElement("button");
    btn.className = "ms-auto flex-shrink-0 cursor-pointer rounded-md p-1 hover:bg-surface-hover";
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    btn.onclick = closeNotice;
    el.appendChild(btn);

    document.body.appendChild(el);
    activeElement = el;

    if (options.timeout) dismissTimer = setTimeout(closeNotice, options.timeout);

    return id;
}

export function closeNotice() {
    if (dismissTimer) {
        clearTimeout(dismissTimer);
        dismissTimer = null;
    }
    if (activeElement) {
        activeElement.remove();
        activeElement = null;
    }
}
