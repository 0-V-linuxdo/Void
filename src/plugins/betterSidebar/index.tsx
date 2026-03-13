/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { ErrorBoundary } from "@components/ErrorBoundary";
import { Flex } from "@components/Flex";
import { Text } from "@components/Text";
import type { SessionTierId, SubscriptionTier } from "@grok-types/enums";
import { SidebarComponents } from "@turbopack/common/components";
import { React, useRef } from "@turbopack/common/react";
import { SessionStore, SubscriptionsStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin from "@utils/types";
import type { ComponentType } from "react";

const cl = classNameFactory("void-sidebar-");

const TIER_DISPLAY: Record<SubscriptionTier, string> = {
    SUBSCRIPTION_TIER_INVALID: "Free",
    SUBSCRIPTION_TIER_X_BASIC: "Basic",
    SUBSCRIPTION_TIER_X_PREMIUM: "Premium",
    SUBSCRIPTION_TIER_X_PREMIUM_PLUS: "Premium+",
    SUBSCRIPTION_TIER_GROK_PRO: "SuperGrok",
    SUBSCRIPTION_TIER_SUPER_GROK_PRO: "SuperGrok Pro",
};

const SESSION_TIER_DISPLAY: Record<SessionTierId, string> = {
    "0": "Free",
    "1": "X Premium",
    "2": "X Premium+",
};

function getPlanName(bestSubscription?: SubscriptionTier, sessionTierId?: SessionTierId) {
    if (bestSubscription) return TIER_DISPLAY[bestSubscription] ?? bestSubscription;
    return SESSION_TIER_DISPLAY[sessionTierId ?? "0"] ?? "Free";
}

function UserCard({ AvatarMenu }: { AvatarMenu: ComponentType }) {
    const { open } = SidebarComponents.useSidebar();
    const { user } = SessionStore.useSession();
    const bestSubscription = SubscriptionsStore.useSubscriptionsStore(s => s.bestSubscription);
    const cardRef = useRef<HTMLDivElement>(null);

    if (!open || !user) return <AvatarMenu />;

    const forward = (type: string) => {
        cardRef.current?.querySelector<HTMLElement>("button[data-state]")
            ?.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, pointerType: "mouse" }));
    };

    return (
        <div ref={cardRef} className={cl("card")} onPointerDown={() => forward("pointerdown")} onPointerUp={() => forward("pointerup")}>
            <AvatarMenu />
            <Flex flexDirection="column" justifyContent="center" gap="0" className={cl("info")}>
                <Text as="span" size="sm" weight="medium" className={cl("name")}>
                    {user.givenName || user.email?.split("@")[0] || "User"}
                </Text>
                <Text as="span" size="xs" color="secondary" className={cl("plan")}>
                    {getPlanName(bestSubscription, user.sessionTierId)}
                </Text>
            </Flex>
        </div>
    );
}

export default definePlugin({
    name: "BetterSidebar",
    description: "Shows your name and plan in the sidebar footer.",
    authors: [Devs.Prism],

    _UserCard: ErrorBoundary.wrap(UserCard),

    patches: [
        {
            find: "AvatarDropdownMenu,{}),",
            replacement: {
                match: /\(0,(\i)\.jsx\)\((\i)\.AvatarDropdownMenu,\{\}\)/,
                replace: "(0,$1.jsx)($self._UserCard,{AvatarMenu:$2.AvatarDropdownMenu})",
            },
        },
    ],
});
