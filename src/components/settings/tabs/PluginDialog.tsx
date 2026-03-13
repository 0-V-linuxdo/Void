/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./PluginDialog.css";

import { Button, Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, Flex, Separator, Text } from "@components";
import { Cross2Icon } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import type { Plugin } from "@utils/types";

import SettingField from "../SettingField";
import { isVisibleSetting } from "../utils";

const cl = classNameFactory("void-plugin-dialog-");

interface PluginDialogProps {
    plugin: Plugin;
    open: boolean;
    onClose(): void;
}

export default function PluginDialog({ plugin, open, onClose }: PluginDialogProps) {
    const entries = Object.entries(plugin.settings?.def ?? {}).filter(isVisibleSetting);

    return (
        <Dialog
            open={open}
            onOpenChange={(v: boolean) => {
                if (!v) onClose();
            }}
        >
            <DialogContent className={cl("content")} aria-describedby={undefined}>
                <DialogClose asChild>
                    <Button variant="tertiary" size="sm" shape="square" aria-label="Close" className={cl("close")}>
                        <Cross2Icon />
                    </Button>
                </DialogClose>
                <DialogHeader className={cl("header")}>
                    <DialogTitle>{plugin.name}</DialogTitle>
                    {plugin.description && (
                        <Text size="xs" color="secondary">
                            {plugin.description}
                        </Text>
                    )}
                </DialogHeader>
                <Separator />
                {!!plugin.authors?.length && (
                    <Flex flexDirection="column" gap="0.25rem">
                        <Text size="sm" weight="medium">
                            Authors
                        </Text>
                        <Text size="xs" color="secondary">
                            {plugin.authors.join(", ")}
                        </Text>
                    </Flex>
                )}
                <Flex flexDirection="column" gap="0.25rem">
                    <Text size="sm" weight="medium">
                        Settings
                    </Text>
                    {entries.length ? (
                        <Flex flexDirection="column" gap="0.75rem" className={cl("settings-list")}>
                            {entries.map(([key, setting]) => (
                                <SettingField key={key} id={key} setting={setting} pluginName={plugin.name} />
                            ))}
                        </Flex>
                    ) : (
                        <Text size="xs" color="secondary">
                            No configurable settings.
                        </Text>
                    )}
                </Flex>
            </DialogContent>
        </Dialog>
    );
}
