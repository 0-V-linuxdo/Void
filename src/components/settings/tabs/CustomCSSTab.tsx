/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./CustomCSSTab.css";

import { getSettingsPluginData, pluginPath, SettingsStore, updateSettingsPluginData } from "@api/Settings";
import { Flex, Switch } from "@components";
import { React, useCallback, useEffect, useState } from "@turbopack/common/react";
import { classes, classNameFactory, disableStyle, enableStyle, registerStyle } from "@utils/css";

import { CssEditor } from "../CssEditor";

const cl = classNameFactory("void-css-");
const STYLE_ID = "void-custom-css";

function setCustomCSSEnabled(enabled: boolean) {
    updateSettingsPluginData({ customCSSEnabled: enabled });
    if (!enabled) return disableStyle(STYLE_ID);
    const css = getSettingsPluginData().customCSS;
    if (typeof css === "string" && css) {
        registerStyle(STYLE_ID, css);
        enableStyle(STYLE_ID);
    }
}

function useCustomCSSEnabled() {
    const [enabled, setEnabled] = useState(() => getSettingsPluginData().customCSSEnabled !== false);

    useEffect(() => {
        const sync = () => setEnabled(getSettingsPluginData().customCSSEnabled !== false);
        SettingsStore.addChangeListener(pluginPath("Settings"), sync);
        return () => SettingsStore.removeChangeListener(pluginPath("Settings"), sync);
    }, []);

    const update = useCallback((checked: boolean) => {
        setEnabled(checked);
        setCustomCSSEnabled(checked);
    }, []);

    return [enabled, update] as const;
}

export function loadSavedCSS(): string {
    const { customCSS: saved, customCSSEnabled } = getSettingsPluginData();
    if (typeof saved === "string" && saved && customCSSEnabled !== false) {
        registerStyle(STYLE_ID, saved);
    }
    return typeof saved === "string" ? saved : "";
}

export function QuickCSSSwitch() {
    const [enabled, update] = useCustomCSSEnabled();
    return <Switch checked={enabled} onCheckedChange={update} />;
}

export default function CustomCSSTab() {
    const [enabled] = useCustomCSSEnabled();
    const [css, setCss] = useState(loadSavedCSS);

    const apply = useCallback((val: string) => {
        setCss(val);
        updateSettingsPluginData({ customCSS: val });
        if (getSettingsPluginData().customCSSEnabled !== false) registerStyle(STYLE_ID, val);
    }, []);

    return (
        <Flex flexDirection="column" gap="1rem" className={classes(cl("root"), "void-tab-root")}>
            <CssEditor value={css} onChange={apply} disabled={!enabled} />
        </Flex>
    );
}
