/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { NoticeType, showNotice } from "@api/Notices";
import { fetchExternal, sleep } from "@utils/misc";

import { Logger } from "./Logger";

const logger = new Logger("UpdateChecker", "#85c1dc");
const SEMVER_RE = /^\d+\.\d+\.\d+$/;

const UPDATE_URL = IS_EXTENSION ? REPO_URL : "https://greasyfork.org/en/scripts/567871-void";

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
        if (!latest || !SEMVER_RE.test(latest)) return;
        if (!isNewer(latest, VERSION)) {
            logger.info(`Up to date (${VERSION})`);
            return;
        }

        logger.info(`Update available: ${VERSION} → ${latest}`);

        // wait for sonner to mount
        await sleep(3000);

        showNotice({
            message: "Void is outdated, please update to the new version.",
            type: NoticeType.WARNING,
            action: { label: "Update", onClick: () => window.open(UPDATE_URL, "_blank") },
        });
    } catch (e) {
        logger.warn("Failed to check for updates", e);
    }
}
