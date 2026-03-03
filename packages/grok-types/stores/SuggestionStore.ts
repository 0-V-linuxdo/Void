import type { ZustandStore } from "../zustand";

/** Configuration for the suggestion system. */
export interface SuggestionConfig {
    /** Whether suggestions are enabled. */
    enabled: boolean;
    /** Whether Grok-powered suggestions are enabled. */
    grokEnabled: boolean;
    /** Maximum characters for suggestion queries. */
    maxChars: number;
}

/** A Grok LLM completion suggestion. */
export interface LlmSuggestion {
    type: "llm";
    text: string;
}

/** A search engine completion suggestion. */
export interface SearchSuggestion {
    type: "search";
    text: string;
}

/** A stock ticker suggestion with market data. */
export interface StockSuggestion {
    type: "stock";
    summary: any;
}

/** A quick answer suggestion (inline answer to the query). */
export interface AnswerSuggestion {
    type: "answer";
    text: string;
}

/** A math expression evaluation result. */
export interface MathSuggestion {
    type: "math";
    result: string;
    expression: string;
}

/** A workspace project match. */
export interface ProjectSuggestion {
    type: "project";
    project: any;
}

/** A conversation template match. */
export interface TemplateSuggestion {
    type: "template";
    template: any;
}

/** Discriminated union of all suggestion types. */
export type Suggestion =
    | LlmSuggestion
    | SearchSuggestion
    | StockSuggestion
    | AnswerSuggestion
    | MathSuggestion
    | ProjectSuggestion
    | TemplateSuggestion;

/** Zustand state for inline suggestions (autocomplete, stock tickers, etc). */
export interface SuggestionStoreState {
    /** Suggestion system configuration (from feature flags). */
    config: SuggestionConfig;
    /** Stock data keyed by ticker symbol. */
    stockByTicker: Record<string, any>;
    /** Current list of active suggestions. */
    suggestions: Suggestion[];
    /** Cancellation token for the current suggestion fetch. */
    fetchSymbol: symbol;
    /** Cancellation token for stock ticker fetches. */
    tickerFetchSymbol: symbol;

    /** Fetch suggestions for a query, debounced and streamed from the API. */
    ensureSuggestions: (query: string, workspaces: any[], templates: any[], responses?: any[] | null) => Promise<void>;
    /** Clear the current suggestions list and cancel in-flight fetches. */
    clearList: () => void;
    /** Internal: Update the suggestions list via a mutator function. */
    _updateList: (updater: (suggestions: Suggestion[]) => Suggestion[]) => void;
}

/** Module exports for the Suggestion store. */
export interface SuggestionStoreModule {
    /** Zustand store hook for inline suggestions. */
    useSuggestionStore: ZustandStore<SuggestionStoreState>;
    /** Initialization hook that syncs feature flag config into the store. */
    useSuggestionStoreInit: () => void;
    /** Hook that manages the suggestion lifecycle for a query string. */
    useSuggestions: (query: string) => Suggestion[];
}
