import type { ZustandStore } from "../zustand";

/** Step in the subscription cancellation flow. */
export type CancelFlowStep = "reason" | "offer" | "preview" | "confirm" | (string & {});

/** Redemption status for a retention offer. */
export type RedemptionStatus = "idle" | "pending" | "success" | "error" | (string & {});

/** Zustand state for subscription cancellation flow. */
export interface SettingsSubscriptionCancelFlowStoreState {
    /** Whether the cancel flow dialog is open. */
    open: boolean;
    /** Current step in the cancellation flow. */
    step: CancelFlowStep;
    /** Retention offer data from the API, or null if not loaded. */
    offerData: any;
    /** Whether the retention offer is loading. */
    offerLoading: boolean;
    /** Cancellation preview data from the API, or null if not loaded. */
    previewData: any;
    /** Whether the cancellation preview is loading. */
    previewLoading: boolean;
    /** Current redemption status. */
    redemptionStatus: RedemptionStatus;
    /** Error message from a failed redemption, or null. */
    redemptionError: string | null;
    /** Whether the subscription is past due. */
    isPastDue: boolean;
    /** Whether a retention offer was claimed this session. */
    offerClaimedThisSession: boolean;

    /** Open or close the cancel flow dialog. */
    setOpen: (open: boolean) => void;
    /** Set the current step. */
    setStep: (step: CancelFlowStep) => void;
    /** Load the retention offer from the API. */
    loadOffer: () => Promise<void>;
    /** Load the cancellation preview from the API. */
    loadPreview: () => Promise<void>;
    /** Redeem the retention offer. */
    redeemOffer: () => Promise<void>;
}

/** Module exports for the SettingsSubscriptionCancelFlow store. */
export interface SettingsSubscriptionCancelFlowStoreModule {
    /** Zustand store hook for subscription cancel flow state. */
    useSettingsSubscriptionCancelFlowStore: ZustandStore<SettingsSubscriptionCancelFlowStoreState>;
}
