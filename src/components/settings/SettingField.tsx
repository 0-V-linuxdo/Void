/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings } from "@api/Settings";
import { Flex, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SettingsDescription, SettingsRow, SettingsTitle, Slider, Switch, Text } from "@components";
import { React, useCallback, useMemo, useState } from "@turbopack/common/react";
import { humanizeKey } from "@utils/text";
import { OptionType, type PluginSettingDef, type PluginSettingSelectOption } from "@utils/types";

import { type InputChangeEvent, resolveDefault } from "./utils";

interface SettingFieldProps {
    id: string;
    setting: PluginSettingDef;
    pluginName: string;
}

function usePluginSetting(pluginName: string, id: string, setting: PluginSettingDef) {
    const [value, setValue] = useState((Settings.plugins[pluginName] ?? {})[id] ?? resolveDefault(setting));

    const update = useCallback(
        (val: any) => {
            setValue(val);
            Settings.plugins[pluginName] = { ...Settings.plugins[pluginName], [id]: val };
            setting.onChange?.(val);
        },
        [id, pluginName, setting],
    );

    return [value, update] as const;
}

function SettingLabel({ id, setting }: { id: string; setting: PluginSettingDef }) {
    return (
        <Flex flexDirection="column" gap="0">
            <SettingsTitle>{humanizeKey(id)}</SettingsTitle>
            {"description" in setting && setting.description && <SettingsDescription>{setting.description}</SettingsDescription>}
        </Flex>
    );
}

function BooleanField({ id, setting, pluginName }: SettingFieldProps) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return (
        <SettingsRow action={<Switch checked={!!value} onCheckedChange={update} />}>
            <SettingLabel id={id} setting={setting} />
        </SettingsRow>
    );
}

function SelectField({ id, setting, pluginName }: SettingFieldProps) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    if (!("options" in setting)) return null;

    const { options } = (setting as { options: readonly PluginSettingSelectOption[] });
    const valueMap = useMemo(() => new Map(options.map(o => [String(o.value), o.value])), [options]);

    return (
        <Flex flexDirection="column" gap="0.5rem">
            <SettingLabel id={id} setting={setting} />
            <Select value={String(value ?? "")} onValueChange={(v: string) => update(valueMap.get(v) ?? v)}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map((o: PluginSettingSelectOption) => (
                        <SelectItem key={String(o.value)} value={String(o.value)}>
                            {o.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Flex>
    );
}

function SliderField({ id, setting, pluginName }: SettingFieldProps) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    if (!("min" in setting)) return null;

    const { min, max } = setting as { min: number; max: number };

    return (
        <Flex flexDirection="column" gap="0.5rem">
            <SettingLabel id={id} setting={setting} />
            <Flex gap="8px" className="items-center">
                <Slider
                    value={[(value as number) ?? min]}
                    min={min}
                    max={max}
                    step={1}
                    onValueChange={([v]: number[]) => update(v)}
                    className="w-32"
                />
                <Text size="sm" color="secondary" className="tabular-nums w-6 text-right">{value as number}</Text>
            </Flex>
        </Flex>
    );
}

function ComponentField({ setting, pluginName }: SettingFieldProps) {
    const [, update] = usePluginSetting(pluginName, "component", setting);
    if (!("component" in setting)) return null;

    const Comp = (setting as { component: React.ComponentType<{ setValue: (v: any) => void; option: PluginSettingDef }> }).component;
    return <Comp setValue={update} option={setting} />;
}

function NumberField({ id, setting, pluginName }: SettingFieldProps) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return (
        <Flex flexDirection="column" gap="0.5rem">
            <SettingLabel id={id} setting={setting} />
            <Input
                type="number"
                value={(value as string) ?? ""}
                onChange={(e: InputChangeEvent) => {
                    const n = Number(e.target.value);
                    if (!isNaN(n)) update(n);
                }}
                className="w-24"
            />
        </Flex>
    );
}

function StringField({ id, setting, pluginName }: SettingFieldProps) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    return (
        <Flex flexDirection="column" gap="0.5rem">
            <SettingLabel id={id} setting={setting} />
            <Input
                type="text"
                value={(value as string) ?? ""}
                onChange={(e: InputChangeEvent) => update(e.target.value)}
                placeholder={"placeholder" in setting ? (setting as { placeholder?: string }).placeholder : undefined}
                className="w-full"
            />
        </Flex>
    );
}

type FieldComponent = React.ComponentType<SettingFieldProps>;

const FIELD_MAP: Record<OptionType, FieldComponent | null> = {
    [OptionType.BOOLEAN]: BooleanField,
    [OptionType.SELECT]: SelectField,
    [OptionType.SLIDER]: SliderField,
    [OptionType.COMPONENT]: ComponentField,
    [OptionType.NUMBER]: NumberField,
    [OptionType.BIGINT]: NumberField,
    [OptionType.STRING]: StringField,
    [OptionType.CUSTOM]: null,
};

export default function SettingField({ id, setting, pluginName }: SettingFieldProps) {
    const Field = FIELD_MAP[setting.type];
    if (!Field) return null;
    return <Field id={id} setting={setting} pluginName={pluginName} />;
}
