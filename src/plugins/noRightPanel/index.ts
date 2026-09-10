/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { PanelRightCloseIcon } from "@components/icons";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import { ChatPageStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import definePlugin, { StartAt } from "@utils/types";

function isRightOpen(s: ChatPageStoreState) {
    return s.sidePanelContent?.type === "rightPanel";
}

function enforce() {
    const state = ChatPageStore.useChatPageStore.getState();
    if (isRightOpen(state)) state.closeSidePanelExplicitly();
}

export default definePlugin({
    name: "NoRightPanel",
    icon: PanelRightCloseIcon,
    description: "Keep Grok's right panel closed.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,
    startAt: StartAt.TurbopackReady,

    start: enforce,

    zustand: {
        ChatPageStore: {
            selector: isRightOpen,
            handler(open: boolean) {
                if (open) enforce();
            },
        },
    },

    patches: [
        {
            find: "willRestoreRightPanelByIntent",
            replacement: {
                match: /willRestoreRightPanelByIntent=\i=>\{/,
                replace: "willRestoreRightPanelByIntent=()=>{return!1;",
            },
        },
        {
            find: '"computePreviewAutoOpen"',
            replacement: {
                match: /&&(\i)\(\{source:"auto"\}\)/,
                replace: "&&!1&&$1({source:\"auto\"})",
            },
        },
    ],
});
