/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ErrorBoundary } from "@components/ErrorBoundary";

import CustomCSSTabRaw, { loadSavedCSS } from "./CustomCSSTab";
import PluginsTabRaw from "./PluginsTab";
import ThemesTabRaw from "./ThemesTab";

export { setPendingPluginDialog } from "./PluginsTab";

export { loadSavedCSS };
export const CustomCSSTab = ErrorBoundary.wrap(CustomCSSTabRaw);
export const PluginsTab = ErrorBoundary.wrap(PluginsTabRaw);
export const ThemesTab = ErrorBoundary.wrap(ThemesTabRaw);
