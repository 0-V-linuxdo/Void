/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Text } from "@components/Text";
import type { SubscriptionTier } from "@grok-types/enums";
import { SidebarComponents } from "@turbopack/common/components";
import { React, useRef } from "@turbopack/common/react";
import { SessionStore, SubscriptionsStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";
import type { ComponentType } from "react";

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
});

const PLAN_NAMES: Partial<Record<SubscriptionTier, string>> = {
    SUBSCRIPTION_TIER_X_BASIC: "X Basic",
    SUBSCRIPTION_TIER_X_PREMIUM: "X Premium",
    SUBSCRIPTION_TIER_X_PREMIUM_PLUS: "X Premium+",
    SUBSCRIPTION_TIER_SUPER_GROK_LITE: "SuperGrok Lite",
    SUBSCRIPTION_TIER_GROK_PRO: "SuperGrok",
    SUBSCRIPTION_TIER_SUPER_GROK_PRO: "SuperGrok Pro",
};

const X_SUB_NAMES: Record<string, string> = { PremiumPlus: "SuperGrok", Premium: "X Premium", Basic: "X Basic" };

function getPlanName(bestSubscription?: SubscriptionTier, xSubscriptionType?: string): string {
    return (bestSubscription && PLAN_NAMES[bestSubscription])
        ?? (xSubscriptionType && X_SUB_NAMES[xSubscriptionType])
        ?? "Free";
}

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

export default definePlugin({
    name: "BetterSidebar",
    description: "Various sidebar improvements.",
    authors: [Devs.Prism],
    settings,
    managedStyle: "betterSidebar",

    _UserCard: ErrorBoundary.wrap(UserCard),

    _defaultOpen() {
        return !settings.store.defaultCollapsed;
    },

    _onSidebarClick() {
        if (!settings.store.clickToToggle) return undefined;
        return (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest("button,a,input,[role=button],[data-sidebar=trigger],[data-sidebar=footer]")) return;
            (e.currentTarget as HTMLElement).closest("[data-state]")
                ?.querySelector<HTMLElement>("[data-sidebar=trigger]")?.click();
        };
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
    ],
});
