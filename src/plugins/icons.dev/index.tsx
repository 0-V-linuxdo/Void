/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Button, ErrorBoundary, Flex, Grid, Input, Paragraph, Text } from "@components";
import { TelescopeIcon } from "@components/icons";
import { allTabs } from "@plugins/_core/settings";
import { React, useMemo, useState } from "@turbopack/common/react";
import { Toaster } from "@turbopack/common/utils";
import { getModuleCache, isBlacklisted, syncLazyModules } from "@turbopack/patchTurbopack";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { copyToClipboard } from "@utils/misc";
import { useFiltered } from "@utils/react";
import definePlugin, { StartAt } from "@utils/types";
import type { ComponentType } from "react";

const cl = classNameFactory("void-icons-");

interface IconEntry {
    name: string;
    component: ComponentType<any>;
}

function countKeys(obj: any): number {
    let count = 0;
    for (const _ in obj) if (++count > 3) return count;
    return count;
}

function collectIcons(): IconEntry[] {
    syncLazyModules();
    const cache = getModuleCache();
    const icons: IconEntry[] = [];
    const seen = new Set<string>();

    for (const [, exports] of cache) {
        if (exports == null || typeof exports !== "object" || isBlacklisted(exports)) continue;
        if (countKeys(exports) > 3) continue;
        for (const key in exports) {
            if (key === "Icon" || !key.endsWith("Icon") || seen.has(key)) continue;
            try {
                const val = exports[key];
                if (typeof val !== "function") continue;
                seen.add(key);
                icons.push({ name: key, component: val });
            } catch {}
        }
    }

    icons.sort((a, b) => a.name.localeCompare(b.name));
    return icons;
}

function IconCard({ entry }: { entry: IconEntry }) {
    const finderCode = `findExportedComponent("${entry.name}")`;

    async function onClick() {
        await copyToClipboard(finderCode);
        Toaster.toast.success(`Copied: ${finderCode}`);
    }

    const Comp = entry.component;

    return (
        <ErrorBoundary fallback={null}>
            <Button variant="ghost" className={cl("item")} onClick={onClick} title={finderCode}>
                <div className={cl("item-icon")}>
                    <Comp size="20" />
                </div>
                <Text size="xs" className={cl("item-name")}>
                    {entry.name.replace(/Icon$/, "")}
                </Text>
            </Button>
        </ErrorBoundary>
    );
}

const getIconKey = (entry: IconEntry) => entry.name;

function IconsTab() {
    const [search, setSearch] = useState("");
    const icons = useMemo(collectIcons, []);
    const filtered = useFiltered(icons, search, getIconKey);

    return (
        <Flex flexDirection="column" gap="1.5rem">
            <Flex flexDirection="column" gap="0" className={cl("section")}>
                <Text size="sm" weight="medium">Icons</Text>
                <Paragraph>{`Browse ${icons.length} Grok icons. Click to copy the finder code.`}</Paragraph>
            </Flex>
            <Flex className={cl("section")}>
                <Input
                    type="text"
                    placeholder={`Search ${icons.length} icons...`}
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    className={cl("search")}
                />
            </Flex>
            {filtered.length > 0 ? (
                <Grid columns="repeat(auto-fill, minmax(100px, 1fr))" gap="0.5rem" className={cl("section")}>
                    {filtered.map(entry => (
                        <IconCard key={entry.name} entry={entry} />
                    ))}
                </Grid>
            ) : (
                <Paragraph className={cl("empty")}>
                    {search ? "No icons match your search." : "No icons found."}
                </Paragraph>
            )}
        </Flex>
    );
}

export default definePlugin({
    name: "IconsBrowser",
    description: "Browse and copy Grok icon finder codes.",
    authors: [Devs.Prism],
    dev: true,

    startAt: StartAt.TurbopackReady,

    start() {
        allTabs.push({
            id: "void_icons_tab",
            name: "Icons",
            icon: TelescopeIcon,
            component: IconsTab,
        });
    },

    stop() {
        const idx = allTabs.findIndex(t => t.id === "void_icons_tab");
        if (idx !== -1) allTabs.splice(idx, 1);
    },
});
