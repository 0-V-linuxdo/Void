/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SettingsDescriptionProps, SettingsRowProps, SettingsTitleProps } from "@grok-types";
import type { ComponentType } from "react";

export interface SettingsPrimitives {
    SettingsTitle: ComponentType<SettingsTitleProps>;
    SettingsDescription: ComponentType<SettingsDescriptionProps>;
    SettingsRow: ComponentType<SettingsRowProps>;
}

const captured: Partial<SettingsPrimitives> = {};

export function setSettingsPrimitive<K extends keyof SettingsPrimitives>(name: K, component: SettingsPrimitives[K]): void {
    captured[name] = component;
}

export function getSettingsPrimitive<K extends keyof SettingsPrimitives>(name: K): SettingsPrimitives[K] | null {
    return captured[name] ?? null;
}
