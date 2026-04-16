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
    DialogFooter,
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
    Text,
} from "@components";
import { React, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { errorMessage } from "@utils/misc";
import { useFiltered } from "@utils/react";

import { CssEditor } from "../CssEditor";
import ThemeCard from "../ThemeCard";
import { type InputChangeEvent } from "../utils";
import { VoidDialogShell } from "./VoidDialogShell";

type ThemeFilter = "all" | "enabled" | "disabled" | "online" | "local";

const cl = classNameFactory("void-themes-");

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
                <Flex flexDirection="column" gap="0.25rem">
                    <Text size="sm" weight="medium">URL</Text>
                    <Input
                        type="text"
                        placeholder="https://raw.githubusercontent.com/..."
                        value={url}
                        onChange={(e: InputChangeEvent) => { setUrl(e.target.value); setError(""); }}
                        onKeyDown={(e: { key: string }) => { if (e.key === "Enter") handleImport(); }}
                    />
                </Flex>
                {error && <Text size="xs" className={cl("add-error")}>{error}</Text>}
                <DialogFooter className={cl("local-footer")}>
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleImport} disabled={loading || !url.trim()}>
                        {loading ? "Importing..." : "Import"}
                    </Button>
                </DialogFooter>
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
                <Flex flexDirection="column" gap="0.25rem">
                    <Text size="sm" weight="medium">Name</Text>
                    <Input
                        type="text"
                        placeholder="My Theme"
                        value={name}
                        onChange={(e: InputChangeEvent) => setName(e.target.value)}
                    />
                </Flex>
                <Flex flexDirection="column" gap="0.25rem" className={cl("local-css-field")}>
                    <Text size="sm" weight="medium">CSS</Text>
                    <CssEditor className={cl("local-editor")} value={css} onChange={setCss} placeholder="Paste your CSS here..." />
                </Flex>
                {error && <Text size="xs" className={cl("add-error")}>{error}</Text>}
                <DialogFooter className={cl("local-footer")}>
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim() || !css.trim()}>
                        {theme ? "Save" : "Create"}
                    </Button>
                </DialogFooter>
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
            {themes.length > 0 && (
                <Flex alignItems="center" gap="0.75rem">
                    <Input
                        type="text"
                        placeholder={`Search ${themes.length} themes...`}
                        value={search}
                        onChange={(e: InputChangeEvent) => setSearch(e.target.value)}
                        className="void-search-bar-input"
                    />
                    <Select value={filter} onValueChange={(v: string) => setFilter(v as ThemeFilter)}>
                        <SelectTrigger className="void-search-bar-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="local">Local</SelectItem>
                        </SelectContent>
                    </Select>
                </Flex>
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
