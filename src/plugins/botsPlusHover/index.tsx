/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { PlusIcon } from "@components/icons";
import { createElement } from "@turbopack/common/react";
import { ChatPageStore, RoutingStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { disableStyle, enableStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";
import type { MouseEvent } from "react";

const BTN_CLASS = "void-chats-plus flex size-5 shrink-0 items-center justify-center rounded-md text-tertiary hover:bg-button-ghost-hover hover:text-primary focus:outline-none focus-visible:bg-button-ghost-hover";

const settings = definePluginSettings({
    titleRowHover: {
        type: OptionType.BOOLEAN,
        description: "Show Bots, Chats, and Projects header actions only when hovering that section, like the expand chevron.",
        default: true,
    },
    chatsPlus: {
        type: OptionType.BOOLEAN,
        description: "Show a plus on the Chats header that starts a new chat.",
        default: true,
    },
});

function apply() {
    if (settings.store.titleRowHover) enableStyle("botsPlusHover");
    else disableStyle("botsPlusHover");
}

function newChat(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const native = document.querySelector<HTMLElement>('[data-testid="new-chat"]');
    if (native) {
        native.click();
        return;
    }
    const { route, push } = RoutingStore.useRoutingStore.getState();
    const teamId = route.teamId ?? null;
    const workspaceId = route.workspaceId;
    if (workspaceId) {
        push({ page: "workspace", workspaceId, tab: "conversations", teamId });
        const chat = ChatPageStore.useChatPageStore.getState();
        chat.setProjectId(workspaceId);
        chat.setConversationId(undefined);
        return;
    }
    ChatPageStore.useChatPageStore.getState().setConversationId(undefined);
    push({ page: "main", teamId });
}

const ChatsPlus = ErrorBoundary.wrap(function ChatsPlusButton() {
    if (!settings.use(["chatsPlus"]).chatsPlus) return null;
    return createElement(
        "button",
        {
            type: "button",
            className: BTN_CLASS,
            "aria-label": "New chat",
            "data-void-chats-plus": "",
            onClick: newChat,
        },
        createElement(PlusIcon, { size: 14 }),
    );
}, null);

export default definePlugin({
    name: "BotsPlusHover",
    icon: PlusIcon,
    description: "Show Bots, Chats, and Projects header actions on section hover, and add a New chat plus on Chats.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,
    managedStyle: "botsPlusHover",
    settings,

    _ChatsPlus: () => createElement(ChatsPlus),

    patches: [
        {
            find: "\"sidebar.new-bot-btn.aria-label\",\"New bot\"",
            replacement: [
                {
                    match: /(\i)\("flex size-5 shrink-0 items-center justify-center rounded-md text-tertiary","hover:bg-button-ghost-hover hover:text-primary","focus:outline-none focus-visible:bg-button-ghost-hover"\)/,
                    replace: "$1(\"flex size-5 shrink-0 items-center justify-center rounded-md text-tertiary void-bots-plus\",\"hover:bg-button-ghost-hover hover:text-primary\",\"focus:outline-none focus-visible:bg-button-ghost-hover\")",
                },
                {
                    match: /("button",\{type:"button","aria-label":\i,className:\i,onClick:\i)/,
                    replace: "$&,\"data-void-bots-plus\":\"\"",
                },
            ],
        },
        {
            find: "\"sidebar-chats\",\"Chats\"",
            replacement: {
                match: /(\i\("sidebar-chats","Chats"\):\i\("sidebar-history","History"\),collapsed:\i,onToggle:\(\)=>\i\(\i\))/,
                replace: "$1,action:$self._ChatsPlus()",
            },
        },
    ],

    start: apply,
    onSettingsChange: apply,
    stop() {
        disableStyle("botsPlusHover");
    },
});
