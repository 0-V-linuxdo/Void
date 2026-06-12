/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "@utils/Logger";
import type { Patch, PatchReplacement } from "@utils/types";

import { getFnSource } from "./fnSource";
import { matchesAllPatterns } from "./match";
import { getRuntimeFactoryRegistry, patches } from "./patchTurbopack";
import type { PatchReport, PatchResult, PatchStats } from "./types";

const logger = new Logger("TurbopackPatcher", "#e78284");

interface PatchTiming {
    plugin: string;
    moduleId: number;
    match: PatchReplacement["match"];
    findTime: number;
    replaceTime: number;
}

export const patchTimings: PatchTiming[] | null = IS_DEV ? [] : null;

export const patchResults: PatchResult[] = [];

export const validateMisses = new Set<string>();

export const patchStats: PatchStats = {
    applied: 0,
    noEffect: 0,
    errors: 0,
    runtimeFallbacks: 0,
    patchedModules: new Set<number>(),
};

export const chunkFingerprint = new Set<string>();

export function getChunkFingerprint(): string[] {
    return [...chunkFingerprint];
}

function isFactoryPending(patch: Patch): boolean {
    const registry = getRuntimeFactoryRegistry();
    if (!registry) return false;
    const find = Array.isArray(patch.find) ? patch.find : [patch.find];
    for (const [, factory] of registry) {
        if (matchesAllPatterns(getFnSource(factory), find)) return true;
    }
    return false;
}

export function patchReport(): PatchReport {
    const orphaned: { plugin: string; find: string }[] = [];
    const pending: { plugin: string; find: string }[] = [];
    for (const p of patches) {
        if (p.all) continue;
        const entry = { plugin: p.plugin, find: String(p.find) };
        (isFactoryPending(p) ? pending : orphaned).push(entry);
    }
    return { stats: { ...patchStats, patchedModules: [...patchStats.patchedModules] }, results: patchResults, orphaned, pending };
}

export function reportOrphanedPatches(): void {
    const orphaned = patches.filter(p => !p.all && !isFactoryPending(p));
    const warnOrphaned = orphaned.filter(p => !p.noWarn);
    if (warnOrphaned.length)
        logger.warn(
            `${warnOrphaned.length} patch(es) found no module:`,
            warnOrphaned.map(p => `${p.plugin}: ${String(p.find)}`),
        );

    if (!patchStats.applied && (warnOrphaned.length || patchStats.noEffect)) {
        logger.warn("Zero patches applied this session — grok build likely changed, run the reporter.");
    }

    if (validateMisses.size) {
        logger.warn(`${validateMisses.size} disabled-plugin patch(es) no longer match:`, [...validateMisses]);
    }

    if (patchStats.noEffect || patchStats.errors) {
        for (const result of patchResults) {
            for (const rep of result.replacements) {
                if (rep.status === "noEffect" && !result.noWarn) logger.debug(`[no effect] ${result.plugin}: ${rep.match}`);
                else if (rep.status === "error") logger.debug(`[error] ${result.plugin}: ${rep.match}`);
            }
        }
    }

    if (IS_DEV) {
        for (const t of patchTimings!) {
            const patchTime = t.findTime + t.replaceTime;
            if (patchTime <= 20) continue;
            logger.warn(`Slow patch: ${t.plugin} on ${t.moduleId} (find: ${t.findTime.toFixed(1)}ms, replace: ${t.replaceTime.toFixed(1)}ms) ${String(t.match)}`);
        }
        patchTimings!.length = 0;
    }
}
