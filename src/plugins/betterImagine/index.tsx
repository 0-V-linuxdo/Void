/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { DownloadIcon } from "@components/icons";
import type { MediaPostType } from "@grok-types/enums";
import type { MediaItem } from "@grok-types/stores/MediaStore";
import { Fragment, React, useState } from "@turbopack/common/react";
import { MediaStore } from "@turbopack/common/stores";
import { Toaster } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore, fetchExternal, sanitizeFilename } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";

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

let currentFilter: MediaFilter = "all";
let currentSearch = "";
const filterStore = createExternalStore();

function setFilter(f: MediaFilter) {
    currentFilter = f;
    filterStore.notify();
}

function setSearch(s: string) {
    currentSearch = s;
    filterStore.notify();
}

function filterItems(items: MediaItem[]): MediaItem[] {
    if (currentFilter === "all" && !currentSearch) return items;
    const target = currentFilter !== "all" ? FILTER_MAP[currentFilter] : null;
    const q = currentSearch.toLowerCase();
    return items.filter(p => {
        if (!p) return false;
        if (target && p.mediaType !== target) return false;
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

async function downloadAllFavorites() {
    const { favoritesList } = MediaStore.useMediaStore.getState();
    const downloads: { url: string; name: string }[] = [];

    for (const post of favoritesList) {
        const item = resolveItem(post);
        if (!item?.mediaUrl) continue;
        const ext = item.mediaUrl.split(".").pop()?.split("?")[0] ?? "jpg";
        downloads.push({ url: item.mediaUrl, name: `${sanitizeFilename((item.prompt ?? "").slice(0, 60), "imagine")}.${ext}` });
    }

    if (!downloads.length) {
        Toaster.toast.error("No favorites to download.");
        return;
    }

    let done = 0;
    for (const { url, name } of downloads) {
        try {
            const res = await fetchExternal(url);
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
            URL.revokeObjectURL(a.href);
            done++;
        } catch (e) {
            logger.error("Failed to download image:", url, e);
        }
    }

    Toaster.toast.success(`Downloaded ${done} image${done > 1 ? "s" : ""}.`);
}

function DownloadAllButton() {
    const [loading, setLoading] = useState(false);

    const onClick = async () => {
        setLoading(true);
        try { await downloadAllFavorites(); }
        finally { setLoading(false); }
    };

    return (
        <Button variant="secondary" shape="pill" size="md" disabled={loading} onClick={onClick}>
            <DownloadIcon size={16} />
            <span className="font-semibold">{loading ? "Downloading..." : "Download all"}</span>
        </Button>
    );
}

function FilterButtons() {
    useExternalStore(filterStore);

    return (
        <Fragment>
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

const WrappedDownloadAll = ErrorBoundary.wrap(DownloadAllButton);
const WrappedFilterButtons = ErrorBoundary.wrap(FilterButtons);

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
            ],
        },
        {
            find: 'imagine-folder.all","All"',
            replacement: {
                match: /"imagine-folder.all","All"\)}\)]\}\)/,
                replace: "$&,$self._renderFilterButtons({})",
            },
        },
        {
            find: "group/media-post-masonry-card",
            group: true,
            replacement: [
                {
                    match: /muted:!0,autoPlay:!0/,
                    replace: "muted:!0,autoPlay:$self._autoPlay()",
                },
                {
                    match: /onMouseOver:\i\?\(\)=>\i\(!0\):void 0,onMouseLeave:\i\?\(\)=>\i\(!1\):void 0/,
                    replace: "$&,...$self._hoverProps()",
                },
            ],
        },
    ],
});
