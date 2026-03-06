/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./PluginsTab.css";

import { isPluginEnabled, plugins } from "@api/PluginManager";
import {
    Button,
    ConfirmDialog,
    ErrorBoundary,
    Flex,
    Grid,
    Input,
    Paragraph,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Separator,
    Text,
} from "@components";
import { React, useCallback, useEffect, useMemo, useState } from "@turbopack/common/react";
import { classes, classNameFactory } from "@utils/css";
import { useFiltered } from "@utils/react";

import PluginCard from "../PluginCard";
import { type InputChangeEvent, type ListFilter } from "../utils";
import PluginDialog from "./PluginDialog";

const cl = classNameFactory("void-plugins-");

const getPluginKey = (name: string) => `${name} ${plugins[name].description ?? ""}`;

export default function PluginsTab() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ListFilter>("all");
    const [dialogName, setDialogName] = useState<string | null>(null);
    const [showReload, setShowReload] = useState(false);

    const { userPlugins, requiredPlugins } = useMemo(() => {
        const user: string[] = [];
        const required: string[] = [];
        for (const n of Object.keys(plugins).sort((a, b) => a.localeCompare(b))) {
            if (plugins[n].hidden) continue;
            if (plugins[n].required) required.push(n);
            else user.push(n);
        }
        return { userPlugins: user, requiredPlugins: required };
    }, []);

    const initialStatesRef = React.useRef<Map<string, boolean> | null>(null);
    const changedPluginsRef = React.useRef(new Set<string>());
    const dismissedRef = React.useRef(false);

    useEffect(() => {
        if (initialStatesRef.current) return;
        const map = new Map<string, boolean>();
        for (const n of userPlugins) map.set(n, isPluginEnabled(n));
        for (const n of requiredPlugins) map.set(n, isPluginEnabled(n));
        initialStatesRef.current = map;
    }, [userPlugins, requiredPlugins]);

    const visibleUser = useMemo(() => {
        if (filter === "all") return userPlugins;
        const enabled = filter === "enabled";
        return userPlugins.filter(n => isPluginEnabled(n) === enabled);
    }, [filter, userPlugins]);

    const visibleRequired = useMemo(() => {
        if (filter === "all") return requiredPlugins;
        const enabled = filter === "enabled";
        return requiredPlugins.filter(n => isPluginEnabled(n) === enabled);
    }, [filter, requiredPlugins]);

    const filteredUser = useFiltered(visibleUser, search, getPluginKey);
    const filteredRequired = useFiltered(visibleRequired, search, getPluginKey);

    const dialogPlugin = dialogName ? plugins[dialogName] : null;
    const hasResults = filteredUser.length > 0 || filteredRequired.length > 0;
    const needsReload = changedPluginsRef.current.size > 0;

    const onReload = useCallback((pluginName: string) => {
        const initialStates = initialStatesRef.current;
        const changedPlugins = changedPluginsRef.current;
        if (!initialStates) return;
        const current = isPluginEnabled(pluginName);
        if (current === initialStates.get(pluginName)) changedPlugins.delete(pluginName);
        else changedPlugins.add(pluginName);

        if (changedPlugins.size) {
            if (!dismissedRef.current) setShowReload(true);
        } else {
            setShowReload(false);
            dismissedRef.current = false;
        }
    }, []);

    const onDismiss = useCallback(() => {
        dismissedRef.current = true;
        setShowReload(false);
    }, []);

    return (
        <Flex flexDirection="column" gap="1.5rem">
            <Flex flexDirection="column" gap="0" className="px-3">
                <Text size="sm" weight="medium">
                    Plugins
                </Text>
                <Text size="xs" color="secondary">
                    Pick which plugins to use. Some need a page reload to kick in.
                </Text>
            </Flex>
            {needsReload && !showReload && (
                <Flex alignItems="center" className={classes(cl("reload-banner"), "mx-3")}>
                    <Text size="xs" className="text-inherit flex-1">
                        Reload the page to apply plugin changes.
                    </Text>
                    <Button variant="secondary" size="sm" onClick={() => location.reload()}>
                        Reload
                    </Button>
                </Flex>
            )}
            <Flex alignItems="center" gap="0.75rem" className="px-3">
                <Input
                    type="text"
                    placeholder={`Search ${visibleUser.length + visibleRequired.length} plugins...`}
                    value={search}
                    onChange={(e: InputChangeEvent) => setSearch(e.target.value)}
                    className="flex-1 min-w-0"
                />
                <Select value={filter} onValueChange={(v: string) => setFilter(v as ListFilter)}>
                    <SelectTrigger className="w-28">
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
                <Grid columns="repeat(2, 1fr)" className="px-3">
                    {filteredUser.map(n => (
                        <ErrorBoundary key={n} fallback={null}>
                            <PluginCard name={n} onSettings={setDialogName} onReload={onReload} />
                        </ErrorBoundary>
                    ))}
                </Grid>
            )}
            {filteredRequired.length > 0 && (
                <>
                    <Separator className="mx-3 w-auto" />
                    <Grid columns="repeat(2, 1fr)" className="px-3">
                        {filteredRequired.map(n => (
                            <ErrorBoundary key={n} fallback={null}>
                                <PluginCard name={n} onSettings={setDialogName} onReload={onReload} />
                            </ErrorBoundary>
                        ))}
                    </Grid>
                </>
            )}
            {!hasResults && (
                <Paragraph color="secondary" className="text-center py-8">
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
