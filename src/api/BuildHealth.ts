/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getChunkFingerprint } from "@turbopack/patchReport";
import { Logger } from "@utils/Logger";

import { getSettingsPluginData, updateSettingsPluginData } from "./Settings";

const logger = new Logger("TurbopackPatcher", "#e78284");

export function checkBuildFingerprint() {
    const domChunks = [...document.querySelectorAll<HTMLScriptElement>('script[src*="/_next/static/chunks/"]')].map(s => s.src.slice(s.src.lastIndexOf("/") + 1));
    const current = [...new Set([...domChunks, ...getChunkFingerprint()])];
    if (!current.length) return;

    const previous = getSettingsPluginData().chunkFingerprint;
    if (previous?.length) {
        const prev = new Set(previous);
        const overlap = current.filter(c => prev.has(c)).length / current.length;
        if (overlap < 0.5) logger.warn("grok build changed (chunk fingerprint shifted)");
    }

    updateSettingsPluginData({ chunkFingerprint: current });
}
