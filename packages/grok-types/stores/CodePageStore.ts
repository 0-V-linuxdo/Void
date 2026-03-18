import type { ZustandStore } from "../zustand";

/** Zustand state for the Grok Code editor page. */
export interface CodePageStoreState {
    /** Whether advanced options are shown. */
    showAdvanced: boolean;
    /** Whether the local config dialog is open. */
    localConfigDialogOpen: boolean;
    /** Active sandbox session ID, or undefined when no session. */
    sandboxSessionId: string | undefined;
    /** Git metadata for the current sandbox session. */
    gitMetadata: any;
    /** Saved prompts keyed by session ID. */
    savedPromptBySessionId: Record<string, string>;
    /** Whether the side panel (files/edits) is open. */
    sidePanelOpen: boolean;
    /** Currently selected side panel tab (e.g. "files"). */
    selectedTab: string;
    /** Whether the chat panel is open. */
    chatPanelOpen: boolean;
    /** Whether the content/preview panel is open. */
    contentPanelOpen: boolean;
    /** Diff view mode, or null for default. */
    diffViewMode: string | null;
    /** Edits filter mode (e.g. "all"). */
    editsFilter: string;
    /** Whether yolo (auto-apply) mode is enabled. */
    yoloMode: boolean;
    /** Whether arena (A/B model comparison) mode is enabled. */
    arenaMode: boolean;
    /** Side panel width percentage. */
    sidePanelSize: number;
    /** Content panel width percentage. */
    contentPanelSize: number;
    /** Debug panel height percentage. */
    debugPanelSize: number;
    /** Pending file path to reveal in the file tree. */
    pendingRevealPath: string | null;
    /** Pending file path to scroll to in staging. */
    pendingStagingScrollPath: string | null;
    /** Result of a code navigation action. */
    codeNavResult: any;
    /** Pending new session creation requests keyed by ID. */
    pendingNewSessionRequestsById: Record<string, any>;
    /** Pending worktree creations keyed by session ID. */
    pendingWorktreeCreationsBySessionId: Record<string, any>;
    /** Debug panel's currently selected session ID. */
    debugCurrentSessionId: string | undefined;
    /** Debug panel's currently selected model ID. */
    debugCurrentModelId: string | undefined;
    /** Debug panel's active tab. */
    debugPanelTab: string;
    /** Debug panel's active store sub-tab. */
    debugPanelStoreSubTab: string;

    reset: () => void;
    setSavedPrompt: (sessionId: string, prompt: string) => void;
    clearSavedPrompt: (sessionId: string) => void;
    getSavedPrompt: (sessionId: string) => string | undefined;
    setSidePanelOpen: (open: boolean) => void;
    setSelectedTab: (tab: string) => void;
    setChatPanelOpen: (open: boolean) => void;
    toggleChatPanel: () => void;
    setContentPanelOpen: (open: boolean) => void;
    setDiffViewMode: (mode: string | null) => void;
    setEditsFilter: (filter: string) => void;
    setYoloMode: (enabled: boolean) => void;
    toggleYoloMode: () => void;
    setArenaMode: (enabled: boolean) => void;
    toggleArenaMode: () => void;
    setSidePanelSize: (size: number) => void;
    setContentPanelSize: (size: number) => void;
    setDebugPanelSize: (size: number) => void;
    requestRevealPath: (path: string) => void;
    clearPendingRevealPath: () => void;
    requestStagingScrollPath: (path: string) => void;
    clearPendingStagingScrollPath: () => void;
    setCodeNavResult: (result: any) => void;
    clearCodeNavResult: () => void;
    upsertPendingNewSessionRequestById: (id: string, request: any) => void;
    removePendingNewSessionRequestById: (id: string) => void;
    upsertPendingWorktreeCreation: (sessionId: string, creation: any) => void;
    removePendingWorktreeCreation: (sessionId: string) => void;
    setDebugCurrentSession: (sessionId: string | undefined, modelId: string | undefined) => void;
    setDebugPanelTab: (tab: string) => void;
    setDebugPanelStoreSubTab: (tab: string) => void;
    toggleShowAdvanced: () => void;
    toggleLocalConfigDialog: () => void;
}

/** Module exports for the CodePage store. */
export interface CodePageStoreModule {
    /** Zustand store hook for Grok Code page state. */
    useCodePageStore: ZustandStore<CodePageStoreState>;
    /** WebSocket URL for dev environments. */
    DEV_WEBSOCKET_SERVER_URL: string;
    /** WebSocket URL for local development. */
    LOCAL_WEBSOCKET_SERVER_URL: string;
    /** WebSocket URL for production. */
    PROD_WEBSOCKET_SERVER_URL: string;
    /** Get the relay client URL for the current environment. */
    getRelayClientUrl: () => string;
}
