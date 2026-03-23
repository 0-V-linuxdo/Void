import type { ZustandStore } from "../zustand";

/** Zustand state for connector feedback collection. */
export interface ConnectorFeedbackStoreState {
    /** Response IDs with pending feedback. */
    pendingFeedbackResponseIds: Set<string>;
    /** Response IDs with completed feedback. */
    completedFeedbackResponseIds: Set<string>;
    /** Active conversation ID for feedback context. */
    currentConversationId: string | null;

    /** Set the active conversation for feedback tracking. */
    setConversation: (conversationId: string) => void;
    /** Mark a response as requiring feedback. */
    requireFeedback: (responseId: string) => void;
    /** Mark a response's feedback as completed. */
    completeFeedback: (responseId: string) => void;
    /** Whether any responses have pending feedback. */
    hasPendingFeedback: () => boolean;
    /** Whether any responses have completed feedback. */
    hasCompletedFeedback: () => boolean;
    /** Clear all pending feedback entries. */
    clearPendingFeedback: () => void;
    /** Reset the store to initial state. */
    reset: () => void;
}

/** Module exports for the ConnectorFeedback store. */
export interface ConnectorFeedbackStoreModule {
    /** Zustand store hook for connector feedback state. */
    useConnectorFeedbackStore: ZustandStore<ConnectorFeedbackStoreState>;
}
