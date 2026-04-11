import type { ModelId } from "../enums/models";
import type { ToolName } from "../enums/tools";
import type { ZustandStore } from "../zustand";

/**
 * User-configurable preferences stored server-side.
 * Persisted via the user settings API and managed through the Settings UI.
 */
export interface UserSettings {
    /** Whether to exclude conversations from model training data. */
    excludeFromTraining: boolean;
    /** Allow X (Twitter) data to personalize Grok responses. */
    allowXPersonalization: boolean;
    /**
     * Key-value map of UI preferences.
     * Known keys include `autoWrapLongLinesCode`, `browserNotificationsEnabled`,
     * `enableBrowserGeoLocation`, `showConversationPreviews`, `hideArtifacts`,
     * `showActiveTabs`, `disableAutoScroll`, `enableTiptapEditorForQueryBar`,
     * `useModelModeSelector3`, `enableStarBackground`, `isAsyncChat`,
     * `enableEarlyAccessModels`, `disableVideoGenerationOnUpload`,
     * `requireCmdEnterToSubmit`, `enableColoredFileIcons`.
     */
    preferences: Record<string, any>;
    /** Whether Grok's memory feature is enabled for the user. */
    enableMemory: boolean;
    /** Allow shared conversations to be indexed by search engines. */
    allowShareIndexing: boolean;
    /** Allow push notifications from the Grok companion feature. */
    allowCompanionNotifications: boolean;
    /** Automatically share conversations when a share link is generated. */
    allowAutoShare: boolean;
    /** Custom agent behavior configurations. */
    agentCustomizations: any[];
}

/**
 * Zustand state for user settings and dev tool overrides, including
 * age verification and developer model/system prompt overrides.
 */
export interface SettingsStoreState {
    /** Whether incognito mode is active (conversations not saved). */
    isIncognito: boolean;
    /** In-flight promise for the user settings fetch. Undefined when idle. */
    userSettingsPromise: Promise<any> | undefined;
    /** Fetched user settings, or undefined before the initial load. */
    userSettings: UserSettings | undefined;
    /** User's selected UI language code (e.g. "en"). Undefined for browser default. */
    selectedLanguage: string | undefined;
    /** Whether the age verification dialog is currently shown. */
    showAgeVerification: boolean;
    /** Configuration for age verification behavior (gating rules). */
    ageVerificationBehavior: any;
    /** Callback invoked after successful age verification. */
    ageVerificationCallback: (() => void) | undefined;
    /** Global model config override object (dev tools). */
    modelConfigOverride: any;
    /** Per-model config overrides keyed by model ID (dev tools). */
    modelConfigOverrideByModel: Record<ModelId, any>;
    /** Custom system prompt override applied to all conversations (dev tools). */
    systemPromptOverride: string | undefined;
    /** Custom memory system prompt override (dev tools). */
    memorySystemPromptOverride: string | undefined;
    /** Force the tool composer v2 UI. Undefined uses server default. */
    isToolComposer2: boolean | undefined;
    /** Side-by-side response comparison mode (e.g. "default"). */
    sideBySideMode: string;
    /** Bypass the response cache for fresh generations. */
    skipResponseCache: boolean;
    /** Override the model API address (dev tools). Empty string for default. */
    modelAddressOverride: string;
    /** Override the model family routing (dev tools). "none" for default. */
    modelFamilyOverride: string;
    /** Custom model endpoint address override (dev tools). */
    customModelAddressOverride: string | undefined;
    /** Hide the model override indicator badge in the UI. */
    isModelOverrideHidden: boolean;

    setIsIncognito: (value: boolean) => void;
    setUserSettingsPromise: (promise: Promise<any>) => void;
    setUserSettings: (settings: UserSettings) => void;
    setSelectedLanguage: (lang: string) => void;
    setShowAgeVerification: (show: boolean) => void;
    setAgeVerificationBehavior: (behavior: any) => void;
    setAgeVerificationCallback: (cb: (() => void) | undefined) => void;
    setModelConfigOverrideByModel: (overrides: Record<ModelId, any>) => void;
    setIsToolComposer2: (value: boolean) => void;
    setSideBySideMode: (value: string) => void;
    setSkipResponseCache: (value: boolean) => void;
    setModelAddressOverride: (address: string) => void;
    setModelFamilyOverride: (family: string) => void;
    setCustomModelAddressOverride: (address: string | undefined) => void;
    setIsModelOverrideHidden: (hidden: boolean) => void;
    setSystemPromptOverride: (prompt: string | undefined) => void;
    setMemorySystemPromptOverride: (prompt: string | undefined) => void;
    /** Hydrate settings store from server-side prefetch data. */
    loadFromPrefetch: (data: any) => void;

    /** Initialize GDPR-compliant user settings (EU users). */
    initializeGdprUserSettings: () => void;
    /** Initialize enterprise-specific user settings. */
    initializeEnterpriseUserSettings: () => void;
    /** Fetch user settings from the API and populate the store. */
    fetchGetUserSettings: () => Promise<void>;
    /** Persist partial user settings changes to the API. */
    fetchSetUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
    /** Update a single preference key-value pair on the server. */
    fetchSetPreference: (key: string, value: any) => Promise<void>;
}

/** Module exports for the Settings store. */
export interface SettingsStoreModule {
    /** Zustand store hook for user settings state. */
    useSettingsStore: ZustandStore<SettingsStoreState>;
    /** Map of tool name identifiers to their display names. */
    TOOL_NAMES: Record<ToolName, string>;
    /** Check if a dev model config override exists for the given model ID. */
    hasModelConfigOverride: (model: ModelId) => boolean;
    /** Zod-like validation schema for model config override objects. */
    modelConfigOverrideSchema: any;
}
