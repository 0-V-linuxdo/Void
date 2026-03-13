/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { initPluginManager, isPluginEnabled, plugins, registerPlugin, startAllPlugins, startPlugin } from "@api/PluginManager";
import { _resolveReady, blacklistBadModules, getModuleCache, getRuntimeFactoryRegistry, onModuleLoad, patches, patchTurbopack, reportOrphanedPatches, rescanRuntimeModules } from "@turbopack/patchTurbopack";
import { filters, waitFor } from "@turbopack/turbopack";
import { Logger } from "@utils/Logger";
import { onlyOnce } from "@utils/misc";
import { type Plugin, StartAt } from "@utils/types";
import { checkForUpdates } from "@utils/updateChecker";

import Plugins from "~plugins";

export { addChatBarButton, removeChatBarButton } from "@api/ChatBarButtons";
export { dispatch, subscribe } from "@api/Events";
export { closeAllModals, closeModal, confirm, openModal } from "@api/Modals";
export { closeNotice, NoticeType, showNotice } from "@api/Notices";
export { dismissToast, showToast, ToastType } from "@api/Notifications";
export { addPatch, isPluginEnabled, plugins, registerPlugin, startPlugin, stopPlugin } from "@api/PluginManager";
export { definePluginSettings, initSettings, migratePluginSetting, migratePluginSettings, migrateSettingsToPlugin, PlainSettings, Settings, SettingsStore } from "@api/Settings";
export { addTheme, disableTheme, enableTheme, getThemes, isThemesEnabled, removeTheme, setThemesEnabled } from "@api/Themes";
export * as common from "@turbopack/common";
export { getModuleCache, getRuntimeFactoryRegistry, getRuntimeModuleCache, getTurbopackHelpers, isBlacklisted, onceReady, onModuleLoad, patches, patchReport, patchResults, patchStats, syncLazyModules } from "@turbopack/patchTurbopack";
export * from "@turbopack/turbopack";
export { classes, classNameFactory, disableStyle, enableStyle, registerStyle } from "@utils/css";
export { isNonNullish, isObject, isTruthy } from "@utils/guards";
export { makeLazy, proxyLazy } from "@utils/lazy";
export { Logger } from "@utils/Logger";
export { clamp, copyToClipboard, createExternalStore, debounce, errorMessage, fetchExternal, formatCountdown, formatDuration, mergeDefaults, onlyOnce, sanitizeFilename, sleep } from "@utils/misc";
export { escapeRegExp, humanizeKey, pluralize } from "@utils/text";
export { default as definePlugin, OptionType, StartAt } from "@utils/types";

const logger = new Logger("TurbopackPatcher", "#e78284");

const APP_READY_SETTLE_MS = 500;
const MIN_FACTORY_RATIO = 0.4;
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

function hasEnoughModules(): boolean {
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return false;
    return getModuleCache().size / registry.size >= MIN_FACTORY_RATIO;
}

function waitForModulesStable() {
    let settleTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let unsubLoad: (() => void) | null = null;
    let cancelWaitFor: (() => void) | null = null;

    let fired = false;
    const fire = onlyOnce(() => {
        fired = true;
        if (settleTimer) clearTimeout(settleTimer);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        if (unsubLoad) unsubLoad();
        if (cancelWaitFor) cancelWaitFor();
        rescanRuntimeModules();
        blacklistBadModules();
        _resolveReady();
        startAllPlugins(StartAt.TurbopackReady);
        logger.info(`${getModuleCache().size} modules loaded, ready`);
        retryFailedPlugins();
        deferOrphanReport();
        checkForUpdates();
    });

    const settleUntilReady = () => {
        if (settleTimer) clearTimeout(settleTimer);
        if (hasEnoughModules()) {
            fire();
            return;
        }
        settleTimer = setTimeout(settleUntilReady, APP_READY_SETTLE_MS);
    };

    cancelWaitFor = waitFor(filters.byProps("useRoutingStore", "formatUrl"), () => {
        cancelWaitFor = null;
        settleUntilReady();
    });

    unsubLoad = onModuleLoad(() => {
        if (!fired && !cancelWaitFor && settleTimer) {
            clearTimeout(settleTimer);
            settleTimer = setTimeout(settleUntilReady, APP_READY_SETTLE_MS);
        }
    });

    fallbackTimer = setTimeout(fire, FALLBACK_MS);
}

export function init() {
    patchTurbopack();

    for (const name in Plugins) {
        registerPlugin(Plugins[name] as Plugin);
    }

    initPluginManager();

    startAllPlugins(StartAt.Init);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => startAllPlugins(StartAt.DOMContentLoaded), { once: true });
    } else {
        startAllPlugins(StartAt.DOMContentLoaded);
    }

    waitForModulesStable();
}
