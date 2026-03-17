/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./CustomCSSTab.css";

import { getSettingsPluginData, updateSettingsPluginData } from "@api/Settings";
import { Flex, Paragraph, Switch, Text } from "@components";
import { React, useCallback, useEffect, useRef, useState } from "@turbopack/common/react";
import { classNameFactory, disableStyle, enableStyle, registerStyle } from "@utils/css";

const cl = classNameFactory("void-css-");
const STYLE_ID = "void-custom-css";

export function setCustomCSSEnabled(enabled: boolean) {
    updateSettingsPluginData({ customCSSEnabled: enabled });
    if (enabled) {
        const css = getSettingsPluginData().customCSS;
        if (typeof css === "string" && css) {
            registerStyle(STYLE_ID, css);
            enableStyle(STYLE_ID);
        }
    } else {
        disableStyle(STYLE_ID);
    }
}

export function loadSavedCSS(): string {
    const s = getSettingsPluginData();
    const saved = s.customCSS;
    if (typeof saved === "string" && saved && s.customCSSEnabled !== false) {
        registerStyle(STYLE_ID, saved);
        return saved;
    }
    return typeof saved === "string" ? saved : "";
}

function formatCSS(raw: string): string {
    let out = "";
    let indent = 0;
    const pad = () => "    ".repeat(indent);
    const tokens = raw.replace(/\s+/g, " ").trim().split(/(?=[{}:;])|(?<=[{}:;])/g);

    for (const t of tokens) {
        const s = t.trim();
        if (!s) continue;
        if (s === "{") {
            out += " {\n";
            indent++;
        } else if (s === "}") {
            indent = Math.max(0, indent - 1);
            out += pad() + "}\n\n";
        } else if (s === ";") {
            out += ";\n";
        } else if (s === ":") {
            out += ": ";
        } else if (indent > 0) {
            out += pad() + s;
        } else {
            out += s;
        }
    }

    return out.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

const TOKEN = /\/\*[\s\S]*?\*\/|@[\w-]+|"[^"]*"|'[^']*'|#[\da-fA-F]{3,8}|[\d.]+(?:px|em|rem|%|vh|vw|s|ms|deg|fr|ch)?|[\w-]+|[{}:;,()!]/g;

function highlight(css: string): string {
    let inBlock = 0;
    let afterColon = false;
    let result = "";
    let lastEnd = 0;

    for (const m of css.matchAll(TOKEN)) {
        if (m.index! > lastEnd) result += esc(css.slice(lastEnd, m.index));
        lastEnd = m.index! + m[0].length;
        const t = m[0];

        if (t.startsWith("/*")) {
            result += span("com", t);
            afterColon = false;
        } else if (t.startsWith("@")) {
            result += span("at", t);
        } else if (t === "{") {
            inBlock++;
            afterColon = false;
            result += span("brace", t);
        } else if (t === "}") {
            inBlock = Math.max(0, inBlock - 1);
            afterColon = false;
            result += span("brace", t);
        } else if (t === ":") {
            afterColon = inBlock > 0;
            result += span("punct", t);
        } else if (t === ";" || t === ",") {
            afterColon = false;
            result += span("punct", t);
        } else if (t === "(" || t === ")" || t === "!") {
            result += span("punct", t);
        } else if (t.startsWith('"') || t.startsWith("'")) {
            result += span("str", t);
        } else if (t.startsWith("#") || /^[\d.]/.test(t)) {
            result += span("num", t);
        } else if (afterColon) {
            result += span("val", t);
        } else if (inBlock > 0) {
            result += span("prop", t);
        } else {
            result += span("sel", t);
        }
    }

    if (lastEnd < css.length) result += esc(css.slice(lastEnd));
    return result;
}

function span(cls: string, text: string): string {
    return `<span class="${cl(cls)}">${esc(text)}</span>`;
}

function esc(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export default function CustomCSSTab() {
    const highlightRef = useRef<HTMLPreElement>(null);
    const [enabled, setEnabled] = useState(() => getSettingsPluginData().customCSSEnabled !== false);
    const [css, setCss] = useState(loadSavedCSS);

    const apply = useCallback((val: string) => {
        setCss(val);
        updateSettingsPluginData({ customCSS: val });
        if (getSettingsPluginData().customCSSEnabled !== false) registerStyle(STYLE_ID, val);
    }, []);

    const handleToggle = (checked: boolean) => {
        setEnabled(checked);
        setCustomCSSEnabled(checked);
    };

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const pasted = e.clipboardData.getData("text/plain");
        if (pasted.includes("{") && !pasted.includes("\n")) {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const formatted = formatCSS(pasted);
            const next = css.slice(0, start) + formatted + css.slice(end);
            apply(next);
            requestAnimationFrame(() => {
                const pos = start + formatted.length;
                ta.selectionStart = pos;
                ta.selectionEnd = pos;
            });
        }
    }, [css, apply]);

    useEffect(() => {
        if (highlightRef.current) highlightRef.current.innerHTML = highlight(css) + "\n";
    }, [css]);

    return (
        <Flex flexDirection="column" gap="0.75rem" className={cl("root")}>
            <Flex alignItems="center" justifyContent="space-between" className={cl("header")}>
                <Flex flexDirection="column" gap="0">
                    <Text size="sm" weight="medium">Quick CSS</Text>
                    <Paragraph>Custom CSS applied live as you type.</Paragraph>
                </Flex>
                <Switch checked={enabled} onCheckedChange={handleToggle} />
            </Flex>
            <div className={cl("wrap")}>
                <pre ref={highlightRef} className={cl("highlight")} aria-hidden="true" />
                <textarea
                    className={cl("input")}
                    value={css}
                    onChange={e => apply(e.target.value)}
                    onPaste={handlePaste}
                    disabled={!enabled}
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                />
            </div>
        </Flex>
    );
}
