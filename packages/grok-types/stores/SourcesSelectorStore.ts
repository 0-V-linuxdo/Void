import type { ZustandStore } from "../zustand";

/**
 * Zustand state for the sources selector in the query bar, tracking which
 * data sources (web, X, Gmail, Google Calendar, Outlook) and workspace
 * connectors/collections are active for the current query.
 */
export interface SourcesSelectorStoreState {
    /** Scope ID (team or workspace) for which the selector was initialized, or null. */
    sourcesSelectorInitializedScopeId: string | null;
    /** Whether web search is enabled for the current query. */
    isWebSearchEnabled: boolean;
    /** Whether X (Twitter) search is enabled. */
    isXSearchEnabled: boolean;
    /** Whether Gmail search is enabled. */
    isGmailSearchEnabled: boolean;
    /** Whether Google Calendar search is enabled. */
    isGoogleCalendarSearchEnabled: boolean;
    /** Whether Google Drive search is enabled. */
    isGoogleDriveSearchEnabled: boolean;
    /** Whether Outlook search is enabled. */
    isOutlookSearchEnabled: boolean;
    /** Whether Outlook Calendar search is enabled. */
    isOutlookCalendarSearchEnabled: boolean;
    /** Active workspace connector IDs. */
    activeConnectorIds: string[];
    /** Active workspace collection IDs. */
    activeCollectionIds: string[];
    /** Snapshot of the initial state for reset. */
    initialState: SourcesSelectorStoreState;

    /** Reset all source selections to initial state. */
    clear: () => void;
    /** Set the initialized scope ID. */
    setSourcesSelectorInitializedScopeId: (scopeId: string | null) => void;
    /** Toggle web search enabled. */
    setIsWebSearchEnabled: (enabled: boolean) => void;
    /** Toggle X search enabled. */
    setIsXSearchEnabled: (enabled: boolean) => void;
    /** Toggle Gmail search enabled. */
    setIsGmailSearchEnabled: (enabled: boolean) => void;
    /** Toggle Google Calendar search enabled. */
    setIsGoogleCalendarSearchEnabled: (enabled: boolean) => void;
    /** Toggle Google Drive search enabled. */
    setIsGoogleDriveSearchEnabled: (enabled: boolean) => void;
    /** Toggle Outlook search enabled. */
    setIsOutlookSearchEnabled: (enabled: boolean) => void;
    /** Toggle Outlook Calendar search enabled. */
    setIsOutlookCalendarSearchEnabled: (enabled: boolean) => void;
    /** Toggle a connector ID in the active set. */
    toggleActiveConnectorId: (id: string) => void;
    /** Replace the active connector IDs. */
    setActiveConnectorIds: (ids: string[]) => void;
    /** Enable a specific connector ID. */
    enableConnectorId: (id: string) => void;
    /** Toggle a connector for a given scope. */
    toggleConnector: (scopeId: string, connectorId: string) => void;
    /** Sync active connectors from the server for a scope. */
    syncConnectors: (scopeId: string, connectorIds: string[]) => void;
    /** Toggle a collection ID in the active set. */
    toggleActiveCollectionId: (id: string) => void;
    /** Replace the active collection IDs. */
    setActiveCollectionIds: (ids: string[]) => void;
    /** Enable a specific collection ID. */
    enableCollectionId: (id: string) => void;
}

/** Module exports for the SourcesSelector store. */
export interface SourcesSelectorStoreModule {
    /** Zustand store hook for sources selector state. */
    useSourcesSelectorStore: ZustandStore<SourcesSelectorStoreState>;
    /** Get persisted source preferences from storage. */
    getPersistedSourcePreferences: () => Record<string, any>;
}
