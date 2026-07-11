/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ColorSettingRow.css";

import { Flex, SettingsDescription, SettingsRow, SettingsTitle, Text } from "@components";
import { React } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";

const cl = classNameFactory("void-color-picker-");

export interface ColorSettingRowProps {
    value: string;
    onChange: (value: string) => void;
    title: string;
    description: string;
}

export function ColorSettingRow({ value, onChange, title, description }: ColorSettingRowProps) {
    return (
        <SettingsRow action={
            <Flex alignItems="center" gap="0.5rem">
                <input
                    type="color"
                    className={cl("input")}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
                <Text size="sm" color="muted">{value}</Text>
            </Flex>
        }>
            <Flex flexDirection="column" gap="0">
                <SettingsTitle>{title}</SettingsTitle>
                <SettingsDescription>{description}</SettingsDescription>
            </Flex>
        </SettingsRow>
    );
}
