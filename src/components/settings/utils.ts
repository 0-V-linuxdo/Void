/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { OptionType, type Plugin, type PluginSettingDef } from "@utils/types";

export { resolveDefault } from "@api/Settings";

export function isVisibleSetting([, s]: [string, PluginSettingDef]): boolean {
    return s.type !== OptionType.CUSTOM && !("hidden" in s && s.hidden);
}

export function hasVisibleSettings(plugin: Plugin): boolean {
    return !!plugin.settings?.def && Object.entries(plugin.settings.def).some(isVisibleSetting);
}
