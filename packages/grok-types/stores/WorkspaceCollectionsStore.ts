import type { ZustandStore } from "../zustand";

/**
 * Zustand state for workspace collection management, storing collections
 * (knowledge bases) per team and workspace. Collections group
 * related documents for RAG-powered conversations.
 */
export interface WorkspaceCollectionsStoreState {
    /** Collection state keyed by team ID. */
    teamIdToCollectionState: Record<string, any>;
    /** Collection state keyed by workspace ID. */
    workspaceIdToCollectionsState: Record<string, any>;
    /** Whether collections are currently being loaded. */
    isLoadingCollections: boolean;
    /** Snapshot of the initial state used for reset. */
    initialState: WorkspaceCollectionsStoreState;

    /** Reset the store to initial state. */
    clear: () => void;
    /** Load collections for a workspace. */
    loadWorkspaceCollections: (workspaceId: string) => Promise<void>;
    /** Add a collection to the active set. */
    addActiveCollection: (collectionId: string) => void;
    /** Remove a collection from the active set. */
    removeActiveCollection: (collectionId: string) => void;
    /** Get the collection state for a workspace. */
    getWorkspaceCollectionsState: (workspaceId: string) => any;
    /** Get the collection state for a team. */
    getTeamCollectionState: (teamId: string) => any;
    /** Get enterprise collections for a team. */
    getEnterpriseCollections: (teamId: string) => any[];
    /** Get active collection IDs for a workspace. */
    getActiveCollectionIds: (workspaceId: string) => string[];
}

/** Module exports for the WorkspaceCollections store. */
export interface WorkspaceCollectionsStoreModule {
    /** Hook that returns active collection IDs for a workspace. */
    useWorkspaceActiveCollectionIds: (workspaceId: string) => string[];
    /** Zustand store hook for workspace collections state. */
    useWorkspaceCollectionsStore: ZustandStore<WorkspaceCollectionsStoreState>;
}
