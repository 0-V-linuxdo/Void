/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("BetterImagine");

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
                    match: /MediaPostSourcePublic,(\i)="favorites"!==(\i)/,
                    replace: 'MediaPostSourcePublic;if("favorites"!==$2&&$self._hideDefault())return null;$1="favorites"!==$2',
                },
            ],
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
