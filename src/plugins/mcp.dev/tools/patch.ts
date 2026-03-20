/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { getRuntimeFactoryRegistry, patches, patchResults, patchStats } from "@turbopack/patchTurbopack";
import { search } from "@turbopack/turbopack";
import { type PatchedModuleFactory, SYM_PATCHED_BY } from "@turbopack/types";
import { canonicalizeMatch } from "@utils/patches";

import { PATCH } from "./constants";
import type { LintWarning, PatchArgs } from "./types";
import { clampDefault, countCaptureGroups, errorMessage, extractContextAnchors, extractI18nKeys, getAllFactorySources, getFactorySourceCache } from "./utils";

function findModulesByFind(findStr: string): { ids: number[]; results: Record<number, unknown>; canonFind: string | RegExp } {
    const canonFind = canonicalizeMatch(findStr);
    const results = search(canonFind);
    const ids = Object.keys(results).map(Number);
    return { ids, results, canonFind };
}

const PATCH_ACTIONS = ["test", "analyze", "list", "conflicts", "broken", "lint", "context", "bench"] as const;

function lintMatchRegex(matchStr: string, replaceStr?: string): LintWarning[] {
    const warnings: LintWarning[] = [];

    if (/(?<!\\)\.\+/.test(matchStr)) warnings.push({ severity: "error", message: "Unbounded .+ gap", fix: "Use .{0,N}" });
    if (/(?<!\\)\.\*/.test(matchStr)) warnings.push({ severity: "error", message: "Unbounded .* gap", fix: "Use .{0,N}" });

    const varRe = /(?:^|[^\\a-zA-Z_$\w])([etrnioslcu])(?=[.,()[\]{}=!<>?:])/g;
    const foundVars = new Set<string>();
    let vm;
    while ((vm = varRe.exec(matchStr)) !== null) {
        if (!matchStr.startsWith("\\i", vm.index + vm[0].length - 1)) foundVars.add(vm[1]);
    }
    if (foundVars.size) {
        warnings.push({ severity: "error", message: `Hardcoded minified var(s): ${[...foundVars].slice(0, 5)}`, fix: "Use \\i" });
    }

    if (/\\i(?:\.\\i)+/.test(matchStr) && !/["'][^"']+["']/.test(matchStr)) {
        warnings.push({ severity: "warn", message: "Isolated \\i.\\i chain without anchors", fix: "Add string literals" });
    }

    if (/\.\{0,\d{3,}\}/.test(matchStr)) warnings.push({ severity: "warn", message: "Very large gap bound (100+)", fix: "Narrow the gap" });

    if (!/["'][^"']{2,}["']/.test(matchStr) && !/\\e\{/.test(matchStr)) {
        warnings.push({ severity: "warn", message: "No string literal anchor in match", fix: "Add i18n key, component name, or data-testid" });
    }

    if (matchStr.length > PATCH.MATCH_WARN_LENGTH && matchStr.length <= PATCH.MATCH_LONG_LENGTH) {
        warnings.push({ severity: "info", message: `Match regex is ${matchStr.length} chars (>${PATCH.MATCH_WARN_LENGTH})`, fix: "Simplify: use .{0,N}, $&, or lookbehind" });
    }

    const groups = countCaptureGroups(matchStr);
    if (groups > PATCH.MAX_CAPTURE_WARN) warnings.push({ severity: "warn", message: `${groups} capture groups`, fix: "Use (?:...) for unused groups" });

    if (replaceStr) {
        if (groups > 0 && !replaceStr.includes("$&") && !/\$\d/.test(replaceStr)) {
            warnings.push({ severity: "info", message: "Capture groups defined but not referenced in replace", fix: "Use $& or (?:...) for non-capturing" });
        }
        const refs = replaceStr.match(/\$(\d+)/g)?.map(g => Number(g.slice(1))) ?? [];
        for (const ref of refs) {
            if (ref > groups) warnings.push({ severity: "error", message: `$${ref} referenced but only ${groups} groups` });
        }
        const usedGroups = new Set(refs);
        for (let i = 1; i <= groups; i++) {
            if (!usedGroups.has(i)) warnings.push({ severity: "info", message: `$${i} unused`, fix: "Use (?:...)" });
        }
    }

    if (matchStr.length > PATCH.MATCH_LONG_LENGTH) warnings.push({ severity: "warn", message: `Long regex (${PATCH.MATCH_LONG_LENGTH}+ chars)`, fix: "Split into multiple patches" });

    const unnecessaryEscapeRe = /\\([/:!@#%=<>,;])/g;
    let ue;
    while ((ue = unnecessaryEscapeRe.exec(matchStr)) !== null) {
        warnings.push({ severity: "info", message: `Unnecessary escape: \\${ue[1]} (${ue[1]} doesn't need escaping in regex)` });
    }

    return warnings;
}

function longestLiteral(matchStr: string): string {
    let best = "";
    let current = "";
    for (let i = 0; i < matchStr.length; i++) {
        const ch = matchStr[i];
        if (ch === "\\") {
            if (i + 1 < matchStr.length) {
                const next = matchStr[i + 1];
                if (/[a-zA-Z0-9]/.test(next)) {
                    if (current.length > best.length) best = current;
                    current = "";
                    i++;
                    if (next === "e" && i < matchStr.length && matchStr[i] === "{") {
                        const close = matchStr.indexOf("}", i + 1);
                        if (close !== -1) i = close;
                    } else if ((next === "u" || next === "p" || next === "P" || next === "k") && i < matchStr.length && matchStr[i] === "{") {
                        const close = matchStr.indexOf("}", i + 1);
                        if (close !== -1) i = close;
                    } else if (next === "x") {
                        i += 2;
                    } else if (next === "u" && i < matchStr.length && matchStr[i] !== "{") {
                        i += 4;
                    }
                } else {
                    current += next;
                    i++;
                }
            }
        } else if (/[.*+?()[\]{}|^$]/.test(ch)) {
            if (current.length > best.length) best = current;
            current = "";
        } else {
            current += ch;
        }
    }
    if (current.length > best.length) best = current;
    return best;
}

function testMatchOnSource(src: string, id: number, findStr: string, matchStr: string, replaceStr: string, flags?: string, contextPad?: number) {
    let regex: RegExp;
    try {
        regex = canonicalizeMatch(new RegExp(matchStr, flags ?? ""));
    } catch (e: unknown) {
        return { status: "INVALID_REGEX" as const, error: errorMessage(e) };
    }

    const lintWarnings = lintMatchRegex(matchStr, replaceStr);
    const warnings = lintWarnings.filter(w => w.severity === "error" || w.severity === "warn").map(w => w.message);

    if (replaceStr.includes("$self")) warnings.push('$self is expanded at runtime to Void.plugins["Name"], not in test preview');

    let matched: RegExpMatchArray | null;
    try {
        matched = src.match(regex);
    } catch (e: unknown) {
        return { status: "MATCH_FAILED", id, hint: `Regex error: ${errorMessage(e)}`, ...(warnings.length && { warnings }) };
    }

    if (!matched) {
        const literal = longestLiteral(matchStr);
        const literalIdx = literal.length >= PATCH.MIN_LITERAL_LENGTH ? src.indexOf(literal) : -1;
        let hint: string;
        if (literalIdx >= 0) {
            hint = `Longest literal "${literal.slice(0, PATCH.HINT_LITERAL_SLICE)}" found at ${literalIdx} but full regex didn't match — check quantifiers and escaping`;
        } else if (literal.length >= PATCH.MIN_LITERAL_LENGTH) {
            hint = `Longest literal "${literal.slice(0, PATCH.HINT_LITERAL_SLICE)}" not found in source — verify find targets the right module`;
        } else {
            hint = "No substantial literal in match pattern — add string anchors";
        }
        const canonFindStr = canonicalizeMatch(findStr);
        const findIdx = typeof canonFindStr === "string" ? src.indexOf(canonFindStr) : src.search(canonFindStr);
        const nfPad = clampDefault(contextPad, PATCH.DEFAULT_CONTEXT_PAD, PATCH.MAX_CONTEXT_PAD);
        const nearFind = findIdx >= 0 ? src.slice(Math.max(0, findIdx - nfPad), Math.min(src.length, findIdx + nfPad * 2)) : undefined;
        const result: Record<string, unknown> = { status: "MATCH_FAILED", id, len: src.length, hint };
        if (literalIdx >= 0) {
            const partialStart = Math.max(0, literalIdx - nfPad);
            result.partialAt = literalIdx;
            result.partialCtx = src.slice(partialStart, Math.min(src.length, literalIdx + literal.length + nfPad));
        }
        if (nearFind) result.nearFind = nearFind;
        if (warnings.length) result.warnings = warnings;
        return result;
    }

    const replaceGroups = replaceStr.match(/\$(\d+)/g)?.map((g: string) => Number(g.slice(1))) ?? [];
    const captureCount = countCaptureGroups(matchStr);
    for (const g of replaceGroups) {
        if (g > captureCount) warnings.push(`$${g} referenced but only ${captureCount} groups`);
    }

    const globalRegex = new RegExp(regex.source, regex.flags.includes("g") ? regex.flags : `${regex.flags}g`);
    const allMatches = src.match(globalRegex);
    if (allMatches && allMatches.length > 1) warnings.push(`Regex matches ${allMatches.length} times in source — only first is replaced without g flag`);

    const patchedSrc = src.replace(regex, replaceStr);
    if (patchedSrc === src) warnings.push("Replacement produced identical output (no-op)");

    const at = matched.index!;
    const pad = clampDefault(contextPad, PATCH.DEFAULT_CONTEXT_PAD, PATCH.MAX_CONTEXT_PAD);
    const cs = Math.max(0, at - pad);
    const ce = Math.min(src.length, at + matched[0].length + pad);

    const canonFind = canonicalizeMatch(findStr);
    const findOffset = typeof canonFind === "string" ? src.indexOf(canonFind) : src.search(canonFind);

    const result: Record<string, unknown> = {
        status: "VALID",
        id,
        at,
        findOffset,
        len: src.length,
        matchLen: matched[0].length,
        matched: matched[0].slice(0, PATCH.MATCH_SLICE),
        before: src.slice(cs, ce),
        after: patchedSrc.slice(cs, Math.max(cs, ce + (patchedSrc.length - src.length))),
    };
    if (/\\[ie]/.test(matchStr)) result.canonicalRegex = regex.source;
    if (matched.length > 1) result.groups = matched.slice(1).map((g: string) => g?.slice(0, PATCH.GROUP_SLICE));
    if (warnings.length) result.warnings = warnings;
    return result;
}

function diagnoseOrphaned(p: (typeof patches)[number]) {
    const canonParts = Array.isArray(p.find) ? p.find.map(f => canonicalizeMatch(f)) : [canonicalizeMatch(String(p.find))];
    const results = search(...canonParts);
    const ids = Object.keys(results).map(Number);
    const replacements = Array.isArray(p.replacement) ? p.replacement : [p.replacement];
    const findLabel = String(p.find).slice(0, PATCH.FIND_SLICE);

    if (!ids.length) {
        const findStr = String(p.find);
        let inUnloaded = 0;
        for (const [, src] of getFactorySourceCache()) {
            if (src.includes(findStr)) inUnloaded++;
        }
        const reason = inUnloaded ? `find matched 0 loaded modules (found in ${inUnloaded} unloaded factory sources — likely lazy chunk)` : "find matched 0 modules";
        return { plugin: p.plugin, find: findLabel, n: replacements.length, reason };
    }

    const sources = p.all ? ids.map(id => String(results[id])) : [String(results[ids[0]])];
    const failed = replacements.filter(r => {
        if (typeof r.replace === "function" || typeof r.match === "function") return false;
        try {
            const regex = r.match instanceof RegExp ? r.match : canonicalizeMatch(new RegExp(r.match as string));
            return !sources.some(src => {
                if (regex instanceof RegExp) regex.lastIndex = 0;
                return regex.test(src);
            });
        } catch {
            return true;
        }
    });

    if (!failed.length) return null;

    const reason =
        failed.length === replacements.length
            ? `find matched ${ids.length} module(s) but all ${replacements.length} match regex(es) failed`
            : `find matched ${ids.length} module(s), ${failed.length}/${replacements.length} match regex(es) failed`;

    const result: Record<string, unknown> = { plugin: p.plugin, find: findLabel, n: replacements.length, reason, moduleId: ids[0] };
    const src = String(results[ids[0]]);
    const canonFind = canonParts[0];
    const findIdx = typeof canonFind === "string" ? src.indexOf(canonFind) : src.search(canonFind);
    if (findIdx >= 0) {
        const neighborhood = src.slice(Math.max(0, findIdx - 200), Math.min(src.length, findIdx + 400));
        const nearbyI18n = extractI18nKeys(neighborhood);
        if (nearbyI18n.length) result.nearbyI18n = nearbyI18n;
    }
    return result;
}

export function handlePatch(args: PatchArgs): unknown {
    const { action, find: findStr, match: matchStr, replace: replaceStr, flags } = args;

    if (action === "list") {
        return patches.map(p => {
            const replacements = Array.isArray(p.replacement) ? p.replacement : [p.replacement];
            const result = patchResults.find(r => r.plugin === p.plugin && r.find === String(p.find));
            const entry: Record<string, unknown> = {
                plugin: p.plugin,
                find: String(p.find).slice(0, PATCH.FIND_SLICE),
                all: !!p.all,
                replacements: replacements.map((r, i) => {
                    const rep: Record<string, unknown> = {
                        match: String(r.match).slice(0, PATCH.MATCH_SLICE),
                        replace: typeof r.replace === "string" ? r.replace.slice(0, PATCH.MATCH_SLICE) : "[function]",
                    };
                    if (result?.replacements[i]) rep.status = result.replacements[i].status;
                    return rep;
                }),
            };
            if (p.group) entry.group = true;
            if (result) entry.moduleId = result.moduleId;
            else entry.status = isPluginEnabled(p.plugin) ? "unmatched" : "disabled";
            return entry;
        });
    }

    if (action === "analyze") {
        if (!findStr) return { error: "Provide find string" };
        const { ids, results, canonFind } = findModulesByFind(findStr);
        if (!ids.length) return { unique: false, count: 0, hint: "No modules match this find string" };

        const ctxPad = clampDefault(args.context, PATCH.ANALYZE_DEFAULT_CONTEXT, PATCH.MAX_CONTEXT_PAD);

        if (ids.length === 1) {
            const id = ids[0];
            const src = String(results[id]);
            const findIdx = typeof canonFind === "string" ? src.indexOf(canonFind) : src.search(canonFind);
            const start = Math.max(0, findIdx - ctxPad);
            const ctx = src.slice(start, start + ctxPad * 2);
            const nearbyI18n = extractI18nKeys(ctx);
            const result: Record<string, unknown> = { unique: true, id, at: findIdx, len: src.length, ctx };
            if (nearbyI18n.length) result.i18nKeys = nearbyI18n;
            return result;
        }

        const firstSrc = String(results[ids[0]]);
        const sameSource = ids.every(mid => String(results[mid]) === firstSrc);

        const entries = ids.slice(0, PATCH.ANALYZE_IDS_LIMIT).map(mid => {
            const modSrc = String(results[mid]);
            const modIdx = typeof canonFind === "string" ? modSrc.indexOf(canonFind) : modSrc.search(canonFind);
            const start = Math.max(0, modIdx - ctxPad);
            const ctx = modSrc.slice(start, start + ctxPad * 2);
            const nearbyI18n = extractI18nKeys(ctx);
            const entry: Record<string, unknown> = { id: mid, ctx };
            if (nearbyI18n.length) entry.i18nKeys = nearbyI18n;
            return entry;
        });

        const result: Record<string, unknown> = { unique: false, count: ids.length, entries };
        if (sameSource) {
            result.sharedFactory = true;
            result.ids = ids.slice(0, PATCH.ANALYZE_IDS_LIMIT);
            result.hint = `Shared factory — all ${ids.length} IDs share identical source. Use all:true in patch.`;
        }
        return result;
    }

    if (action === "test") {
        if (!findStr || !matchStr || !replaceStr) return { error: "Provide find, match, and replace" };

        const { ids, results } = findModulesByFind(findStr);
        if (!ids.length) {
            const registry = getRuntimeFactoryRegistry();
            return { status: "FIND_NO_MATCH", hint: "No modules match this find string. Verify the string exists in module source or use search tool.", factories: registry?.size ?? 0 };
        }

        const id = ids[0];
        const src = String(results[id]);
        const testResult = testMatchOnSource(src, id, findStr, matchStr, replaceStr, flags, args.context);

        if (typeof testResult === "object" && testResult.status === "VALID") {
            const matchAt = testResult.at as number;
            const i18nPad = clampDefault(args.context, PATCH.DEFAULT_CONTEXT_PAD, PATCH.MAX_CONTEXT_PAD);
            const neighborhood = src.slice(Math.max(0, matchAt - i18nPad), Math.min(src.length, matchAt + i18nPad * 2));
            const nearbyI18n = extractI18nKeys(neighborhood);
            if (nearbyI18n.length) (testResult as Record<string, unknown>).nearbyI18n = nearbyI18n;
        }

        if (ids.length === 1) return testResult;

        const sameSource = ids.every(mid => String(results[mid]) === src);
        return {
            ...testResult,
            findCount: ids.length,
            ids: ids.slice(0, PATCH.NOT_UNIQUE_IDS_LIMIT),
            sharedFactory: sameSource,
            hint: sameSource ? `Shared factory (${ids.length} IDs, same source) — use all:true in patch` : `${ids.length} different modules match find — make find more specific`,
        };
    }

    if (action === "conflicts") {
        const registry = getRuntimeFactoryRegistry();
        if (!registry) return { error: "Factory registry not available" };
        const conflicts: Array<{ id: number; plugins: string[] }> = [];
        for (const [id, factory] of registry) {
            const patchedBy = (factory as PatchedModuleFactory)[SYM_PATCHED_BY];
            if (patchedBy && patchedBy.length > 1) conflicts.push({ id, plugins: patchedBy });
        }
        return { count: conflicts.length, conflicts };
    }

    if (action === "broken") {
        const orphaned = patches.map(diagnoseOrphaned).filter(Boolean);
        const noEffect = patchResults.flatMap(r =>
            r.replacements.filter(rep => rep.status === "noEffect").map(rep => ({ plugin: r.plugin, find: r.find.slice(0, PATCH.FIND_SLICE), moduleId: r.moduleId, match: rep.match.slice(0, PATCH.MATCH_SLICE) })),
        );
        const errors = patchResults.flatMap(r =>
            r.replacements.filter(rep => rep.status === "error").map(rep => ({ plugin: r.plugin, find: r.find.slice(0, PATCH.FIND_SLICE), moduleId: r.moduleId, match: rep.match.slice(0, PATCH.MATCH_SLICE) })),
        );
        return {
            orphaned,
            ...(noEffect.length && { noEffect }),
            ...(errors.length && { errors }),
            stats: {
                applied: patchStats.applied,
                noEffect: patchStats.noEffect,
                errors: patchStats.errors,
                runtimeFallbacks: patchStats.runtimeFallbacks,
                patched: patchStats.patchedModules.size,
            },
        };
    }

    if (action === "lint") {
        if (!matchStr) return { error: "Provide match regex string to lint" };
        const warnings = lintMatchRegex(matchStr, replaceStr);
        const errorCount = warnings.filter(w => w.severity === "error").length;
        const warnCount = warnings.filter(w => w.severity === "warn").length;
        return { warnings, summary: { errors: errorCount, warns: warnCount, info: warnings.length - errorCount - warnCount }, clean: !errorCount && !warnCount };
    }

    if (action === "context") {
        if (!findStr) return { error: "Provide find string" };
        const { ids, results, canonFind } = findModulesByFind(findStr);
        if (!ids.length) {
            const registry = getRuntimeFactoryRegistry();
            return { error: "No modules match this find string", hint: "Verify the string exists in module source or use search tool.", factories: registry?.size ?? 0 };
        }

        const id = ids[0];
        const src = String(results[id]);
        const findIdx = typeof canonFind === "string" ? src.indexOf(canonFind) : src.search(canonFind);
        if (findIdx < 0) return { error: "Find matched module but indexOf failed" };

        const rawWindow = args.window;
        const windowSize = Math.max(PATCH.CONTEXT_MIN_WINDOW, clampDefault(rawWindow, PATCH.CONTEXT_DEFAULT_WINDOW, PATCH.CONTEXT_MAX_WINDOW));
        const half = Math.floor(windowSize / 2);
        const ctxStart = Math.max(0, findIdx - half);
        const ctxEnd = Math.min(src.length, findIdx + half);
        const ctx = src.slice(ctxStart, ctxEnd);

        const anchors = extractContextAnchors(ctx, getAllFactorySources(), PATCH.CONTEXT_MAX_ANCHORS);
        const findRelative = findIdx - ctxStart;
        for (const anchor of anchors) anchor.dist = Math.abs(anchor.at - findRelative);
        anchors.sort((a, b) => (a.dist ?? 0) - (b.dist ?? 0));

        const result: Record<string, unknown> = {
            id,
            at: findIdx,
            len: src.length,
            ctxStart,
            src: ctx,
            anchors,
        };
        if (rawWindow != null && rawWindow < PATCH.CONTEXT_MIN_WINDOW) result.note = `Window clamped to minimum of ${PATCH.CONTEXT_MIN_WINDOW} (requested ${rawWindow}).`;
        if (ids.length > 1) {
            const sameSource = ids.every(mid => String(results[mid]) === src);
            result.findCount = ids.length;
            if (sameSource) result.sharedFactory = true;
        }
        return result;
    }

    if (action === "bench") {
        if (!matchStr) return { error: "Provide match regex string" };

        let regex: RegExp;
        try {
            regex = canonicalizeMatch(new RegExp(matchStr, flags ?? ""));
        } catch (e: unknown) {
            return { error: `Invalid regex: ${errorMessage(e)}` };
        }

        const RUNS = 50;
        const WARMUP = 5;

        const bench = (fn: () => void) => {
            for (let i = 0; i < WARMUP; i++) fn();
            const times: number[] = [];
            for (let i = 0; i < RUNS; i++) {
                const start = performance.now();
                fn();
                times.push(performance.now() - start);
            }
            times.sort((a, b) => a - b);
            return {
                medianMs: +(times[Math.floor(RUNS / 2)].toFixed(3)),
                p95Ms: +(times[Math.floor(RUNS * 0.95)].toFixed(3)),
                maxMs: +(times[RUNS - 1].toFixed(3)),
            };
        };

        const allSources = getAllFactorySources();
        const canonFind = findStr ? canonicalizeMatch(findStr) : undefined;

        const find = canonFind ? bench(() => {
            for (const src of allSources) {
                if (src.includes(canonFind)) break;
            }
        }) : undefined;

        const match = bench(() => {
            for (const src of allSources) { regex.lastIndex = 0; regex.test(src); }
        });

        const replace = replaceStr ? bench(() => {
            for (const src of allSources) { regex.lastIndex = 0; src.replace(regex, replaceStr); }
        }) : undefined;

        let totalLen = 0;
        for (const src of allSources) totalLen += src.length;

        return {
            regex: regex.source.slice(0, PATCH.MATCH_SLICE),
            modules: { count: allSources.length, totalLen },
            ...(find && { find }),
            match,
            ...(replace && { replace }),
        };
    }

    return { error: `Unknown action: ${action}`, validActions: PATCH_ACTIONS };
}
