import type { ZustandStore } from "../zustand";

/** A user's reaction to a highlight story. */
export type StoryReaction = "liked" | "disliked" | null;

/** A highlight story from the highlights feed. */
export interface HighlightStory {
    /** Unique story identifier. */
    storyId: string;
    /** X (Twitter) post IDs associated with this story. */
    xPostIds?: string[];
    /** Grok-generated article for this story. */
    article?: { content: string };
    /** Grok's analysis summary of the story. */
    grokAnalysis?: string;
}

/** Zustand state for the Highlights/Stories feed. */
export interface HighlightsStoreState {
    /** Raw Zustand persist store reference. */
    store: any;
    /** List of loaded highlight stories. */
    stories: HighlightStory[];
    /** Whether stories are currently being fetched. */
    isLoading: boolean;
    /** Last fetch error, or null. */
    error: Error | null;
    /** Cursor for paginated story fetching. */
    nextCursor: string | undefined;
    /** User reactions keyed by story ID. */
    storyReactions: Record<string, StoryReaction>;
    /** Source X posts keyed by story ID. */
    sourcePostsByStoryId: Record<string, any[]>;
    /** Set of story IDs whose entrance animation has played. */
    animatedStoryIds: Set<string>;
    /** Map from requested story ID to canonical merged story ID. */
    mergedStoryIds: Record<string, string>;
    /** Whether the user is denied access to highlights (4xx from API). */
    accessDenied: boolean;
    /** Set of X post IDs already seen, used for deduplication. */
    seenPostIds: Set<string>;

    /** Replace the stories list. */
    setStories: (stories: HighlightStory[]) => void;
    /** Set the loading state. */
    setIsLoading: (loading: boolean) => void;
    /** Set the error state. */
    setError: (error: Error | null) => void;
    /** Set the next pagination cursor. */
    setNextCursor: (cursor: string | undefined) => void;
    /** Set a reaction for a story. */
    setStoryReaction: (storyId: string, reaction: StoryReaction) => void;
    /** Set source posts for a story. */
    setSourcePostsByStoryId: (storyId: string, posts: any[]) => void;
    /** Get source posts for a story. */
    getSourcePostsByStoryId: (storyId: string) => any[];
    /** Mark a story's entrance animation as played. */
    markStoryAnimated: (storyId: string) => void;
    /** Check whether a story's entrance animation has played. */
    hasStoryAnimated: (storyId: string) => boolean;
    /** Toggle a "liked" reaction on a story. */
    likeStory: (storyId: string) => void;
    /** Toggle a "disliked" reaction on a story. */
    dislikeStory: (storyId: string) => void;
    /** Filter stories to remove duplicates already seen by post ID. */
    deduplicateByPostIds: (stories: HighlightStory[], postIds: Set<string>) => HighlightStory[];
    /** Fetch the initial page of stories. */
    fetchStories: (limit?: number) => Promise<void>;
    /** Fetch the next page of stories using the stored cursor. */
    fetchMoreStories: () => Promise<void>;
    /** Get a story by ID, optionally fetching from the API. */
    getStory: (storyId: string, source?: string) => Promise<HighlightStory>;
    /** Reset all highlights state to initial values. */
    reset: () => void;
}

/** Module exports for the Highlights store. */
export interface HighlightsStoreModule {
    /** Zustand store hook for the Highlights/Stories feed. */
    useHighlightsStore: ZustandStore<HighlightsStoreState>;
}
