/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { SubscriptionTier, XSubscriptionType } from "@grok-types/enums";

const PLAN_NAMES: Partial<Record<SubscriptionTier, string>> = {
    SUBSCRIPTION_TIER_X_BASIC: "X Basic",
    SUBSCRIPTION_TIER_X_PREMIUM: "X Premium",
    SUBSCRIPTION_TIER_X_PREMIUM_PLUS: "X Premium+",
    SUBSCRIPTION_TIER_SUPER_GROK_LITE: "SuperGrok Lite",
    SUBSCRIPTION_TIER_GROK_PRO: "SuperGrok",
    SUBSCRIPTION_TIER_SUPER_GROK_PRO: "SuperGrok Pro",
};

const X_SUB_NAMES: Partial<Record<XSubscriptionType, string>> = {
    PremiumPlus: "SuperGrok",
    Premium: "X Premium",
    Basic: "X Basic",
};

export function getPlanName(bestSubscription?: SubscriptionTier, xSubscriptionType?: XSubscriptionType): string {
    return (bestSubscription ? PLAN_NAMES[bestSubscription] : undefined)
        ?? (xSubscriptionType ? X_SUB_NAMES[xSubscriptionType] : undefined)
        ?? "Free";
}
