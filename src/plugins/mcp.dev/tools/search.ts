/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getModuleCache } from "@turbopack/patchTurbopack";
import { matchesAllPatterns } from "@turbopack/turbopack";

import { SEARCH } from "./constants";
import type { SearchArgs, SearchMatch } from "./types";
import { clampConfig, getFactorySourceCache, isModulePatched, parseRegexPattern } from "./utils";

type LoadedCache = Map<number, unknown> | null;
type Filter = SearchArgs["filter"];

interface SearchContext {
    sources: Map<number, string>;
    loadedCache: LoadedCache;
    filter: Filter;
    targetId: number | undefined;
    max: number;
    context: number;
}

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

function buildMatchEntry(id: number, src: string, idx: number, matchLen: number, context: number): SearchMatch {
    const { snippet, truncatedMatch } = buildSnippet(src, idx, matchLen, context);
    const entry: SearchMatch = { id, at: idx, s: snippet, len: src.length };
    if (truncatedMatch) entry.truncatedMatch = true;
    if (isModulePatched(id)) entry.patched = true;
    return entry;
}

function shouldSkipModule(id: number, ctx: SearchContext): boolean {
    if (ctx.targetId != null && id !== ctx.targetId) return true;
    const { filter, loadedCache } = ctx;
    if (!filter) return false;
    if (filter === "patched") return !isModulePatched(id);
    if (!loadedCache) return false;
    if (filter === "loaded") return !loadedCache.has(id);
    if (filter === "unloaded") return loadedCache.has(id);
    return false;
}

function countMultiPattern(ctx: SearchContext, patterns: (string | RegExp)[]): number {
    let hits = 0;
    for (const [id, src] of ctx.sources) {
        if (shouldSkipModule(id, ctx)) continue;
        if (matchesAllPatterns(src, patterns)) hits++;
    }
    return hits;
}

function searchMultiPattern(ctx: SearchContext, rawPatterns: string[], patterns: (string | RegExp)[]): unknown {
    const matches: SearchMatch[] = [];
    const firstPat = patterns[0];
    let moduleHits = 0;
    for (const [id, src] of ctx.sources) {
        if (shouldSkipModule(id, ctx)) continue;
        if (!matchesAllPatterns(src, patterns)) continue;
        moduleHits++;
        if (matches.length >= ctx.max) continue;

        let idx = 0;
        let matchLen = 0;
        if (typeof firstPat === "string") {
            const pos = src.indexOf(firstPat);
            if (pos !== -1) { idx = pos; matchLen = firstPat.length; }
        } else {
            firstPat.lastIndex = 0;
            const m = firstPat.exec(src);
            if (m) { idx = m.index; matchLen = m[0].length; }
        }
        matches.push(buildMatchEntry(id, src, idx, matchLen, ctx.context));
    }
    const result: { matches: SearchMatch[]; totalModules?: number; hint?: string } = { matches };
    if (moduleHits > matches.length) result.totalModules = moduleHits;
    if (!matches.length && !moduleHits) result.hint = multiPatternHint(ctx, rawPatterns);
    return result;
}

function multiPatternHint(ctx: SearchContext, rawPatterns: string[]): string {
    const hints: string[] = [`No modules matched all ${rawPatterns.length} patterns. Try fewer constraints.`];
    for (const raw of rawPatterns) {
        const { regex: r } = parseRegexPattern(raw);
        let count = 0;
        for (const [id, src] of ctx.sources) {
            if (shouldSkipModule(id, ctx)) continue;
            if (r ? r.test(src) : src.includes(raw)) count++;
            if (r) r.lastIndex = 0;
        }
        if (!count) hints.push(`Pattern '${raw}' had 0 matches individually.`);
    }
    if (ctx.filter) hints.push("Try without filter.");
    return hints.join(" ");
}

function countSinglePattern(ctx: SearchContext, pattern: string, regex: RegExp | null): number {
    let hits = 0;
    for (const [id, src] of ctx.sources) {
        if (shouldSkipModule(id, ctx)) continue;
        if (findMatch(src, pattern, regex)) hits++;
    }
    return hits;
}

function searchSinglePattern(ctx: SearchContext, pattern: string, regex: RegExp | null): unknown {
    const matches: SearchMatch[] = [];
    let total = 0;
    let moduleHits = 0;
    let capped = false;

    for (const [id, src] of ctx.sources) {
        if (shouldSkipModule(id, ctx)) continue;

        if (ctx.targetId != null) {
            let startFrom = 0;
            while (matches.length < ctx.max && total < SEARCH.MAX_TOTAL) {
                const hit = findMatch(src, pattern, regex, startFrom);
                if (!hit) break;
                const entry = buildMatchEntry(id, src, hit.idx, hit.len, ctx.context);
                total += entry.s.length;
                matches.push(entry);
                startFrom = hit.idx + Math.max(hit.len, 1);
            }
            continue;
        }

        const hit = findMatch(src, pattern, regex);
        if (!hit) continue;
        moduleHits++;
        if (capped) continue;
        if (matches.length >= ctx.max || total >= SEARCH.MAX_TOTAL) { capped = true; continue; }
        const entry = buildMatchEntry(id, src, hit.idx, hit.len, ctx.context);
        total += entry.s.length;
        matches.push(entry);
    }
    const result: { matches: SearchMatch[]; totalModules?: number; hint?: string } = { matches };
    if (ctx.targetId == null && moduleHits > matches.length) result.totalModules = moduleHits;
    if (!matches.length && !moduleHits) {
        if (ctx.filter) result.hint = `No matches with filter "${ctx.filter}". Try without filter or check if pattern exists in ${ctx.filter === "loaded" ? "unloaded" : "loaded"} modules.`;
        else if (ctx.targetId != null) result.hint = `Pattern not found in module ${ctx.targetId}. Use without id to search all modules.`;
        else if (regex) result.hint = "No regex matches. Check syntax or try a simpler literal pattern.";
        else result.hint = `Literal "${pattern.slice(0, 40)}" not found in any factory source. Check spelling or try a partial/regex pattern.`;
    }
    if (total >= SEARCH.MAX_TOTAL) result.hint = (result.hint ? result.hint + " " : "") + "Stopped early due to output size limit.";
    return result;
}

export function handleSearch(args: SearchArgs): unknown {
    const { pattern, id: targetId, and: andPatterns, filter } = args;
    const max = clampConfig(args.max, { default: SEARCH.DEFAULT_MAX, max: SEARCH.MAX_RESULTS_CAP });
    const context = clampConfig(args.context, { default: SEARCH.DEFAULT_CONTEXT, max: SEARCH.MAX_CONTEXT });

    if (filter && filter !== "loaded" && filter !== "unloaded" && filter !== "patched") return { error: `Invalid filter: "${filter}". Use "loaded", "unloaded", or "patched".` };
    if (!pattern && !andPatterns?.length) return { error: 'Provide pattern (string or /regex/) or and[] (array of strings). Use count:true for count-only, filter:"loaded"/"unloaded" to narrow scope.' };

    const sources = getFactorySourceCache();
    if (!sources.size) return { error: "Factory registry not available" };

    const ctx: SearchContext = {
        sources,
        loadedCache: filter ? getModuleCache() : null,
        filter,
        targetId,
        max,
        context,
    };

    if (andPatterns?.length) {
        const rawPatterns = pattern ? [pattern, ...andPatterns] : andPatterns;
        const patterns: (string | RegExp)[] = rawPatterns.map(p => parseRegexPattern(p).regex ?? p);
        if (args.count) return { count: countMultiPattern(ctx, patterns), total: sources.size };
        return searchMultiPattern(ctx, rawPatterns, patterns);
    }

    if (!pattern) return { error: "Pattern must not be empty." };
    const { regex } = parseRegexPattern(pattern);
    if (!regex && pattern.startsWith("/")) return { error: `Invalid regex: could not parse ${pattern}. Use /pattern/flags syntax.` };

    if (args.count) return { count: countSinglePattern(ctx, pattern, regex), total: sources.size };
    return searchSinglePattern(ctx, pattern, regex);
}
