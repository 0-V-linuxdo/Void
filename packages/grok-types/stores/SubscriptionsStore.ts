import type { GrokSubscription } from "../common/Subscription";
import type { SubscriptionTier } from "../enums/subscription";
import type { ZustandStore } from "../zustand";

/**
 * Zustand state for the user's subscription data, populated from the
 * session API. Computes the best (highest-tier) active subscription
 * on page load.
 */
export interface SubscriptionsStoreState {
    /** Whether the user has any active subscriptions. */
    hasSubscriptions: boolean;
    /** Active subscription objects from the API. */
    activeSubscriptions: GrokSubscription[];
    /** Highest-tier active subscription tier string, or undefined if free. */
    bestSubscription: SubscriptionTier | undefined;
    /** Whether the user subscribes through Braintree. */
    isBraintreeSubscriber: boolean;
}

/** Module exports for the Subscriptions store. */
export interface SubscriptionsStoreModule {
    /** Zustand store hook for subscription state. */
    useSubscriptionsStore: ZustandStore<SubscriptionsStoreState>;
}
