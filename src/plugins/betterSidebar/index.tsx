/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { Button, Checkbox, ConfirmDialog } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Text } from "@components/Text";
import { SidebarComponents } from "@turbopack/common/components";
import { getPlanName } from "@turbopack/common/plan";
import { Fragment, React, useEffect, useRef, useState } from "@turbopack/common/react";
import { ChatPageStore, ConversationStore, SessionStore, SubscriptionsStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory, registerStyle, unregisterStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore } from "@utils/misc";
import { pluralize } from "@utils/text";
import definePlugin, { OptionType } from "@utils/types";
import type { ComponentType } from "react";

const logger = new Logger("BetterSidebar");
const cl = classNameFactory("void-sidebar-");
const bdCl = classNameFactory("void-bd-");

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

const selected = new Set<string>();
const bdStore = createExternalStore();

function toggleSelect(id: string) {
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    bdStore.notify();
}

function clearSelection() {
    selected.clear();
    bdStore.notify();
}

async function deleteSelected() {
    const ids = [...selected];
    clearSelection();

    const currentConvId = ChatPageStore.useChatPageStore.getState().conversationId;
    if (currentConvId && ids.includes(currentConvId)) {
        ChatPageStore.useChatPageStore.getState().setConversationId(undefined);
    }

    const { fetchSoftDeleteConversation } = ConversationStore.useConversationStore.getState();
    await Promise.allSettled(ids.map(id =>
        fetchSoftDeleteConversation(id).catch(e => logger.error("Failed to delete", id, e)),
    ));
}

function SelectCheckbox({ id }: { id: string }) {
    const enabled = settings.use(["batchSelect"]).batchSelect;
    const [checked, setChecked] = useState(selected.has(id));
    const idRef = useRef(id);
    idRef.current = id;

    useEffect(() => bdStore.subscribe(() => setChecked(selected.has(idRef.current))), []);

    if (!enabled) return null;

    return (
        <div onClick={e => { e.stopPropagation(); e.preventDefault(); }} className={bdCl("wrap")}>
            <Checkbox
                checked={checked}
                onCheckedChange={() => toggleSelect(id)}
                className={bdCl("checkbox")}
            />
        </div>
    );
}

function ActionBar() {
    const [count, setCount] = useState(selected.size);
    const [open, setOpen] = useState(false);

    useEffect(() => bdStore.subscribe(() => setCount(selected.size)), []);

    if (!count) return null;

    return (
        <Fragment>
            <div className={bdCl("action-bar")}>
                <span className={bdCl("count")}>Selected · {count}</span>
                <div className={bdCl("buttons")}>
                    <Button variant="primary" size="sm" shape="pill" onClick={clearSelection}>Cancel</Button>
                    <Button variant="danger" size="sm" shape="pill" onClick={() => setOpen(true)}>Delete</Button>
                </div>
            </div>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete conversations"
                description={`Are you sure you want to delete ${pluralize(count, "conversation")}? This cannot be undone.`}
                confirmText="Delete"
                danger
                onConfirm={deleteSelected}
            />
        </Fragment>
    );
}

export default definePlugin({
    name: "BetterSidebar",
    description: "Various sidebar improvements.",
    authors: [Devs.Prism],
    settings,
    managedStyle: "betterSidebar",

    _UserCard: ErrorBoundary.wrap(UserCard),
    _renderCheckbox: ErrorBoundary.wrap(SelectCheckbox, null),
    _renderActionBar: ErrorBoundary.wrap(ActionBar, null),

    _wrapSidebarClick(onClick: () => void, id: string) {
        return (e: MouseEvent) => {
            if (settings.store.batchSelect && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                e.stopPropagation();
                toggleSelect(id);
                return;
            }
            onClick();
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
        clearSelection();
        registerStyle("batchDelete-hover", [
            ".void-bd-wrap{display:none}",
            ".void-bd-wrap:has([data-state=checked]){display:inline-flex}",
            ".group\\/sidebar-menu-item:hover .void-bd-wrap{display:inline-flex}",
            ".void-bd-checkbox{border-color:oklch(.9924 0 none/.15)!important}",
        ].join(""));
    },

    stop() {
        clearSelection();
        unregisterStyle("batchDelete-hover");
    },

    patches: [
        {
            find: "AvatarDropdownMenu,{}),",
            group: true,
            replacement: [
                {
                    match: /\(0,(\i)\.jsx\)\((\i)\.AvatarDropdownMenu,\{\}\)/,
                    replace: "(0,$1.jsx)($self._UserCard,{AvatarMenu:$2.AvatarDropdownMenu})",
                },
                {
                    match: /className:"min-w-0 flex-1",children:\(0,\i\.jsx\)\(\i,\{\}\)\},"sidebar-footer-details"/,
                    replace: 'className:"hidden",children:null},"sidebar-footer-details"',
                },
            ],
        },
        {
            find: "useSidebar must be used within a SidebarProvider",
            all: true,
            group: true,
            replacement: [
                {
                    match: /defaultOpen:\i=!0/,
                    replace: "defaultOpen:_=$self._defaultOpen()",
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
                    match: /,\(0,(\i)\.jsx\)\((\i),\{title:(\i),editing:/,
                    replace: ",(0,$1.jsx)($self._renderCheckbox,{id:arguments[0].id}),(0,$1.jsx)($2,{title:$3,editing:",
                },
                {
                    match: /\((\i),\{route:(\i),onClick:(\i),onDragStart:(\i),className:/,
                    replace: "($1,{route:$2,onClick:$self._wrapSidebarClick($3,arguments[0].id),onDragStart:$4,className:",
                },
            ],
        },
        {
            find: "\"sidebar-expand\",\"Expand\"",
            replacement: {
                match: /\(0,\i\.jsx\)\(\i\.SidebarSectionTitle,\{title:\i\("sidebar-history","History"\)/,
                replace: "$self._renderActionBar(),$&",
            },
        },
    ],
});
