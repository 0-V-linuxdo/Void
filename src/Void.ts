/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { checkBuildFingerprint } from "@api/BuildHealth";
import { initPluginManager, registerPlugin, retryFailedPlugins, startAllPlugins } from "@api/PluginManager";
import { initStreamEvents } from "@api/StreamEvents";
import { reportOrphanedPatches } from "@turbopack/patchReport";
import { _resolveReady, blacklistBadModules, getModuleCache, patches, patchTurbopack, rescanRuntimeModules } from "@turbopack/patchTurbopack";
import { filters, reportFailedFinders, waitFor } from "@turbopack/turbopack";
import { Logger } from "@utils/Logger";
import { onlyOnce } from "@utils/misc";
import { type Plugin, StartAt } from "@utils/types";

import Plugins from "~plugins";

export { addChatBarButton, removeChatBarButton } from "@api/ChatBarButtons";
export { addContextMenuItem, removeContextMenuItem } from "@api/ContextMenus";
export { dispatch, subscribe } from "@api/Events";
export { type VoidEventMap } from "@api/Events";
export { closeAllModals, closeModal, openModal } from "@api/Modals";
export { closeNotice, NoticeType, showNotice } from "@api/Notices";
export { dismissToast, showToast, ToastType } from "@api/Notifications";
export { addPatch, isPluginEnabled, plugins, registerPlugin, startPlugin, stopPlugin } from "@api/PluginManager";
export { definePluginSettings, initSettings, migratePluginSetting, migratePluginSettings, migrateSettingsToPlugin, PlainSettings, Settings, SettingsStore } from "@api/Settings";
export { type NotificationPosition } from "@api/Settings";
export { addLocalTheme, addTheme, disableTheme, enableTheme, getThemes, isOnlineThemesEnabled, isThemesEnabled, removeTheme, setOnlineThemesEnabled, setThemesEnabled, updateLocalTheme } from "@api/Themes";
export { ErrorBoundary } from "@components/ErrorBoundary";
export * as common from "@turbopack/common";
export { injectExports } from "@turbopack/injection";
export { patchReport, patchResults, patchStats } from "@turbopack/patchReport";
export { getModuleCache, getRuntimeFactoryRegistry, getRuntimeModuleCache, getTurbopackHelpers, isBlacklisted, onceReady, onModuleLoad, patches, syncLazyModules } from "@turbopack/patchTurbopack";
export * from "@turbopack/turbopack";
export { Devs } from "@utils/constants";
export { classes, classNameFactory, disableStyle, enableStyle, registerStyle, unregisterStyle } from "@utils/css";
export { isNonNullish, isObject, isTruthy } from "@utils/guards";
export { makeLazy, proxyLazy } from "@utils/lazy";
export { Logger } from "@utils/Logger";
export { type LogLevel } from "@utils/Logger";
export { clamp, copyToClipboard, createExternalStore, debounce, errorMessage, fetchExternal, formatCountdown, formatDuration, mapGetOrCreate, mergeDefaults, onlyOnce, sanitizeFilename, sendBrowserNotification, sleep, sortedEntries } from "@utils/misc";
export { findInReactTree, getFiber, getReactRoot, useEventSubscription, useExternalStore, useForceUpdater, useIsStreaming, useSelectionHas, useSelectionSize, walkFiberTree, walkFiberUp, wrapComponent } from "@utils/react";
export { escapeHtml, escapeRegExp, humanizeKey, pluralize } from "@utils/text";
export { default as definePlugin, OptionType, type PluginSettingValue, StartAt } from "@utils/types";

const logger = new Logger("TurbopackPatcher", "#e78284");

const FALLBACK_MS = 15_000;
const ORPHAN_REPORT_DELAY_MS = 5_000;

function safely(name: string, fn: () => void) {
    try { fn(); } catch (e) { logger.error(`${name} failed:`, e); }
}

function deferOrphanReport() {
    if (!patches.some(p => !p.all)) return;
    setTimeout(() => {
        reportOrphanedPatches();
        reportFailedFinders();
    }, ORPHAN_REPORT_DELAY_MS);
}

function waitForModulesStable() {
    const fire = onlyOnce(() => {
        if (cancelWaitFor) cancelWaitFor();
        clearTimeout(fallbackTimer);
        rescanRuntimeModules();

        safely("blacklistBadModules", blacklistBadModules);
        safely("initStreamEvents", initStreamEvents);
        safely("_resolveReady", _resolveReady);
        safely("startAllPlugins", () => startAllPlugins(StartAt.TurbopackReady));

        logger.info(`${getModuleCache().size} modules loaded, ready`);

        safely("retryFailedPlugins", retryFailedPlugins);
        safely("deferOrphanReport", deferOrphanReport);
        safely("checkBuildFingerprint", checkBuildFingerprint);
    });

    const cancelWaitFor = waitFor(filters.byProps("useRoutingStore", "formatUrl"), fire);
    const fallbackTimer = setTimeout(fire, FALLBACK_MS);
}

let _initialized = false;

export function init() {
    if (_initialized) return;
    _initialized = true;

    for (const plugin of Object.values(Plugins)) {
        safely("registerPlugin", () => registerPlugin(plugin as Plugin));
    }

    safely("initPluginManager", initPluginManager);
    safely("patchTurbopack", patchTurbopack);
    safely("startAllPlugins(Init)", () => startAllPlugins(StartAt.Init));

    const fireDomContent = () => safely("startAllPlugins(DOMContentLoaded)", () => startAllPlugins(StartAt.DOMContentLoaded));
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fireDomContent, { once: true });
    else fireDomContent();

    safely("waitForModulesStable", waitForModulesStable);
}
