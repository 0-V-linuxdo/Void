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
    | "patch::perf::identifier-start"
    | "patch::replace::match-miss"
    | "patch::replace::partial-groups"
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
const SLOW_THRESHOLD_MS = 20;
const BACKREF_RE = /\$(\d)/g;
const SELF_RE = /\$self/g;

type CompiledFind = PatchSpec["find"][number] & { compiled?: RegExp };

interface ReplacementOutcome {
    diagnostics: Diagnostic[];
    applied: boolean;
    timeMs: number;
}

interface FactoryGroup {
    factory: string;
    representative: ModuleEntry;
    ids: number[];
}

function startsNonLiteral(source: string): boolean {
    const head = source.replace(/^\(+(?:\?:)?/, "");
    return /^(?:\[|\\[wdsWDSbB]|\.)/.test(head);
}

export function testPatch(patch: PatchSpec, map: ChunkMap): PatchReportEntry {
    const diagnostics: Diagnostic[] = [];
    const timings: PatchReportEntry["timings"] = [];

    const finds = patch.find.map<CompiledFind>(f => {
        if (f.kind !== "regex") return { ...f };
        try { return { ...f, compiled: canonicalizeMatch(f.regex!) as RegExp }; }
        catch {
            diagnostics.push({
                severity: "error",
                code: "patch::replace::regex-invalid",
                title: "Find regex failed to compile",
                primary: { span: f.span, label: "regex threw" },
                help: "Check escapes. `\\i` expands to minified ident token, any other `\\x` outside a charclass will break.",
            });
            return { ...f };
        }
    });

    const matchedModules: number[] = [];
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

    // Runtime dedupes patching at the factory level (one wrapped factory per
    // distinct factory text). Group the matched modules accordingly so each
    // group mirrors exactly one `patchFactory` invocation at runtime.
    const groups = groupByFactory(matchedModules, map);

    // The runtime evaluates replacements per group, then aggregates by the
    // `all`/`group` flags. Track per-group application so we can mirror it.
    const groupApplied: boolean[] = [];
    for (let g = 0; g < groups.length; g++) {
        const group = groups[g];
        let allReplaced = true;
        for (let r = 0; r < patch.replacement.length; r++) {
            const res = evaluateReplacement(patch.replacement[r], group.representative, patch);
            if (g === 0) timings.push({ replacementIndex: r, timeMs: res.timeMs });
            diagnostics.push(...res.diagnostics);
            if (!res.applied) allReplaced = false;
        }
        groupApplied.push(allReplaced);
    }

    aggregate(patch, groups, groupApplied, matchedModules, diagnostics);

    const ok = diagnostics.every(d => d.severity !== "error") || patch.noWarn;
    return { patch, matchedModules, diagnostics, ok, timings };
}

function groupByFactory(matchedModules: number[], map: ChunkMap): FactoryGroup[] {
    const byFactory = new Map<string, FactoryGroup>();
    for (const id of matchedModules) {
        const mod = map.modules.get(id);
        if (!mod) continue;
        const existing = byFactory.get(mod.factory);
        if (existing) existing.ids.push(id);
        else byFactory.set(mod.factory, { factory: mod.factory, representative: mod, ids: [id] });
    }
    return [...byFactory.values()];
}

// Decision table mirroring `patchFactory`:
//  - non-all: runtime consumes the patch on the FIRST factory group that hits
//    find, regardless of which group that is (chunk load order is
//    nondeterministic). >1 group where the match misses anywhere is therefore a
//    load-order gamble → hard error.
//  - all: applied to every group; a miss in some groups is partial application,
//    legitimate only when intended → distinct warn so it gets `noWarn`'d.
//  - group: per group, a failing replacement reverts that whole group's module.
function aggregate(patch: PatchSpec, groups: FactoryGroup[], groupApplied: boolean[], matchedModules: number[], diagnostics: Diagnostic[]): void {
    const idNote = `ids: ${matchedModules.slice(0, MAX_MODULE_AMBIGUITY).join(", ")}${matchedModules.length > MAX_MODULE_AMBIGUITY ? "…" : ""}`;
    const appliedCount = groupApplied.filter(Boolean).length;

    if (patch.group) {
        const failed = groupApplied.filter(a => !a).length;
        if ((patch.all ? failed > 0 : failed === groups.length) && !patch.noWarn) {
            diagnostics.push({
                severity: "error",
                code: "patch::group::failed",
                title: `grouped patch reverts in ${failed}/${groups.length} factory group(s)`,
                primary: { span: patch.span, label: "whole group reverts at runtime" },
                notes: [idNote],
                help: "`group: true` reverts the entire patch for a module if any replacement misses there. Fix the failing replacements or drop `group: true`.",
            });
        }
    }

    if (patch.all) {
        if (appliedCount > 0 && appliedCount < groups.length && !patch.noWarn) {
            diagnostics.push({
                severity: "warn",
                code: "patch::replace::partial-groups",
                title: `match resolves in ${appliedCount}/${groups.length} factory groups`,
                primary: { span: patch.span, label: `applies to ${appliedCount} of ${groups.length} groups` },
                notes: [idNote],
                help: "`all: true` applies per group; the rest are left untouched. If partial application is intended, set `noWarn: true`; otherwise widen the match.",
            });
        }
        return;
    }

    // Non-all: only one group ever receives the patch at runtime, decided by
    // load order. If find spans >1 group and any group fails the match, the
    // runtime outcome is a coin flip.
    if (groups.length > 1) {
        const missing = groupApplied.filter(a => !a).length;
        diagnostics.push({
            severity: "error",
            code: "patch::find::ambiguous",
            title: `find matches ${groups.length} distinct factories without \`all: true\``,
            primary: { span: patch.span, label: `${groups.length} factories across ${matchedModules.length} modules` },
            notes: [idNote, missing ? `match misses in ${missing} group(s): runtime resolves to whichever chunk loads first` : "all groups match, but only the first-loaded one is patched"],
            help: "Runtime consumes a non-`all` patch on the first factory group that hits `find`, so a mixed group is load-order roulette. Narrow `find` to one factory, or set `all: true`.",
        });
    }
}

function moduleMatchesFind(mod: ModuleEntry, finds: CompiledFind[]): boolean {
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

function runMatch(rep: ReplacementSpec, mod: ModuleEntry): { index: number; text: string; compiled: RegExp | null; error?: string } | null {
    if (rep.match.kind === "regex") {
        let compiled: RegExp;
        try { compiled = canonicalizeMatch(rep.match.regex!) as RegExp; }
        catch (e) { return { index: -1, text: "", compiled: null, error: e instanceof Error ? e.message : String(e) }; }
        compiled.lastIndex = 0;
        const m = mod.factory.match(compiled);
        if (!m) return { index: -1, text: "", compiled };
        return { index: m.index ?? 0, text: m[0], compiled };
    }
    const idx = mod.factory.indexOf(rep.match.value);
    return { index: idx, text: rep.match.value, compiled: null };
}

function evaluateReplacement(rep: ReplacementSpec, mod: ModuleEntry, patch: PatchSpec): ReplacementOutcome {
    const diagnostics: Diagnostic[] = [];
    const start = performance.now();
    const m = runMatch(rep, mod);

    if (m?.error) {
        diagnostics.push({
            severity: "error",
            code: "patch::replace::regex-invalid",
            title: "match regex failed to compile",
            primary: { span: rep.match.span, label: m.error },
        });
        return { diagnostics, applied: false, timeMs: performance.now() - start };
    }

    const compiled = m?.compiled ?? null;
    if (compiled && startsNonLiteral(compiled.source)) {
        diagnostics.push({
            severity: "warn",
            code: "patch::perf::identifier-start",
            title: "match regex starts with an identifier or character class",
            primary: { span: rep.match.span, label: "no literal first char" },
            help: "Literal-at-start lets V8 fast-scan (~400x faster, prevents aborts). Anchor on a literal, or consume a literal prefix and re-emit it in replace.",
        });
    }

    if (!m || m.index === -1) {
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
        return { diagnostics, applied: false, timeMs: performance.now() - start };
    }

    if (compiled && rep.replace.kind === "string") {
        const groups = countCaptureGroups(compiled.source);
        for (const ref of rep.replace.value.matchAll(BACKREF_RE)) {
            const n = Number(ref[1]);
            if (n > groups) {
                diagnostics.push({
                    severity: "error",
                    code: "patch::replace::backref-invalid",
                    title: `replace uses $${n} but match only has ${groups} capture group(s)`,
                    primary: { span: rep.replace.span, label: `$${n} has no group` },
                    secondary: [{ span: rep.match.span, label: `match declares ${groups} group(s)` }],
                });
            }
        }
    }

    if (rep.replace.kind !== "string") {
        return { diagnostics, applied: diagnostics.every(d => d.severity !== "error"), timeMs: performance.now() - start };
    }

    const replaceExpr = rep.replace.value.replace(SELF_RE, `Void.plugins[${JSON.stringify(patch.plugin)}]`);
    const replaced = mod.factory.replace(compiled ?? m.text, replaceExpr);

    if (replaced !== mod.factory) {
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
    }

    return { diagnostics, applied: diagnostics.every(d => d.severity !== "error"), timeMs: performance.now() - start };
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
