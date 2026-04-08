/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../shared.css";
import "./PluginsTab.css";

import { subscribe } from "@api/Events";
import { isPluginEnabled, plugins } from "@api/PluginManager";
import {
    Button,
    ConfirmDialog,
    ErrorBoundary,
    Flex,
    Grid,
    Input,
    Paragraph,
    SectionHeader,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Separator,
    Text,
} from "@components";
import { consumePendingPluginDialog } from "@plugins/_core/settings";
import { React, useCallback, useEffect, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { useFiltered } from "@utils/react";

import PluginCard from "../PluginCard";
import { type InputChangeEvent, type ListFilter } from "../utils";
import PluginDialog from "./PluginDialog";

const cl = classNameFactory("void-plugins-");

const getPluginKey = (name: string) => `${name} ${plugins[name].description ?? ""}`;

function filterByEnabled(list: string[], filter: ListFilter): string[] {
    if (filter === "all") return list;
    const enabled = filter === "enabled";
    return list.filter(n => isPluginEnabled(n) === enabled);
}

export default function PluginsTab() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ListFilter>("all");
    const [dialogName, setDialogName] = useState<string | null>(null);
    const [showReload, setShowReload] = useState(false);
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

    const initialStatesRef = React.useRef<Map<string, boolean> | null>(null);
    const changedPluginsRef = React.useRef(new Set<string>());
    const dismissedRef = React.useRef(false);

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

    useEffect(() => subscribe("reloadNeeded", () => {
        changedPluginsRef.current.add("__settings__");
        if (!dismissedRef.current) setShowReload(true);
    }), []);

    const visibleUser = useMemo(() => filterByEnabled(userPlugins, filter), [filter, userPlugins, toggleTick]);
    const visibleRequired = useMemo(() => filterByEnabled(requiredPlugins, filter), [filter, requiredPlugins, toggleTick]);

    const filteredUser = useFiltered(visibleUser, search, getPluginKey);
    const filteredRequired = useFiltered(visibleRequired, search, getPluginKey);

    const dialogPlugin = dialogName ? plugins[dialogName] : null;
    const hasResults = filteredUser.length > 0 || filteredRequired.length > 0;
    const needsReload = changedPluginsRef.current.size > 0;

    const onReload = useCallback((pluginName: string) => {
        const initialStates = initialStatesRef.current;
        if (!initialStates) return;
        const changed = changedPluginsRef.current;

        if (isPluginEnabled(pluginName) === initialStates.get(pluginName)) changed.delete(pluginName);
        else changed.add(pluginName);

        if (!changed.size) {
            setShowReload(false);
            dismissedRef.current = false;
        } else if (!dismissedRef.current) {
            setShowReload(true);
        }
    }, []);

    const onDismiss = useCallback(() => {
        dismissedRef.current = true;
        setShowReload(false);
    }, []);

    return (
        <Flex flexDirection="column" gap="1.5rem">
            <SectionHeader title="Plugins" description="Pick which plugins to use. Some need a page reload to kick in." />
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
            <Flex alignItems="center" gap="0.75rem" className="void-tab-section">
                <Input
                    type="text"
                    placeholder={`Search ${visibleUser.length + visibleRequired.length} plugins...`}
                    value={search}
                    onChange={(e: InputChangeEvent) => setSearch(e.target.value)}
                    className="void-search-bar-input"
                />
                <Select value={filter} onValueChange={(v: string) => setFilter(v as ListFilter)}>
                    <SelectTrigger className={cl("filter-select")}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                </Select>
            </Flex>
            {filteredUser.length > 0 && (
                <Grid columns="repeat(2, 1fr)" className="void-tab-section">
                    {filteredUser.map(n => (
                        <ErrorBoundary key={n} fallback={null}>
                            <PluginCard name={n} onSettings={setDialogName} onReload={onReload} />
                        </ErrorBoundary>
                    ))}
                </Grid>
            )}
            {filteredRequired.length > 0 && (
                <>
                    <Separator className={cl("divider")} />
                    <Grid columns="repeat(2, 1fr)" className="void-tab-section">
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
            {dialogPlugin && <PluginDialog plugin={dialogPlugin} open={true} onClose={() => setDialogName(null)} />}
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
