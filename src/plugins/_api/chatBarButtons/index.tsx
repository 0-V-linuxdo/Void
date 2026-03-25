/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { VoidChatBarButtons } from "@api/ChatBarButtons";
import { ModalContainer } from "@api/Modals";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { React } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "ChatBarButtonAPI",
    description: "Adds buttons to the chat input bar.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,

    renderButtons() {
        return (
            <ErrorBoundary>
                <VoidChatBarButtons />
                <ModalContainer />
            </ErrorBoundary>
        );
    },

    patches: [
        {
            find: "ImagineSelector,{iconOnlyTrigger",
            all: true,
            replacement: [
                {
                    match: /ModeSelect,\{compact:(\i)\}\)\}\),/,
                    replace: "$&$self.renderButtons(),",
                },
                {
                    match: /paddingInlineEnd:\i\?void 0:(\i)\?/,
                    replace: "paddingInlineEnd:$1?",
                },
            ],
        },
    ],
});
