/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getModuleCache } from "@turbopack/patchTurbopack";
import { matchesAllPatterns } from "@turbopack/turbopack";

import { SEARCH } from "./constants";
import type { SearchArgs, SearchMatch } from "./types";
import { clampDefault, getFactorySourceCache, isModulePatched, parseRegexPattern } from "./utils";

function findMatch(src: string, pattern: string, regex: RegExp | null, startFrom = 0): { idx: number; len: number } | null {
    if (regex) {
        regex.lastIndex = startFrom;
        const m = regex.exec(src);
        if (!m) return null;
        return { idx: m.index, len: m[0].length };
    }
    const idx = src.indexOf(pattern, startFrom);
    if (idx === -1) return null;
    return { idx, len: pattern.length };
}

function buildSnippet(src: string, idx: number, matchLen: number, ctx: number): { snippet: string; truncatedMatch?: boolean } {
    const start = Math.max(0, idx - ctx);
    const cappedMatchLen = Math.min(matchLen, SEARCH.MAX_MATCH_LENGTH);
    const end = Math.min(src.length, idx + cappedMatchLen + ctx);
    const snippet = src.slice(start, end);
    return matchLen > SEARCH.MAX_MATCH_LENGTH ? { snippet, truncatedMatch: true } : { snippet };
}

function shouldSkipModule(id: number, filter: string | undefined, loadedCache: Map<number, unknown> | null): boolean {
    if (!filter) return false;
    if (filter === "patched") return !isModulePatched(id);
    if (!loadedCache) return false;
    if (filter === "loaded") return !loadedCache.has(id);
    if (filter === "unloaded") return loadedCache.has(id);
    return false;
}

export function handleSearch(args: SearchArgs): unknown {
    const { pattern, id: targetId, and: andPatterns, filter } = args;
    const max = clampDefault(args.max, SEARCH.DEFAULT_MAX, SEARCH.MAX_RESULTS_CAP);
    const context = clampDefault(args.context, SEARCH.DEFAULT_CONTEXT, SEARCH.MAX_CONTEXT);

    if (filter && filter !== "loaded" && filter !== "unloaded" && filter !== "patched") return { error: `Invalid filter: "${filter}". Use "loaded", "unloaded", or "patched".` };
    if (!pattern && !andPatterns?.length)
        return { error: 'Provide pattern (string or /regex/) or and[] (array of strings). Use count:true for count-only, filter:"loaded"/"unloaded" to narrow scope.' };

    const sources = getFactorySourceCache();
    if (!sources.size) return { error: "Factory registry not available" };

    const loadedCache = filter ? getModuleCache() : null;

    if (andPatterns?.length) {
        const rawPatterns = pattern ? [pattern, ...andPatterns] : andPatterns;
        const allPatterns: (string | RegExp)[] = rawPatterns.map(p => {
            const { regex } = parseRegexPattern(p);
            return regex ?? p;
        });
        let moduleHits = 0;

        if (args.count) {
            for (const [id, src] of sources) {
                if (targetId != null && id !== targetId) continue;
                if (shouldSkipModule(id, filter, loadedCache)) continue;
                if (matchesAllPatterns(src, allPatterns)) moduleHits++;
            }
            return { count: moduleHits, total: sources.size };
        }

        const matches: SearchMatch[] = [];
        const firstPat = allPatterns[0];
        for (const [id, src] of sources) {
            if (targetId != null && id !== targetId) continue;
            if (shouldSkipModule(id, filter, loadedCache)) continue;
            if (!matchesAllPatterns(src, allPatterns)) continue;
            moduleHits++;
            if (matches.length >= max) continue;

            let idx = 0;
            let matchLen = 0;
            if (typeof firstPat === "string") {
                const pos = src.indexOf(firstPat);
                if (pos !== -1) {
                    idx = pos;
                    matchLen = firstPat.length;
                }
            } else {
                firstPat.lastIndex = 0;
                const m = firstPat.exec(src);
                if (m) {
                    idx = m.index;
                    matchLen = m[0].length;
                }
            }
            const { snippet, truncatedMatch } = buildSnippet(src, idx, matchLen, context);
            const entry: SearchMatch = { id, at: idx, s: snippet, len: src.length };
            if (truncatedMatch) entry.truncatedMatch = true;
            if (isModulePatched(id)) entry.patched = true;
            matches.push(entry);
        }
        const result: { matches: SearchMatch[]; totalModules?: number; hint?: string } = { matches };
        if (moduleHits > matches.length) result.totalModules = moduleHits;
        if (!matches.length && !moduleHits) {
            const hints: string[] = [`No modules matched all ${rawPatterns.length} patterns. Try fewer constraints.`];
            for (const raw of rawPatterns) {
                const { regex: r } = parseRegexPattern(raw);
                let count = 0;
                for (const [id, src] of sources) {
                    if (targetId != null && id !== targetId) continue;
                    if (shouldSkipModule(id, filter, loadedCache)) continue;
                    if (r ? r.test(src) : src.includes(raw)) count++;
                    if (r) r.lastIndex = 0;
                }
                if (!count) hints.push(`Pattern '${raw}' had 0 matches individually.`);
            }
            if (filter) hints.push("Try without filter.");
            result.hint = hints.join(" ");
        }
        return result;
    }

    if (!pattern) return { error: "Pattern must not be empty." };
    const { regex } = parseRegexPattern(pattern);
    if (!regex && pattern.startsWith("/")) {
        return { error: `Invalid regex: could not parse ${pattern}. Use /pattern/flags syntax.` };
    }

    if (args.count) {
        let moduleHits = 0;
        for (const [id, src] of sources) {
            if (targetId != null && id !== targetId) continue;
            if (shouldSkipModule(id, filter, loadedCache)) continue;
            if (findMatch(src, pattern, regex)) moduleHits++;
        }
        return { count: moduleHits, total: sources.size };
    }

    const matches: SearchMatch[] = [];
    let total = 0;
    let moduleHits = 0;
    let capped = false;

    for (const [id, src] of sources) {
        if (targetId != null && id !== targetId) continue;
        if (shouldSkipModule(id, filter, loadedCache)) continue;

        if (targetId != null) {
            const patched = isModulePatched(id);
            let startFrom = 0;
            while (matches.length < max && total < SEARCH.MAX_TOTAL) {
                const hit = findMatch(src, pattern, regex, startFrom);
                if (!hit) break;
                const { snippet, truncatedMatch } = buildSnippet(src, hit.idx, hit.len, context);
                total += snippet.length;
                const entry: SearchMatch = { id, at: hit.idx, s: snippet, len: src.length };
                if (truncatedMatch) entry.truncatedMatch = true;
                if (patched) entry.patched = true;
                matches.push(entry);
                startFrom = hit.idx + Math.max(hit.len, 1);
            }
        } else {
            const hit = findMatch(src, pattern, regex);
            if (!hit) continue;
            moduleHits++;
            if (capped) continue;
            if (matches.length >= max || total >= SEARCH.MAX_TOTAL) {
                capped = true;
                continue;
            }
            const { snippet, truncatedMatch } = buildSnippet(src, hit.idx, hit.len, context);
            total += snippet.length;
            const entry: SearchMatch = { id, at: hit.idx, len: src.length, s: snippet };
            if (truncatedMatch) entry.truncatedMatch = true;
            if (isModulePatched(id)) entry.patched = true;
            matches.push(entry);
        }
    }
    const result: { matches: SearchMatch[]; totalModules?: number; hint?: string } = { matches };
    if (targetId == null && moduleHits > matches.length) result.totalModules = moduleHits;
    if (!matches.length && !moduleHits) {
        if (filter) result.hint = `No matches with filter "${filter}". Try without filter or check if pattern exists in ${filter === "loaded" ? "unloaded" : "loaded"} modules.`;
        else if (targetId != null) result.hint = `Pattern not found in module ${targetId}. Use without id to search all modules.`;
        else if (regex) result.hint = "No regex matches. Check syntax or try a simpler literal pattern.";
    }
    if (total >= SEARCH.MAX_TOTAL) result.hint = (result.hint ? result.hint + " " : "") + "Stopped early due to output size limit.";
    return result;
}
