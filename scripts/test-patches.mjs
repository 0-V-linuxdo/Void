#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

import { countCaptureGroups } from "../src/utils/patches.ts";

const PLUGINS_DIR = "src/plugins";
const MAX_CAPTURE_WARN = 5;
const MATCH_LONG = 200;

const isCI = process.env.GITHUB_ACTIONS === "true";
let errors = 0;
let warnings = 0;

function annotate(level, file, line, message) {
    if (level === "error") errors++;
    else warnings++;
    if (isCI) {
        const safe = message.replaceAll("\n", "%0A");
        console.log(`::${level} file=${file},line=${line}::${safe}`);
    } else {
        console.log(`${level.toUpperCase()} ${file}:${line} ${message}`);
    }
}

function lintMatch(file, line, kind, value, replaceValue) {
    if (kind === "regex") {
        try { new RegExp(value); }
        catch (e) { annotate("error", file, line, `Invalid regex: ${e.message}`); return; }

        if (/(?<!\\)\.\+/.test(value)) annotate("error", file, line, "Unbounded .+ gap, use .{0,N}");
        if (/(?<!\\)\.\*/.test(value)) annotate("error", file, line, "Unbounded .* gap, use .{0,N}");

        const hasQuoted = /["'][^"']{2,}["']/.test(value);
        const hasLiteralRun = /[A-Za-z_$][A-Za-z0-9_$]{3,}/.test(value.replaceAll(/\\[A-Za-z]/g, ""));
        if (!hasQuoted && !hasLiteralRun && !/\\e\{/.test(value)) {
            annotate("warning", file, line, "No string literal anchor in match");
        }

        if (value.length > MATCH_LONG) annotate("warning", file, line, `Long regex (${value.length} chars), consider splitting`);

        const groups = countCaptureGroups(value);
        if (groups > MAX_CAPTURE_WARN) annotate("warning", file, line, `${groups} capture groups, prefer (?:...) for unused`);

        if (typeof replaceValue === "string") {
            const refs = [...replaceValue.matchAll(/\$(\d+)/g)].map(m => Number(m[1]));
            for (const r of refs) {
                if (r > groups) annotate("error", file, line, `$${r} referenced but only ${groups} capture groups`);
            }
        }
    }

    if (typeof replaceValue === "string" && replaceValue.includes("$self") && !/\$self[._]/.test(replaceValue)) {
        annotate("warning", file, line, "$self used without member access");
    }
}

function lineOf(sourceFile, node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
}

function extractMatchInfo(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        return { kind: "string", value: node.text };
    }
    if (ts.isRegularExpressionLiteral(node)) {
        const text = node.text;
        const lastSlash = text.lastIndexOf("/");
        return { kind: "regex", value: text.slice(1, lastSlash) };
    }
    return null;
}

function extractReplaceString(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    return null;
}

function inspectPatch(file, sourceFile, patchNode) {
    let findNode = null;
    let replacementNode = null;
    for (const prop of patchNode.properties) {
        if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
        if (prop.name.text === "find") findNode = prop.initializer;
        else if (prop.name.text === "replacement") replacementNode = prop.initializer;
    }

    if (!findNode) {
        annotate("error", file, lineOf(sourceFile, patchNode), "Patch missing find");
        return;
    }

    const finds = ts.isArrayLiteralExpression(findNode) ? findNode.elements : [findNode];
    for (const f of finds) {
        const info = extractMatchInfo(f);
        if (!info) {
            annotate("warning", file, lineOf(sourceFile, f), "find is not a string/regex literal, skipped");
            continue;
        }
        if (info.kind === "string" && info.value.length < 3) {
            annotate("warning", file, lineOf(sourceFile, f), `find string too short (${info.value.length} chars)`);
        }
    }

    if (!replacementNode) return;
    const replacements = ts.isArrayLiteralExpression(replacementNode) ? replacementNode.elements : [replacementNode];

    for (const rep of replacements) {
        if (!ts.isObjectLiteralExpression(rep)) continue;
        let matchNode = null;
        let replaceNode = null;
        for (const prop of rep.properties) {
            if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
            if (prop.name.text === "match") matchNode = prop.initializer;
            else if (prop.name.text === "replace") replaceNode = prop.initializer;
        }
        if (!matchNode) {
            annotate("error", file, lineOf(sourceFile, rep), "replacement missing match");
            continue;
        }
        const info = extractMatchInfo(matchNode);
        if (!info) continue;
        const replaceStr = replaceNode ? extractReplaceString(replaceNode) : undefined;
        lintMatch(file, lineOf(sourceFile, matchNode), info.kind, info.value, replaceStr);
    }
}

function walkPatches(file, sourceFile) {
    const visit = (node) => {
        if (ts.isObjectLiteralExpression(node)) {
            for (const prop of node.properties) {
                if (
                    ts.isPropertyAssignment(prop)
                    && ts.isIdentifier(prop.name)
                    && prop.name.text === "patches"
                    && ts.isArrayLiteralExpression(prop.initializer)
                ) {
                    for (const patch of prop.initializer.elements) {
                        if (ts.isObjectLiteralExpression(patch)) inspectPatch(file, sourceFile, patch);
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
}

function* pluginEntries(dir) {
    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (!statSync(path).isDirectory()) continue;
        for (const f of ["index.ts", "index.tsx"]) {
            const p = join(path, f);
            try { statSync(p); yield p; break; }
            catch { /* skip */ }
        }
    }
}

for (const file of pluginEntries(PLUGINS_DIR)) {
    const text = readFileSync(file, "utf8");
    if (!text.includes("patches:")) continue;
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    walkPatches(file, sourceFile);
}

console.log(`\n${errors} error(s), ${warnings} warning(s)`);
if (errors > 0) process.exit(1);
