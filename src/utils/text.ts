/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const CAMEL_BOUNDARY = /([a-z])([A-Z])/g;
const WORD_SEPARATOR = /[-_]/g;
const WORD_START = /\b\w/g;
const REGEXP_SPECIALS = /[.*+?^${}()|[\]\\]/g;

export function humanizeKey(key: string, acronyms?: Record<string, string>): string {
    const title = key
        .replaceAll(CAMEL_BOUNDARY, "$1 $2")
        .replaceAll(WORD_SEPARATOR, " ")
        .replaceAll(WORD_START, c => c.toUpperCase());
    if (!acronyms) return title;
    let result = title;
    for (const [from, to] of Object.entries(acronyms)) {
        result = result.replaceAll(new RegExp(`\\b${escapeRegExp(from)}\\b`, "g"), to);
    }
    return result;
}

export function escapeRegExp(s: string): string {
    return s.replaceAll(REGEXP_SPECIALS, "\\$&");
}

export function pluralize(count: number, singular: string, plural?: string): string {
    return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`;
}

export function escapeHtml(s: string, quotes = false): string {
    const base = s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    return quotes ? base.replaceAll("\"", "&quot;") : base;
}
