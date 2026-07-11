/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { argv, cwd, exit } from "node:process";

import ts from "typescript";

const DEFAULT_ROOTS = ["src", "reporter", "browser", "build.ts"];
const SOURCE_RE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", ".void-cache"]);
const KEEP_RE = /SPDX-License-Identifier|oxlint-disable|eslint-disable|@ts-ignore|@ts-expect-error|@ts-nocheck|prettier-ignore|stylelint-disable|webpackChunkName|@preserve|@__PURE__/;

function scriptKind(file) {
    if (file.endsWith(".tsx")) return ts.ScriptKind.TSX;
    if (file.endsWith(".jsx")) return ts.ScriptKind.JSX;
    if (/\.(js|mjs|cjs)$/.test(file)) return ts.ScriptKind.JS;
    return ts.ScriptKind.TS;
}

function collectComments(text, file) {
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind(file));
    const byPos = new Map();
    const record = ranges => {
        if (!ranges) return;
        for (const r of ranges) if (!byPos.has(r.pos)) byPos.set(r.pos, r);
    };
    const visit = node => {
        record(ts.getLeadingCommentRanges(text, node.getFullStart()));
        record(ts.getTrailingCommentRanges(text, node.getEnd()));
        for (const child of node.getChildren(sf)) visit(child);
    };
    visit(sf);
    return [...byPos.values()].sort((a, b) => a.pos - b.pos);
}

function stripText(text, file) {
    const removable = collectComments(text, file).filter(c => !KEEP_RE.test(text.slice(c.pos, c.end)));
    let out = text;
    for (let i = removable.length - 1; i >= 0; i--) {
        const { pos, end } = removable[i];
        const lineStart = out.lastIndexOf("\n", pos - 1) + 1;
        let lineEnd = out.indexOf("\n", end);
        if (lineEnd === -1) lineEnd = out.length;
        const beforeBlank = out.slice(lineStart, pos).trim() === "";
        const afterBlank = out.slice(end, lineEnd).trim() === "";
        if (beforeBlank && afterBlank) {
            out = out.slice(0, lineStart) + out.slice(lineEnd < out.length ? lineEnd + 1 : lineEnd);
        } else if (beforeBlank) {
            let e = end;
            while (out[e] === " " || out[e] === "\t") e++;
            out = out.slice(0, pos) + out.slice(e);
        } else {
            let s = pos;
            while (s > 0 && (out[s - 1] === " " || out[s - 1] === "\t")) s--;
            out = out.slice(0, s) + out.slice(end);
        }
    }
    return { out: out.replace(/\n{3,}/g, "\n\n"), count: removable.length };
}

function walk(path, acc) {
    let info;
    try { info = statSync(path); } catch { return acc; }
    if (info.isDirectory()) {
        for (const entry of readdirSync(path)) {
            if (SKIP_DIRS.has(entry)) continue;
            walk(join(path, entry), acc);
        }
    } else if (SOURCE_RE.test(path)) {
        acc.push(path);
    }
    return acc;
}

const rawArgs = argv.slice(2);
const check = rawArgs.includes("--check") || rawArgs.includes("--dry");
const roots = rawArgs.filter(a => !a.startsWith("--"));
const targets = (roots.length ? roots : DEFAULT_ROOTS).flatMap(r => walk(resolve(cwd(), r), []));

let changed = 0;
let total = 0;
const offenders = [];
for (const file of targets) {
    const text = readFileSync(file, "utf8");
    const { out, count } = stripText(text, file);
    if (count === 0 || out === text) continue;
    changed++;
    total += count;
    offenders.push(`${file.replace(resolve(cwd()) + "\\", "").replace(resolve(cwd()) + "/", "")}: ${count}`);
    if (!check) writeFileSync(file, out);
}

if (check) {
    if (changed) {
        console.log(`strip-comments --check: ${total} comment(s) in ${changed} file(s):`);
        for (const o of offenders) console.log(`  ${o}`);
        console.log("run `bun run scripts/strip-comments.mjs` to remove them");
        exit(1);
    }
    console.log(`strip-comments --check: clean (${targets.length} files)`);
    exit(0);
}

console.log(changed ? `stripped ${total} comment(s) from ${changed} file(s):` : `nothing to strip (${targets.length} files clean)`);
for (const o of offenders) console.log(`  ${o}`);
