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
import { checkForUpdates } from "@utils/updateChecker";

import Plugins from "~plugins";

export { addChatBarButton, removeChatBarButton } from "@api/ChatBarButtons";
export { addContextMenuItem, removeContextMenuItem } from "@api/ContextMenus";
export { dispatch, subscribe } from "@api/Events";
export { closeAllModals, closeModal, confirm, openModal } from "@api/Modals";
export { closeNotice, NoticeType, showNotice } from "@api/Notices";
export { dismissToast, showToast, ToastType } from "@api/Notifications";
export { addPatch, isPluginEnabled, plugins, registerPlugin, startPlugin, stopPlugin } from "@api/PluginManager";
export { definePluginSettings, initSettings, migratePluginSetting, migratePluginSettings, migrateSettingsToPlugin, PlainSettings, Settings, SettingsStore } from "@api/Settings";
export { addLocalTheme, addTheme, disableTheme, enableTheme, getThemes, isOnlineThemesEnabled, isThemesEnabled, removeTheme, setOnlineThemesEnabled, setThemesEnabled, updateLocalTheme } from "@api/Themes";
export { ErrorBoundary } from "@components/ErrorBoundary";
export * as common from "@turbopack/common";
export { getModuleCache, getRuntimeFactoryRegistry, getRuntimeModuleCache, getTurbopackHelpers, isBlacklisted, onceReady, onModuleLoad, patches, patchReport, patchResults, patchStats, syncLazyModules } from "@turbopack/patchTurbopack";
export * from "@turbopack/turbopack";
export { Devs } from "@utils/constants";
export { classes, classNameFactory, disableStyle, enableStyle, registerStyle } from "@utils/css";
export { isNonNullish, isObject, isTruthy } from "@utils/guards";
export { makeLazy, proxyLazy } from "@utils/lazy";
export { Logger } from "@utils/Logger";
export { clamp, copyToClipboard, createExternalStore, debounce, errorMessage, extractUrlExtension, fetchExternal, formatCountdown, formatDuration, mapGetOrCreate, mergeDefaults, onlyOnce, sanitizeFilename, sendBrowserNotification, sleep, sortedEntries } from "@utils/misc";
export { useEventSubscription, useExternalStore, useForceUpdater } from "@utils/react";
export { escapeRegExp, humanizeKey, pluralize } from "@utils/text";
export { default as definePlugin, OptionType, StartAt } from "@utils/types";

const logger = new Logger("TurbopackPatcher", "#e78284");

const FALLBACK_MS = 15_000;
const RETRY_TIMEOUT_MS = 15_000;
const ORPHAN_REPORT_DELAY_MS = 5_000;

function deferOrphanReport() {
    const hasNonGlobal = patches.some(p => !p.all);
    if (!hasNonGlobal) return;

    const unsub = onModuleLoad(() => {
        if (!patches.some(p => !p.all)) {
            unsub();
            clearTimeout(timeout);
        }
    });
    const timeout = setTimeout(() => {
        unsub();
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
        }, 200);
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
        blacklistBadModules();
        _resolveReady();
        startAllPlugins(StartAt.TurbopackReady);
        logger.info(`${getModuleCache().size} modules loaded, ready`);
        retryFailedPlugins();
        deferOrphanReport();
        checkForUpdates();
    });

    const cancelWaitFor = waitFor(filters.byProps("useRoutingStore", "formatUrl"), fire);
    const fallbackTimer = setTimeout(fire, FALLBACK_MS);
}

export function init() {
    for (const plugin of Object.values(Plugins)) {
        registerPlugin(plugin as Plugin);
    }

    initPluginManager();

    patchTurbopack();

    startAllPlugins(StartAt.Init);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => startAllPlugins(StartAt.DOMContentLoaded), { once: true });
    } else {
        startAllPlugins(StartAt.DOMContentLoaded);
    }

    waitForModulesStable();
}
