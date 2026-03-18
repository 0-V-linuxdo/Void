import type { BuildSubPage, GrokPage, WorkspaceTab } from "../enums";
import type { ZustandStore } from "../zustand";

export type { GrokPage };

/**
 * A parsed route object representing the current page state.
 * Grok uses client-side routing without React Router; this store
 * manages navigation state directly.
 */
export interface GrokRoute {
    /** Page identifier (e.g. "main", "chat", "workspace", "build"). */
    page: GrokPage;
    /** Active conversation ID when on a chat page. */
    conversationId?: string | null;
    /** Whether this is a temporary/ephemeral route (e.g. incognito). */
    temporary?: boolean;
    /** Whether voice mode is active for this route. */
    voice?: boolean;
    /** Conversation template ID, or null. */
    templateId?: string | null;
    /** Team/workspace ID for enterprise routes, or null. */
    teamId?: string | null;
    /** Model code override from URL params (parsed as number via parseInt). */
    modelCode?: number | null;
    /** Workspace ID for project pages. */
    workspaceId?: string;
    /** Active tab within the current page. */
    tab?: WorkspaceTab | null;
    /** Build session ID. */
    sessionId?: string;
    /** Build sub-page (e.g. "remote", "history", "settings", "share", "compare", "arena"). */
    subPage?: BuildSubPage;
    /** Story ID for highlights/trends pages. */
    storyId?: string;
    /** Post ID for imagine pages. */
    postId?: string;
    /** Ticker symbol for finance pages. */
    ticker?: string;
    /** Anchor for FAQ/changelog deep links. */
    anchor?: string | null;
    /** URL hash fragment. */
    hash?: string;
    /** Notification ID for deep-linking to a specific notification. */
    notificationId?: string;
    /** Task ID for the tasks page. */
    taskId?: string | null;
    /** Whether the build setup wizard is shown. */
    setup?: boolean;
    /** Extensible — Grok may add new route properties. */
    [key: string]: any;
}

/**
 * Zustand state for client-side routing, handling navigation history
 * and scroll position restoration. Grok does not use React Router;
 * this store + `useRoutingSync` hook handle all routing.
 */
export interface RoutingStoreState {
    /** Current parsed route object. Initialized from window.location on load. */
    route: GrokRoute;
    /** Saved scroll position for the main page, used for back-navigation restoration. */
    mainPageScrollPosition: number | null;
    /** Flag to reset main page content on next mount (e.g. after switching teams). */
    mainPageResetOnMount: boolean;
    /** Navigation history stack for back-button support (max 25 entries). */
    historyStack: GrokRoute[];

    /** Sync internal state when the browser URL changes externally (popstate). */
    handleExternalChange: () => void;
    /** Save the current scroll position of the main page list. */
    saveMainPageScrollPosition: (position: number) => void;
    /** Clear the saved main page scroll position. */
    clearMainPageScrollPosition: () => void;
    /** Request a full reset of the main page on next mount. */
    requestMainPageReset: () => void;
    /** Clear the main page reset flag after handling. */
    clearMainPageReset: () => void;
    /** Navigate to a new route, pushing to browser history. */
    push: (route: GrokRoute, state?: Record<string, any>) => void;
    /** Navigate to a new route, replacing the current browser history entry. */
    replace: (route: GrokRoute, state?: Record<string, any>) => void;
}

/** Module exports for the Routing store. */
export interface RoutingStoreModule {
    /** Zustand store hook for routing state. */
    useRoutingStore: ZustandStore<RoutingStoreState>;
    /** Hook that synchronizes the store with browser URL changes. */
    useRoutingSync: () => void;
    /** Hook that returns the current slug-based page component. */
    useRoutingSlugComponent: () => any;
    /** Format a URL object (pathname + query + hash) into a URL string. */
    formatUrl: (urlObject: { pathname?: string; query?: Record<string, any>; hash?: string }) => string;
    /** Convert a GrokRoute into a URL object relative to a base route. */
    routeToUrlObject: (route: GrokRoute, baseRoute: GrokRoute) => { pathname?: string; query?: Record<string, any>; hash?: string };
    /** Parse a URL string into a GrokRoute. */
    urlToRoute: (url: string) => GrokRoute;
    /** Valid tab identifiers for the workspace main page (e.g. "own", "shared", "examples"). */
    workspaceMainPageTabs: WorkspaceTab[];
}
