/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NoticeType, showNotice } from "@api/Notices";
import { fetchExternal } from "@utils/misc";

import { Logger } from "./Logger";

const logger = new Logger("UpdateChecker", "#85c1dc");

function isNewer(remote: string, local: string): boolean {
    const r = remote.split(".").map(Number);
    const l = local.split(".").map(Number);
    for (let i = 0; i < Math.max(r.length, l.length); i++) {
        const a = r[i] ?? 0, b = l[i] ?? 0;
        if (a > b) return true;
        if (a < b) return false;
    }
    return false;
}

export async function checkForUpdates() {
    try {
        const resp = await fetchExternal(`${REPO_RAW_URL}/main/package.json`);
        if (!resp.ok) return;

        const { version: latest } = await resp.json() as { version: string };
        if (!latest || !isNewer(latest, VERSION)) {
            logger.info(`Up to date (${VERSION})`);
            return;
        }

        logger.info(`Update available: ${VERSION} → ${latest}`);

        showNotice({
            message: "Void has been updated to a newer version. Please update from",
            type: NoticeType.WARNING,
            link: IS_EXTENSION
                ? { url: REPO_URL, label: "GitHub" }
                : { url: "https://greasyfork.org/en/scripts/567871-void", label: "Greasy Fork" },
            suffix: "to the new version.",
        });
    } catch (e) {
        logger.warn("Failed to check for updates", e);
    }
}
