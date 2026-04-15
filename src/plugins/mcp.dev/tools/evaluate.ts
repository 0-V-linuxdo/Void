/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EVAL } from "./constants";
import type { EvalArgs, EvalError, EvalResult } from "./types";
import { formatError, isThenable, serialize } from "./utils";

const STATEMENT_RE = /^(return|throw|break|continue|if|for|while|switch|try|class|function(?!\s*\()|const|let|var)\b/;
const NON_RETURNABLE_RE = STATEMENT_RE;
const IIFE_TRIGGER_RE = /^(?:return\s|let\s|const\s|var\s|class\s)/;

function stripTrailingComment(line: string): string {
    let inStr: string | null = null;
    let commentStart = -1;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === "\\" && inStr) { i++; continue; }
        if (inStr) { if (ch === inStr) inStr = null; continue; }
        if (ch === "\"" || ch === "'" || ch === "`") { inStr = ch; continue; }
        if (ch === "/" && line[i + 1] === "/") { commentStart = i; break; }
        if (ch === "/" && line[i + 1] === "*") {
            const end = line.indexOf("*/", i + 2);
            if (end !== -1 && end === line.length - 2) { commentStart = i; break; }
            if (end !== -1) { i = end + 1; continue; }
        }
    }
    return (commentStart >= 0 ? line.slice(0, commentStart) : line).trim();
}

function findLastTopLevelSemicolon(src: string): number {
    let depth = 0;
    for (let i = src.length - 1; i >= 0; i--) {
        const ch = src[i];
        if (ch === "\"" || ch === "'" || ch === "`") {
            for (i--; i >= 0; i--) {
                if (src[i] === ch && src[i - 1] !== "\\") break;
            }
            continue;
        }
        if (ch === ")") depth++;
        else if (ch === "(") depth--;
        else if (ch === ";" && depth <= 0) return i;
    }
    return -1;
}

function autoReturn(code: string): string {
    const trimmedCode = code.replace(/\s+$/, "");
    const lastNewline = trimmedCode.lastIndexOf("\n");
    const lastLine = lastNewline === -1 ? trimmedCode.trim() : trimmedCode.slice(lastNewline + 1).trim();

    if (!lastLine || /^[)\]},;]+$/.test(lastLine) || lastLine.startsWith("//") || lastLine.startsWith("/*")) return code;

    const expr = stripTrailingComment(lastLine).replace(/;$/, "").trim();
    if (!expr) return code;

    if (STATEMENT_RE.test(expr)) {
        const lastSemi = findLastTopLevelSemicolon(trimmedCode);
        if (lastSemi > -1 && lastSemi < trimmedCode.length - 1) {
            const afterSemi = stripTrailingComment(trimmedCode.slice(lastSemi + 1)).trim();
            if (afterSemi && !NON_RETURNABLE_RE.test(afterSemi)) {
                return `${trimmedCode.slice(0, lastSemi + 1)}\nreturn ${afterSemi};`;
            }
        }
        return trimmedCode;
    }

    if (lastNewline === -1) return `return ${expr};`;
    return `${trimmedCode.slice(0, lastNewline)}\nreturn ${expr};`;
}

function needsIIFE(code: string): boolean {
    return IIFE_TRIGGER_RE.test(code.trimStart());
}

function wrapIIFE(code: string): string {
    return `(()=>{${autoReturn(code)}})()`;
}

function tryEval(code: string): EvalResult | EvalError {
    try { return { ok: true, value: (0, eval)(code) }; }
    catch (err: unknown) { return { ok: false, error: err }; }
}

function evalAsync(code: string): Promise<unknown> {
    return (0, eval)(`(async()=>{${autoReturn(code)}})()`);
}

function isAsyncSyntaxError(err: unknown, code: string): boolean {
    if (!(err instanceof SyntaxError)) return false;
    return err.message.includes("await") || code.includes("await ") || code.includes("import(");
}

export function handleEval(args: EvalArgs): unknown {
    const { code } = args;
    if (!code) return { error: "Provide code to evaluate." };
    if (code.length > EVAL.MAX_CODE_LENGTH) return { error: `Code too long: ${code.length} chars (max ${EVAL.MAX_CODE_LENGTH}). Reduce code or split into multiple calls.` };

    let evalCode = needsIIFE(code) ? wrapIIFE(code) : code;
    let r = tryEval(evalCode);

    if (!r.ok && isAsyncSyntaxError(r.error, code)) {
        try {
            return evalAsync(code).then(
                val => serialize(val, EVAL.SERIALIZE_DEPTH),
                (err: unknown) => ({ error: formatError(err) }),
            );
        } catch (asyncErr: unknown) {
            return { error: formatError(asyncErr) };
        }
    }

    if (!r.ok && r.error instanceof SyntaxError && evalCode === code) {
        evalCode = wrapIIFE(code);
        r = tryEval(evalCode);
    }

    if (!r.ok) return { error: formatError(r.error) };

    if (isThenable(r.value)) {
        return r.value.then(
            val => serialize(val, EVAL.SERIALIZE_DEPTH),
            (err: unknown) => ({ error: formatError(err) }),
        );
    }
    return serialize(r.value, EVAL.SERIALIZE_DEPTH);
}
