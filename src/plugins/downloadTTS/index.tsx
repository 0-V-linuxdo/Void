/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Button } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { DownloadIcon } from "@components/icons";
import { Spinner } from "@turbopack/common/components";
import { React, useCallback, useState } from "@turbopack/common/react";
import { ChatPageStore, TextToSpeechStore } from "@turbopack/common/stores";
import { FileUtils } from "@turbopack/common/utils";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";

const cl = classNameFactory("void-download-tts-");

const logger = new Logger("DownloadTTS");

async function fetchAndDownload() {
    const { currentStreamId } = TextToSpeechStore.useTextToSpeechStore.getState();
    if (!currentStreamId) return;

    const voiceId = ChatPageStore.useChatPageStore.getState().voiceId as string | undefined;
    let url = `/http/app-chat/read-response-audio-file/${currentStreamId}`;
    if (voiceId) url += `?voiceId=${encodeURIComponent(voiceId)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const blob = await res.blob();
    await FileUtils.downloadBlob(blob, `tts-${currentStreamId.slice(0, 8)}.wav`);
}

function DownloadButton() {
    const [loading, setLoading] = useState(false);

    const onClick = useCallback(async () => {
        setLoading(true);
        try {
            await fetchAndDownload();
        } catch (e) {
            logger.error("Failed to download TTS audio:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <Button
            aria-label="Download audio"
            onClick={onClick}
            disabled={loading}
            size="md"
            shape="square"
            variant="tertiary"
        >
            {loading
                ? <Spinner size="sm" className={cl("spinner")} />
                : <DownloadIcon size={16} />}
        </Button>
    );
}

export default definePlugin({
    name: "DownloadTTS",
    description: "Add a download button to the TTS playback controls.",
    authors: [Devs.Prism],

    patches: [{
        find: "tts-controls.play.label\",\"Play\"),onClick",
        all: true,
        replacement: {
            match: /\(0,\i\.jsx\)\(\i\.Button,\{"aria-label":\i\("tts-controls\.stop\.label","Stop"\)/,
            replace: "$self._renderDownloadButton(),$&",
        },
    }],

    _renderDownloadButton: ErrorBoundary.wrap(DownloadButton),
});
