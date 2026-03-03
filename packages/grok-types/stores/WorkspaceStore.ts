import type { LoadingStatus } from "../common/LoadingStatus";
import type { ZustandStore } from "../zustand";

/** Async resource wrapper used by the workspace store. */
export interface WorkspaceResource<T> {
    /** Resolved data, or undefined if not yet loaded. */
    data: T | undefined;
    /** Loading status of the resource. */
    status: LoadingStatus;
    /** Error object if the fetch failed, or null. */
    error: any;
}

/**
 * Zustand state for workspace/project management, including own and
 * shared-with-me workspaces and the create workspace dialog state.
 */
export interface WorkspaceStoreState {
    /** Map of workspace ID to async resource wrapper. */
    byId: Record<string, WorkspaceResource<any>>;
    /** Map of workspace ID to permissions data. */
    permissionsById: Record<string, any>;
    /** List of workspace objects for the current user. */
    list: any[];
    /** Loading status of the workspace list. */
    listStatus: LoadingStatus;
    /** Pagination token for the next page of workspaces. */
    listPageToken: string;
    /** Whether the create workspace dialog is open. */
    createDialogIsOpen: boolean;
    /** Initial name for the create workspace dialog. */
    createDialogInitialName: string;
    /** Initial instructions for the create workspace dialog. */
    createDialogInitialInstructions: string;
    /** Initial icon for the create workspace dialog. */
    createDialogInitialIcon: string;
    /** Whether the side panel is expanded. */
    sidePanelExpanded: boolean;
    /** Whether the files section is expanded in the side panel. */
    filesSectionExpanded: boolean;
    /** Whether the collections section is expanded in the side panel. */
    collectionsSectionExpanded: boolean;
    /** List of workspaces shared with the current user. */
    sharedWithMeList: any[];
    /** Loading status of the shared-with-me list. */
    sharedWithMeListStatus: LoadingStatus;
    /** Snapshot of the initial state used for reset. */
    initialState: WorkspaceStoreState;

    /** Reset the store to initial state. */
    clear: () => void;
    /** Load the first page of workspaces. */
    loadFirstPage: () => Promise<void>;
    /** Load the next page of workspaces. */
    loadNextPage: () => Promise<void>;
    /** Ensure a workspace is loaded by ID. */
    ensureWorkspace: (id: string) => Promise<void>;
    /** Load a specific workspace by ID. */
    loadWorkspace: (id: string) => Promise<void>;
    /** Load workspaces shared with the current user. */
    loadSharedWithMeWorkspaces: () => Promise<void>;
    /** Delete a workspace by ID. */
    deleteWorkspace: (id: string) => Promise<void>;
    /** Create a new workspace. */
    createWorkspace: (data: any) => Promise<void>;
    /** Update a workspace by ID with partial data. */
    updateWorkspace: (id: string, data: any) => Promise<void>;
    /** Clone a workspace. */
    cloneWorkspace: (id: string, data: any) => Promise<void>;
    /** Load permissions for a workspace. */
    loadWorkspacePermissions: (id: string) => Promise<void>;
    /** Set public access for a project. */
    setProjectPublicAccess: (id: string, access: any) => Promise<void>;
    /** Set email-based access for a project. */
    setProjectEmailAccess: (id: string, email: string, access: any) => Promise<void>;
    /** Set team-based access for a project. */
    setProjectTeamAccess: (id: string, teamId: string, access: any) => Promise<void>;
    /** Set user ID-based access for a project. */
    setProjectUserIdAccess: (id: string, userId: string, access: any) => Promise<void>;
    /** Toggle the side panel expanded state. */
    toggleSidePanel: (expanded: boolean) => void;
    /** Toggle the files section expanded state. */
    toggleFilesSection: (expanded: boolean) => void;
    /** Toggle the collections section expanded state. */
    toggleCollectionsSection: (expanded: boolean) => void;
    /** Set the create dialog open state. */
    setCreateDialogIsOpen: (open: boolean) => void;
    /** Set initial values for the create workspace dialog. */
    setCreateDialogInitialValues: (name: string, instructions: string, icon: string) => void;
}

/** Module exports for the Workspace store. */
export interface WorkspaceStoreModule {
    /** Hook that returns the shared-with-me workspaces list. */
    useSharedWithMeWorkspaces: () => any[];
    /** Zustand store hook for workspace state. */
    useWorkspaceStore: ZustandStore<WorkspaceStoreState>;
    /** Hook that returns the user's workspace list with loading state. */
    useWorkspacesList: () => any;
}
