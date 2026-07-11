/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RECON } from "./constants";
import type { ReconArgs } from "./types";
import { clampConfig, getFactorySourceCache } from "./utils";

type ReconCategory = NonNullable<ReconArgs["categories"]>[number];

interface ReconHit {
    id: number;
    s: string;
    at: number;
}

const CATEGORIES: Record<ReconCategory, RegExp> = {
    endpoints: /https?:\/\/[^\s"'`\\)]+|["'`]\/(?:api|v\d+|graphql|rest|_next\/data|internal)\/[^\s"'`\\)]{2,}/g,
    secrets: /AIza[0-9A-Za-z_-]{35}|AKIA[0-9A-Z]{16}|GOCSPX-[0-9A-Za-z_-]{20,}|gh[opsu]_[0-9A-Za-z]{30,}|xox[baprs]-[0-9A-Za-z-]{10,}|glpat-[0-9A-Za-z_-]{20}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}|(?:sk|pk|xai)[-_][A-Za-z0-9]{16,}|-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----|(?:api[_-]?key|secret|token|bearer|password)["':=\s]{1,4}["'`]([A-Za-z0-9_-]{12,})["'`]/gi,
    flags: /"((?:ENABLE|DISABLE|ALLOW|SHOW|HIDE|IS|HAS)_[A-Z][A-Z0-9_]+)"/g,
    sinks: /\.innerHTML\b|dangerouslySetInnerHTML|\beval\(|new Function\(|document\.write\(|insertAdjacentHTML|addEventListener\(["']message["']|\.onmessage\s*=/g,
    graphql: /gql`|["']operationName["']|__typename|persistedQuery|["']\/graphql["']/g,
    storage: /(?:local|session)Storage\.\w+|document\.cookie|indexedDB\.\w+/g,
};

const ALL_CATEGORIES = Object.keys(CATEGORIES) as ReconCategory[];

function scanCategory(cache: Map<number, string>, pattern: RegExp, limit: number, targetId?: number): ReconHit[] {
    const hits: ReconHit[] = [];
    const seen = new Set<string>();
    for (const [id, src] of cache) {
        if (targetId != null && id !== targetId) continue;
        pattern.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = pattern.exec(src)) !== null) {
            const raw = m[1] ?? m[0];
            const s = raw.length > RECON.MAX_MATCH_LENGTH ? raw.slice(0, RECON.MAX_MATCH_LENGTH) + "…" : raw;
            if (!seen.has(s)) {
                seen.add(s);
                hits.push({ id, s, at: m.index });
                if (hits.length >= limit) return hits;
            }
            if (m.index === pattern.lastIndex) pattern.lastIndex++;
        }
    }
    return hits;
}

export function handleRecon(args: ReconArgs): unknown {
    const cache = getFactorySourceCache();
    if (!cache.size) return { error: "Factory registry not available." };

    const limit = clampConfig(args.limit, { default: RECON.DEFAULT_LIMIT, max: RECON.MAX_LIMIT });
    const categories = args.categories?.length ? args.categories : ALL_CATEGORIES;

    const result: Record<string, unknown> = { scanned: args.moduleId != null ? 1 : cache.size };
    let used = 0;
    for (const cat of categories) {
        const hits = scanCategory(cache, CATEGORIES[cat], limit, args.moduleId);
        const kept: ReconHit[] = [];
        for (const h of hits) {
            used += h.s.length + 24;
            if (used > RECON.OUTPUT_BUDGET) break;
            kept.push(h);
        }
        result[cat] = { count: hits.length, returned: kept.length, capped: hits.length >= limit, truncatedForSize: kept.length < hits.length, hits: kept };
    }
    return result;
}
