/** Model identifier strings used in API requests and store state. */
export type ModelId =
    | "grok-3"
    | "grok-3-fast"
    | "grok-4"
    | "grok-4-mini-thinking-tahoe"
    | "grok-4-1-thinking-1129"
    | "grok-4-1-0204"
    | "grok-4-1-nightly-0224"
    | "grok-4-mini-thinking-1216"
    | "grok-420"
    | "grok-420-0204"
    | "grok-4-1-non-thinking-companion"
    | "grok-4-heavy"
    | "grok-2-1212"
    | "grok-2-mini"
    | (string & {});

/** Model mode selector controlling which model variant is used. Maps to the model picker UI. */
export type ModelMode =
    | "auto"
    | "fast"
    | "expert"
    | "heavy"
    | "grok-4-mini-thinking"
    | "grok-4-1"
    | "grok-4-1-thinking"
    | "grok-4-1-nightly"
    | "grok-420"
    | (string & {});

/**
 * Internal model mode enum from the API (`ModelConfigModelMode`).
 * Stored on `GrokModel.modelMode`. Maps 1:1 with {@link ModelMode} via
 * `modelConfigModelModeToModelMode()` / `modelModeToModelConfigModelMode()`.
 *
 * | API Value                      | ModelMode             |
 * |--------------------------------|-----------------------|
 * | MODEL_MODE_UNKNOWN             | (undefined)           |
 * | MODEL_MODE_AUTO                | "auto"                |
 * | MODEL_MODE_FAST                | "fast"                |
 * | MODEL_MODE_EXPERT              | "expert"              |
 * | MODEL_MODE_HEAVY               | "heavy"               |
 * | MODEL_MODE_GROK_4_MINI_THINKING| "grok-4-mini-thinking"|
 * | MODEL_MODE_GROK_4_1            | "grok-4-1"            |
 * | MODEL_MODE_GROK_4_1_THINKING   | "grok-4-1-thinking"   |
 * | MODEL_MODE_GROK_4_1_NIGHTLY    | "grok-4-1-nightly"    |
 * | MODEL_MODE_GROK_420            | "grok-420"            |
 */
export type ModelConfigModelMode =
    | "MODEL_MODE_UNKNOWN"
    | "MODEL_MODE_AUTO"
    | "MODEL_MODE_FAST"
    | "MODEL_MODE_EXPERT"
    | "MODEL_MODE_HEAVY"
    | "MODEL_MODE_GROK_4_MINI_THINKING"
    | "MODEL_MODE_GROK_4_1"
    | "MODEL_MODE_GROK_4_1_THINKING"
    | "MODEL_MODE_GROK_4_1_NIGHTLY"
    | "MODEL_MODE_GROK_420"
    | "MODEL_MODE_IMAGINE"
    | (string & {});

/**
 * Backend routing identifier from the API (`ModelConfigPromptingBackend`).
 * Stored on `GrokModel.promptingBackend`. Determines which inference backend handles the request.
 */
export type PromptingBackend = "GIX" | "CHAT" | (string & {});

/** Reasoning depth mode for responses. */
export type ReasoningMode = "none" | "think" | "deepsearch" | "deepersearch" | "unknown" | (string & {});

/** Request kind sent to the rate limits API, determines processing pipeline. */
export type RequestKind = "DEFAULT" | "REASONING" | "DEEPSEARCH" | "DEEPERSEARCH" | "IMAGE_GENERATION" | "VIDEO_GENERATION" | (string & {});

/** UI layout effort level from the API, controls response rendering mode. */
export type UiLayoutEffort =
    | "UNSPECIFIED"
    | "LOW"
    | "HIGH"
    | "AUTO"
    | (string & {});

/** Reasoning UI layout variant from the API. */
export type ReasoningUiLayout =
    | "UNSPECIFIED"
    | "UNIFIED"
    | "SPLIT"
    | "HEAVY"
    | "FUNCTION_CALL"
    | (string & {});

/** Subscription tier gating for model modes. */
export type ModeSubscriptionTier =
    | "TIER_UNSPECIFIED"
    | "TIER_SUPERGROK"
    | "TIER_SUPERGROK_HEAVY"
    | (string & {});
