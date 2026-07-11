/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ChunkMap, ModuleEntry } from "./chunks";
import type { FinderSpec } from "./extract";
import type { Diagnostic } from "./fmt";

export interface FinderReportEntry {
    finder: FinderSpec;
    matchedModules: number[];
    diagnostics: Diagnostic[];
    ok: boolean;
}

const MAX_REPORT_IDS = 8;

const HELP: Partial<Record<FinderSpec["kind"], string>> = {
    byProps: "No module exports every prop. Check each literal in chunks or drop renamed ones.",
    exportedComponent: "No module exports every prop. Check each literal in chunks or drop renamed ones.",
    byStoreName: "No `use<Name>Store` found. Store got renamed or split.",
    byEventName: "No `logEventGlobal` call with this event name. Event got renamed or inlined.",
    byDisplayName: "No React component has this displayName. Production usually strips it. Use byCode or byProps.",
    byCode: "No module contains every code pattern. Widen with `\\i` or `.{0,N}` gaps.",
    componentByCode: "No module contains every code pattern. Widen with `\\i` or `.{0,N}` gaps.",
    cssClasses: "No module has all class names (usually verbatim in CSS-in-JS).",
    mapMangled: "Locator code missing. Mangled-property maps break easy, add another anchor.",
};

export function testFinder(finder: FinderSpec, map: ChunkMap): FinderReportEntry {
    const diagnostics: Diagnostic[] = [];

    if (finder.args.every(a => a.kind === "unknown" || a.kind === "identifier")) {
        return { finder, matchedModules: [], diagnostics, ok: true };
    }

    const matched: number[] = [];
    for (const mod of map.modules.values()) {
        if (moduleMatchesFinder(finder, mod)) matched.push(mod.id);
    }

    if (matched.length === 0) {
        diagnostics.push({
            severity: "error",
            code: "finder::no-match",
            title: `${finder.call}(${finder.args.map(a => a.raw).join(", ")}) matched 0 modules`,
            primary: { span: finder.span, label: "resolves to nothing at runtime" },
            help: HELP[finder.kind] ?? "Finder did not match, inspect chunks for changes.",
        });
        return { finder, matchedModules: matched, diagnostics, ok: false };
    }

    const requiresUnique = finder.kind === "byStoreName" || finder.kind === "byDisplayName";
    if (requiresUnique && matched.length > 1) {
        diagnostics.push({
            severity: "warn",
            code: "finder::ambiguous",
            title: `${finder.call} matched ${matched.length} modules, expected 1`,
            primary: { span: finder.span, label: `${matched.length} candidates` },
            notes: [`ids: ${matched.slice(0, MAX_REPORT_IDS).join(", ")}${matched.length > MAX_REPORT_IDS ? "…" : ""}`],
            help: "Store and displayName finders must resolve to one module. Narrow the lookup.",
        });
    }

    return { finder, matchedModules: matched, diagnostics, ok: diagnostics.every(d => d.severity !== "error") };
}

function moduleMatchesFinder(finder: FinderSpec, mod: ModuleEntry): boolean {
    switch (finder.kind) {
        case "byProps":
        case "exportedComponent":
            return finder.args.every(a => {
                if (a.kind === "identifier" || a.kind === "unknown") return true;
                if (a.kind !== "string" || !a.value) return false;
                const n = a.value;
                return mod.factory.includes(`"${n}",0,`)
                    || mod.factory.includes(`"${n}",()=>`)
                    || mod.factory.includes(`'${n}',0,`)
                    || mod.factory.includes(`'${n}',()=>`)
                    || mod.factory.includes(`.${n}=`)
                    || mod.factory.includes(`${n}:function(){return `);
            });
        case "byDisplayName":
            return finder.args.some(a => a.kind === "string" && a.value && mod.factory.includes(`displayName:"${a.value}"`));
        case "byStoreName": {
            const a = finder.args[0];
            if (a?.kind !== "string" || !a.value) return false;
            const canonical = a.value.startsWith("use") ? a.value : a.value.endsWith("Store") ? `use${a.value}` : `use${a.value}Store`;
            return mod.factory.includes(`"${canonical}"`) || mod.factory.includes(canonical + "=");
        }
        case "byEventName": {
            const a = finder.args[0];
            return a?.kind === "string" && !!a.value && mod.factory.includes(`logEventGlobal)("${a.value}"`);
        }
        case "byCode":
        case "componentByCode":
            return finder.args.every(a => {
                if (a.kind === "identifier" || a.kind === "unknown") return true;
                if (a.kind === "string" && a.value) return mod.factory.includes(a.value);
                if (a.kind === "regex" && a.regex) { a.regex.lastIndex = 0; return a.regex.test(mod.factory); }
                return false;
            });
        case "cssClasses":
            return finder.args.every(a => {
                if (a.kind === "identifier" || a.kind === "unknown") return true;
                return a.kind === "string" && !!a.value && mod.factory.includes(a.value);
            });
        case "mapMangled": {
            const locator = finder.args[0];
            if (locator?.kind === "string" && locator.value) return mod.factory.includes(locator.value);
            if (locator?.kind === "regex" && locator.regex) { locator.regex.lastIndex = 0; return locator.regex.test(mod.factory); }
            return false;
        }
        default:
            return false;
    }
}

export function summariseFinders(entries: FinderReportEntry[]): { byKind: Record<string, { total: number; failed: number }> } {
    const byKind: Record<string, { total: number; failed: number }> = {};
    for (const e of entries) {
        const k = e.finder.kind;
        byKind[k] ??= { total: 0, failed: 0 };
        byKind[k].total++;
        if (!e.ok) byKind[k].failed++;
    }
    return { byKind };
}
