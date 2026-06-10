/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../shared.css";
import "./ThemesTab.css";

import { addLocalTheme, addTheme, getThemes, removeTheme, type ThemeData, updateLocalTheme } from "@api/Themes";
import {
    Button,
    ConfirmDialog,
    Dialog,
    ErrorBoundary,
    Flex,
    Grid,
    Input,
    Paragraph,
    SectionHeader,
    Separator,
    Text,
} from "@components";
import { React, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { errorMessage } from "@utils/misc";
import { useFiltered } from "@utils/react";

import { CssEditor } from "../CssEditor";
import ThemeCard from "../ThemeCard";
import { type InputChangeEvent } from "../utils";
import { SearchFilterBar } from "./SearchFilterBar";
import { DialogActions, DialogField, VoidDialogShell } from "./VoidDialogShell";

type ThemeFilter = "all" | "enabled" | "disabled" | "online" | "local";

const cl = classNameFactory("void-themes-");

const FILTER_OPTIONS: readonly { value: ThemeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "enabled", label: "Enabled" },
    { value: "disabled", label: "Disabled" },
    { value: "online", label: "Online" },
    { value: "local", label: "Local" },
];

const getThemeKey = (t: ThemeData) => `${t.name} ${t.description ?? ""} ${t.author ?? ""}`;

interface LocalThemeDialogProps {
    open: boolean;
    onClose(): void;
    theme?: ThemeData;
    onSave(): void;
}

interface OnlineThemeDialogProps {
    open: boolean;
    onClose(): void;
    onSave(): void;
}

function OnlineThemeDialog({ open, onClose, onSave }: OnlineThemeDialogProps) {
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleImport = async () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        setError("");
        setLoading(true);
        try {
            await addTheme(trimmed);
            onSave();
            onClose();
        } catch (e) {
            setError(errorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <VoidDialogShell title="Add Online Theme">
                <DialogField label="URL">
                    <Input
                        type="text"
                        placeholder="https://raw.githubusercontent.com/..."
                        value={url}
                        onChange={(e: InputChangeEvent) => { setUrl(e.target.value); setError(""); }}
                        onKeyDown={(e: { key: string }) => { if (e.key === "Enter") handleImport(); }}
                    />
                </DialogField>
                {error && <Text size="xs" className={cl("add-error")}>{error}</Text>}
                <DialogActions
                    className={cl("local-footer")}
                    onCancel={onClose}
                    confirmLabel={loading ? "Importing..." : "Import"}
                    onConfirm={handleImport}
                    confirmDisabled={loading || !url.trim()}
                />
            </VoidDialogShell>
        </Dialog>
    );
}

function LocalThemeDialog({ open, onClose, theme, onSave }: LocalThemeDialogProps) {
    const [name, setName] = useState(theme?.name ?? "");
    const [css, setCss] = useState(theme?.css ?? "");
    const [error, setError] = useState("");

    const handleSave = () => {
        setError("");
        try {
            if (theme) {
                updateLocalTheme(theme.url, { name, css });
            } else {
                addLocalTheme(name, css);
            }
            onSave();
            onClose();
        } catch (e) {
            setError(errorMessage(e));
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
            <VoidDialogShell title={theme ? "Edit Local Theme" : "New Local Theme"}>
                <DialogField label="Name">
                    <Input
                        type="text"
                        placeholder="My Theme"
                        value={name}
                        onChange={(e: InputChangeEvent) => setName(e.target.value)}
                    />
                </DialogField>
                <DialogField label="CSS" className={cl("local-css-field")}>
                    <CssEditor className={cl("local-editor")} value={css} onChange={setCss} placeholder="Paste your CSS here..." />
                </DialogField>
                {error && <Text size="xs" className={cl("add-error")}>{error}</Text>}
                <DialogActions
                    className={cl("local-footer")}
                    onCancel={onClose}
                    confirmLabel={theme ? "Save" : "Create"}
                    onConfirm={handleSave}
                    confirmDisabled={!name.trim() || !css.trim()}
                />
            </VoidDialogShell>
        </Dialog>
    );
}

export default function ThemesTab() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ThemeFilter>("all");
    const [themes, setThemes] = useState(getThemes);
    const [localDialogOpen, setLocalDialogOpen] = useState(false);
    const [onlineDialogOpen, setOnlineDialogOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<ThemeData | undefined>();

    const refreshThemes = () => setThemes(getThemes());

    const visible = useMemo(() => {
        switch (filter) {
            case "enabled": return themes.filter(t => t.enabled);
            case "disabled": return themes.filter(t => !t.enabled);
            case "online": return themes.filter(t => !t.local);
            case "local": return themes.filter(t => t.local);
            default: return themes;
        }
    }, [themes, filter]);

    const filtered = useFiltered(visible, search, getThemeKey);

    const [removeUrl, setRemoveUrl] = useState<string | null>(null);
    const removeTarget = removeUrl ? themes.find(t => t.url === removeUrl) : null;

    const handleRemove = () => {
        if (!removeUrl) return;
        removeTheme(removeUrl);
        setRemoveUrl(null);
        refreshThemes();
    };

    return (
        <Flex flexDirection="column" gap="1rem" className="void-tab-root">
            <Flex alignItems="center" justifyContent="space-between" gap="0.75rem">
                <SectionHeader title="Online Themes" description="Load themes from a URL. Re-fetched on every page load so updates apply automatically." />
                <Button variant="secondary" size="md" onClick={() => setOnlineDialogOpen(true)}>
                    Manage
                </Button>
            </Flex>
            <Flex alignItems="center" justifyContent="space-between" gap="0.75rem">
                <SectionHeader title="Local Themes" description="Custom CSS stored only on this device. Good for private tweaks or drafts you don't want to host publicly." />
                <Button variant="secondary" size="md" onClick={() => { setEditingTheme(undefined); setLocalDialogOpen(true); }}>
                    Manage
                </Button>
            </Flex>
            <Separator />
            {themes.length > 0 && (
                <SearchFilterBar
                    placeholder={`Search ${themes.length} themes...`}
                    search={search}
                    onSearchChange={setSearch}
                    filter={filter}
                    onFilterChange={f => setFilter(f)}
                    options={FILTER_OPTIONS}
                    selectClassName="void-search-bar-select"
                />
            )}
            {filtered.length > 0 && (
                <Grid columns="repeat(2, 1fr)">
                    {filtered.map(t => (
                        <ErrorBoundary key={t.url} fallback={null}>
                            <ThemeCard theme={t} onRemove={setRemoveUrl} onToggle={() => refreshThemes()} onEdit={t.local ? () => { setEditingTheme(t); setLocalDialogOpen(true); } : undefined} />
                        </ErrorBoundary>
                    ))}
                </Grid>
            )}
            {themes.length > 0 && !filtered.length && (
                <Paragraph color="secondary" className="void-tab-empty">
                    No themes match your search.
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
            {onlineDialogOpen && (
                <OnlineThemeDialog
                    open={onlineDialogOpen}
                    onClose={() => setOnlineDialogOpen(false)}
                    onSave={() => refreshThemes()}
                />
            )}
            {localDialogOpen && (
                <LocalThemeDialog
                    open={localDialogOpen}
                    onClose={() => setLocalDialogOpen(false)}
                    theme={editingTheme}
                    onSave={() => refreshThemes()}
                />
            )}
        </Flex>
    );
}
