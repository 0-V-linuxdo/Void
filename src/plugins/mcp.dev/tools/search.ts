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
type SourceEntries = Iterable<[number, string]>;

interface SearchContext {
    loadedCache: LoadedCache;
    filter: Filter;
    max: number;
    context: number;
}

interface ScanResult {
    matches: SearchMatch[];
    moduleHits: number;
    total: number;
}

function findMatch(src: string, pattern: string | RegExp, startFrom = 0): { idx: number; len: number } | null {
    if (typeof pattern === "string") {
        const idx = src.indexOf(pattern, startFrom);
        return idx === -1 ? null : { idx, len: pattern.length };
    }
    pattern.lastIndex = startFrom;
    const m = pattern.exec(src);
    return m ? { idx: m.index, len: m[0].length } : null;
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
    const { filter, loadedCache } = ctx;
    if (!filter) return false;
    if (filter === "patched") return !isModulePatched(id);
    if (!loadedCache) return false;
    if (filter === "loaded") return !loadedCache.has(id);
    if (filter === "unloaded") return loadedCache.has(id);
    return false;
}

function targetEntries(id: number, sources: Map<number, string>): [number, string][] {
    const src = sources.get(id);
    return src == null ? [] : [[id, src]];
}

function scanModules(entries: SourceEntries, ctx: SearchContext, patterns: (string | RegExp)[], opts: { countOnly: true; perModuleMultiHit: boolean }): number;
function scanModules(entries: SourceEntries, ctx: SearchContext, patterns: (string | RegExp)[], opts: { countOnly: false; perModuleMultiHit: boolean }): ScanResult;
function scanModules(entries: SourceEntries, ctx: SearchContext, patterns: (string | RegExp)[], opts: { countOnly: boolean; perModuleMultiHit: boolean }): number | ScanResult {
    if (opts.countOnly) {
        let hits = 0;
        for (const [id, src] of entries) {
            if (shouldSkipModule(id, ctx)) continue;
            if (matchesAllPatterns(src, patterns)) hits++;
        }
        return hits;
    }

    const locator = patterns[0];
    const matches: SearchMatch[] = [];
    let moduleHits = 0;
    let total = 0;
    let capped = false;

    for (const [id, src] of entries) {
        if (shouldSkipModule(id, ctx)) continue;
        if (!matchesAllPatterns(src, patterns)) continue;

        if (opts.perModuleMultiHit) {
            let startFrom = 0;
            while (matches.length < ctx.max && total < SEARCH.MAX_TOTAL) {
                const hit = findMatch(src, locator, startFrom);
                if (!hit) break;
                const entry = buildMatchEntry(id, src, hit.idx, hit.len, ctx.context);
                total += entry.s.length;
                matches.push(entry);
                startFrom = hit.idx + Math.max(hit.len, 1);
            }
            continue;
        }

        moduleHits++;
        if (capped) continue;
        if (matches.length >= ctx.max || total >= SEARCH.MAX_TOTAL) { capped = true; continue; }
        const hit = findMatch(src, locator, 0);
        if (!hit) continue;
        const entry = buildMatchEntry(id, src, hit.idx, hit.len, ctx.context);
        total += entry.s.length;
        matches.push(entry);
    }

    return { matches, moduleHits, total };
}

function buildSearchResult(scanResult: ScanResult, perModuleMultiHit: boolean, hint: () => string): { matches: SearchMatch[]; totalModules?: number; hint?: string } {
    const { matches, moduleHits, total } = scanResult;
    const result: { matches: SearchMatch[]; totalModules?: number; hint?: string } = { matches };
    if (!perModuleMultiHit && moduleHits > matches.length) result.totalModules = moduleHits;
    if (!matches.length && !moduleHits) result.hint = hint();
    if (total >= SEARCH.MAX_TOTAL) result.hint = (result.hint ? result.hint + " " : "") + "Stopped early due to output size limit.";
    return result;
}

function multiPatternHint(entries: SourceEntries, ctx: SearchContext, rawPatterns: string[], patterns: (string | RegExp)[]): string {
    const hints: string[] = [`No modules matched all ${rawPatterns.length} patterns. Try fewer constraints.`];
    rawPatterns.forEach((raw, i) => {
        if (!scanModules(entries, ctx, [patterns[i]], { countOnly: true, perModuleMultiHit: false })) hints.push(`Pattern '${raw}' had 0 matches individually.`);
    });
    if (ctx.filter) hints.push("Try without filter.");
    return hints.join(" ");
}

function singlePatternHint(ctx: SearchContext, targetId: number | undefined, pattern: string, isRegex: boolean): string {
    if (ctx.filter) return `No matches with filter "${ctx.filter}". Try without filter or check if pattern exists in ${ctx.filter === "loaded" ? "unloaded" : "loaded"} modules.`;
    if (targetId != null) return `Pattern not found in module ${targetId}. Use without id to search all modules.`;
    if (isRegex) return "No regex matches. Check syntax or try a simpler literal pattern.";
    return `Literal "${pattern.slice(0, 40)}" not found in any factory source. Check spelling or try a partial/regex pattern.`;
}

function parsePatterns(raws: string[], isAnd: boolean): { patterns: (string | RegExp)[] } | { error: string } {
    const patterns: (string | RegExp)[] = [];
    for (const raw of raws) {
        const regex = parseRegexPattern(raw);
        if (!regex && raw.startsWith("/")) {
            return { error: isAnd ? `Invalid regex in and[]: could not parse ${raw}. Use /pattern/flags syntax.` : `Invalid regex: could not parse ${raw}. Use /pattern/flags syntax.` };
        }
        patterns.push(regex ?? raw);
    }
    return { patterns };
}

export function handleSearch(args: SearchArgs): unknown {
    const { pattern, id: targetId, and: andPatterns, filter } = args;
    const max = clampConfig(args.max, { default: SEARCH.DEFAULT_MAX, max: SEARCH.MAX_RESULTS_CAP });
    const context = clampConfig(args.context, { default: SEARCH.DEFAULT_CONTEXT, max: SEARCH.MAX_CONTEXT });

    if (filter && filter !== "loaded" && filter !== "unloaded" && filter !== "patched") return { error: `Invalid filter: "${filter}". Use "loaded", "unloaded", or "patched".` };
    if (!pattern && !andPatterns?.length) return { error: 'Provide pattern (string or /regex/) or and[] (array of strings). Use count:true for count-only, filter:"loaded"/"unloaded" to narrow scope.' };

    const sources = getFactorySourceCache();
    if (!sources.size) return { error: "Factory registry not available" };

    const ctx: SearchContext = { loadedCache: filter ? getModuleCache() : null, filter, max, context };
    const entries: SourceEntries = targetId == null ? sources : targetEntries(targetId, sources);

    if (andPatterns?.length) {
        const rawPatterns = pattern ? [pattern, ...andPatterns] : andPatterns;
        const parsed = parsePatterns(rawPatterns, true);
        if ("error" in parsed) return parsed;
        const { patterns } = parsed;

        if (args.count) return { count: scanModules(entries, ctx, patterns, { countOnly: true, perModuleMultiHit: false }), total: sources.size };
        return buildSearchResult(
            scanModules(entries, ctx, patterns, { countOnly: false, perModuleMultiHit: false }),
            false,
            () => multiPatternHint(entries, ctx, rawPatterns, patterns),
        );
    }

    if (!pattern) return { error: "Pattern must not be empty." };
    const parsed = parsePatterns([pattern], false);
    if ("error" in parsed) return parsed;
    const { patterns } = parsed;
    const isRegex = typeof patterns[0] !== "string";

    if (args.count) return { count: scanModules(entries, ctx, patterns, { countOnly: true, perModuleMultiHit: false }), total: sources.size };

    const perModuleMultiHit = targetId != null;
    return buildSearchResult(
        scanModules(entries, ctx, patterns, { countOnly: false, perModuleMultiHit }),
        perModuleMultiHit,
        () => singlePatternHint(ctx, targetId, pattern, isRegex),
    );
}
