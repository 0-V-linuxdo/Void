/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const RE_START_PREV = /[=:,({[!&|?;+\-*/%<>^~]/;
const RE_FLAGS = /[gimsuy]/;
const RE_START_KEYWORDS = /\b(?:return|typeof|in|of|delete|new|throw|void|instanceof|yield|await)$/;

export function positionOf(src: string, off: number): { line: number; col: number } {
    let line = 1;
    let lineStart = 0;
    for (let i = 0; i < off && i < src.length; i++) {
        if (src[i] === "\n") { line++; lineStart = i + 1; }
    }
    return { line, col: off - lineStart + 1 };
}

function skipString(src: string, start: number): number {
    const quote = src[start];
    let i = start + 1;
    while (i < src.length) {
        const c = src[i];
        if (c === "\\") { i += 2; continue; }
        if (quote === "`" && c === "$" && src[i + 1] === "{") {
            i = skipBalanced(src, i + 1, "{", "}");
            continue;
        }
        if (c === quote) return i + 1;
        i++;
    }
    return src.length;
}

function skipRegex(src: string, start: number): number {
    let i = start + 1;
    let inClass = false;
    while (i < src.length) {
        const c = src[i];
        if (c === "\\") { i += 2; continue; }
        if (c === "[") inClass = true;
        else if (c === "]") inClass = false;
        else if (c === "/" && !inClass) { i++; break; }
        else if (c === "\n") return i;
        i++;
    }
    while (i < src.length && RE_FLAGS.test(src[i])) i++;
    return i;
}

function looksLikeRegex(src: string, i: number): boolean {
    let j = i - 1;
    while (j >= 0 && /\s/.test(src[j])) j--;
    const prev = j >= 0 ? src[j] : "";
    if (!prev || RE_START_PREV.test(prev)) return true;
    return RE_START_KEYWORDS.test(src.slice(Math.max(0, j - 8), j + 1));
}

export function skipTrivia(src: string, i: number): number {
    const c = src[i];
    if (c === "\"" || c === "'" || c === "`") return skipString(src, i);
    if (c === "/") {
        const n = src[i + 1];
        if (n === "/") {
            let j = i + 2;
            while (j < src.length && src[j] !== "\n") j++;
            return j;
        }
        if (n === "*") {
            let j = i + 2;
            while (j < src.length - 1 && !(src[j] === "*" && src[j + 1] === "/")) j++;
            return j + 2;
        }
        if (looksLikeRegex(src, i)) return skipRegex(src, i);
    }
    return i;
}

export function skipBalanced(src: string, start: number, open: string, close: string): number {
    let depth = 0;
    let i = start;
    while (i < src.length) {
        const before = i;
        const after = skipTrivia(src, i);
        if (after !== before) { i = after; continue; }
        const c = src[i];
        if (c === open) depth++;
        else if (c === close) {
            depth--;
            if (depth === 0) return i + 1;
        }
        i++;
    }
    return src.length;
}

export function skipToTopLevelComma(src: string, start: number, end: number): number {
    let i = start;
    let depth = 0;
    while (i < end) {
        const before = i;
        const after = skipTrivia(src, i);
        if (after !== before) { i = after; continue; }
        const c = src[i];
        if (c === "(" || c === "{" || c === "[") depth++;
        else if (c === ")" || c === "}" || c === "]") {
            depth--;
            if (depth < 0) return i;
        } else if (c === "," && depth === 0) return i;
        i++;
    }
    return end;
}

export function splitArgs(argsSrc: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let last = 0;
    let i = 0;
    while (i < argsSrc.length) {
        const before = i;
        const after = skipTrivia(argsSrc, i);
        if (after !== before) { i = after; continue; }
        const c = argsSrc[i];
        if (c === "(" || c === "[" || c === "{") depth++;
        else if (c === ")" || c === "]" || c === "}") depth--;
        else if (c === "," && depth === 0) {
            out.push(argsSrc.slice(last, i).trim());
            last = i + 1;
        }
        i++;
    }
    const tail = argsSrc.slice(last).trim();
    if (tail) out.push(tail);
    return out;
}

export interface LiteralArg {
    kind: "string" | "regex" | "array" | "identifier" | "unknown";
    value?: string;
    regex?: { pattern: string; flags: string };
    array?: LiteralArg[];
    raw: string;
}

export function parseArg(src: string): LiteralArg {
    const s = src.trim();
    if (!s) return { kind: "unknown", raw: src };
    const c = s[0];
    if (c === "\"" || c === "'" || c === "`") {
        const end = skipString(s, 0);
        const body = s.slice(1, end - 1);
        if (c === "`" && hasTemplateInterpolation(body)) return { kind: "identifier", value: s, raw: s };
        return { kind: "string", value: unescapeString(body), raw: s };
    }
    if (c === "/") {
        const end = skipRegex(s, 0);
        const body = s.slice(0, end);
        const lastSlash = body.lastIndexOf("/");
        return { kind: "regex", regex: { pattern: body.slice(1, lastSlash), flags: body.slice(lastSlash + 1) }, raw: s };
    }
    if (c === "[") {
        const end = skipBalanced(s, 0, "[", "]");
        return { kind: "array", array: splitArgs(s.slice(1, end - 1)).map(parseArg), raw: s };
    }
    if (/^[A-Za-z_$]/.test(c)) return { kind: "identifier", value: s, raw: s };
    return { kind: "unknown", raw: s };
}

function hasTemplateInterpolation(body: string): boolean {
    for (let i = 0; i < body.length - 1; i++) {
        if (body[i] === "\\") { i++; continue; }
        if (body[i] === "$" && body[i + 1] === "{") return true;
    }
    return false;
}

const STR_ESCAPES: Record<string, string> = { "\\": "\\", "\"": "\"", "'": "'", "`": "`", n: "\n", r: "\r", t: "\t", 0: "\0", b: "\b", f: "\f", v: "\v" };

function unescapeString(body: string): string {
    return body.replace(/\\([\\"'`nrt0bfv]|x[0-9a-fA-F]{2}|u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4})/g, (_, esc) => {
        if (esc[0] === "u") {
            if (esc[1] === "{") return String.fromCodePoint(parseInt(esc.slice(2, -1), 16));
            return String.fromCodePoint(parseInt(esc.slice(1), 16));
        }
        if (esc[0] === "x") return String.fromCodePoint(parseInt(esc.slice(1), 16));
        return STR_ESCAPES[esc] ?? esc;
    });
}

export function walkObjectEntries(body: string): Array<{ key: string; value: string; valueOffset: number }> {
    const out: Array<{ key: string; value: string; valueOffset: number }> = [];
    let i = 0;
    while (i < body.length) {
        const before = i;
        const after = skipTrivia(body, i);
        if (after !== before) { i = after; continue; }
        if (/\s/.test(body[i]) || body[i] === ",") { i++; continue; }

        let keyEnd = i;
        const kc = body[i];
        let key: string;
        if (kc === "\"" || kc === "'") {
            keyEnd = skipString(body, i);
            key = body.slice(i + 1, keyEnd - 1);
        } else if (/[A-Za-z_$]/.test(kc)) {
            while (keyEnd < body.length && /[A-Za-z0-9_$]/.test(body[keyEnd])) keyEnd++;
            key = body.slice(i, keyEnd);
        } else {
            i++;
            continue;
        }

        let j = keyEnd;
        while (j < body.length && /\s/.test(body[j])) j++;
        if (body[j] !== ":") { i = j + 1; continue; }
        j++;
        while (j < body.length && /\s/.test(body[j])) j++;

        const valueStart = j;
        const vc = body[j];
        let valueEnd: number;
        if (vc === "\"" || vc === "'" || vc === "`") valueEnd = skipString(body, j);
        else if (vc === "/" && looksLikeRegex(body, j)) valueEnd = skipRegex(body, j);
        else if (vc === "{") valueEnd = skipBalanced(body, j, "{", "}");
        else if (vc === "[") valueEnd = skipBalanced(body, j, "[", "]");
        else if (vc === "(") valueEnd = skipBalanced(body, j, "(", ")");
        else valueEnd = skipToTopLevelComma(body, j, body.length);

        out.push({ key, value: body.slice(valueStart, valueEnd), valueOffset: valueStart });
        i = valueEnd;
    }
    return out;
}
