/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/** Convert any identifier (camelCase, snake_case, kebab-case) to Title Case. */
export function humanizeKey(key: string, acronyms?: Record<string, string>): string {
    const title = key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, c => c.toUpperCase());
    if (!acronyms) return title;
    return Object.entries(acronyms).reduce((s, [from, to]) => s.replace(new RegExp(`\\b${escapeRegExp(from)}\\b`, "g"), to), title);
}

/** Escape special regex characters in a string. */
export function escapeRegExp(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Pluralize a word: `pluralize(1, "item")` -> "1 item", `pluralize(5, "item")` -> "5 items" */
export function pluralize(count: number, singular: string, plural?: string): string {
    return `${count} ${count === 1 ? singular : (plural ?? singular + "s")}`;
}
