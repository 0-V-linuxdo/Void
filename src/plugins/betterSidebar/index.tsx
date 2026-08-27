/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { SelectionActionBar, SelectionCheckbox } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Text } from "@components/Text";
import { PanelLeftIcon } from "@components/icons";
import { SidebarComponents } from "@turbopack/common/components";
import { getPlanName } from "@turbopack/common/plan";
import { createElement, Fragment, React, useRef } from "@turbopack/common/react";
import { ChatPageStore, ConversationStore, SessionStore, SubscriptionsStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createSelectionStore } from "@utils/misc";
import definePlugin, { OptionType } from "@utils/types";
import type { ComponentType, ReactNode } from "react";

const logger = new Logger("BetterSidebar");
const cl = classNameFactory("void-sidebar-");

const settings = definePluginSettings({
    clickToToggle: {
        type: OptionType.BOOLEAN,
        description: "Click anywhere on the sidebar to toggle it.",
        default: true,
    },
    defaultCollapsed: {
        type: OptionType.BOOLEAN,
        description: "Start with the sidebar collapsed on page load.",
        default: false,
    },
    batchSelect: {
        type: OptionType.BOOLEAN,
        description: "Show checkboxes on conversations for bulk selection and deletion.",
        default: true,
    },
});

function UserCard({ AvatarMenu }: { AvatarMenu: ComponentType }) {
    const { open } = SidebarComponents.useSidebar();
    const { user } = SessionStore.useSession();
    const bestSubscription = SubscriptionsStore.useSubscriptionsStore(s => s.bestSubscription);
    const cardRef = useRef<HTMLDivElement>(null);

    if (!open || !user) return <AvatarMenu />;

    const forward = (e: React.PointerEvent, type: string) => {
        if (!e.isTrusted) return;
        cardRef.current?.querySelector<HTMLElement>("button[data-state]")
            ?.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, pointerType: "mouse" }));
    };

    return (
        <div ref={cardRef} className={cl("card")} onPointerDown={e => forward(e, "pointerdown")} onPointerUp={e => forward(e, "pointerup")}>
            <AvatarMenu />
            <Flex flexDirection="column" justifyContent="center" gap="0" className={cl("info")}>
                <Text as="span" size="sm" weight="medium" className={cl("name")}>
                    {user.givenName ?? user.email?.split("@")[0] ?? "User"}
                </Text>
                <Text as="span" size="xs" color="secondary" className={cl("plan")}>
                    {getPlanName(bestSubscription, user.xSubscriptionType)}
                </Text>
            </Flex>
        </div>
    );
}

const selection = createSelectionStore<string>();

const CONVERSATION_PAGE = "chat";
const isConversationRoute = (route?: { page?: string }) => route?.page === CONVERSATION_PAGE;

async function deleteConversations(ids: string[]) {
    const currentConvId = ChatPageStore.useChatPageStore.getState().conversationId;
    if (currentConvId && ids.includes(currentConvId)) {
        ChatPageStore.useChatPageStore.getState().setConversationId(undefined);
    }

    const { fetchSoftDeleteConversation } = ConversationStore.useConversationStore.getState();
    await Promise.allSettled(ids.map(id =>
        fetchSoftDeleteConversation(id).catch(e => logger.error("Failed to delete", id, e)),
    ));
}

function SelectCheckbox({ id, route }: { id: string | undefined; route?: { page?: string } }) {
    const enabled = settings.use(["batchSelect"]).batchSelect;

    if (!enabled || !id || !isConversationRoute(route)) return null;

    return <SelectionCheckbox selection={selection} id={id} />;
}

const WrappedCheckbox = ErrorBoundary.wrap(SelectCheckbox, null);

export default definePlugin({
    name: "BetterSidebar",
    icon: PanelLeftIcon,
    description: "Various sidebar improvements.",
    authors: [Devs.Prism],
    tags: ["ui"],
    settings,
    managedStyle: "betterSidebar",

    _UserCard: ErrorBoundary.wrap(UserCard),
    _renderActionBar: ErrorBoundary.wrap(() => <SelectionActionBar selection={selection} noun="conversation" title="Delete conversations" onDelete={deleteConversations} />, null),

    _wrapCheckbox(item: ReactNode, id: string | undefined, route?: { page?: string }) {
        return createElement(Fragment, null, createElement(WrappedCheckbox, { id, route }), item);
    },

    _wrapSidebarClick(onClick: ((e: MouseEvent) => void) | undefined, id: string | undefined, route?: { page?: string }) {
        return (e: MouseEvent) => {
            if (id && settings.store.batchSelect && isConversationRoute(route) && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                selection.toggle(id);
                return;
            }
            onClick?.(e);
        };
    },

    _defaultOpen() {
        return !settings.store.defaultCollapsed;
    },

    _onSidebarClick() {
        if (!settings.store.clickToToggle) return;
        return (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest("button,a,input,[role=button],[data-sidebar=trigger],[data-sidebar=footer]")) return;
            (e.currentTarget as HTMLElement).closest("[data-state]")
                ?.querySelector<HTMLElement>("[data-sidebar=trigger]")?.click();
        };
    },

    start() {
        selection.clear();
    },

    stop() {
        selection.clear();
    },

    patches: [
        {
            find: "AvatarDropdownMenu,{expanded:",
            replacement: {
                match: /\(0,(\i)\.jsx\)\((\i)\.AvatarDropdownMenu,\{/,
                replace: "(0,$1.jsx)($self._UserCard,{AvatarMenu:$2.AvatarDropdownMenu,",
            },
        },
        {
            find: "useSidebar must be used within a SidebarProvider",
            all: true,
            group: true,
            replacement: [
                {
                    match: /\{defaultOpen:(\i),open:/,
                    replace: "{defaultOpen:$1=$self._defaultOpen(),open:",
                },
                {
                    match: /data-sidebar":"sidebar",className:/,
                    replace: 'data-sidebar":"sidebar",onClick:$self._onSidebarClick(),className:',
                },
            ],
        },
        {
            find: "\"Editing actions\",\"Editing actions\"",
            all: true,
            group: true,
            replacement: [
                {
                    match: /=(\(0,\i\.jsx\)\(\i,\{title:\i,editing:\i,[^}]{0,80}?validationErrorMessage:\i[^}]{0,40}?\}\))/,
                    replace: "=$self._wrapCheckbox($1,arguments[0].id,arguments[0].route)",
                },
                {
                    match: /\((\i),\{route:(\i),onClick:(\i),(.{0,40}?className:)/,
                    replace: "($1,{route:$2,onClick:$self._wrapSidebarClick($3,arguments[0].id,$2),$4",
                },
            ],
        },
        {
            find: "\"sidebar-expand\",\"Expand\"",
            replacement: {
                match: /\(0,\i\.jsx\)\(\i\.SidebarSectionTitle,\{title:\i\("sidebar-history"/,
                replace: "$self._renderActionBar(),$&",
            },
        },
    ],
});
