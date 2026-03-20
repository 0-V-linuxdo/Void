/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ButtonWithTooltip, ConfirmDialog, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { HeartCrackIcon, ScalingIcon, SquareMousePointerIcon, TrashIcon } from "@components/icons";
import type { GrokPage, MediaPostType } from "@grok-types/enums";
import type { MediaItem } from "@grok-types/stores/MediaStore";
import { Fragment, React, useCallback, useEffect, useMemo, useRef, useState } from "@turbopack/common/react";
import { MediaStore, RoutingStore } from "@turbopack/common/stores";
import { Toaster } from "@turbopack/common/utils";
import { findExportedComponentLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { copyToClipboard, createExternalStore, fetchExternal, sanitizeFilename } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { createZip } from "@utils/zip";

const CopyIcon = findExportedComponentLazy("CopyIcon");
const DownloadIcon = findExportedComponentLazy("DownloadIcon");
const logger = new Logger("BetterImagine");

const cl = classNameFactory("void-imagine-");

const settings = definePluginSettings({
    hideDefaultPreviews: {
        type: OptionType.BOOLEAN,
        description: "Hide the community image grid and templates on the Imagine home page.",
        default: true,
    },
    noAutoplay: {
        type: OptionType.BOOLEAN,
        description: "Stop video thumbnails from autoplaying.",
        default: true,
    },
    playOnHover: {
        type: OptionType.BOOLEAN,
        description: "Play video thumbnails when hovered.",
        default: true,
    },
});

const MEDIA_TYPE_IMAGE: MediaPostType = "MEDIA_POST_TYPE_IMAGE";
const MEDIA_TYPE_VIDEO: MediaPostType = "MEDIA_POST_TYPE_VIDEO";
const PAGE_FAVORITES: GrokPage = "imagine-favorites";

const FILTER_MAP: Record<Exclude<MediaFilter, "all">, MediaPostType> = {
    image: MEDIA_TYPE_IMAGE,
    video: MEDIA_TYPE_VIDEO,
};

type MediaFilter = "all" | "image" | "video";
type DateFilter = "all" | "today" | "week" | "month";

const DATE_LABELS: Record<DateFilter, string> = {
    all: "Any time",
    today: "Today",
    week: "This week",
    month: "This month",
};

let currentFilter: MediaFilter = "all";
let currentSearch = "";
let currentDate: DateFilter = "all";
const filterStore = createExternalStore();

function setFilter(f: MediaFilter) {
    currentFilter = f;
    filterStore.notify();
}

function setSearch(s: string) {
    currentSearch = s;
    filterStore.notify();
}

function setDate(d: DateFilter) {
    currentDate = d;
    filterStore.notify();
}

function getDateCutoff(d: DateFilter): number {
    const now = Date.now();
    const DAY = 86_400_000;
    if (d === "today") return now - DAY;
    if (d === "week") return now - 7 * DAY;
    if (d === "month") return now - 30 * DAY;
    return 0;
}

function filterItems(items: MediaItem[]): MediaItem[] {
    if (currentFilter === "all" && !currentSearch && currentDate === "all") return items;
    const target = currentFilter !== "all" ? FILTER_MAP[currentFilter] : null;
    const q = currentSearch.toLowerCase();
    const cutoff = getDateCutoff(currentDate);
    return items.filter(p => {
        if (!p) return false;
        if (target && p.mediaType !== target) return false;
        if (cutoff && new Date(p.createTime).getTime() < cutoff) return false;
        if (q && !(p.prompt ?? "").toLowerCase().includes(q) && !(p.originalPrompt ?? "").toLowerCase().includes(q)) return false;
        return true;
    });
}

const selectedIds = new Set<string>();
let selectMode = false;
const selectionStore = createExternalStore();

function toggleSelectMode() {
    selectMode = !selectMode;
    if (!selectMode) selectedIds.clear();
    selectionStore.notify();
}

function toggleSelected(id: string) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    selectionStore.notify();
}

function clearSelection() {
    selectedIds.clear();
    selectMode = false;
    selectionStore.notify();
}

async function bulkDeletePosts(ids: string[]) {
    const { deletePost } = MediaStore.useMediaStore.getState();
    let deleted = 0;
    for (const id of ids) {
        try {
            await deletePost(id, id);
            deleted++;
        } catch (e) {
            logger.error("Failed to delete post:", id, e);
        }
    }
    clearSelection();
    Toaster.toast.success(`Deleted ${deleted} item${deleted !== 1 ? "s" : ""}.`);
}

async function bulkUpscaleVideos(ids: string[]) {
    const state = MediaStore.useMediaStore.getState();
    let upscaled = 0;
    let alreadyHd = 0;
    let inProgress = 0;
    for (const id of ids) {
        const item = state.byId[id];
        if (!item) continue;
        const videos = state.videoByMediaId[id];
        if (!videos?.length) continue;
        for (const video of videos) {
            if (video.hdMediaUrl) { alreadyHd++; continue; }
            if (video.upscalingInProgress) { inProgress++; continue; }
            try {
                await state.upscaleVideo(id, video.id);
                upscaled++;
            } catch (e) {
                logger.error("Failed to upscale video:", id, video.id, e);
            }
        }
    }
    if (upscaled > 0) Toaster.toast.success(`Upscaling ${upscaled} video${upscaled !== 1 ? "s" : ""}.`);
    else if (alreadyHd > 0) Toaster.toast.info(`${alreadyHd} video${alreadyHd !== 1 ? "s" : ""} already in HD.`);
    else if (inProgress > 0) Toaster.toast.info(`${inProgress} video${inProgress !== 1 ? "s" : ""} already upscaling.`);
    else Toaster.toast.info("No videos to upscale.");
}

const CARD_SELECTOR = ".group\\/media-post-masonry-card";

const pending = new WeakMap<HTMLVideoElement, Promise<void>>();

function pauseVideo(video: HTMLVideoElement) {
    const promise = pending.get(video);
    pending.delete(video);
    if (promise) {
        promise.then(() => {
            if (pending.has(video)) return;
            video.pause();
            video.currentTime = 0;
        }).catch(e => logger.warn("Failed to pause video:", e));
    } else {
        video.pause();
        video.currentTime = 0;
    }
}

const onMouseEnter = (e: { currentTarget: HTMLElement }) => {
    const video = e.currentTarget.querySelector("video");
    if (video) pending.set(video, video.play().catch(e => logger.error("Failed to play video", e)));
};

const onMouseLeave = (e: { currentTarget: HTMLElement }) => {
    const video = e.currentTarget.querySelector("video");
    if (video) pauseVideo(video);
};

function resolveItem(post: MediaItem): MediaItem | undefined {
    if (!post?.id) return undefined;
    return post;
}

function dedupeNames(names: string[]): string[] {
    const counts = new Map<string, number>();
    return names.map(name => {
        const count = counts.get(name) ?? 0;
        counts.set(name, count + 1);
        if (!count) return name;
        const dot = name.lastIndexOf(".");
        return dot > 0 ? `${name.slice(0, dot)} (${count})${name.slice(dot)}` : `${name} (${count})`;
    });
}

async function downloadAllFavorites() {
    const { favoritesList } = MediaStore.useMediaStore.getState();
    const entries: { url: string; name: string }[] = [];

    for (const post of favoritesList) {
        const item = resolveItem(post);
        if (!item?.mediaUrl) continue;
        const ext = item.mediaUrl.split(".").pop()?.split("?")[0] ?? "jpg";
        entries.push({ url: item.mediaUrl, name: `${sanitizeFilename((item.prompt ?? "").slice(0, 60), "imagine")}.${ext}` });
    }

    if (!entries.length) {
        Toaster.toast.error("No favorites to download.");
        return;
    }

    if (entries.length === 1) {
        try {
            const res = await fetchExternal(entries[0].url);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = entries[0].name;
            a.click();
            URL.revokeObjectURL(a.href);
            Toaster.toast.success("Downloaded 1 image.");
        } catch (e) {
            logger.error("Failed to download image:", entries[0].url, e);
        }
        return;
    }

    const names = dedupeNames(entries.map(e => e.name));
    const files: Record<string, Uint8Array> = {};
    let done = 0;

    await Promise.all(entries.map(async (entry, i) => {
        try {
            const res = await fetchExternal(entry.url);
            const buf = await res.arrayBuffer();
            files[names[i]] = new Uint8Array(buf);
            done++;
        } catch (e) {
            logger.error("Failed to fetch:", entry.url, e);
        }
    }));

    if (!done) {
        Toaster.toast.error("Failed to download any files.");
        return;
    }

    const blob = createZip(files);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "favorites.zip";
    a.click();
    URL.revokeObjectURL(a.href);
    Toaster.toast.success(`Downloaded ${done} file${done > 1 ? "s" : ""} as zip.`);
}

function useFavoritesPage() {
    return RoutingStore.useRoutingStore(s => s.route.page) === PAGE_FAVORITES;
}

function DownloadAllButton() {
    const isFavorites = useFavoritesPage();
    const [loading, setLoading] = useState(false);

    const onClick = useCallback(async () => {
        setLoading(true);
        try { await downloadAllFavorites(); }
        finally { setLoading(false); }
    }, []);

    if (!isFavorites) return null;

    return (
        <ButtonWithTooltip
            tooltipContent="Download all favorites"
            variant="secondary"
            shape="pill"
            size="md"
            disabled={loading}
            onClick={onClick}
        >
            <DownloadIcon size="20" />
            <span className="font-semibold">{loading ? "Downloading..." : "Download all"}</span>
        </ButtonWithTooltip>
    );
}

function getVisibleIds(favorites: MediaItem[]): string[] {
    return filterItems(favorites).map(i => i.id);
}

function ActionToolbar() {
    const isFavorites = useFavoritesPage();
    useExternalStore(selectionStore);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteAllOpen, setDeleteAllOpen] = useState(false);
    const [upscaleOpen, setUpscaleOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const favorites = MediaStore.useMediaStore(s => s.favoritesList);
    const videoByMediaId = MediaStore.useMediaStore(s => s.videoByMediaId);

    const count = selectedIds.size;
    const videoCount = useMemo(() => {
        const ids = count > 0 ? [...selectedIds] : getVisibleIds(favorites);
        return ids.filter(id => videoByMediaId[id]?.length).length;
    }, [count, favorites, videoByMediaId]);

    useEffect(() => {
        if (!isFavorites && selectMode) clearSelection();
    }, [isFavorites]);

    const onDeleteSelected = useCallback(async () => {
        setBusy(true);
        try { await bulkDeletePosts([...selectedIds]); }
        finally { setBusy(false); }
    }, []);

    const onDeleteAll = useCallback(async () => {
        setBusy(true);
        try { await bulkDeletePosts(getVisibleIds(favorites)); }
        finally { setBusy(false); }
    }, [favorites]);

    const onUpscale = useCallback(async () => {
        setBusy(true);
        const ids = count > 0 ? [...selectedIds] : getVisibleIds(favorites);
        try { await bulkUpscaleVideos(ids); }
        finally { setBusy(false); }
    }, [favorites, count]);

    const onSelectAll = useCallback(() => {
        for (const id of getVisibleIds(favorites)) selectedIds.add(id);
        selectionStore.notify();
    }, [favorites]);

    if (!isFavorites) return null;

    return (
        <div className={cl("action-toolbar")}>
            <ButtonWithTooltip
                tooltipContent={selectMode ? "Exit select mode" : "Select items"}
                variant={selectMode ? "primary" : "secondary"}
                shape="pill"
                size="md"
                onClick={toggleSelectMode}
            >
                <SquareMousePointerIcon size={18} />
                <span className="font-semibold">{selectMode ? "Cancel" : "Select"}</span>
            </ButtonWithTooltip>
            {selectMode && (
                <ButtonWithTooltip
                    tooltipContent="Select all visible items"
                    variant="secondary"
                    shape="pill"
                    size="md"
                    onClick={onSelectAll}
                >
                    <span className="font-semibold">Select all</span>
                </ButtonWithTooltip>
            )}
            <ButtonWithTooltip
                tooltipContent={videoCount > 0 ? `Upscale ${videoCount} video${videoCount !== 1 ? "s" : ""}` : "No videos to upscale"}
                variant="secondary"
                shape="pill"
                size="md"
                disabled={busy || videoCount === 0}
                onClick={() => setUpscaleOpen(true)}
            >
                <ScalingIcon size={18} />
                <span className="font-semibold">{videoCount > 1 ? `Upscale ${videoCount}` : "Upscale"}</span>
            </ButtonWithTooltip>
            {selectMode && count > 0 ? (
                <ButtonWithTooltip
                    tooltipContent={`Delete ${count} selected`}
                    variant="danger"
                    shape="pill"
                    size="md"
                    disabled={busy}
                    onClick={() => setConfirmOpen(true)}
                >
                    <TrashIcon size={18} />
                    <span className="font-semibold">{busy ? "Deleting..." : count > 1 ? `Delete ${count}` : "Delete"}</span>
                </ButtonWithTooltip>
            ) : !selectMode && (
                <ButtonWithTooltip
                    tooltipContent="Delete all visible items"
                    variant="secondary"
                    shape="pill"
                    size="md"
                    disabled={busy}
                    onClick={() => setDeleteAllOpen(true)}
                >
                    <TrashIcon size={18} />
                    <span className="font-semibold">{busy ? "Deleting..." : "Delete all"}</span>
                </ButtonWithTooltip>
            )}
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="Delete selected items"
                description={`Are you sure you want to permanently delete ${count} item${count !== 1 ? "s" : ""}? This cannot be undone.`}
                confirmText={`Delete ${count}`}
                danger
                onConfirm={onDeleteSelected}
            />
            <ConfirmDialog
                open={deleteAllOpen}
                onOpenChange={setDeleteAllOpen}
                title="Delete all items"
                description="Are you sure you want to permanently delete all visible items? This cannot be undone."
                confirmText="Delete all"
                danger
                onConfirm={onDeleteAll}
            />
            <ConfirmDialog
                open={upscaleOpen}
                onOpenChange={setUpscaleOpen}
                title={`Upscale ${videoCount} video${videoCount !== 1 ? "s" : ""}`}
                description={`This will start HD upscaling for ${videoCount} video${videoCount !== 1 ? "s" : ""}. Already upscaled videos will be skipped.`}
                confirmText="Upscale"
                onConfirm={onUpscale}
            />
        </div>
    );
}

function SelectOverlay({ postId }: { postId: string }) {
    const isFavorites = useFavoritesPage();
    const ref = useRef<HTMLSpanElement>(null);
    useExternalStore(selectionStore);

    const isSelected = selectMode && selectedIds.has(postId);

    useEffect(() => {
        const card = ref.current?.closest(CARD_SELECTOR) as HTMLElement | null;
        if (!card) return;
        const selected = isFavorites && isSelected;
        card.classList.toggle(cl("card-selected"), selected);
        return () => { card.classList.remove(cl("card-selected")); };
    }, [isFavorites, isSelected]);

    useEffect(() => {
        if (!isFavorites) return;
        const card = ref.current?.closest(CARD_SELECTOR) as HTMLElement | null;
        if (!card) return;

        const handler = (e: MouseEvent) => {
            if (selectMode) {
                e.preventDefault();
                e.stopPropagation();
                toggleSelected(postId);
                return;
            }
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                selectMode = true;
                selectedIds.add(postId);
                selectionStore.notify();
            }
        };

        card.addEventListener("click", handler, { capture: true });
        return () => card.removeEventListener("click", handler, { capture: true });
    }, [isFavorites, postId]);

    if (!isFavorites) return null;
    return <span ref={ref} className={cl("select-marker")} />;
}

function FilterButtons() {
    useExternalStore(filterStore);

    return (
        <Fragment>
            <Select value={currentDate} onValueChange={(v: string) => setDate(v as DateFilter)}>
                <SelectTrigger className={cl("date-select")}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {(Object.keys(DATE_LABELS) as DateFilter[]).map(d => (
                        <SelectItem key={d} value={d}>{DATE_LABELS[d]}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <input
                type="text"
                placeholder="Search..."
                value={currentSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className={cl("search")}
            />
            {(["image", "video"] as const).map(f => (
                <button
                    key={f}
                    className={classes(cl("filter-btn"), currentFilter === f && cl("filter-btn-active"))}
                    onClick={() => setFilter(currentFilter === f ? "all" : f)}
                >
                    {f === "image" ? "Images" : "Videos"}
                </button>
            ))}
        </Fragment>
    );
}

function useFilteredFavorites(): MediaItem[] {
    const favorites = MediaStore.useMediaStore(s => s.favoritesList);
    useExternalStore(filterStore);
    return filterItems(favorites);
}

function CardActions({ postId }: { postId: string }) {
    const isFavorites = useFavoritesPage();
    const item = MediaStore.useMediaStore(s => s.byId[postId]);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const onDownload = async () => {
        if (!item?.mediaUrl) return;
        try {
            const res = await fetchExternal(item.mediaUrl);
            const blob = await res.blob();
            const ext = item.mediaUrl.split(".").pop()?.split("?")[0] ?? "jpg";
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `${sanitizeFilename((item.prompt ?? "").slice(0, 60), "imagine")}.${ext}`;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (e) {
            logger.error("Failed to download:", e);
        }
    };

    const onCopyPrompt = async () => {
        const prompt = item?.prompt ?? item?.originalPrompt;
        if (!prompt) return;
        try {
            await copyToClipboard(prompt);
            Toaster.toast.success("Copied prompt.");
        } catch (e) {
            logger.error("Failed to copy prompt:", e);
        }
    };

    const onUnfavorite = () => {
        MediaStore.useMediaStore.getState().unlike(postId);
    };

    const onDelete = async () => {
        try {
            await MediaStore.useMediaStore.getState().deletePost(postId, postId);
            Toaster.toast.success("Deleted.");
        } catch (e) {
            logger.error("Failed to delete post:", e);
            Toaster.toast.error("Failed to delete.");
        }
    };

    const hasPrompt = !!(item?.prompt || item?.originalPrompt);

    return (
        <Fragment>
            {hasPrompt && (
                <ButtonWithTooltip
                    tooltipContent="Copy prompt"
                    className={cl("card-btn")}
                    shape="circle"
                    size="md"
                    variant="none"
                    onClick={onCopyPrompt}
                >
                    <CopyIcon size="16" className="text-white" />
                </ButtonWithTooltip>
            )}
            <ButtonWithTooltip
                tooltipContent="Download"
                className={cl("card-btn")}
                shape="circle"
                size="md"
                variant="none"
                onClick={onDownload}
            >
                <DownloadIcon size="16" className="text-white" />
            </ButtonWithTooltip>
            {isFavorites && (
                <ButtonWithTooltip
                    tooltipContent="Unsave"
                    className={cl("card-btn")}
                    shape="circle"
                    size="md"
                    variant="none"
                    onClick={onUnfavorite}
                >
                    <HeartCrackIcon size={16} className="text-white" />
                </ButtonWithTooltip>
            )}
            {isFavorites && (
                <ButtonWithTooltip
                    tooltipContent="Delete permanently"
                    className={classes(cl("card-btn"), cl("card-btn-danger"))}
                    shape="circle"
                    size="md"
                    variant="none"
                    onClick={() => setConfirmDelete(true)}
                >
                    <TrashIcon size={16} className="text-white" />
                </ButtonWithTooltip>
            )}
            {isFavorites && (
                <ConfirmDialog
                    open={confirmDelete}
                    onOpenChange={setConfirmDelete}
                    title="Delete this item"
                    description="Are you sure you want to permanently delete this item? This cannot be undone."
                    confirmText="Delete"
                    danger
                    onConfirm={onDelete}
                />
            )}
        </Fragment>
    );
}

const WrappedDownloadAll = ErrorBoundary.wrap(DownloadAllButton);
const WrappedActionToolbar = ErrorBoundary.wrap(ActionToolbar);
const WrappedFilterButtons = ErrorBoundary.wrap(FilterButtons);
const WrappedCardActions = ErrorBoundary.wrap(CardActions);
const WrappedSelectOverlay = ErrorBoundary.wrap(SelectOverlay);

export default definePlugin({
    name: "BetterImagine",
    description: "Quality of life improvements and features for the Imagine page.",
    authors: [Devs.Prism],
    settings,

    _hideDefault() {
        return settings.store.hideDefaultPreviews;
    },

    _autoPlay() {
        return !settings.store.noAutoplay;
    },

    _hoverProps() {
        if (!settings.store.playOnHover) return {};
        return { onMouseEnter, onMouseLeave };
    },

    _renderDownloadAll: WrappedDownloadAll,
    _renderActionToolbar: WrappedActionToolbar,
    _renderFilterButtons: WrappedFilterButtons,
    _renderCardActions: WrappedCardActions,
    _renderSelectOverlay: WrappedSelectOverlay,

    _useFilteredFavorites() {
        return useFilteredFavorites();
    },

    patches: [
        {
            find: "image_feed_opened",
            group: true,
            replacement: [
                {
                    match: /"default"===(\i)&&\(0,(\i)\.jsx\)\((\i),\{containerWidth:/,
                    replace: '"default"===$1&&!$self._hideDefault()&&(0,$2.jsx)($3,{containerWidth:',
                },
                {
                    match: /}\):\(0,(\i\.jsx)\)\((\i),\{containerRef:(\i),variant:(\i),/,
                    replace: '}):(0,$1)($self._hideDefault()&&"favorites"!==$4?()=>null:$2,{containerRef:$3,variant:$4,',
                },
                {
                    match: /"imagine-upload-image-button.label","Upload image"\)}\)]\}\)/,
                    replace: "$&,$self._renderActionToolbar({}),$self._renderDownloadAll({})",
                },
                {
                    match: /,(\i)=\(0,(\i)\.useMediaStore\)\(\i=>\i\.favoritesList\),(\i)=\(0,\i\.useMediaStore\)\(\i=>\i\.list\)/,
                    replace: ",$1=$self._useFilteredFavorites(),$3=(0,$2.useMediaStore)(e=>e.list)",
                },
            ],
        },
        {
            find: "image_feed_image_selected",
            group: true,
            replacement: [
                {
                    match: /muted:!0,autoPlay:!0/g,
                    replace: "muted:!0,autoPlay:$self._autoPlay()",
                },
                {
                    match: /onMouseOver:\i\?\(\)=>\i\(!0\):void 0,onMouseLeave:\i\?\(\)=>\i\(!1\):void 0/,
                    replace: "$&,...$self._hoverProps()",
                },
                {
                    match: /children:\(0,(\i)\.jsx\)\((\i),\{postId:(\i),mediaType:(\i),onOpenChange:(\i)\}\)\}\)/,
                    replace: "children:[$self._renderSelectOverlay({postId:$3}),(0,$1.jsx)($2,{postId:$3,mediaType:$4,onOpenChange:$5}),$self._renderCardActions({postId:$3})]})",
                },
                {
                    match: /children:(\(0,\i\.jsx\)\(\i,\{isLiked:\i,postId:(\i),isImageEdit:\i,forceVisible:\i\}\))\}\)/g,
                    replace: "children:[$self._renderSelectOverlay({postId:$2}),$1,$self._renderCardActions({postId:$2})]})",
                },
            ],
        },
        {
            find: 'imagine-folder.all","All"',
            replacement: {
                match: /"imagine-folder.all","All"\)}\)]\}\)/,
                replace: "$&,$self._renderFilterButtons({})",
            },
        },
    ],
});
