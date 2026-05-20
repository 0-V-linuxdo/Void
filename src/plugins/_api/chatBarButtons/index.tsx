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
            <VoidChatBarButtons location="chat" />
            <ModalContainer />
        </Fragment>
    );
}

function ImagineButtons() {
    return <VoidChatBarButtons location="imagine" />;
}

export default definePlugin({
    name: "ChatBarButtonAPI",
    description: "Adds buttons to the chat input bar.",
    authors: [Devs.Prism],
    required: true,
    hidden: true,

    renderButtons: ErrorBoundary.wrap(Buttons),
    renderImagineButtons: ErrorBoundary.wrap(ImagineButtons),

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
                    match: /paddingInlineEnd:\i\?void 0:(\i)/,
                    replace: "paddingInlineEnd:$1",
                },
            ],
        },
        {
            find: 'imagine-query-bar-placeholder","Type to imagine"',
            replacement: {
                match: /(\i&&!\i&&!\i&&\(0,\i\.jsx\)\(\i+\.DictationButton,)/,
                replace: "$self.renderImagineButtons(),$1",
            },
        },
    ],
});
