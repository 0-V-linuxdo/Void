/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export default function definePlugin<P extends PluginDef>(p: P & Record<PropertyKey, any>) {
    return p as typeof p & Plugin;
}

export type ReplaceFn = (match: string, ...groups: string[]) => string;

export interface PatchReplacement {
    match: string | RegExp;
    replace: string | ReplaceFn;
    predicate?(): boolean;
    noWarn?: boolean;
}

export interface Patch {
    plugin: string;
    find: string | RegExp | (string | RegExp)[];
    replacement: PatchReplacement | PatchReplacement[];
    all?: boolean;
    noWarn?: boolean;
    group?: boolean;
    predicate?(): boolean;
    validateOnly?: boolean;
}

export interface Plugin extends PluginDef {
    patches?: Patch[];
    started: boolean;
    isDependency?: boolean;
}

export interface StoreSubscription {
    store: { subscribe: (callback: (...args: any[]) => void, selector?: (state: any) => any) => () => void };
    callback: (state: any, prevState: any) => void;
    selector?: (state: any) => any;
}

export interface ZustandSubscription {
    selector?: (state: any) => any;
    handler: (current: any, prev: any) => void;
}

export interface PluginEventListener {
    target?: "document" | "window";
    event: string;
    handler: EventListener;
    options?: AddEventListenerOptions;
}

export interface PluginDef {
    name: string;
    description: string;
    authors: string[];
    chrome?: boolean;
    start?(): void;
    stop?(): void;
    patches?: Omit<Patch, "plugin">[];
    dependencies?: string[];
    required?: boolean;
    hidden?: boolean;
    dev?: boolean;
    preview?: boolean;
    enabledByDefault?: boolean;
    requiresRestart?: boolean;
    startAt?: StartAt;
    settings?: DefinedSettings;
    managedStyle?: string;
    tags?: string[];
    storeSubscriptions?: StoreSubscription[];
    zustand?: Record<string, ZustandSubscription>;
    chatBarButton?: import("@api/ChatBarButtons").ChatBarButtonDef;
    contextMenuItems?: { [L in import("@api/ContextMenus").ContextMenuLocation]?: import("@api/ContextMenus").ContextMenuItemDef<L> };
    events?: Record<string, (data: any) => void>;
    eventListeners?: PluginEventListener[];
    cleanupSelectors?: string[];
}

export const enum StartAt {
    Init = "Init",
    DOMContentLoaded = "DOMContentLoaded",
    TurbopackReady = "TurbopackReady",
}

export const enum OptionType {
    STRING,
    NUMBER,
    BIGINT,
    BOOLEAN,
    SELECT,
    SLIDER,
    COMPONENT,
    CUSTOM,
}

export type SettingsDefinition = Record<string, PluginSettingDef>;

export type SettingsChecks<D extends SettingsDefinition> = {
    [K in keyof D]?: D[K] extends PluginSettingComponentDef ? IsDisabled<DefinedSettings<D>> : IsDisabled<DefinedSettings<D>> & IsValid<PluginSettingType<D[K]>, DefinedSettings<D>>;
};

export type PluginSettingDef =
    | (PluginSettingCustomDef & Pick<PluginSettingCommon, "onChange">)
    | (PluginSettingComponentDef & Omit<PluginSettingCommon, "description" | "placeholder">)
    | ((PluginSettingStringDef | PluginSettingNumberDef | PluginSettingBooleanDef | PluginSettingSelectDef | PluginSettingSliderDef | PluginSettingBigIntDef) & PluginSettingCommon);

export interface PluginSettingCommon {
    description: string;
    placeholder?: string;
    onChange?(newValue: any): void;
    restartNeeded?: boolean;
    componentProps?: Record<string, any>;
    hidden?: boolean;
}

interface IsDisabled<D = any> {
    disabled?(this: D): boolean;
}

interface IsValid<T, D = any> {
    isValid?(this: D, value: T): boolean | string;
}

export interface PluginSettingStringDef {
    type: OptionType.STRING;
    default?: string;
    multiline?: boolean;
}

export interface PluginSettingNumberDef {
    type: OptionType.NUMBER;
    default?: number;
}

export interface PluginSettingBigIntDef {
    type: OptionType.BIGINT;
    default?: bigint;
}

export interface PluginSettingBooleanDef {
    type: OptionType.BOOLEAN;
    default?: boolean;
}

export interface PluginSettingSelectDef {
    type: OptionType.SELECT;
    options: readonly PluginSettingSelectOption[];
}

export interface PluginSettingSelectOption {
    label: string;
    value: string | number | boolean;
    default?: boolean;
}

export interface PluginSettingCustomDef {
    type: OptionType.CUSTOM;
    default?: any;
}

export interface PluginSettingSliderDef {
    type: OptionType.SLIDER;
    min: number;
    max: number;
    default: number;
}

export interface IPluginOptionComponentProps {
    setValue(newValue: any): void;
    option: PluginSettingComponentDef;
}

export interface PluginSettingComponentDef {
    type: OptionType.COMPONENT;
    component: (props: IPluginOptionComponentProps) => any;
    default?: any;
}

type PluginSettingType<O extends PluginSettingDef> = O extends PluginSettingStringDef
    ? string
    : O extends PluginSettingNumberDef | PluginSettingSliderDef
      ? number
      : O extends PluginSettingBigIntDef
        ? bigint
        : O extends PluginSettingBooleanDef
          ? boolean
          : O extends PluginSettingSelectDef
            ? O["options"][number]["value"]
            : O extends { default: infer D }
              ? D
              : any;

type PluginSettingDefaultType<O extends PluginSettingDef> = O extends PluginSettingSelectDef
    ? O["options"] extends { default?: boolean }[]
        ? O["options"][number]["value"]
        : undefined
    : O extends { default: infer T }
      ? T
      : undefined;

type SettingsStore<D extends SettingsDefinition> = {
    [K in keyof D]: PluginSettingType<D[K]> | PluginSettingDefaultType<D[K]>;
};

export interface DefinedSettings<Def extends SettingsDefinition = SettingsDefinition, Checks extends SettingsChecks<Def> = {}, PrivateSettings extends object = {}> {
    store: SettingsStore<Def> & PrivateSettings;
    plain: SettingsStore<Def> & PrivateSettings;
    def: Def;
    checks: Checks;
    pluginName: string;
    use<F extends (keyof Def | keyof PrivateSettings & string)>(settings?: F[]): SettingsStore<Def> & PrivateSettings;
    withPrivateSettings<T extends object>(): DefinedSettings<Def, Checks, T>;
}
