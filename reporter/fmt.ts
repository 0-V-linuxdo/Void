/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const ansi = {
    red: (s: string) => `\x1b[31m${s}\x1b[0m`,
    green: (s: string) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
    blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
    magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
    cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
    dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
    bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
    italic: (s: string) => `\x1b[3m${s}\x1b[0m`,
};

export type Severity = "error" | "warn" | "info";

export interface SourceSpan {
    file: string;
    line: number;
    col: number;
    length?: number;
}

export interface Diagnostic {
    severity: Severity;
    code: string;
    title: string;
    primary: { span: SourceSpan; label?: string };
    secondary?: Array<{ span: SourceSpan; label?: string; context?: string[] }>;
    help?: string;
    notes?: string[];
}

const SEV_STYLE: Record<Severity, (s: string) => string> = {
    error: ansi.red,
    warn: ansi.yellow,
    info: ansi.cyan,
};

function sliceLines(text: string, line: number, span = 2): Array<{ n: number; text: string }> {
    const lines = text.split("\n");
    const out: Array<{ n: number; text: string }> = [];
    const lo = Math.max(1, line - span);
    const hi = Math.min(lines.length, line + span);
    for (let i = lo; i <= hi; i++) out.push({ n: i, text: lines[i - 1] ?? "" });
    return out;
}

export function renderDiagnostic(d: Diagnostic, fileCache: Map<string, string>): string {
    const sev = SEV_STYLE[d.severity];
    const head = `${sev(d.severity)}${ansi.dim("[")}${d.code}${ansi.dim("]")}`;
    const out: string[] = [];
    out.push(`\n${head} ${ansi.bold(d.title)}`);
    out.push(...renderSpan(d.primary.span, d.primary.label, fileCache, sev));
    for (const s of d.secondary ?? []) out.push(...renderSpan(s.span, s.label, fileCache, ansi.cyan, s.context));
    if (d.help) out.push(`  ${ansi.cyan("help:")} ${d.help}`);
    for (const n of d.notes ?? []) out.push(`  ${ansi.dim("note:")} ${ansi.dim(n)}`);
    return out.join("\n");
}

const MINIFIED_LINE_THRESHOLD = 500;

function renderSpan(span: SourceSpan, label: string | undefined, fileCache: Map<string, string>, color: (s: string) => string, contextLines?: string[]): string[] {
    const out: string[] = [];
    const text = contextLines ? contextLines.join("\n") : fileCache.get(span.file) ?? "";
    const rel = span.file.replace(/\\/g, "/");
    out.push(`  ${ansi.dim("┌─[")}${ansi.bold(rel)}${ansi.dim(":")}${span.line}${ansi.dim(":")}${span.col}${ansi.dim("]")}`);
    const lines = sliceLines(text, span.line, 1);
    const hitLine = lines.find(l => l.n === span.line);

    if (hitLine && hitLine.text.length > MINIFIED_LINE_THRESHOLD) {
        const WINDOW = 160;
        const col = Math.max(1, span.col);
        const lo = Math.max(0, col - 1 - Math.floor(WINDOW / 2));
        const hi = Math.min(hitLine.text.length, lo + WINDOW);
        const slice = hitLine.text.slice(lo, hi);
        const caretOffsetInSlice = Math.max(0, col - 1 - lo);
        const gutterW = String(span.line).length;
        out.push(`  ${ansi.dim(String(span.line).padStart(gutterW) + " │")} ${lo > 0 ? ansi.dim("…") : ""}${slice}${hi < hitLine.text.length ? ansi.dim("…") : ""}`);
        if (label) {
            const caretPad = " ".repeat(gutterW + 3 + (lo > 0 ? 1 : 0) + caretOffsetInSlice);
            const caretLen = Math.max(1, Math.min(span.length ?? 1, Math.max(1, hi - (lo + caretOffsetInSlice))));
            out.push(`  ${ansi.dim(" ".repeat(gutterW) + " ╵")} ${caretPad}${color("^".repeat(Math.min(caretLen, 40)))} ${color(label)}`);
        }
        return out;
    }

    const gutterW = String(lines.at(-1)?.n ?? span.line).length;
    for (const l of lines) {
        const gutter = String(l.n).padStart(gutterW, " ");
        const isHit = l.n === span.line;
        const rendered = isHit ? l.text : ansi.dim(l.text);
        out.push(`  ${ansi.dim(gutter + " │")} ${rendered}`);
        if (isHit && label) {
            const caretPad = " ".repeat(gutterW + 3 + Math.max(0, span.col - 1));
            const caretLen = Math.max(1, Math.min(span.length ?? 1, l.text.length - span.col + 1));
            out.push(`  ${ansi.dim(" ".repeat(gutterW) + " ╵")} ${caretPad}${color("^".repeat(caretLen))} ${color(label)}`);
        }
    }
    return out;
}

export function counter(label: string, pass: number, fail: number, extra?: string): string {
    const parts = [`${ansi.green(`${pass} passed`)}`];
    parts.push(fail ? ansi.red(`${fail} failed`) : ansi.dim("0 failed"));
    if (extra) parts.push(extra);
    return `${label}: ${parts.join(", ")}`;
}
