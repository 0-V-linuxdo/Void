/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../shared.css";
import "./ThemesTab.css";

import { addLocalTheme, addTheme, getThemes, isOnlineThemesEnabled, removeTheme, setOnlineThemesEnabled, type ThemeData, updateLocalTheme } from "@api/Themes";
import {
    Button,
    ConfirmDialog,
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { Cross2Icon, PlusIcon } from "@components/icons";
import { React, useMemo, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { errorMessage } from "@utils/misc";
import { useFiltered } from "@utils/react";
import { pluralize } from "@utils/text";

import ThemeCard from "../ThemeCard";
import { type InputChangeEvent } from "../utils";

type ThemeFilter = "all" | "enabled" | "disabled" | "online" | "local";

const cl = classNameFactory("void-themes-");

const getThemeKey = (t: ThemeData) => `${t.name} ${t.description ?? ""} ${t.author ?? ""}`;

interface LocalThemeDialogProps {
    open: boolean;
    onClose(): void;
    theme?: ThemeData;
    onSave(): void;
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
            <DialogContent className="void-dialog-content" aria-describedby={undefined}>
                <DialogClose asChild>
                    <Button variant="tertiary" size="sm" shape="square" aria-label="Close" className="void-dialog-close">
                        <Cross2Icon />
                    </Button>
                </DialogClose>
                <DialogHeader className="void-dialog-header">
                    <DialogTitle>{theme ? "Edit Local Theme" : "New Local Theme"}</DialogTitle>
                </DialogHeader>
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
                    <textarea
                        className={cl("local-textarea")}
                        placeholder="Paste your CSS here..."
                        value={css}
                        onChange={e => setCss(e.target.value)}
                        spellCheck={false}
                    />
                </Flex>
                {error && <Text size="xs" className={cl("add-error")}>{error}</Text>}
                <DialogFooter className={cl("local-footer")}>
                    <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim() || !css.trim()}>
                        {theme ? "Save" : "Create"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ThemesTab() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<ThemeFilter>("all");
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [onlineEnabled, setOnlineEnabled] = useState(isOnlineThemesEnabled);
    const [themes, setThemes] = useState(getThemes);
    const [localDialogOpen, setLocalDialogOpen] = useState(false);
    const [editingTheme, setEditingTheme] = useState<ThemeData | undefined>();

    const visible = useMemo(() => {
        switch (filter) {
            case "enabled": return themes.filter(t => t.enabled);
            case "disabled": return themes.filter(t => !t.enabled);
            case "online": return themes.filter(t => !t.local);
            case "local": return themes.filter(t => !!t.local);
            default: return themes;
        }
    }, [themes, filter]);

    const filtered = useFiltered(visible, search, getThemeKey);

    const handleOnlineToggle = (checked: boolean) => {
        setOnlineEnabled(checked);
        setOnlineThemesEnabled(checked);
        setThemes(getThemes());
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
            <Flex alignItems="center" justifyContent="space-between" className="void-tab-section">
                <Flex flexDirection="column" gap="0">
                    <Text size="sm" weight="medium">Online Themes</Text>
                    <Paragraph>Allow loading themes from external URLs. Disable to only use local themes.</Paragraph>
                </Flex>
                <Switch checked={onlineEnabled} onCheckedChange={handleOnlineToggle} />
            </Flex>
            <Flex flexDirection="column" gap="0.5rem" className="void-tab-section">
                <Flex alignItems="center" gap="0.5rem">
                    <Input
                        type="text"
                        placeholder="https://raw.githubusercontent.com/..."
                        value={url}
                        onChange={(e: InputChangeEvent) => { setUrl(e.target.value); setError(""); }}
                        onKeyDown={(e: { key: string }) => { if (e.key === "Enter") handleAdd(); }}
                        className="void-search-bar-input"
                    />
                    <Button variant="primary" size="sm" className={cl("import-btn")} onClick={handleAdd} disabled={loading || !url.trim()}>
                        {loading ? "Importing..." : "Import"}
                    </Button>
                    <Button variant="secondary" size="sm" className={cl("import-btn")} onClick={() => { setEditingTheme(undefined); setLocalDialogOpen(true); }}>
                        <PlusIcon size={14} /> Local
                    </Button>
                </Flex>
                {error && <Text size="xs" className={cl("add-error")}>{error}</Text>}
            </Flex>
            {themes.length > 0 && (
                <Flex flexDirection="column" gap="0.375rem" className="void-tab-section">
                    <Flex flexDirection="column" gap="0">
                        <Text size="sm" weight="medium">Installed Themes</Text>
                        <Paragraph>Re-fetched every page load.</Paragraph>
                    </Flex>
                    <Paragraph>
                        {`${pluralize(themes.length, "theme")} installed \u00B7 ${themes.filter(t => t.enabled).length} enabled`}
                    </Paragraph>
                </Flex>
            )}
            {themes.length > 0 && (
                <Flex alignItems="center" gap="0.75rem" className="void-tab-section">
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
                <Grid columns="repeat(2, 1fr)" className="void-tab-section">
                    {filtered.map(t => (
                        <ErrorBoundary key={t.url} fallback={null}>
                            <ThemeCard theme={t} globalEnabled={!!t.local || onlineEnabled} onRemove={setRemoveUrl} onToggle={() => setThemes(getThemes())} onEdit={t.local ? () => { setEditingTheme(t); setLocalDialogOpen(true); } : undefined} />
                        </ErrorBoundary>
                    ))}
                </Grid>
            )}
            {themes.length > 0 && !filtered.length && (
                <Paragraph color="secondary" className="void-tab-empty">
                    No themes match your search.
                </Paragraph>
            )}
            {!themes.length && (
                <Paragraph color="secondary" className="void-tab-empty">
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
            {localDialogOpen && (
                <LocalThemeDialog
                    open={localDialogOpen}
                    onClose={() => setLocalDialogOpen(false)}
                    theme={editingTheme}
                    onSave={() => setThemes(getThemes())}
                />
            )}
        </Flex>
    );
}
