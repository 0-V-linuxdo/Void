/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { initPluginManager, isPluginEnabled, plugins, registerPlugin, startAllPlugins, startPlugin } from "@api/PluginManager";
import { _resolveReady, blacklistBadModules, getModuleCache, onModuleLoad, patches, patchTurbopack, reportOrphanedPatches, rescanRuntimeModules } from "@turbopack/patchTurbopack";
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
export { getModuleCache, getRuntimeFactoryRegistry, getRuntimeModuleCache, getTurbopackHelpers, isBlacklisted, onceReady, onModuleLoad, patches, patchReport, patchResults, patchStats, syncLazyModules } from "@turbopack/patchTurbopack";
export * from "@turbopack/turbopack";
export { Devs } from "@utils/constants";
export { classes, classNameFactory, disableStyle, enableStyle, registerStyle, unregisterStyle } from "@utils/css";
export { isNonNullish, isObject, isTruthy } from "@utils/guards";
export { makeLazy, proxyLazy } from "@utils/lazy";
export { Logger } from "@utils/Logger";
export { type LogLevel } from "@utils/Logger";
export { clamp, copyToClipboard, createExternalStore, debounce, errorMessage, extractUrlExtension, fetchExternal, formatCountdown, formatDuration, mapGetOrCreate, mergeDefaults, onlyOnce, sanitizeFilename, sendBrowserNotification, sleep, sortedEntries } from "@utils/misc";
export { useEventSubscription, useExternalStore, useForceUpdater } from "@utils/react";
export { escapeRegExp, humanizeKey, pluralize } from "@utils/text";
export { default as definePlugin, type EventListenerTarget, OptionType, type PluginSettingValue,StartAt } from "@utils/types";

const logger = new Logger("TurbopackPatcher", "#e78284");

const FALLBACK_MS = 15_000;
const RETRY_TIMEOUT_MS = 15_000;
const RETRY_DEBOUNCE_MS = 200;
const ORPHAN_REPORT_DELAY_MS = 5_000;

function deferOrphanReport() {
    if (!patches.some(p => !p.all)) return;
    setTimeout(() => {
        reportOrphanedPatches();
        reportFailedFinders();
    }, ORPHAN_REPORT_DELAY_MS);
}

function retryFailedPlugins() {
    const getFailed = () =>
        Object.values(plugins).filter(
            p => !p.started && isPluginEnabled(p.name) && (p.startAt ?? StartAt.Init) === StartAt.TurbopackReady,
        );

    if (!getFailed().length) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const tryRetry = () => {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => {
            retryTimer = null;
            rescanRuntimeModules();
            for (const p of getFailed()) startPlugin(p, true);

            if (!getFailed().length) {
                unsub();
                clearTimeout(timeout);
                logger.info("All previously failed plugins started after late module load");
            }
        }, RETRY_DEBOUNCE_MS);
    };

    const unsub = onModuleLoad(tryRetry);

    const timeout = setTimeout(() => {
        unsub();
        if (retryTimer) clearTimeout(retryTimer);
        rescanRuntimeModules();
        const remaining = getFailed();
        for (const p of remaining) startPlugin(p, true);
        const stillFailed = getFailed();
        if (stillFailed.length) {
            logger.warn(`${stillFailed.length} plugin(s) still failed after retry window: ${stillFailed.map(p => p.name).join(", ")}`);
        }
    }, RETRY_TIMEOUT_MS);
}

function waitForModulesStable() {
    const fire = onlyOnce(() => {
        if (cancelWaitFor) cancelWaitFor();
        clearTimeout(fallbackTimer);
        rescanRuntimeModules();

        try { blacklistBadModules(); } catch (e) { logger.error("blacklistBadModules failed:", e); }
        try { _resolveReady(); } catch (e) { logger.error("_resolveReady failed:", e); }
        try { startAllPlugins(StartAt.TurbopackReady); } catch (e) { logger.error("startAllPlugins failed:", e); }

        logger.info(`${getModuleCache().size} modules loaded, ready`);

        try { retryFailedPlugins(); } catch (e) { logger.error("retryFailedPlugins failed:", e); }
        try { deferOrphanReport(); } catch (e) { logger.error("deferOrphanReport failed:", e); }
    });

    const cancelWaitFor = waitFor(filters.byProps("useRoutingStore", "formatUrl"), fire);
    const fallbackTimer = setTimeout(fire, FALLBACK_MS);
}

let _initialized = false;

export function init() {
    if (_initialized) return;
    _initialized = true;

    for (const plugin of Object.values(Plugins)) {
        try {
            registerPlugin(plugin as Plugin);
        } catch (e) {
            logger.error("Failed to register plugin:", e);
        }
    }

    try { initPluginManager(); } catch (e) { logger.error("initPluginManager failed:", e); }

    try { patchTurbopack(); } catch (e) { logger.error("Failed to patch Turbopack:", e); }

    try { startAllPlugins(StartAt.Init); } catch (e) { logger.error("startAllPlugins(Init) failed:", e); }

    try {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                try { startAllPlugins(StartAt.DOMContentLoaded); } catch (e) { logger.error("startAllPlugins(DOMContentLoaded) failed:", e); }
            }, { once: true });
        } else {
            startAllPlugins(StartAt.DOMContentLoaded);
        }
    } catch (e) { logger.error("startAllPlugins(DOMContentLoaded) failed:", e); }

    try { waitForModulesStable(); } catch (e) { logger.error("waitForModulesStable failed:", e); }
}
