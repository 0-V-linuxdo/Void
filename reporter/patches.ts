/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { canonicalizeMatch, countCaptureGroups } from "../src/utils/patches";

import type { ChunkMap, ModuleEntry } from "./chunks";
import type { PatchSpec, ReplacementSpec } from "./extract";
import type { Diagnostic } from "./fmt";

export type PatchIssueCode =
    | "patch::find::no-module"
    | "patch::find::ambiguous"
    | "patch::replace::match-miss"
    | "patch::replace::backref-invalid"
    | "patch::replace::syntax-error"
    | "patch::replace::regex-invalid"
    | "patch::group::failed";

export interface PatchReportEntry {
    patch: PatchSpec;
    matchedModules: number[];
    diagnostics: Diagnostic[];
    ok: boolean;
    timings: Array<{ replacementIndex: number; timeMs: number }>;
}

const MAX_MODULE_AMBIGUITY = 10;
const SLOW_THRESHOLD_MS = 10;
const BACKREF_RE = /\$(\d)/g;
const SELF_RE = /\$self/g;

interface MatchHit {
    text: string;
    index: number;
    groups: string[];
}

export function testPatch(patch: PatchSpec, map: ChunkMap): PatchReportEntry {
    const diagnostics: Diagnostic[] = [];
    const timings: PatchReportEntry["timings"] = [];
    const matchedModules: number[] = [];

    const finds = patch.find.map(f => {
        if (f.kind !== "regex") return { ...f, compiled: undefined };
        try { return { ...f, compiled: canonicalizeMatch(f.regex!) as RegExp }; }
        catch {
            diagnostics.push({
                severity: "error",
                code: "patch::replace::regex-invalid",
                title: "Find regex failed to compile",
                primary: { span: f.span, label: "regex threw" },
                help: "Check escapes. `\\i` expands to minified ident token, any other `\\x` outside a charclass will break.",
            });
            return { ...f, compiled: undefined as RegExp | undefined };
        }
    });

    for (const mod of map.modules.values()) {
        if (moduleMatchesFind(mod, finds)) matchedModules.push(mod.id);
    }

    if (matchedModules.length === 0) {
        if (!patch.noWarn) {
            diagnostics.push({
                severity: "error",
                code: "patch::find::no-module",
                title: `${patch.plugin} find matched 0 modules`,
                primary: { span: patch.span, label: "no hit" },
                help: "Module may be lazy-loaded from a route not crawled, renamed, or split. Set `noWarn: true` only if absence is acceptable.",
            });
        }
        return { patch, matchedModules, diagnostics, ok: patch.noWarn, timings };
    }

    // Turbopack dedupes at factory level. Multiple ids with same factory text
    // get one patch applied to the shared factory, so `all: false` is fine.
    const uniqueFactories = new Set<string>();
    for (const id of matchedModules) {
        const mod = map.modules.get(id);
        if (mod) uniqueFactories.add(mod.factory);
    }
    if (!patch.all && uniqueFactories.size > 1) {
        diagnostics.push({
            severity: "error",
            code: "patch::find::ambiguous",
            title: `find matches ${uniqueFactories.size} distinct factories without \`all: true\``,
            primary: { span: patch.span, label: `${uniqueFactories.size} factories across ${matchedModules.length} modules` },
            notes: [`ids: ${matchedModules.slice(0, MAX_MODULE_AMBIGUITY).join(", ")}${matchedModules.length > MAX_MODULE_AMBIGUITY ? "…" : ""}`],
            help: "Add anchor to narrow find, or set `all: true`.",
        });
    }

    // Pick a representative module per unique factory. Matched modules often
    // include lookalikes where the `find` anchors appear but the `match` regex
    // does not, so we test each factory until one succeeds.
    const representatives: ModuleEntry[] = [];
    const seenFactories = new Set<string>();
    for (const id of matchedModules) {
        const mod = map.modules.get(id);
        if (!mod || seenFactories.has(mod.factory)) continue;
        seenFactories.add(mod.factory);
        representatives.push(mod);
    }
    const groupFails: number[] = [];

    for (let r = 0; r < patch.replacement.length; r++) {
        const rep = patch.replacement[r];
        const res = testReplacementAcross(rep, representatives, patch);
        diagnostics.push(...res.diagnostics);
        timings.push({ replacementIndex: r, timeMs: res.timeMs });
        if (!res.ok) groupFails.push(r);
    }

    if (patch.group && groupFails.length) {
        diagnostics.push({
            severity: "error",
            code: "patch::group::failed",
            title: `grouped patch would revert: ${groupFails.length}/${patch.replacement.length} replacements fail`,
            primary: { span: patch.span, label: "whole group reverts at runtime" },
            help: "`group: true` reverts the entire patch if any replacement misses. Fix the failing ones or drop `group: true`.",
        });
    }

    const ok = diagnostics.every(d => d.severity !== "error") || patch.noWarn;
    return { patch, matchedModules, diagnostics, ok, timings };
}

function moduleMatchesFind(mod: ModuleEntry, finds: Array<{ kind: "string" | "regex"; value: string; regex?: RegExp; compiled?: RegExp }>): boolean {
    for (const f of finds) {
        if (f.kind === "string") {
            if (!mod.factory.includes(f.value)) return false;
        } else {
            const re = f.compiled ?? f.regex;
            if (!re) return false;
            re.lastIndex = 0;
            if (!re.test(mod.factory)) return false;
        }
    }
    return true;
}

function runMatch(rep: ReplacementSpec, mod: ModuleEntry): { hit: MatchHit | null; compiled: RegExp | null; error?: string } {
    if (rep.match.kind === "regex") {
        let compiled: RegExp;
        try { compiled = canonicalizeMatch(rep.match.regex!) as RegExp; }
        catch (e) { return { hit: null, compiled: null, error: e instanceof Error ? e.message : String(e) }; }
        compiled.lastIndex = 0;
        const m = mod.factory.match(compiled);
        if (!m) return { hit: null, compiled };
        return { hit: { text: m[0], index: m.index ?? 0, groups: m.slice(1) }, compiled };
    }
    const idx = mod.factory.indexOf(rep.match.value);
    if (idx === -1) return { hit: null, compiled: null };
    return { hit: { text: rep.match.value, index: idx, groups: [] }, compiled: null };
}

function testReplacementAcross(rep: ReplacementSpec, candidates: ModuleEntry[], patch: PatchSpec): { diagnostics: Diagnostic[]; ok: boolean; timeMs: number } {
    const start = performance.now();
    let lastMiss: { diagnostics: Diagnostic[]; ok: boolean; timeMs: number } | null = null;
    for (const mod of candidates) {
        const res = testReplacement(rep, mod, patch);
        if (res.ok) return res;
        lastMiss = res;
    }
    return lastMiss ?? { diagnostics: [], ok: true, timeMs: performance.now() - start };
}

function testReplacement(rep: ReplacementSpec, mod: ModuleEntry, patch: PatchSpec): { diagnostics: Diagnostic[]; ok: boolean; timeMs: number } {
    const diagnostics: Diagnostic[] = [];
    const start = performance.now();
    const { hit, compiled, error } = runMatch(rep, mod);

    if (error) {
        diagnostics.push({
            severity: "error",
            code: "patch::replace::regex-invalid",
            title: "match regex failed to compile",
            primary: { span: rep.match.span, label: error },
        });
        return { diagnostics, ok: false, timeMs: performance.now() - start };
    }

    if (!hit) {
        if (!rep.noWarn && !patch.noWarn) {
            diagnostics.push({
                severity: "error",
                code: "patch::replace::match-miss",
                title: `match did not resolve in module ${mod.id}`,
                primary: { span: rep.match.span, label: "no hit in this module" },
                secondary: [moduleContext(mod, 0, "factory head")],
                help: "Find hit the module but the match regex missed. Minified shape probably drifted. Widen `.{0,N}` gaps or update anchor.",
            });
        }
        return { diagnostics, ok: rep.noWarn || patch.noWarn, timeMs: performance.now() - start };
    }

    if (compiled && rep.replace.kind === "string") {
        const groups = countCaptureGroups(compiled.source);
        for (const m of rep.replace.value.matchAll(BACKREF_RE)) {
            const ref = Number(m[1]);
            if (ref > groups) {
                diagnostics.push({
                    severity: "error",
                    code: "patch::replace::backref-invalid",
                    title: `replace uses $${ref} but match only has ${groups} capture group(s)`,
                    primary: { span: rep.replace.span, label: `$${ref} has no group` },
                    secondary: [{ span: rep.match.span, label: `match declares ${groups} group(s)` }],
                });
            }
        }
    }

    if (rep.replace.kind !== "string") {
        return { diagnostics, ok: diagnostics.every(d => d.severity !== "error"), timeMs: performance.now() - start };
    }

    const replaceExpr = rep.replace.value.replace(SELF_RE, `Void.plugins[${JSON.stringify(patch.plugin)}]`);
    const replaced = mod.factory.replace(compiled ?? hit.text, replaceExpr);

    try {
        new Function("return " + replaced);
    } catch (e) {
        const msg = e instanceof Error ? e.message.split("\n")[0] : String(e);
        diagnostics.push({
            severity: "error",
            code: "patch::replace::syntax-error",
            title: "replacement produced invalid JavaScript",
            primary: { span: rep.replace.span, label: msg },
            secondary: [moduleContext(mod, replaced.indexOf(replaceExpr), "patched output", replaced)],
            help: "Run the match/replace yourself, inspect what lands in the module. Likely missing paren, brace, or bad expression context.",
        });
    }

    return { diagnostics, ok: diagnostics.every(d => d.severity !== "error"), timeMs: performance.now() - start };
}

function moduleContext(mod: ModuleEntry, centerOff: number, label: string, patchedSource?: string): NonNullable<Diagnostic["secondary"]>[number] {
    const source = patchedSource ?? mod.factory;
    let line = 1, last = 0;
    for (let i = 0; i < centerOff && i < source.length; i++) if (source[i] === "\n") { line++; last = i + 1; }
    return {
        span: { file: `module ${mod.id} (${mod.chunkName}.js)`, line, col: centerOff - last + 1 },
        label,
        context: source.split("\n"),
    };
}

export function summariseTimings(entries: PatchReportEntry[]): Array<{ patch: PatchSpec; timeMs: number; replacementIndex: number }> {
    const slow: Array<{ patch: PatchSpec; timeMs: number; replacementIndex: number }> = [];
    for (const e of entries) {
        for (const t of e.timings) {
            if (t.timeMs > SLOW_THRESHOLD_MS) slow.push({ patch: e.patch, timeMs: t.timeMs, replacementIndex: t.replacementIndex });
        }
    }
    slow.sort((a, b) => b.timeMs - a.timeMs);
    return slow;
}
