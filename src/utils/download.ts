/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FileUtils } from "@turbopack/common/utils";
import { Logger } from "@utils/Logger";
import { dedupeNames, fetchExternal } from "@utils/misc";
import { createZip } from "@utils/zip";

const logger = new Logger("Download");

export interface DownloadEntry {
    url: string;
    name: string;
}

export async function fetchAndDownload(url: string, filename: string): Promise<boolean> {
    try {
        const res = await fetchExternal(url);
        if (!res.ok) { logger.warn("Failed to fetch:", url, res.status); return false; }
        await FileUtils.downloadBlob(await res.blob(), filename);
        return true;
    } catch (e) {
        logger.error("Failed to download:", url, e);
        return false;
    }
}

export async function fetchAndZip(entries: DownloadEntry[], zipName: string): Promise<number> {
    const names = dedupeNames(entries.map(e => e.name));
    const files: Record<string, Uint8Array> = {};

    await Promise.all(entries.map(async (entry, i) => {
        try {
            const res = await fetchExternal(entry.url);
            if (!res.ok) { logger.warn("Failed to fetch:", entry.url); return; }
            files[names[i]] = new Uint8Array(await res.arrayBuffer());
        } catch (e) {
            logger.error("Failed to fetch:", entry.url, e);
        }
    }));

    const count = Object.keys(files).length;
    if (!count) return 0;

    await FileUtils.downloadBlob(createZip(files), zipName);
    return count;
}
