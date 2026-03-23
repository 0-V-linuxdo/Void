import type { ZustandStore } from "../zustand";

/** Age verification flow stage. */
export type AgeVerificationStage = "initial" | "pending" | "verified" | "denied" | (string & {});

/** Zustand state for age verification flow. */
export interface AgeVerificationStoreState {
    /** Date of birth as Unix timestamp in seconds, or null if not set. */
    dateOfBirthSeconds: number | null;
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
    useAgeVerificationStore: ZustandStore<AgeVerificationStoreState>;
}
