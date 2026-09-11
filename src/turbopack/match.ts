/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export function matchesPattern(text: string, pattern: string | RegExp): boolean {
    if (typeof pattern === "string") return text.includes(pattern);
    pattern.lastIndex = 0;
    return pattern.test(text);
}

export function matchesAllPatterns(text: string, patterns: (string | RegExp)[]): boolean {
    return patterns.every(p => matchesPattern(text, p));
}
