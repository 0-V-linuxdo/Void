import type { GrokPersonality } from "../common/Personality";
import type { ZustandStore } from "../zustand";

/**
 * Zustand state for conversation personalities (system prompt presets)
 * that alter Grok's response style. Supports CRUD operations and
 * draft editing for custom personalities.
 */
export interface PersonalityStoreState {
    /** In-flight fetch promises keyed by personality ID. */
    promiseById: Record<string, Promise<any>>;
    /** Cached personalities keyed by personality ID. */
    byId: Record<string, GrokPersonality>;
    /** Ordered list of all personality objects. */
    list: GrokPersonality[];
    /** Draft prompt text keyed by personality ID (for editing). */
    draftPromptById: Record<string, string>;

    /** Reset the store to initial state. */
    clear: () => void;
    /** Insert or update a personality in the cache. */
    upsertPersonality: (personality: GrokPersonality) => void;
    /** Append multiple personalities to the cache. */
    appendPersonalities: (personalities: GrokPersonality[]) => void;
    /** Remove a personality from the cache by ID. */
    removePersonality: (id: string) => void;
    /** Insert or update a fetch promise for a personality ID. */
    idsertPersonalityPromise: (id: string, promise: Promise<any>) => void;
    /** Remove a fetch promise by personality ID. */
    removePersonalityPromise: (id: string) => void;
    /** Set a draft prompt for a personality. */
    upsertDraftPrompt: (id: string, prompt: string) => void;

    /** Create a new personality via the API. */
    fetchCreatePersonality: (data: any) => Promise<any>;
    /** Update an existing personality. */
    fetchUpdatePersonality: (data: any) => Promise<any>;
    /** Delete a personality by ID. */
    fetchDeletePersonality: (id: string) => Promise<any>;
    /** Fetch all personalities from the API. */
    fetchListPersonalities: () => Promise<any>;
    /** Fetch a single personality by ID. */
    fetchGetPersonality: (id: string) => Promise<any>;
}

/** Module exports for the Personality store. */
export interface PersonalityStoreModule {
    /** Check if a personality is a custom (non-preset) personality. */
    isCustomPersonality: (personality: GrokPersonality) => boolean;
    /** Zod-like schema for validating personality objects. */
    personalitySchema: any;
    /** Zustand store hook for personality state. */
    usePersonalityStore: ZustandStore<PersonalityStoreState>;
}
