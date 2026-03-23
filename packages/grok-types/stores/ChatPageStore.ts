import type { GrokPersonality } from "../common/Personality";
import type { ConversationMode } from "../enums/conversation";
import type { ModelId, ModelMode, ModelConfigModelMode, ReasoningMode } from "../enums/models";
import type { VoiceActivityStatus, VoiceConnectionStatus } from "../enums/voice";
import type { ZustandStore } from "../zustand";

/**
 * Zustand state for the active chat page, encompassing
 * model selection, rate limiting, voice mode, streaming state, side panel,
 * and all chat-related UI state.
 */
export interface ChatPageStoreState {
    /** Active conversation ID, or undefined for a new chat. */
    conversationId: string | undefined;
    /** Optimistic conversation ID assigned before the server confirms creation. */
    optimisticConversationId: string | undefined;
    /** ID of the last message in the conversation thread. */
    lastMessageId: string | undefined;
    /** Current content displayed in the side panel (response details, search results, etc.). */
    sidePanelContent: any;
    /** Navigation stack for side panel drill-down (back button support). */
    sidePanelStack: any[];
    /** Response ID associated with the current side panel content. */
    sidePanelResponseId: string | undefined;

    /** Currently selected model ID (e.g. "grok-420", "grok-4"). */
    activeModelId: ModelId;
    /** Selected custom system prompt ID, or undefined for default. */
    selectedSystemPromptId: string | undefined;
    /** Conversation interaction mode (e.g. "chat", "deep_search"). */
    conversationMode: ConversationMode;
    /** Reasoning depth mode (e.g. "none", "think", "deepsearch"). */
    reasoningMode: ReasoningMode;
    /** Model variant mode from the model picker (e.g. "expert", "fast", "auto"). */
    modelMode: ModelMode;
    /** Whether the 4/20 special model mode is enabled. */
    enable420: boolean;


    /** Whether the user is rate-limited. `false` when not limited, or a string error message. */
    isRateLimited: boolean | string;
    /** Whether thinking/reasoning mode is specifically rate-limited. */
    isThinkingRateLimited: boolean;
    /** Whether deep search mode is specifically rate-limited. */
    isDeepSearchRateLimited: boolean;
    /** Whether the user needs to authenticate to continue. */
    isUnauthenticated: boolean;


    /** Whether the query/input bar is expanded (default: true). */
    queryBarExpanded: boolean;
    /** Debounce flag while the user is actively typing. */
    isTypingDebounce: boolean;
    /** Whether to show the streaming dots indicator. */
    showStreamingIndicator: boolean;
    /** Whether deeper search mode is selected in the UI toggle. */
    isDeeperSearchSelected: boolean;
    /** Whether the share dialog is open. */
    requestShareDialogOpen: boolean;
    /** Whether the chat page has finished its initial load. */
    chatPageLoaded: boolean;


    /** Default model ID for anonymous users, from the models API. */
    defaultAnonModelId: ModelId;
    /** Default model ID for free-tier users, from the models API. */
    defaultFreeModelId: ModelId;
    /** Default model ID for pro users, or undefined if not set. */
    defaultProModelId: ModelId | undefined;


    /** Set of message IDs that were optimistically created but are now stale. */
    staleOptimisticMessageIds: Set<string>;
    /** ID of the response currently being streamed. */
    streamedMessageId: string | undefined;
    /** ID of an optimistically created message (before server confirms). */
    optimisticMessageId: string | undefined;
    /** Set of preferred response IDs selected by the user in A/B comparisons. */
    preferredResponses: Set<string>;
    /** Whether the current response is using an experimental model. */
    usingExperiment: boolean;


    /** Configuration for side-by-side response comparison mode. */
    sideBySideConfig: any;
    /** Data for the quote popup overlay. */
    quotePopupData: any;
    /** Arbitrary metadata attached to the current chat session. */
    metadata: Record<string, any>;
    /** Workspace project ID, or undefined for non-workspace chats. */
    projectId: string | undefined;
    /** Selected personality preset ID, or undefined for default assistant. */
    selectedPersonalityId: string | undefined;
    /** Custom personality configuration object. */
    customPersonality: GrokPersonality | null | undefined;
    /** Text quoted from a response for reply context. */
    quotedText: string | undefined;
    /** Map of conversation ID to draft query text (preserves drafts across conversations). */
    queryByConversationId: Record<string, string>;
    /** Post-response satisfaction survey data. */
    survey: any;
    /** Selected conversation template for structured prompts. */
    selectedConversationTemplate: any;
    /** Whether to show the template input guide overlay. */
    showConversationTemplateInputGuide: boolean;


    /** Current voice activity state (idle, speaking, listening). */
    voiceActivityStatus: VoiceActivityStatus;
    /** LiveKit room instance for WebRTC voice connections. */
    livekitRoom: any;
    /** LiveKit authentication token for the current voice session. */
    livekitToken: string | null;
    /** Request ID for the current LiveKit token request. */
    livekitRequestId: string | null;
    /** WebRTC voice connection lifecycle state. */
    voiceConnectionStatus: VoiceConnectionStatus;
    /** Selected voice persona ID (e.g. "Ara", "Sage"). */
    voiceId: string;
    /** Personality ID used during voice mode (e.g. "assistant"). */
    voicePersonalityId: string;
    /** Custom instructions for voice mode behavior. */
    voiceCustomInstructions: string | null;
    /** Voice playback speed multiplier (1.0 = normal). */
    voicePlaybackSpeed: number;
    /** Selected microphone device ID, or undefined for system default. */
    selectedAudioInputDeviceId: string | undefined;
    /** List of available audio input devices. */
    audioInputDevices: any[];
    /** Whether to auto-open search result cards during voice mode. */
    voiceAutoOpenSearchResults: boolean;
    /** Timeout ID for voice mode auto-disconnect. */
    voiceModeTimeoutId: number | null;
    /** Unique ID for the current voice session. */
    currentVoiceSessionId: string | null;
    /** Conversation ID created during the current voice session. */
    voiceSessionConversationId: string | null;
    /** Promise tracking the voice mode exit flow. */
    exitVoiceModePromise: Promise<void> | null;
    /** Optimistic asset IDs for voice conversation attachments. */
    optimisticVoiceConversationAssetIds: string[];
    /** Whether an active voice response was interrupted by the user. */
    voiceInterruptedActiveResponse: boolean;
    /** Whether to show the voice session rating survey. */
    showVoiceRatingSurvey: boolean;
    /** Session data collected for the voice rating survey. */
    voiceRatingSessionData: any;


    setModelMode: (mode: ModelMode) => void;
    setConversationId: (id: string | undefined) => void;
    setProjectId: (id: string | undefined) => void;
    setOptimisticConversationId: (id: string | undefined) => void;
    setLastMessageId: (id: string | undefined) => void;
    setQuotePopupData: (data: any) => void;
    setSidePanelContent: (content: any) => void;
    closeSidePanel: () => void;
    getSidePanelResponseId: () => string | undefined;
    /** Extract the response ID from a side panel content object, if present. */
    _extractResponseIdFromContent: (content: any) => string | undefined;
    setSidePanelStack: (stack: any[]) => void;
    updateSidePanelResponseId: (id: string | undefined, content: any) => void;
    toggleSidePanelContent: (content: any) => void;
    setStreamedMessageId: (id: string | undefined) => void;
    setActiveModelId: (id: ModelId) => void;
    setSelectedSystemPromptId: (id: string | undefined) => void;
    setIsRateLimited: (value: boolean | string) => void;
    setIsRateLimitedFromError: (error: any) => void;
    setIsUnauthenticated: (value: boolean) => void;
    setOptimisticMessageId: (id: string | undefined) => void;
    setConversationMode: (mode: ConversationMode) => void;
    setReasoningMode: (mode: ReasoningMode) => void;
    setChatPageLoaded: (loaded: boolean) => void;
    setDefaultAnonModelId: (id: ModelId) => void;
    setDefaultFreeModelId: (id: ModelId) => void;
    setDefaultProModelId: (id: ModelId) => void;
    setMetadata: (metadata: Record<string, any>) => void;
    setSelectedPersonalityId: (id: string | undefined) => void;
    setCustomPersonality: (personality: GrokPersonality | null) => void;
    setQuotedText: (text: string | undefined) => void;
    idsetQueryByConversationId: (conversationId: string, query: string) => void;
    setQueryBarExpanded: (expanded: boolean) => void;
    setIsTypingDebounce: (value: boolean) => void;
    setIsDeeperSearchSelected: (value: boolean) => void;
    setEnable420: (value: boolean) => void;
    setShowStreamingIndicator: (value: boolean) => void;
    setRequestShareDialogOpen: (open: boolean) => void;
    setSideBySideConfig: (config: any) => void;
    setSurvey: (survey: any) => void;
    setSelectedConversationTemplate: (template: any, show: boolean) => void;
    setShowConversationTemplateInputGuide: (show: boolean) => void;
    addPreferredResponse: (responseId: string) => void;
    setUsingExperiment: (value: boolean) => void;
    setStaleOptimisticMessageIds: (ids: Set<string>) => void;


    setVoiceConnectionStatus: (status: VoiceConnectionStatus) => void;
    setVoiceActivityStatus: (status: VoiceActivityStatus) => void;
    setVoiceId: (id: string) => void;
    setVoicePersonalityId: (id: string) => void;
    setVoiceCustomInstructions: (instructions: string | null) => void;
    setVoicePlaybackSpeed: (speed: number) => void;
    setSelectedAudioInputDeviceId: (id: string | undefined) => void;
    setAudioInputDevices: (devices: any[]) => void;
    setVoiceAutoOpenSearchResults: (value: boolean) => void;
    setLivekitRoom: (room: any) => void;
    setLivekitToken: (token: string | null) => void;
    setLivekitRequestId: (id: string | null) => void;
    setVoiceModeTimeoutId: (id: number | null) => void;
    setCurrentVoiceSessionId: (id: string | null) => void;
    setVoiceSessionConversationId: (id: string | null) => void;
    setVoiceInterruptedActiveResponse: (value: boolean) => void;
    setShowVoiceRatingSurvey: (show: boolean) => void;
    setVoiceRatingSessionData: (data: any) => void;
    setOptimisticVoiceConversationAssetIds: (ids: string[]) => void;


    /** Check if a streaming error is retryable (transient network issues). */
    isErrorRetryable: (error: any) => boolean;
    /** Create a new conversation and send the first message. */
    establishNewConversation: (...args: any[]) => Promise<void>;
    /** Send a new response in the current conversation. */
    sendResponse: (...args: any[]) => Promise<void>;
    /** Reconnect to in-flight streaming responses after a page reload. */
    reconnectToInflightResponses: (...args: any[]) => Promise<void>;
    /** Abort an active streaming response. */
    abortStream: (...args: any[]) => Promise<void>;


    /** Enter voice mode and establish a WebRTC connection. */
    enterVoiceMode: (...args: any[]) => Promise<void>;
    /** Attempt to enter voice mode with permission checks. */
    attemptEnterVoiceMode: (...args: any[]) => Promise<void>;
    /** Exit voice mode and disconnect WebRTC. */
    exitVoiceMode: (...args: any[]) => Promise<void>;
    /** Perform the actual voice mode exit (internal). */
    performExitVoiceMode: (...args: any[]) => Promise<void>;
    /** Request a new LiveKit authentication token. */
    requestLivekitToken: (...args: any[]) => Promise<void>;
    /** Toggle screen sharing in voice mode. */
    toggleScreenSharing: () => Promise<void>;
    /** Send updated voice settings to the server. */
    sendVoiceSettingsUpdate: (...args: any[]) => void;
    /** Send a manual text message during voice mode. */
    sendVoiceManualMessage: (...args: any[]) => void;
    /** Send file attachments during voice mode. */
    sendVoiceAttachments: (...args: any[]) => void;
    /** Handle a voice connection ping (keepalive). */
    handleVoiceConnectionPing: () => void;
    /** Optimistically update a conversation title before server confirmation. */
    optimisticSetConversationTitle: (conversationId: string, title: string) => void;
    /** Append streaming text to the current voice response transcript. */
    appendVoiceStreamingText: (text: any) => void;
    /** Handle output data from Grok during a voice session. */
    handleVoiceGrokOutput: (output: any) => void;
    /** Handle a search result returned during a voice response. */
    handleVoiceResponseSearchResult: (result: any) => void;

    /** Handle a new conversation created during voice mode. */
    handleConversationCreated: (event: any) => void;
    /** Handle a new conversation item created during voice mode. */
    handleConversationItemCreated: (event: any) => void;
    /** Handle a new message conversation item created during voice mode. */
    handleMessageConversationItemCreated: (event: any) => void;
    /** Handle a new attachment conversation item created during voice mode. */
    handleAttachmentConversationItemCreated: (event: any) => void;
    /** Handle completion of a conversation item transcription. */
    handleConversationItemTranscriptionCompleted: (event: any) => void;
    /** Handle creation of an assistant voice response. */
    handleAssistantVoiceResponseCreated: (event: any) => void;
    /** Handle a transcript delta from the assistant voice response. */
    handleAssistantVoiceResponseTranscriptDelta: (event: any) => void;
    /** Handle a text delta from the assistant voice response. */
    handleAssistantVoiceResponseTextDelta: (event: any) => void;
    /** Handle completion of assistant voice response text. */
    handleAssistantVoiceResponseTextDone: (event: any) => void;
    /** Handle a new output item added to the assistant voice response. */
    handleAssistantVoiceResponseOutputItemAdded: (event: any) => void;
    /** Handle a new content part added to the assistant voice response. */
    handleAssistantVoiceResponseContentPartAdded: (event: any) => void;
    /** Handle completion of the assistant voice response transcript. */
    handleAssistantVoiceResponseTranscriptDone: (event: any) => void;

    /** Check if microphone permission is already granted. */
    checkMicrophonePermission: () => Promise<boolean>;
    /** Request microphone permission from the browser. */
    requestMicrophonePermission: () => Promise<boolean>;
}

/** Module exports for the ChatPage store. */
export interface ChatPageStoreModule {
    /** Zustand store hook for chat page state. */
    useChatPageStore: ZustandStore<ChatPageStoreState>;
    /** Get the latest thread message ID for branching conversations. */
    getLatestThreadMessageId: (...args: any[]) => string | undefined;
    /** Convert model config mode string to internal ModelMode. */
    modelConfigModelModeToModelMode: (mode: ModelConfigModelMode) => ModelMode;
    /** Convert internal ModelMode to model config mode string. */
    modelModeToModelConfigModelMode: (mode: ModelMode) => ModelConfigModelMode;
}
