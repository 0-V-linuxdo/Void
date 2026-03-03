import type { SubscriptionStatus, SubscriptionTier, SubscriptionTierName } from "../enums/subscription";
import type { OrganizationType } from "../enums/user";

/**
 * A user subscription object returned by `GET /rest/subscriptions`.
 *
 * Each subscription has a `tier`, `status`, and zero or more provider-specific
 * detail objects (stripe, google, apple, paypal, x, enterprise, eapi, adhoc).
 */
export interface GrokSubscription {
    /** Subscription tier (e.g. "SUBSCRIPTION_TIER_GROK_PRO"). */
    tier?: SubscriptionTier;
    /** Lifecycle status (e.g. "SUBSCRIPTION_STATUS_ACTIVE"). */
    status?: SubscriptionStatus;
    /** Account creation timestamp as ISO string or epoch. */
    createTime?: string;
    /** Last modification timestamp. */
    modTime?: string;
    /** xAI user ID associated with this subscription. */
    xaiUserId?: string;
    /** Stripe billing details. Present when subscribed via Stripe. */
    stripe?: GrokSubscriptionStripe;
    /** Google Play billing details. */
    google?: GrokSubscriptionGoogle;
    /** Apple App Store billing details. */
    apple?: GrokSubscriptionApple;
    /** PayPal billing details. */
    paypal?: GrokSubscriptionPaypal;
    /** X (Twitter) subscription passthrough. */
    x?: unknown;
    /** Enterprise/team subscription details. */
    enterprise?: GrokSubscriptionEnterprise;
    /** Ad-hoc (promotional/one-off) subscription. */
    adhoc?: { productId?: string };
    /** External API subscription. */
    eapi?: { productId?: string };
}

/** Stripe-specific subscription details. */
export interface GrokSubscriptionStripe {
    subscriptionId?: string;
    invoiceId?: string;
    productId?: string;
    /** End of the current billing period (ISO timestamp). */
    currentPeriodEnd?: string;
    /** Whether the subscription will cancel at period end. */
    cancelAtPeriodEnd?: boolean;
}

/** Google Play subscription details. */
export interface GrokSubscriptionGoogle {
    purchaseToken?: string;
    productId?: string;
    basePlanId?: string;
}

/** Apple App Store subscription details. */
export interface GrokSubscriptionApple {
    originalTxid?: string;
    txid?: string;
    bundleId?: string;
    productId?: string;
}

/** PayPal subscription details. */
export interface GrokSubscriptionPaypal {
    subscriptionId?: string;
    planId?: string;
}

/** Enterprise/team subscription details. */
export interface GrokSubscriptionEnterprise {
    teamId?: string;
    subscriptionId?: string;
}

/**
 * Resolved subscription info returned by the `useSubscriptions()` hook.
 * Combines raw API subscription data with computed convenience flags.
 */
export interface ResolvedSubscriptionInfo {
    /** Whether the request is still loading. */
    isPending: boolean;
    /** Whether the user has an active SuperGrok (or higher) subscription. */
    isSuperGrokUser: boolean;
    /** Whether the user has an active SuperGrok Pro subscription. */
    isSuperGrokProUser: boolean;
    /** Whether the user has an enterprise subscription. */
    isEnterpriseUser: boolean;
    /** Whether any subscriptions exist. */
    hasSubscriptions: boolean;
    /** Highest-tier active subscription, or undefined if free. */
    bestSubscription?: SubscriptionTier;
    /** All subscriptions with an active status. */
    activeSubscriptions: GrokSubscription[];
    /** Enterprise organization type, if applicable. */
    organizationType?: OrganizationType;
}

/**
 * Numeric privilege level map: tier string to level number.
 * Used by `getSubscriptionLevel()` to determine the highest-ranked active tier.
 *
 * @see {@link SubscriptionTier} for the tier string values
 */
export type SubscriptionTierLevelMap = Record<SubscriptionTier, number>;

/**
 * Display name map: tier string to human-readable name.
 *
 * @see {@link SubscriptionTierName} for the display name values
 */
export type SubscriptionTierNameMap = Record<SubscriptionTier, SubscriptionTierName>;
