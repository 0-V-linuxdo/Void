/** Media post type classifying the kind of generated content. */
export type MediaPostType =
	| "MEDIA_POST_TYPE_INVALID"
	| "MEDIA_POST_TYPE_IMAGE"
	| "MEDIA_POST_TYPE_VIDEO"
	| "MEDIA_POST_TYPE_TEMPLATE"
	| (string & {});

/** Media post source indicating where the post came from. */
export type MediaPostSource =
	| "MEDIA_POST_SOURCE_INVALID"
	| "MEDIA_POST_SOURCE_PUBLIC"
	| "MEDIA_POST_SOURCE_LIKED"
	| "MEDIA_POST_SOURCE_OWNED"
	| "MEDIA_POST_SOURCE_CHARACTER_MENTIONED"
	| (string & {});

/** Original reference type for edits and remixes. */
export type OriginalRefType =
	| "ORIGINAL_REF_TYPE_INVALID"
	| "ORIGINAL_REF_TYPE_VIDEO_EXTENSION"
	| "ORIGINAL_REF_TYPE_VIDEO_EDIT"
	| "ORIGINAL_REF_TYPE_IMAGE_EDIT"
	| "ORIGINAL_REF_TYPE_MULTI_REF_IMAGE_EDIT"
	| "ORIGINAL_REF_TYPE_DOODLE_IMAGE_EDIT"
	| (string & {});

/** Imagine generation mode. */
export type ImagineMode = "image" | "video" | (string & {});

/** Imagine action mode for the current generation context. */
export type ImagineActionMode = "videoGen" | (string & {});

/** Media player tab selection. */
export type MediaPlayerTab = "image" | "video" | (string & {});

/** Video resolution option. */
export type VideoResolution = "480p" | "720p" | (string & {});

/** Available actions for a media post. */
export type MediaPostActionType =
	| "MEDIA_POST_ACTION_TYPE_LIKE"
	| "MEDIA_POST_ACTION_TYPE_SHARE"
	| "MEDIA_POST_ACTION_TYPE_DOWNLOAD"
	| "MEDIA_POST_ACTION_TYPE_DELETE"
	| "MEDIA_POST_ACTION_TYPE_UPSCALE_VIDEO"
	| (string & {});

/**
 * Grid permit state for controlling concurrent media rendering.
 * - `0` = waiting for permit
 * - `1` = actively rendering
 * - `2` = unmounted, pending cleanup
 */
export type GridPermitState = 0 | 1 | 2;

/** Pipeline execution stage. */
export type PipelineExecutionStage = "idle" | "running" | "complete" | (string & {});

/** Pipeline step status from the API. */
export type PipelineStepStatus =
    | "PIPELINE_STEP_STATUS_PENDING"
    | "PIPELINE_STEP_STATUS_RUNNING"
    | "PIPELINE_STEP_STATUS_COMPLETED"
    | "PIPELINE_STEP_STATUS_FAILED"
    | (string & {});

/** Image generation model identifier. */
export type ImageModel = "aurora" | "flux" | "imagine" | (string & {});
