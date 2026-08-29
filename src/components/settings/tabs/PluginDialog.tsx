/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../shared.css";
import "./PluginDialog.css";

import { Settings } from "@api/Settings";
import { Button, ConfirmDialog, DialogFooter, Flex, Paragraph, Separator } from "@components";
import { React, useCallback, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import type { Plugin } from "@utils/types";

import SettingField from "../SettingField";
import { isVisibleSetting } from "../utils";
import { DialogField, VoidDialogShell } from "./VoidDialogShell";

const cl = classNameFactory("void-plugin-dialog-");

interface PluginDialogProps {
    plugin: Plugin;
    onClose(): void;
}

export default function PluginDialog({ plugin, onClose }: PluginDialogProps) {
    const entries = useMemo(() => Object.entries(plugin.settings?.def ?? {}).filter(isVisibleSetting), [plugin.settings?.def]);
    const [resetOpen, setResetOpen] = useState(false);

    const resetSettings = useCallback(() => {
        const current = Settings.plugins[plugin.name];
        if (!current) return;
        const entryKeys = new Set(entries.map(([key]) => key));
        Settings.plugins[plugin.name] = Object.fromEntries(
            Object.entries(current).filter(([k]) => !entryKeys.has(k)),
        ) as typeof current;
    }, [plugin.name, entries]);

    return (
        <VoidDialogShell title={plugin.name} subtitle={plugin.description} onClose={onClose} nested>
            <Separator />
            {!!plugin.authors?.length && (
                <DialogField label="Authors">
                    <Paragraph>{plugin.authors.join(", ")}</Paragraph>
                </DialogField>
            )}
            <DialogField label="Settings">
                {entries.length ? (
                    <Flex flexDirection="column" gap="0.75rem" className={cl("settings-list")}>
                        {entries.map(([key, setting]) => (
                            <SettingField key={key} id={key} setting={setting} pluginName={plugin.name} />
                        ))}
                    </Flex>
                ) : (
                    <Paragraph>No configurable settings.</Paragraph>
                )}
            </DialogField>
            {!!entries.length && (
                <DialogFooter className={cl("footer")}>
                    <Button variant="secondary" size="sm" onClick={() => setResetOpen(true)}>
                        Reset
                    </Button>
                </DialogFooter>
            )}
            <ConfirmDialog
                open={resetOpen}
                onOpenChange={setResetOpen}
                title="Reset settings"
                description="Reset this plugin's settings to defaults? This cannot be undone."
                confirmText="Reset"
                danger
                onConfirm={resetSettings}
            />
        </VoidDialogShell>
    );
}
