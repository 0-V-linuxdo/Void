/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ButtonWithTooltip, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { HeartCrackIcon } from "@components/icons";
import type { MediaPostType } from "@grok-types/enums";
import type { MediaItem } from "@grok-types/stores/MediaStore";
import { Fragment, React, useState } from "@turbopack/common/react";
import { MediaStore } from "@turbopack/common/stores";
import { Toaster } from "@turbopack/common/utils";
import { findExportedComponentLazy } from "@turbopack/turbopack";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
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

function resolveItem(post: MediaItem | string): MediaItem | undefined {
    if (typeof post === "string") return MediaStore.useMediaStore.getState().byId[post];
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

function DownloadAllButton() {
    const [loading, setLoading] = useState(false);

    const onClick = async () => {
        setLoading(true);
        try { await downloadAllFavorites(); }
        finally { setLoading(false); }
    };

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
                    className={cl("filter-btn") + (currentFilter === f ? " " + cl("filter-btn-active") : "")}
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
    const item = MediaStore.useMediaStore(s => s.byId[postId]);
    const unlike = MediaStore.useMediaStore(s => s.unlike);

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
        await copyToClipboard(prompt);
        Toaster.toast.success("Copied prompt.");
    };

    const onUnfavorite = () => {
        unlike(postId);
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
        </Fragment>
    );
}

const WrappedDownloadAll = ErrorBoundary.wrap(DownloadAllButton);
const WrappedFilterButtons = ErrorBoundary.wrap(FilterButtons);
const WrappedCardActions = ErrorBoundary.wrap(CardActions);

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
    _renderFilterButtons: WrappedFilterButtons,
    _renderCardActions: WrappedCardActions,

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
                    replace: "$&,$self._renderDownloadAll({})",
                },
                {
                    match: /(\i)=\(0,(\i)\.useMediaStore\)\(\i=>\i\.favoritesList\),(\i)=\(0,\2\.useMediaStore\)\(\i=>\i\.list\)/,
                    replace: "$1=$self._useFilteredFavorites(),$3=(0,$2.useMediaStore)(e=>e.list)",
                },
                {
                    match: /muted:!0,autoPlay:!0/,
                    replace: "muted:!0,autoPlay:$self._autoPlay()",
                },
                {
                    match: /onMouseOver:\i\?\(\)=>\i\(!0\):void 0,onMouseLeave:\i\?\(\)=>\i\(!1\):void 0/,
                    replace: "$&,...$self._hoverProps()",
                },
                {
                    match: /children:\(0,(\i)\.jsx\)\((\i),\{postId:(\i),mediaType:(\i),onOpenChange:(\i)\}\)\}\)/,
                    replace: "children:[(0,$1.jsx)($2,{postId:$3,mediaType:$4,onOpenChange:$5}),$self._renderCardActions({postId:$3})]})",
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
