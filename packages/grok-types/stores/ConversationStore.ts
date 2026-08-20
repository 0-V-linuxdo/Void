import type { ConversationState } from "../enums/conversation";
import type { ZustandStore } from "../zustand";

/**
 * A Grok conversation object as returned by the conversations API.
 * Represents a single chat thread with metadata.
 */
export interface GrokConversation {
    /** Unique conversation UUID. */
    conversationId: string;
    /** User-visible conversation title (auto-generated or manually set). */
    title: string;
    /** Whether the conversation is starred/favorited. */
    starred: boolean;
    /** ISO 8601 timestamp of when the conversation was created. */
    createTime: string;
    /** ISO 8601 timestamp of the last modification. */
    modifyTime: string;
    /** Name of the system prompt used, or empty string for default. */
    systemPromptName: string;
    /** Whether this is a temporary/ephemeral conversation (incognito). */
    temporary: boolean;
    /** Media types used in the conversation (e.g. images, files). */
    mediaTypes: string[];
    /** Workspace IDs this conversation belongs to. Runtime entries are `{ workspaceId }` objects, not bare strings. */
    workspaces: Array<string | { workspaceId?: string; [key: string]: any }>;
    /** Project/workspace id when this conversation lives in a Grok project. */
    workspaceId?: string;
    /** Task execution results associated with this conversation. */
    taskResult: Record<string, any>;
    /** Team/workspace ID, or undefined for personal conversations. */
    teamId?: string;
    /** X (Twitter) user ID associated with this conversation. */
    xUserId?: string;
    /** Template ID used to create this conversation, or undefined. */
    templateId?: string;
    /** URL to the voice chat audio asset, if this was a voice conversation. */
    voiceChatAssetUrl?: string;
    /** Alignment info for voice chat transcription timing. */
    voiceChatAlignmentInfo?: any;
    /** Metadata about the voice chat session. */
    voiceChatSessionMetadata?: any;
    /** Persona ID used for this conversation. */
    personaId?: string;
    /** Whether this conversation was just created and has no responses yet. */
    isNew: boolean;
    /** Conversation state: "open" for active streaming, "closed" for completed. */
    state: ConversationState;
}

/**
 * Zustand state for conversation management, including
 * in-flight request tracking and CRUD operations against the conversations API.
 */
export interface ConversationStoreState {
    /** In-flight fetch promises keyed by conversation ID (deduplication). */
    promiseById: Record<string, Promise<any>>;
    /** Cached conversation objects keyed by conversation ID. */
    byId: Record<string, GrokConversation>;
    /** Ordered list of conversations (most recent first). */
    list: GrokConversation[];
    /** Active abort controllers keyed by conversation ID. */
    abortControllerById: Record<string, AbortController>;
    /** In-flight list fetch promises keyed by query string. */
    listPromiseByQuery: Record<string, Promise<any>>;
    /** Next-page pagination tokens keyed by query string. */
    nextPageTokenByQuery: Record<string, string>;
    /** In-flight workspace conversation fetch promises. */
    promiseByIdWithWorkspaces: Record<string, Promise<any>>;
    /** Cached workspace conversations keyed by ID. */
    byIdWithWorkspaces: Record<string, GrokConversation>;

    /** Insert or update a conversation in the cache and list. */
    upsertConversation: (conversation: GrokConversation) => void;
    /** Append multiple conversations to the list (pagination). */
    appendConversations: (conversations: GrokConversation[]) => void;
    /** Remove a conversation from the cache and list by ID. */
    removeConversation: (id: string) => void;
    /** Replace the entire byId cache. */
    setById: (byId: Record<string, GrokConversation>) => void;
    /** Clear all cached data (logout/reset). */
    clear: () => void;

    /** Store an in-flight fetch promise for a conversation. */
    idsertConversationPromise: (id: string, promise: Promise<any>) => void;
    /** Remove an in-flight fetch promise for a conversation. */
    removeConversationPromise: (id: string) => void;
    /** Replace the entire promiseById map. */
    setPromiseById: (promiseById: Record<string, Promise<any>>) => void;
    /** Store an abort controller for a conversation request. */
    idsertAbortControllerById: (id: string, controller: AbortController) => void;
    /** Remove an abort controller for a conversation request. */
    removeAbortControllerById: (id: string) => void;
    /** Replace the entire listPromiseByQuery map. */
    setListPromiseByQuery: (promises: Record<string, Promise<any>>) => void;
    /** Store a list fetch promise for a query string. */
    idsertListPromiseByQuery: (query: string, promise: Promise<any>) => void;
    /** Store a next-page pagination token for a query string. */
    idsertNextPageTokenByQuery: (query: string, token: string) => void;
    /** Insert or update a conversation with workspace context. */
    upsertConversationWithWorkspaces: (conversation: GrokConversation) => void;
    /** Store an in-flight workspace conversation fetch promise. */
    idsertConversationPromiseWithWorkspaces: (id: string, promise: Promise<any>) => void;
    /** Remove an in-flight workspace conversation fetch promise. */
    removeConversationPromiseWithWorkspaces: (id: string) => void;
    /** Replace the entire byIdWithWorkspaces cache. */
    setByIdWithWorkspaces: (byId: Record<string, GrokConversation>) => void;
    /** Replace the entire promiseByIdWithWorkspaces map. */
    setPromiseByIdWithWorkspaces: (promises: Record<string, Promise<any>>) => void;

    /** Upsert a conversation and update the runtime cache. */
    upsertAndCacheConversation: (conversation: GrokConversation, cache: any) => void;
    /** Append conversations from an API response and update the cache. */
    appendAndCacheConversations: (data: any) => void;
    /** Create a new conversation via the API. */
    fetchCreateConversation: (params: any) => Promise<GrokConversation>;
    /** Update a conversation's title, starred status, etc. */
    fetchUpdateConversation: (id: string, updates: Partial<GrokConversation>) => Promise<GrokConversation>;
    /** Permanently delete a conversation. */
    fetchForceDeleteConversation: (id: string) => Promise<void>;
    /** Soft-delete a conversation (mark as deleted, recoverable). */
    fetchSoftDeleteConversation: (id: string) => Promise<void>;
    /** Fetch a single conversation by ID. */
    fetchGetConversation: (id: string, options?: any) => Promise<GrokConversation>;
    /** Fetch a conversation with workspace context. */
    fetchGetConversationWithWorkspaces: (id: string, options?: any) => Promise<GrokConversation>;
    /** Fetch multiple conversations by IDs in a batch. */
    fetchGetManyConversations: (ids: string[]) => Promise<GrokConversation[]>;
    /** Fetch a paginated list of conversations with optional query filters. */
    fetchListConversations: (query: any, options?: any) => Promise<any>;
    /** Soft-delete all conversations for the current user. */
    fetchSoftDeleteAllConversations: () => Promise<void>;
}

/** Module exports for the Conversation store. */
export interface ConversationStoreModule {
    /** Zustand store hook for conversation state. */
    useConversationStore: ZustandStore<ConversationStoreState>;
    /** Create an optimistic conversation object before the server responds. */
    createOptimisticConversation: (params: any) => GrokConversation;
    /** Pull the project workspace UUID off one or more conversation objects. */
    resolveConversationProjectWorkspaceId: (...conversations: Array<GrokConversation | null | undefined>) => string | undefined;
}
