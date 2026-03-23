import type { ZustandStore } from "../zustand";

/** Enterprise onboarding progress state. */
export interface EnterpriseOnboardingState {
    /** Whether the user has completed onboarding. */
    completedOnboarding: boolean;
    /** IDs of services connected during onboarding. */
    connectedServiceIds: string[];
}

/** Zustand state for enterprise onboarding flow. */
export interface EnterpriseOnboardingStoreState {
    /** Current onboarding progress. */
    onboardingState: EnterpriseOnboardingState;

    /** Mark onboarding as completed. */
    markCompleted: () => void;
    /** Add a service ID to the connected list. */
    addConnectedService: (serviceId: string) => void;
    /** Remove a service ID from the connected list. */
    removeConnectedService: (serviceId: string) => void;
    /** Reset the store to initial state. */
    reset: () => void;
}

/** Module exports for the EnterpriseOnboarding store. */
export interface EnterpriseOnboardingStoreModule {
    /** Zustand store hook for enterprise onboarding state. */
    useEnterpriseOnboardingStore: ZustandStore<EnterpriseOnboardingStoreState>;
}
