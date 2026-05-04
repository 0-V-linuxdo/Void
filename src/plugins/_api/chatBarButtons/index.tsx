/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { VoidChatBarButtons } from "@api/ChatBarButtons";
import { ModalContainer } from "@api/Modals";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Fragment, React } from "@turbopack/common/react";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

function Buttons() {
    return (
        <Fragment>
            <VoidChatBarButtons />
            <ModalContainer />
        </Fragment>
    );
}

export default definePlugin({
    name: "ChatBarButtonAPI",
    description: "Adds buttons to the chat input bar.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,

    renderButtons: ErrorBoundary.wrap(Buttons),

    patches: [
        {
            find: "ImagineSelector,{iconOnlyTrigger",
            all: true,
            replacement: [
                {
                    match: /\},"mode-select"\),/,
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
