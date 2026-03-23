import type { ZustandStore } from "../zustand";

/**
 * Zustand state for workspace connector management, storing connectors
 * (Gmail, Google Calendar, Outlook, etc.) per team and workspace.
 * Connectors enable Grok to search external data sources.
 */
export interface WorkspaceConnectorsStoreState {
    /** Connector state keyed by scope ID (team or enterprise). */
    scopeIdToConnectorsState: Record<string, any>;
    /** Connector state keyed by workspace ID. */
    workspaceIdToConnectorsState: Record<string, any>;
    /** Whether connectors are currently being loaded. */
    isLoadingConnectors: boolean;
    /** Snapshot of the initial state used for reset. */
    initialState: WorkspaceConnectorsStoreState;

    /** Reset the store to initial state. */
    clear: () => void;
    /** Load connectors for a workspace. */
    loadWorkspaceConnectors: (workspaceId: string) => Promise<void>;
    /** Add a connector to the active set. */
    addActiveConnector: (connectorId: string) => void;
    /** Remove a connector from the active set. */
    removeActiveConnector: (connectorId: string) => void;
    /** Get the connector state for a workspace. */
    getWorkspaceConnectorsState: (workspaceId: string) => any;
    /** Get the connector state for a scope (team or enterprise). */
    getScopeConnectorsState: (scopeId: string) => any;
    /** Get connectors for a given scope. */
    getConnectorsForScope: (scopeId: string) => any[];
    /** Get active connector IDs for a workspace. */
    getActiveConnectorIds: (workspaceId: string) => string[];
}

/** Module exports for the WorkspaceConnectors store. */
export interface WorkspaceConnectorsStoreModule {
    /** Hook that returns active connector IDs for a workspace. */
    useWorkspaceActiveConnectorIds: (workspaceId: string) => string[];
    /** Zustand store hook for workspace connectors state. */
    useWorkspaceConnectorsStore: ZustandStore<WorkspaceConnectorsStoreState>;
}
