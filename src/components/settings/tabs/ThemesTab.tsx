/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ThemesTab.css";

import { addTheme, getThemes, isThemesEnabled, removeTheme, setThemesEnabled, type ThemeData } from "@api/Themes";
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
    Switch,
    Text,
} from "@components";
import { React, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { errorMessage } from "@utils/misc";
import { useFiltered } from "@utils/react";
import { pluralize } from "@utils/text";

import ThemeCard from "../ThemeCard";
import { type InputChangeEvent, type ListFilter } from "../utils";

const cl = classNameFactory("void-themes-");

const getThemeKey = (t: ThemeData) => `${t.name} ${t.description ?? ""} ${t.author ?? ""}`;

export default function ThemesTab() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ListFilter>("all");
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [enabled, setEnabled] = useState(isThemesEnabled);
    const [themes, setThemes] = useState(getThemes);

    const visible = useMemo(() => {
        if (filter === "all") return themes;
        const enabled = filter === "enabled";
        return themes.filter(t => t.enabled === enabled);
    }, [themes, filter]);

    const filtered = useFiltered(visible, search, getThemeKey);

    const handleToggle = (checked: boolean) => {
        setEnabled(checked);
        setThemesEnabled(checked);
    };

    const handleAdd = async () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        setError("");
        setLoading(true);
        try {
            await addTheme(trimmed);
            setUrl("");
            setThemes(getThemes());
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    const [removeUrl, setRemoveUrl] = useState<string | null>(null);
    const removeTarget = removeUrl ? themes.find(t => t.url === removeUrl) : null;

    const handleRemove = () => {
        if (!removeUrl) return;
        removeTheme(removeUrl);
        setRemoveUrl(null);
        setThemes(getThemes());
    };

    return (
        <Flex flexDirection="column" gap="2rem">
            <Flex alignItems="center" justifyContent="space-between" className={cl("section")}>
                <Flex flexDirection="column" gap="0">
                    <Text size="sm" weight="medium">
                        Themes
                    </Text>
                    <Text size="xs" color="secondary">
                        Custom CSS themes for Grok. Paste a URL to a .css file to add one.
                    </Text>
                </Flex>
                <Switch checked={enabled} onCheckedChange={handleToggle} />
            </Flex>
            <Flex flexDirection="column" gap="0.5rem" className={cl("section")}>
                <Flex alignItems="center" gap="0.5rem">
                    <Input
                        type="text"
                        placeholder="https://raw.githubusercontent.com/..."
                        value={url}
                        onChange={(e: InputChangeEvent) => { setUrl(e.target.value); setError(""); }}
                        onKeyDown={(e: { key: string }) => { if (e.key === "Enter") handleAdd(); }}
                        className={cl("search-input")}
                    />
                    <Button variant="primary" size="sm" className={cl("import-btn")} onClick={handleAdd} disabled={loading || !url.trim()}>
                        {loading ? "Importing..." : "Import"}
                    </Button>
                </Flex>
                {error && <Text size="xs" className={cl("add-error")}>{error}</Text>}
            </Flex>
            {themes.length > 0 && (
                <Flex flexDirection="column" gap="0.375rem" className={cl("section")}>
                    <Flex flexDirection="column" gap="0">
                        <Text size="sm" weight="medium">Installed Themes</Text>
                        <Text size="xs" color="secondary">
                            Re-fetched every page load. Use the switch above to disable all themes at once.
                        </Text>
                    </Flex>
                    <Text size="xs" color="secondary">
                        {`${pluralize(themes.length, "theme")} installed \u00B7 ${themes.filter(t => t.enabled).length} enabled`}
                    </Text>
                </Flex>
            )}
            {themes.length > 0 && (
                <Flex alignItems="center" gap="0.75rem" className={cl("section")}>
                    <Input
                        type="text"
                        placeholder={`Search ${themes.length} themes...`}
                        value={search}
                        onChange={(e: InputChangeEvent) => setSearch(e.target.value)}
                        className={cl("search-input")}
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
            )}
            {filtered.length > 0 && (
                <Grid columns="repeat(2, 1fr)" className={cl("section")}>
                    {filtered.map(t => (
                        <ErrorBoundary key={t.url} fallback={null}>
                            <ThemeCard theme={t} globalEnabled={enabled} onRemove={setRemoveUrl} onToggle={() => setThemes(getThemes())} />
                        </ErrorBoundary>
                    ))}
                </Grid>
            )}
            {themes.length > 0 && !filtered.length && (
                <Paragraph color="secondary" className={cl("empty")}>
                    No themes match your search.
                </Paragraph>
            )}
            {!themes.length && (
                <Paragraph color="secondary" className={cl("empty")}>
                    No themes added yet. Paste a URL above to add one.
                </Paragraph>
            )}
            <ConfirmDialog
                open={removeUrl != null}
                onOpenChange={v => { if (!v) setRemoveUrl(null); }}
                title="Remove theme"
                description={`Are you sure you want to remove "${removeTarget?.name ?? "this theme"}"?`}
                confirmText="Remove"
                cancelText="Cancel"
                danger
                onConfirm={handleRemove}
            />
        </Flex>
    );
}
