/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./CustomCSSTab.css";

import { Settings } from "@api/Settings";
import { Flex, Switch, Text } from "@components";
import { React, useEffect, useRef, useState } from "@turbopack/common/react";
import { MonacoModule } from "@turbopack/common/utils";
import { findLazy } from "@turbopack/turbopack";
import { classNameFactory, disableStyle, registerStyle } from "@utils/css";

const cl = classNameFactory("void-css-");
const STYLE_ID = "void-custom-css";

const ThemeModule: { darkTheme: any } = findLazy(m => m.darkTheme?.base === "vs-dark");

function getPluginSettings(): Record<string, any> {
    return (Settings.plugins.Settings as Record<string, any>) ?? {};
}

function updatePluginSettings(patch: Record<string, any>) {
    Settings.plugins.Settings = { ...Settings.plugins.Settings, ...patch };
}

export function setCustomCSSEnabled(enabled: boolean) {
    updatePluginSettings({ customCSSEnabled: enabled });
    if (enabled) {
        const css = getPluginSettings().customCSS;
        if (typeof css === "string" && css) registerStyle(STYLE_ID, css);
    } else {
        disableStyle(STYLE_ID);
    }
}

export function loadSavedCSS(): string {
    const s = getPluginSettings();
    const saved = s.customCSS;
    if (typeof saved === "string" && saved && s.customCSSEnabled !== false) {
        registerStyle(STYLE_ID, saved);
        return saved;
    }
    return typeof saved === "string" ? saved : "";
}

function applyCSS(css: string) {
    const enabled = getPluginSettings().customCSSEnabled !== false;
    updatePluginSettings({ customCSS: css });
    if (enabled) registerStyle(STYLE_ID, css);
}

export default function CustomCSSTab() {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<any>(null);
    const [enabled, setEnabled] = useState(() => getPluginSettings().customCSSEnabled !== false);

    const handleToggle = (checked: boolean) => {
        setEnabled(checked);
        setCustomCSSEnabled(checked);
    };

    useEffect(() => {
        if (!containerRef.current) return;

        let disposed = false;
        let editor: any = null;

        (async () => {
            if (!MonacoModule.monacoInstance) await MonacoModule.initMonaco();
            if (disposed) return;

            const monaco = MonacoModule.monacoInstance;
            monaco.editor.defineTheme("grok-dark", ThemeModule.darkTheme);
            editor = monaco.editor.create(containerRef.current!, {
                value: loadSavedCSS(),
                language: "css",
                theme: "grok-dark",
                minimap: { enabled: false },
                scrollbar: { vertical: "hidden", horizontal: "hidden" },
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                folding: false,
                glyphMargin: false,
                fontSize: 13,
                lineNumbers: "off",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: "on",
                padding: { top: 8 },
                renderLineHighlight: "none",
                renderLineHighlightOnlyWhenFocus: true,
                lineDecorationsWidth: 0,
                readOnly: !enabled,
            });

            editorRef.current = editor;
            editor.onDidChangeModelContent(() => applyCSS(editor.getValue()));
        })();

        return () => {
            disposed = true;
            editor?.dispose();
            editorRef.current = null;
        };
    }, []);

    useEffect(() => {
        editorRef.current?.updateOptions({ readOnly: !enabled });
    }, [enabled]);

    return (
        <Flex flexDirection="column" gap="1rem">
            <Flex alignItems="center" justifyContent="space-between" style={{ padding: "0 0.75rem" }}>
                <Flex flexDirection="column" gap="0">
                    <Text size="sm" weight="medium">
                        Quick CSS
                    </Text>
                    <Text size="xs" color="secondary">
                        Custom CSS applied live as you type.
                    </Text>
                </Flex>
                <Switch checked={enabled} onCheckedChange={handleToggle} />
            </Flex>
            <div className={cl("block")}>
                <div className={cl("header")}>
                    <Text as="span">CSS</Text>
                </div>
                <div ref={containerRef} className={cl("editor")} />
            </div>
        </Flex>
    );
}
