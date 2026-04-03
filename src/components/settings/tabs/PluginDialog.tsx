/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../shared.css";
import "./PluginDialog.css";

import { Settings } from "@api/Settings";
import { Button, Dialog, DialogFooter, Flex, Paragraph, Separator, Text } from "@components";
import { React, useCallback, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import type { Plugin } from "@utils/types";

import SettingField from "../SettingField";
import { isVisibleSetting } from "../utils";
import { VoidDialogShell } from "./VoidDialogShell";

const cl = classNameFactory("void-plugin-dialog-");

interface PluginDialogProps {
    plugin: Plugin;
    open: boolean;
    onClose(): void;
}

export default function PluginDialog({ plugin, open, onClose }: PluginDialogProps) {
    const entries = useMemo(() => Object.entries(plugin.settings?.def ?? {}).filter(isVisibleSetting), [plugin.settings?.def]);
    const [confirming, setConfirming] = useState(false);

    const resetSettings = useCallback(() => {
        const current = Settings.plugins[plugin.name];
        if (!current) return;
        const entryKeys = new Set(entries.map(([key]) => key));
        Settings.plugins[plugin.name] = Object.fromEntries(
            Object.entries(current).filter(([k]) => !entryKeys.has(k)),
        ) as typeof current;
        setConfirming(false);
    }, [plugin.name, entries]);

    return (
        <Dialog open={open} onOpenChange={(v: boolean) => { if (!v) onClose(); }}>
            <VoidDialogShell title={plugin.name} subtitle={plugin.description}>
                <Separator />
                {!!plugin.authors?.length && (
                    <Flex flexDirection="column" gap="0.25rem">
                        <Text size="sm" weight="medium">Authors</Text>
                        <Paragraph>{plugin.authors.join(", ")}</Paragraph>
                    </Flex>
                )}
                <Flex flexDirection="column" gap="0.25rem">
                    <Text size="sm" weight="medium">Settings</Text>
                    {entries.length ? (
                        <Flex flexDirection="column" gap="0.75rem" className={cl("settings-list")}>
                            {entries.map(([key, setting]) => (
                                <SettingField key={key} id={key} setting={setting} pluginName={plugin.name} />
                            ))}
                        </Flex>
                    ) : (
                        <Paragraph>No configurable settings.</Paragraph>
                    )}
                </Flex>
                {!!entries.length && (
                    <DialogFooter className={cl("footer")}>
                        <Button
                            variant={confirming ? "danger" : "secondary"}
                            size="sm"
                            onBlur={() => setConfirming(false)}
                            onClick={() => confirming ? resetSettings() : setConfirming(true)}
                        >
                            {confirming ? "Are you sure?" : "Reset"}
                        </Button>
                    </DialogFooter>
                )}
            </VoidDialogShell>
        </Dialog>
    );
}
