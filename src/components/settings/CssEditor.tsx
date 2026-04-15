/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./CssEditor.css";

import { React, useCallback, useLayoutEffect, useRef } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";

const cl = classNameFactory("void-css-");

const TOKEN = /\/\*[\s\S]*?\*\/|@[\w-]+|"[^"]*"|'[^']*'|#[\da-fA-F]{3,8}|[\d.]+(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?|[\w-]+|[{}:;,()!]/g;

function esc(s: string): string {
    return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function span(cls: string, text: string): string {
    return `<span class="${cl(cls)}">${esc(text)}</span>`;
}

export function highlightCss(css: string): string {
    let inBlock = 0;
    let afterColon = false;
    let result = "";
    let lastEnd = 0;

    for (const m of css.matchAll(TOKEN)) {
        const idx = m.index ?? 0;
        if (idx > lastEnd) result += esc(css.slice(lastEnd, idx));
        lastEnd = idx + m[0].length;
        const t = m[0];

        if (t.startsWith("/*")) { result += span("com", t); afterColon = false; }
        else if (t.startsWith("@")) result += span("at", t);
        else if (t === "{") { inBlock++; afterColon = false; result += span("brace", t); }
        else if (t === "}") { inBlock = Math.max(0, inBlock - 1); afterColon = false; result += span("brace", t); }
        else if (t === ":") { afterColon = inBlock > 0; result += span("punct", t); }
        else if (t === ";" || t === ",") { afterColon = false; result += span("punct", t); }
        else if (t === "(" || t === ")" || t === "!") result += span("punct", t);
        else if (t.startsWith("\"") || t.startsWith("'")) result += span("str", t);
        else if (t.startsWith("#") || /^[\d.]/.test(t)) result += span("num", t);
        else if (afterColon) result += span("val", t);
        else if (inBlock > 0) result += span("prop", t);
        else result += span("sel", t);
    }

    if (lastEnd < css.length) result += esc(css.slice(lastEnd));
    return result;
}

export function formatCss(raw: string): string {
    let out = "";
    let indent = 0;
    const pad = () => "    ".repeat(indent);
    const tokens = raw.replaceAll(/\s+/g, " ").trim().split(/(?=[{}:;])|(?<=[{}:;])/g);

    for (const t of tokens) {
        const s = t.trim();
        if (!s) continue;
        if (s === "{") { out += " {\n"; indent++; }
        else if (s === "}") { indent = Math.max(0, indent - 1); out += pad() + "}\n\n"; }
        else if (s === ";") out += ";\n";
        else if (s === ":") out += ": ";
        else if (indent > 0) out += pad() + s;
        else out += s;
    }

    return out.replaceAll(/\n{3,}/g, "\n\n").trim() + "\n";
}

export interface CssEditorProps {
    value: string;
    onChange(value: string): void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

export function CssEditor({ value, onChange, disabled, className, placeholder }: CssEditorProps) {
    const highlightRef = useRef<HTMLPreElement>(null);
    const valueRef = useRef(value);
    valueRef.current = value;

    useLayoutEffect(() => {
        if (highlightRef.current) highlightRef.current.innerHTML = highlightCss(value) + "\n";
    }, [value]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = e.clipboardData.getData("text/plain");
        if (!pasted.includes("{") || pasted.includes("\n")) return;
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const formatted = formatCss(pasted);
        const next = valueRef.current.slice(0, start) + formatted + valueRef.current.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
            const pos = start + formatted.length;
            ta.selectionStart = pos;
            ta.selectionEnd = pos;
        });
    }, [onChange]);

    return (
        <div className={className ? `${cl("wrap")} ${className}` : cl("wrap")}>
            <pre ref={highlightRef} className={cl("highlight")} aria-hidden="true" />
            <textarea
                className={cl("input")}
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                onPaste={handlePaste}
                disabled={disabled}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
            />
        </div>
    );
}
