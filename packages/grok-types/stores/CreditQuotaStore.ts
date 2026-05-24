import type { ZustandStore } from "../zustand";

/** Imagine generation buckets. */
export type ImagineCreditBucket = "image" | "imagePro" | "imageEdit" | "video" | "video720p";

/**
 * Per-bucket quota info from the credit quota store.
 *
 * `remainingQueries` is `Number.MAX_SAFE_INTEGER` when unlimited (server omits the
 * field for unlimited buckets; the store synthesizes the sentinel). `available:
 * false` means the bucket is plan-gated. `nextAvailableAt` is a millisecond
 * timestamp set only when an available bucket is exhausted.
 */
export interface ImagineCreditQuota {
    available: boolean;
    remainingQueries: number;
    windowSizeSeconds: number;
    nextAvailableAt: number | null;
}

/** Zustand state for the credit/quota store driving imagine generation gates. */
export interface CreditQuotaStoreState {
    quotas: Record<ImagineCreditBucket, ImagineCreditQuota>;
    lastFetchedAt: number | null;
    isFetching: boolean;
    generationSeq: number;
    decrementedCategories: ImagineCreditBucket[];
    decrementedToastShown: boolean;

    notifyGenerationComplete: () => void;
    fetchQuotas: () => Promise<void>;
}

export interface CreditQuotaStoreModule {
    useCreditQuotaStore: ZustandStore<CreditQuotaStoreState>;
}
