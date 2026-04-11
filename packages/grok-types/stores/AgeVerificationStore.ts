import type { ComponentType } from "react";

import type { ZustandStore } from "../zustand";

/** Age verification flow stage. */
export type AgeVerificationStage = "start" | "initial" | "pending" | "verified" | "denied" | (string & {});

/** Zustand state for age verification flow. */
export interface AgeVerificationStoreState {
    /** Date of birth as Unix timestamp in seconds, or undefined if not set. */
    dateOfBirthSeconds: number | undefined;
    /** Current stage of the verification flow. */
    stage: AgeVerificationStage;

    /** Set the verification flow stage. */
    setStage: (stage: AgeVerificationStage) => void;
    /** Set the date of birth timestamp. */
    setDateOfBirthSeconds: (seconds: number) => void;
    /** Reset the store to initial state. */
    reset: () => void;
}

/** Module exports for the AgeVerification store. */
export interface AgeVerificationStoreModule {
    /** Zustand store hook for age verification state. */
    useAgeVerificationStage: ZustandStore<AgeVerificationStoreState>;
    /** Over-18 verification dialog component. */
    Over18Verification: ComponentType<any>;
    /** Year-picker component for entering date of birth. */
    YearSelector: ComponentType<any>;
}
