/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EVAL } from "./constants";
import type { EvalArgs, EvalError, EvalResult } from "./types";
import { formatError, isThenable, serialize } from "./utils";

function evalAsync(code: string): Promise<unknown> {
    return (0, eval)(`(async()=>{${autoReturn(code)}})()`);
}

function needsIIFE(code: string): boolean {
    const trimmed = code.trimStart();
    return /^return\s/.test(trimmed) || /^(let|const|var|class)\s/.test(trimmed);
}

const STATEMENT_RE = /^(return|throw|break|continue|if|for|while|switch|try|class|function|const|let|var|await)\b/;
const NON_RETURNABLE_RE = /^(return|throw|break|continue|if|for|while|switch|try|class|function|const|let|var)\b/;

function stripTrailingComment(line: string): string {
    let inStr: string | null = null;
    let commentStart = -1;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === "\\" && inStr) { i++; continue; }
        if (inStr) { if (ch === inStr) inStr = null; continue; }
        if (ch === '"' || ch === "'" || ch === "`") { inStr = ch; continue; }
        if (ch === "/" && line[i + 1] === "/") { commentStart = i; break; }
        if (ch === "/" && line[i + 1] === "*") {
            const end = line.indexOf("*/", i + 2);
            if (end !== -1 && end === line.length - 2) { commentStart = i; break; }
            if (end !== -1) { i = end + 1; continue; }
        }
    }
    return (commentStart >= 0 ? line.slice(0, commentStart) : line).trim();
}

function autoReturn(code: string): string {
    const trimmedCode = code.replace(/\s+$/, "");
    const lastNewline = trimmedCode.lastIndexOf("\n");
    const lastLine = lastNewline === -1 ? trimmedCode.trim() : trimmedCode.slice(lastNewline + 1).trim();

    if (!lastLine || /^[)\]},;]+$/.test(lastLine)) return code;

    if (/^\/\//.test(lastLine) || /^\/\*/.test(lastLine)) return code;

    const expr = stripTrailingComment(lastLine).replace(/;$/, "").trim();
    if (!expr) return code;

    if (STATEMENT_RE.test(expr)) {
        let lastSemi = trimmedCode.length - 1;
        let parenDepth = 0;
        for (let i = trimmedCode.length - 1; i >= 0; i--) {
            const ch = trimmedCode[i];
            if (ch === '"' || ch === "'" || ch === "`") {
                for (i--; i >= 0; i--) {
                    if (trimmedCode[i] === ch && trimmedCode[i - 1] !== "\\") break;
                }
                continue;
            }
            if (ch === ")") parenDepth++;
            else if (ch === "(") parenDepth--;
            else if (ch === ";" && parenDepth <= 0) { lastSemi = i; break; }
        }
        if (lastSemi < trimmedCode.length - 1 && trimmedCode[lastSemi] === ";") {
            const afterSemi = stripTrailingComment(trimmedCode.slice(lastSemi + 1)).trim();
            if (afterSemi && !NON_RETURNABLE_RE.test(afterSemi)) {
                return `${trimmedCode.slice(0, lastSemi + 1)}\nreturn ${afterSemi};`;
            }
        }
        return trimmedCode;
    }

    if (lastNewline === -1) {
        return `return ${expr};`;
    }
    return `${trimmedCode.slice(0, lastNewline)}\nreturn ${expr};`;
}

function wrapIIFE(code: string): string {
    return `(()=>{${autoReturn(code)}})()`;
}

function tryEval(code: string): EvalResult | EvalError {
    try {
        return { ok: true, value: (0, eval)(code) };
    } catch (err: unknown) {
        return { ok: false, error: err };
    }
}

export function handleEval(args: EvalArgs): unknown {
    const { code } = args;
    if (!code) return { error: "Provide code to evaluate." };
    if (code.length > EVAL.MAX_CODE_LENGTH) return { error: `Code too long: ${code.length} chars (max ${EVAL.MAX_CODE_LENGTH}). Reduce code or split into multiple calls.` };

    let evalCode = needsIIFE(code) ? wrapIIFE(code) : code;

    let r = tryEval(evalCode);

    if (!r.ok && r.error instanceof SyntaxError) {
        if (r.error.message.includes("await") || code.includes("await ") || code.includes("import(")) {
            try {
                return evalAsync(code).then(
                    val => serialize(val, EVAL.SERIALIZE_DEPTH),
                    (err: unknown) => ({ error: formatError(err) }),
                );
            } catch (asyncErr: unknown) {
                return { error: formatError(asyncErr) };
            }
        }
        if (evalCode === code) {
            evalCode = wrapIIFE(code);
            r = tryEval(evalCode);
        }
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
