/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../shared.css";
import "./PluginsTab.css";

import { subscribe } from "@api/Events";
import { isPluginEnabled, plugins } from "@api/PluginManager";
import { getPinnedPlugins } from "@api/Settings";
import {
    Button,
    ConfirmDialog,
    ErrorBoundary,
    Flex,
    Grid,
    Paragraph,
    SectionHeader,
    Separator,
    Text,
} from "@components";
import { React, useCallback, useEffect, useMemo, useRef, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { useFiltered } from "@utils/react";

import PluginCard from "../PluginCard";
import { type ListFilter } from "../utils";
import PluginDialog from "./PluginDialog";
import { SearchFilterBar } from "./SearchFilterBar";

const cl = classNameFactory("void-plugins-");

const FILTER_OPTIONS: readonly { value: ListFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "enabled", label: "Enabled" },
    { value: "disabled", label: "Disabled" },
];

const getPluginKey = (name: string) => `${name} ${plugins[name].description ?? ""}`;

function filterByEnabled(list: string[], filter: ListFilter): string[] {
    if (filter === "all") return list;
    const enabled = filter === "enabled";
    return list.filter(n => isPluginEnabled(n) === enabled);
}

function sortPinnedFirst(list: string[]): string[] {
    const pinned = getPinnedPlugins();
    if (!pinned.length) return list;
    const rank = new Map(pinned.map((n, i) => [n, i]));
    return list.toSorted((a, b) => {
        const pa = rank.has(a);
        const pb = rank.has(b);
        if (pa !== pb) return pa ? -1 : 1;
        if (pa) return (rank.get(a) ?? 0) - (rank.get(b) ?? 0);
        return 0;
    });
}

let pendingPluginDialog: string | null = null;

export function setPendingPluginDialog(name: string): void {
    pendingPluginDialog = name;
}

export function consumePendingPluginDialog(): string | null {
    const name = pendingPluginDialog;
    pendingPluginDialog = null;
    return name;
}

export default function PluginsTab() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ListFilter>("all");
    const [dialogName, setDialogName] = useState<string | null>(null);
    const [showReload, setShowReload] = useState(false);
    const [needsReload, setNeedsReload] = useState(false);
    const [toggleTick, setToggleTick] = useState(0);

    const { userPlugins, requiredPlugins } = useMemo(() => {
        const userPlugins: string[] = [];
        const requiredPlugins: string[] = [];
        for (const n of Object.keys(plugins).toSorted((a, b) => a.localeCompare(b))) {
            if (plugins[n].hidden) continue;
            (plugins[n].required ? requiredPlugins : userPlugins).push(n);
        }
        return { userPlugins, requiredPlugins };
    }, []);

    const initialStatesRef = useRef<Map<string, boolean> | null>(null);
    const changedPluginsRef = useRef(new Set<string>());
    const dismissedRef = useRef(false);

    useEffect(() => {
        if (initialStatesRef.current) return;
        const map = new Map<string, boolean>();
        for (const n of [...userPlugins, ...requiredPlugins]) map.set(n, isPluginEnabled(n));
        initialStatesRef.current = map;
    }, [userPlugins, requiredPlugins]);

    useEffect(() => {
        const pending = consumePendingPluginDialog();
        if (pending) setDialogName(pending);
    }, []);

    useEffect(() => subscribe("pluginToggle", () => setToggleTick(t => t + 1)), []);
    useEffect(() => subscribe("pluginPin", () => setToggleTick(t => t + 1)), []);

    useEffect(() => subscribe("reloadNeeded", () => {
        changedPluginsRef.current.add("__settings__");
        setNeedsReload(true);
        if (!dismissedRef.current) setShowReload(true);
    }), []);

    const visibleUser = useMemo(() => sortPinnedFirst(filterByEnabled(userPlugins, filter)), [filter, userPlugins, toggleTick]);
    const visibleRequired = useMemo(() => filterByEnabled(requiredPlugins, filter), [filter, requiredPlugins, toggleTick]);

    const filteredUser = useFiltered(visibleUser, search, getPluginKey);
    const filteredRequired = useFiltered(visibleRequired, search, getPluginKey);

    const dialogPlugin = dialogName ? plugins[dialogName] : null;
    const hasResults = filteredUser.length > 0 || filteredRequired.length > 0;

    const onReload = useCallback((pluginName: string) => {
        const initialStates = initialStatesRef.current;
        if (!initialStates) return;
        const changed = changedPluginsRef.current;

        if (isPluginEnabled(pluginName) === initialStates.get(pluginName)) changed.delete(pluginName);
        else changed.add(pluginName);

        if (!changed.size) {
            setNeedsReload(false);
            setShowReload(false);
            dismissedRef.current = false;
        } else {
            setNeedsReload(true);
            if (!dismissedRef.current) setShowReload(true);
        }
    }, []);

    const onDismiss = useCallback(() => {
        dismissedRef.current = true;
        setShowReload(false);
    }, []);

    return (
        <Flex flexDirection="column" gap="1rem" className="void-tab-root">
            <SectionHeader title="Plugins" description="Turn Void features on or off. Some require a reload to apply. Click the dots on a plugin to configure it." />
            {needsReload && !showReload && (
                <Flex alignItems="center" className={cl("reload-banner")}>
                    <Text size="xs" className={cl("reload-text")}>
                        Reload the page to apply plugin changes.
                    </Text>
                    <Button variant="secondary" size="sm" onClick={() => location.reload()}>
                        Reload
                    </Button>
                </Flex>
            )}
            <SearchFilterBar<ListFilter>
                placeholder={`Search ${visibleUser.length + visibleRequired.length} plugins...`}
                search={search}
                onSearchChange={setSearch}
                filter={filter}
                onFilterChange={setFilter}
                options={FILTER_OPTIONS}
            />
            {filteredUser.length > 0 && (
                <Grid columns="repeat(2, 1fr)">
                    {filteredUser.map(n => (
                        <ErrorBoundary key={n} fallback={null}>
                            <PluginCard name={n} onSettings={setDialogName} onReload={onReload} />
                        </ErrorBoundary>
                    ))}
                </Grid>
            )}
            {filteredRequired.length > 0 && (
                <>
                    <Separator />
                    <Grid columns="repeat(2, 1fr)">
                        {filteredRequired.map(n => (
                            <ErrorBoundary key={n} fallback={null}>
                                <PluginCard name={n} onSettings={setDialogName} onReload={onReload} />
                            </ErrorBoundary>
                        ))}
                    </Grid>
                </>
            )}
            {!hasResults && (
                <Paragraph color="secondary" className="void-tab-empty">
                    {search ? "No plugins match your search." : "No plugins available."}
                </Paragraph>
            )}
            {dialogPlugin && <PluginDialog plugin={dialogPlugin} onClose={() => setDialogName(null)} />}
            <ConfirmDialog
                open={showReload}
                onOpenChange={v => { if (!v) onDismiss(); }}
                title="Reload required"
                description="This plugin patches Grok's code, so you need to reload the page."
                confirmText="Reload"
                cancelText="Later"
                onConfirm={() => location.reload()}
            />
        </Flex>
    );
}
