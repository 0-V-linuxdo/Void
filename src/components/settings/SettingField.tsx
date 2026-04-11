/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./SettingField.css";

import { dispatch } from "@api/Events";
import { resolveDefault, Settings, SettingsStore } from "@api/Settings";
import { Flex, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SettingsDescription, SettingsRow, SettingsTitle, Slider, Switch, Text } from "@components";
import { React, useCallback, useEffect, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { humanizeKey } from "@utils/text";
import { OptionType, type PluginSettingComponentDef, type PluginSettingDef, type PluginSettingSelectOption, type PluginSettingValue } from "@utils/types";

import { type InputChangeEvent } from "./utils";

const cl = classNameFactory("void-setting-");

interface SettingFieldProps {
    id: string;
    setting: PluginSettingDef;
    pluginName: string;
}

function usePluginSetting(pluginName: string, id: string, setting: PluginSettingDef) {
    const resolve = () => (Settings.plugins[pluginName] ?? {})[id] ?? resolveDefault(setting);
    const [value, setValue] = useState(resolve);

    useEffect(() => {
        const path = `plugins.${pluginName}.${id}`;
        const listener = () => setValue(resolve());
        SettingsStore.addChangeListener(path, listener);
        return () => SettingsStore.removeChangeListener(path, listener);
    }, [pluginName, id]);

    const update = useCallback(
        (val: PluginSettingValue) => {
            setValue(val);
            Settings.plugins[pluginName] = { ...Settings.plugins[pluginName], [id]: val };
            setting.onChange?.(val);
            if (setting.restartNeeded) dispatch("reloadNeeded");
        },
        [id, pluginName, setting],
    );

    return [value, update] as const;
}

function SettingLabel({ id, setting }: { id: string; setting: PluginSettingDef }) {
    return (
        <Flex flexDirection="column" gap="0">
            <SettingsTitle>{humanizeKey(id)}</SettingsTitle>
            {setting.description && <SettingsDescription>{setting.description}</SettingsDescription>}
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
    const options = "options" in setting ? (setting as { options: readonly PluginSettingSelectOption[] }).options : null;
    const valueMap = useMemo(() => new Map(options?.map(o => [String(o.value), o.value])), [options]);
    if (!options) return null;

    return (
        <SettingsRow action={
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
        }>
            <SettingLabel id={id} setting={setting} />
        </SettingsRow>
    );
}

function SliderField({ id, setting, pluginName }: SettingFieldProps) {
    const [value, update] = usePluginSetting(pluginName, id, setting);
    if (!("min" in setting)) return null;

    const { min, max } = setting as { min: number; max: number };

    return (
        <Flex flexDirection="column" gap="0.5rem">
            <SettingLabel id={id} setting={setting} />
            <Flex gap="0.5rem" className={cl("slider-row")}>
                <Slider
                    value={[(value as number) ?? min]}
                    min={min}
                    max={max}
                    step={1}
                    onValueChange={([v]: number[]) => update(v)}
                    className={cl("slider")}
                />
                <Text size="sm" color="secondary" className={cl("slider-value")}>{value as number}</Text>
            </Flex>
        </Flex>
    );
}

function ComponentField({ setting, pluginName }: SettingFieldProps) {
    const [, update] = usePluginSetting(pluginName, "component", setting);
    if (!("component" in setting)) return null;

    const Comp = (setting as PluginSettingComponentDef).component;
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
                className={cl("number-input")}
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
                placeholder={setting.placeholder}
                className={cl("string-input")}
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
