import type { LoadingStatus } from "../common/LoadingStatus";
import type {
	GridPermitState,
	ImagineActionMode,
	ImagineMode,
	MediaPlayerTab,
	MediaPostActionType,
	MediaPostSource,
	MediaPostType,
	OriginalRefType,
	VideoResolution,
} from "../enums/media";
import type { ZustandStore } from "../zustand";

/**
 * A generated media item (image or video) in the Imagine system.
 * Represents a single generated or uploaded piece of media content.
 */
export interface MediaItem {
	/** Unique media item ID. */
	id: string;
	/** Optimistic ID assigned before the real ID arrives. */
	optimisticId?: string;
	/** Server item ID (may differ from `id` for generated items). */
	itemId?: string;
	/** User ID of the creator. */
	userId?: string;
	/** URL to the media asset. */
	mediaUrl: string;
	/** Base64 blob source for in-progress previews. */
	blobSrc?: string;
	/** MIME type of the media (e.g. `"video/mp4"`, `"image/png"`). */
	mimeType?: string;
	/** The user's original prompt. */
	prompt: string;
	/** The original prompt before any upsampling. */
	originalPrompt?: string;
	/** Whether this was generated (vs uploaded). */
	isGenerated?: boolean;
	/** Generation progress (0-100). */
	progress?: number;
	/** Whether generation is complete. */
	complete?: boolean;
	/** Media type enum value. */
	mediaType: MediaPostType;
	/** Whether this item was flagged by content moderation. */
	moderated?: boolean;
	/** Model name used for generation. */
	modelName?: string;
	/** ISO 8601 timestamp of creation. */
	createTime: string;
	/** Source of the media item. */
	fromSource?: MediaPostSource;
	/** Generation mode (e.g. `"text"`, `"normal"`). */
	mode?: string;
	/** Width in pixels. */
	width?: number;
	/** Height in pixels. */
	height?: number;
	/** Resolution info. */
	resolution?: { width: number; height: number };
	/** Named resolution tier (e.g. `"480p"`, `"720p"`). */
	resolutionName?: string;
	/** Title for the media post. */
	title?: string;
	/** Image variants of this item. */
	images?: MediaItem[];
	/** Video variants of this item. */
	videos?: MediaItem[];
	/** Child posts (re-generations, animated versions, HD upscales). */
	childPosts?: MediaItem[];
	/** Original post ID for edits/remixes. */
	originalPostId?: string;
	/** The original parent post. */
	originalPost?: MediaItem;
	/** Original reference type for edits. */
	originalRefType?: OriginalRefType;
	/** Input media items for edits. */
	inputMediaItems?: MediaItem[];
	/** Video URL for video items. */
	videoUrl?: string;
	/** Video ID for video items. */
	videoId?: string;
	/** HD/upscaled media URL. */
	hdMediaUrl?: string;
	/** Thumbnail image URL. */
	thumbnailImageUrl?: string;
	/** Last frame thumbnail URL (for videos). */
	lastFrameThumbnailImageUrl?: string;
	/** Watermarked media URL. */
	watermarkedMediaUrl?: string;
	/** Audio track URLs for video items. */
	audioUrls?: string[];
	/** Conversation ID this media was generated in. */
	conversationId?: string;
	/** Video duration in seconds. */
	videoDuration?: number;
	/** Start time offset for video extensions. */
	videoExtensionStartTime?: number;
	/** Available actions for this post. */
	availableActions?: MediaPostActionType[];
	/** User interaction status (like/dislike). */
	userInteractionStatus?: { likeStatus?: boolean };
	/** Inflight generation request ID. */
	inflightId?: string;
	/** Whether upscaling is in progress. */
	upscalingInProgress?: boolean;
	/** Whether this item is favorited. */
	isFavorite?: boolean;
	/** Whether this item is moderated (alias used by some components). */
	isModerated?: boolean;
	/** Whether this item is R-rated. */
	rRated?: boolean;
	/** Whether this item is hidden from the client. */
	isHiddenForClient?: boolean;
	/** Platform origin. */
	platform?: string;
	/** Media processing status. */
	mediaStatus?: string;
}

/**
 * Global video progress state across all in-progress videos.
 */
export interface VideoProgress {
	/** Minimum progress across all in-progress videos (0-1). */
	progress: number;
	/** Number of videos currently generating. */
	numberOfVideosInProgress: number;
}

/**
 * A model override option returned by the imagine overrides API.
 */
export interface ImagineModelOverride {
	/** Override key name. */
	key: string;
	/** Available option values. */
	options: string[];
}

/**
 * Zustand state for the Imagine media store, handling
 * caching, side-by-side comparisons, and media post CRUD for the
 * Imagine tab. The largest store in Grok.
 */
export interface MediaStoreState {
	/** In-flight media fetch promises keyed by ID. */
	promiseById: Record<string, Promise<any>>;
	/** Cached media items keyed by ID. */
	byId: Record<string, MediaItem>;
	/** Liked post IDs. */
	likedPostIds: Record<string, boolean>;
	/** Derived list of feed media items. */
	list: MediaItem[];
	/** Derived list of favorited items. */
	favoritesList: MediaItem[];
	/** Items favorited during this session. */
	favoritedInApp: MediaItem[];
	/** In-flight list fetch promises keyed by query. */
	listPromiseByQuery: Record<string, Promise<any>>;
	/** Pagination cursors keyed by query. */
	nextPageCursorByQuery: Record<string, string>;
	/** Image stream data keyed by stream ID. */
	imageStreamById: Record<string, any>;
	/** Video items keyed by parent media ID. */
	videoByMediaId: Record<string, MediaItem[]>;
	/** Image items keyed by parent media ID. */
	imageByMediaId: Record<string, MediaItem[]>;
	/** Global video generation progress. */
	globalVideoProgress: VideoProgress;
	/** Per-video smoothed progress values. */
	smoothedVideoProgress: Record<string, any>;
	/** Active image generation sessions. */
	imageGenSessions: any;
	/** Media items keyed by prompt key. */
	byPrompt: Record<string, MediaItem[]>;
	/** Post page section data keyed by post ID. */
	postPageSections: Record<string, any[]>;
	/** Post page image edit data keyed by post ID. */
	postPageImageEdits: Record<string, any[]>;
	/** Home generation prompts. */
	homeGenPrompts: any[];
	/** Current imagine session UUID. */
	imagineSessionId: string | null;
	/** Prompt index within the current session. */
	imagineSessionPromptIndex: number;
	/** First fetch status per context. */
	firstFetchStatus: Record<string, LoadingStatus>;
	/** Last context switch value. */
	lastSwitchContext: string | null;
	/** Whether a video generation was content moderated. */
	videoGenModerated: boolean;
	/** Whether the user is rate limited. */
	requestRateLimited: boolean;
	/** Peak hours info for rate limiting. */
	rateLimitedPeakHours: string | null;
	/** Whether the request was rejected. */
	requestRejected: boolean;
	/** Whether a server error occurred. */
	serverError: boolean;
	/** Whether 720p resolution fell back to 480p. */
	resolution720pFallback: boolean;
	/** Timeout handle for clearing error state. */
	errorClearTimeout: ReturnType<typeof setTimeout> | null;
	/** Timeout handle for clearing resolution fallback. */
	resolution720pFallbackClearTimeout: ReturnType<typeof setTimeout> | null;
	/** General error state for non-specific failures. */
	generalError: any;
	/** Timeout handle for clearing general error state. */
	generalErrorTimeout: ReturnType<typeof setTimeout> | null;
	/** Whether storage is exhausted. */
	storageExhausted: boolean;
	/** Timeout handle for storage exhausted state. */
	storageExhaustedTimeout: ReturnType<typeof setTimeout> | null;
	/** Optimistic video generation pending state keyed by ID. */
	optimisticVideoGenPending: Record<string, boolean>;
	/** Whether background videos are paused. */
	pauseBackgroundVideos: boolean;
	/** Whether this is a business session. */
	isBusinessSession: boolean;
	/** Disliked media IDs. */
	dislikedIds: Record<string, boolean>;
	/** Liked media IDs. */
	likedIds: Record<string, boolean>;
	/** In-flight video generation requests keyed by image ID. */
	inflightGenerateVideoForImage: Record<string, any>;
	/** Canceled in-flight video generation IDs. */
	inflightGenerateVideoForImageIdCanceled: Record<string, boolean>;
	/** Last used prompt keyed by media ID. */
	lastUsedPromptById: Record<string, string>;
	/** Extended processing state keyed by ID. */
	extendProcessingById: Record<string, any>;
	/** Side-by-side video comparison pairs keyed by video ID. */
	sideBySideVideoComparisonByVideoId: Record<string, string>;
	/** Side-by-side image comparison pairs keyed by image ID. */
	sideBySideImageComparisonByImageId: Record<string, string>;
	/** Active side-by-side image IDs. */
	sideBySideImageIds: [string, string] | null;
	/** Prompt key for the side-by-side image comparison. */
	sideBySideImagePromptKey: string | null;
	/** Currently active prompt key. */
	activePromptKey: string | null;
	/** Internal side-by-side insertion index for image placement. */
	_sideBySideInsertionIndex: number | null;
	/** Video IDs inhibited from side-by-side display. */
	inhibitedVideoIds: Record<string, boolean>;
	/** Image IDs inhibited from side-by-side display. */
	inhibitedImageIds: Record<string, boolean>;
	/** User-preferred side-by-side video IDs. */
	preferredSideBySideVideoIds: Record<string, boolean>;
	/** User-preferred side-by-side image IDs. */
	preferredSideBySideImageIds: Record<string, boolean>;
	/** User-preferred side-by-side image gen IDs. */
	preferredSideBySideImageGenIds: Record<string, boolean>;
	/** Video coverage data for side-by-side keyed by video ID. */
	sideBySideVideoCoverageByVideoId: Record<string, any>;
	/** Current root container ID. */
	currentRootContainer: string | null;
	/** Whether the store has been rehydrated from persistence. */
	rehydrated: boolean;
	/** Height of the input bar in pixels. */
	inputBarHeight: number;
	/** Pending media import data. */
	pendingImport: any | null;
	/** Optimistic-to-real ID mappings. */
	optimisticToRealIdMap: Record<string, string>;
	/** In-flight media URL imports. */
	inflightMediaUrlImports: Record<string, any>;
	/** Last viewed media ID per container post. */
	lastViewedMediaIdByContainerPostId: Record<string, string>;
	/** Last generated video ID. */
	lastGeneratedVideoId: string | null;
	/** Recently edited image IDs. */
	lastEditedImageIds: string[];
	/** Current authenticated user ID. */
	currentUserId: string | null;
	/** Whether the user is logged in. */
	loggedIn: boolean;
	/** Whether login is being requested. */
	requestingLogin: boolean;
	/** Pending out-of-band side-by-side IDs. */
	pendingOobSideBySideIds: string[];
	/** Whether out-of-band side-by-side images are allowed. */
	allowOutOfBandSideBySideImage: boolean;
	/** Source-specific append functions for media posts, keyed by MediaPostSource. */
	appendMediaPostsBySource: Record<string, Function>;

	setActivePromptKey: (key: string | null) => void;
	setSideBySideInsertionIndex: (index: number | null) => void;
	getSideBySideInsertionIndex: () => number | null;
	setInputBarHeight: (height: number) => void;
	resetRehydrated: () => void;
	setCurrentRootContainer: (container: string | null) => void;
	setOptimisticToRealIdMapping: (optimisticId: string, realId: string) => void;
	setLastViewedMediaId: (containerId: string, mediaId: string) => void;
	setLastGeneratedVideoId: (id: string | null) => void;
	addLastEditedImageId: (id: string) => void;
	clearFeedbackEligibility: () => void;
	setPendingImport: (data: any) => void;
	clearPendingImport: () => void;
	setLoggedIn: (loggedIn: boolean, userId: string | null, isBusinessSession?: boolean) => void;
	setRequestingLogin: (requesting: boolean) => void;
	setLastUsedPromptById: (id: string, prompt: string) => void;
	clearLastUsedPromptById: (id: string) => void;
	setDisliked: (id: string) => void;
	setLiked: (id: string) => void;
	setImageDimensions: (containerId: string, itemId: string, width: number, height: number) => void;
	setExternalPrompt: (prompt: string, source: string) => void;

	/** Check login status; returns true if logged in, shows login prompt otherwise. */
	loginCheck: (action: string) => boolean;

	/** Establish the imagine WebSocket connection. */
	connectWebSocket: () => void;
	/** Close the imagine WebSocket connection. */
	closeWebSocket: () => void;
	/** Toggle WebSocket console logging. */
	setEnableWebSocketConsoleLogging: (enabled: boolean) => void;

	/** Generate images from a prompt via WebSocket. */
	fetchImageGen: (prompt: string, isInitial: boolean, promptKey: string, filterCallback?: any, modelName?: string) => Promise<any>;
	/** Generate more images for an existing prompt. */
	fetchImageGenMore: (prompt: string, promptKey: string, modelName?: string, filterCallback?: any) => Promise<any>;
	/** Reset all image generation state. */
	resetImageGen: () => void;
	/** Get additional generation properties (model overrides, aspect ratio). */
	getAdditionalProperties: () => Record<string, any>;
	/** Get the selection prompt for a given prompt key. */
	getSelectionPromptByPromptKey: (key: string) => string | undefined;

	/** Generate images via chat API (non-websocket). */
	fetchGenerateImages: (params: any) => Promise<any>;
	/** Generate image edits with retry logic. */
	fetchGenerateImageEdits: (params: any) => Promise<any>;

	/** Generate a video from an image. */
	generateVideoForImage: (imageId: string) => Promise<any>;
	/** Cancel an in-flight video generation. */
	cancelGenerateVideoForImage: (imageId: string) => void;
	/** Upscale a video to HD. */
	upscaleVideo: (containerId: string, videoId: string) => Promise<any>;

	/** Insert or update a media post. */
	upsertMediaPost: (post: MediaItem) => void;
	/** Remove a media post by ID. */
	removeMediaPost: (id: string) => void;
	/** Update child media post items (videos/images). */
	upsertChildMediaPost: (post: MediaItem) => void;
	/** Insert or update a list fetch promise for a query. */
	idsertListPromiseByQuery: (query: string, promise: Promise<any>) => void;
	/** Insert or update a media fetch promise by ID. */
	idsertPromiseById: (id: string, promise: Promise<any>) => void;
	/** Insert or update a next page cursor for a query. */
	idsertNextPageCursorByQuery: (query: string, cursor: string) => void;
	/** Insert or update an image stream by ID. */
	upsertImageStreamById: (data: any) => void;
	/** Fetch a paginated list of media posts. */
	fetchListMediaPosts: (filter: any) => Promise<any>;
	/** Fetch a single media post by ID. */
	fetchMediaPost: (id: string) => Promise<MediaItem>;
	/** Create a media post from a text prompt. */
	createMediaPostFromPrompt: (mediaType: MediaPostType, prompt: string) => Promise<MediaItem>;
	/** Create a media post from a generated image. */
	createMediaPostFromGeneratedImage: (media: MediaItem) => Promise<MediaItem>;
	/** Create a media post from a URL. */
	createMediaPostFromUrl: (url: string, mimeType?: string) => Promise<MediaItem>;
	/** Resolve a possibly-generated media item to a permanent post. */
	resolveMediaPostForMaybeGenerated: (media: MediaItem) => Promise<MediaItem>;
	/** Create a share link for a media post. */
	createShareLink: (postId: string, source: string) => Promise<any>;
	/** Like a media post. */
	like: (id: string) => Promise<void>;
	/** Unlike a media post. */
	unlike: (id: string) => Promise<void>;
	/** Show a toast when storage is exhausted. */
	showStorageExhaustedToast: () => void;
	/** Handle a storage exhausted error if applicable. */
	maybeHandleStorageExhaustedError: (error: any) => void;
	/** Delete a media post. */
	deletePost: (id: string, containerId: string) => Promise<void>;

	/** Insert or update a media item under a prompt key. */
	upsertByPrompt: (promptKey: string, media: MediaItem) => void;
	/** Remove a media item from a prompt key. */
	removeByPrompt: (promptKey: string, id: string) => void;

	/** Insert or update an image in a container. */
	upsetImage: (containerId: string, image: MediaItem) => void;
	/** Remove an image by ID from a container. */
	removeImageById: (containerId: string, id: string) => void;
	/** Remove an image from a container. */
	removeImage: (containerId: string, id: string) => void;
	/** Remove a video from a container. */
	removeVideo: (containerId: string, id: string) => void;
	/** Remove a video by inflight ID from a container. */
	removeVideoByInflightId: (containerId: string, inflightId: string) => void;
	/** Remove moderated videos from a container, keeping the specified ID. */
	removeModeratedVideosOtherThanFromContainer: (containerId: string, keepId: string) => void;
	/** Remove moderated images from a container, keeping the specified ID. */
	removeModeratedImagesOtherThanFromContainer: (containerId: string, keepId: string) => void;

	/** Record coverage data for a side-by-side video. */
	recordSideBySideVideoCoverage: (videoId: string, coverage: any) => void;
	/** Record the user's preferred video in a side-by-side comparison. */
	recordPreferredSideBySideVideoIds: (videoId: string, durationMs: number, position: string) => void;
	/** Record the user's preferred image in a side-by-side comparison. */
	recordPreferredSideBySideImageIds: (imageId: string, durationMs: number, position: string) => void;
	/** Record the user's preferred image gen in a side-by-side comparison. */
	recordPreferredSideBySideImageGenId: (imageId: string, durationMs: number, position: string) => void;
	/** Skip a side-by-side video comparison (random selection). */
	skipSideBySideVideo: (durationMs: number, videoId: string) => void;
	/** Skip a side-by-side image comparison (random selection). */
	skipSideBySideImage: (durationMs: number, imageId: string) => void;
	/** Skip a side-by-side image gen comparison. */
	skipSideBySideImageGen: (durationMs: number) => void;
	/** Delete the losing side-by-side item by prompt key. */
	deleteSideBySideLoserWithPromptKey: (id: string) => void;
	/** Delete the losing side-by-side item. */
	deleteSideBySideLoser: (id: string) => void;
	/** Clear side-by-side video comparison state. */
	clearSideBySideVideoComparison: () => void;
	/** Clear side-by-side image comparison state. */
	clearSideBySideImageComparison: () => void;
	/** Move a winning image to the insertion index. */
	moveToSideBySideInsertionIndex: (id: string) => void;

	/** Handle an out-of-band image received via WebSocket. */
	handleOutOfBandImage: (wsMessage: any) => void;
	/** Add an out-of-band side-by-side image. */
	addOutOfBandSideBySideImage: (index: number, id: string, promptKey: string) => void;
	/** Enable or disable out-of-band side-by-side images. */
	enableImageSideBySide: (enabled: boolean) => void;

	/** Switch the imagine context. */
	switchContext: (context: string) => void;
	/** Get the container post ID for a media ID. */
	getContainerPostId: (id: string) => string | undefined;

	/** Push a section to a post page. */
	pushPostPageSection: (id: string, section: any) => void;
	/** Push an image edit to a post page. */
	pushPostPageImageEdit: (id: string, edit: any) => void;
	/** Push a home generation prompt. */
	pushHomeGenPrompt: (prompt: string, source: string) => void;
	/** Clear home generation prompts. */
	clearHomeGenPrompts: () => void;

	/** Get or create an inflight media URL import. */
	getOrCreateInflightMediaUrlImport: (url: string) => { optimisticId: string; isNew: boolean };
	/** Clear an inflight media URL import. */
	clearInflightMediaUrlImport: (url: string) => void;

	/** Backfill video input media items for a container. */
	_backfillVideoInputMediaItems: (containerId: string, items: any) => void;
	/** Show a rate limited toast notification. */
	_showRateLimitedToast: () => void;
	/** Show a server error toast notification. */
	_showServerErrorToast: () => void;
	/** Show a toast when 720p resolution falls back to 480p. */
	_showResolution720pFallbackToast: () => void;
	/** Try to parse rate limit JSON from a response. */
	_tryRateLimitJson: (response: any) => any;
	/** Set rate limited peak hours state with optional timeout. */
	_setRateLimitedPeakHours: (hours: string | null, timeout?: number) => void;
	/** Show a general error toast notification. */
	_showGeneralErrorToast: (error: any) => void;
	/** Run the video generation request for an image. */
	_runGenerateVideoForImage: (params: any) => Promise<any>;
	/** Fetch image edits (internal, single attempt). */
	_fetchGenerateImageEdits: (params: any) => Promise<any>;
	/** Clear rate limit error state. */
	clearRateLimitErrors: () => void;
	/** Redo a pipeline from an existing post. */
	pipelineRedoFromPost: (post: any) => Promise<any>;
}

/**
 * Zustand state for the Imagine mode store.
 *
 * Controls generation mode (image/video), aspect ratio, resolution,
 * video length, and media player tab selection. Persisted to localStorage.
 */
export interface ImagineModeStoreState {
	/** Current generation mode. */
	imagineMode: ImagineMode;
	/** Generation mode on the post page (can differ from main). */
	imagineModePostPage: ImagineMode;
	/** Selected aspect ratio as `[width, height]`. */
	aspectRatio: [number, number];
	/** Selected video resolution. */
	resolution: VideoResolution;
	/** Selected video length in seconds. */
	videoLength: number;
	/** Active media player tab. */
	mediaPlayerTab: MediaPlayerTab;
	/** Current action mode for generation context. */
	actionMode: ImagineActionMode;
	/** Available video duration options in seconds. */
	videoDurationOptions: number[];

	/**
	 * Get the maximum valid video length from the available options
	 * that does not exceed the upsell threshold.
	 */
	maxValidAllowedVideoLength: (targetLength: number) => number;
	/** Get the allowed video resolution, falling back to 480p if not eligible. */
	allowedVideoResolution: (resolution: VideoResolution) => VideoResolution;
	/** Set the video resolution (may trigger upsell). */
	setResolution: (resolution: VideoResolution) => void;
	/** Set the available video duration options. */
	setVideoDurationOptions: (options: number[]) => void;
	/** Set the video length in seconds (may trigger upsell). */
	setVideoLength: (length: number) => void;
	/** Set the generation mode. */
	setImagineMode: (mode: ImagineMode) => void;
	/** Set the post page generation mode. */
	setImagineModePostPage: (mode: ImagineMode) => void;
	/** Get the current video length (defaults to 6). */
	getVideoLength: () => number;
	/** Get the current generation mode. */
	getImagineMode: () => ImagineMode;
	/** Set the aspect ratio. */
	setAspectRatio: (ratio: [number, number]) => void;
	/** Get the current aspect ratio. */
	getAspectRatio: () => [number, number];
	/** Set the media player tab. */
	setMediaPlayerTab: (tab: MediaPlayerTab) => void;
	/** Get the current media player tab. */
	getMediaPlayerTab: () => MediaPlayerTab;
	/** Set the action mode. */
	setActionMode: (mode: ImagineActionMode) => void;
	/** Get the current action mode. */
	getActionMode: () => ImagineActionMode;
}

/**
 * Zustand state for the Imagine model override store.
 *
 * Manages model override selections for A/B testing different
 * generation models. Persisted to localStorage.
 */
export interface ImagineModelOverrideStoreState {
	/** Available model override options from the API. */
	imagineModelOverrides: ImagineModelOverride[];
	/** User-selected override values keyed by override key. */
	overridesSelections: Record<string, string | undefined>;
	/** Whether the overrides dialog is visible. */
	showOverridesDialog: boolean;
	/** Whether model overrides are enabled by the user. */
	enable: boolean;
	/** Whether model overrides are enabled by feature flag. */
	flagEnabled: boolean;

	/** Set whether model overrides are enabled. */
	setEnable: (enabled: boolean) => void;
	/** Set whether the overrides dialog is visible. */
	setShowOverridesDialog: (show: boolean) => void;
	/** Fetch available model overrides from the API. */
	fetchImagineModelOverrides: () => Promise<void>;
	/** Reset all override selections. */
	resetOverridesSelections: () => void;
	/** Set a specific override selection. */
	setOverrideSelection: (key: string, value: string) => void;
	/** Get the current selection for an override key. */
	getOverrideSelection: (key: string) => string;
	/** Whether overrides are actively applied (flag + enabled + has selections). */
	isActive: () => boolean;
}

/**
 * Zustand state for the grid rendering permit store.
 *
 * Controls concurrent media rendering by issuing permits to grid items.
 * Only 2 items can actively render at once; others wait for a permit.
 */
export interface GridStoreState {
	/** Permit state keyed by grid item ID. */
	allowed: Record<string, GridPermitState>;
	/** Internal timeout handle for permit reallocation. */
	_timeout: ReturnType<typeof setTimeout> | null;

	/** Reallocate rendering permits to waiting items (debounced 200ms). */
	reallocatePermits: () => void;
	/** Mount a grid item and request a rendering permit. */
	mount: (id: string) => void;
	/** Unmount a grid item and release its permit. */
	unmount: (id: string) => void;
}

/**
 * Zustand state for the scroll position store.
 *
 * Tracks scroll positions and masonry positioner instances per page/key
 * to restore scroll state when navigating between pages.
 */
export interface ScrollStoreState {
	/** Scroll positions keyed by page ID. */
	scrollPositionByPageId: Record<string, number>;
	/** Masonry positioner instances keyed by layout key. */
	positionerByKey: Record<string, any>;
	/** Last item count per positioner key (for cache invalidation). */
	positionerLastItemCount: Record<string, number>;

	/** Get the saved scroll position for a page (defaults to 0). */
	getScrollPosition: (pageId: string) => number;
	/**
	 * Get the positioner for a layout key.
	 * Invalidates the cached positioner if item count decreased.
	 */
	getPositioner: (key: string, itemCount: number) => any;
	/** Set the positioner for a layout key with optional item count. */
	setPositioner: (key: string, positioner: any, itemCount?: number) => void;
	/** Invalidate all cached positioners, forcing recalculation on next access. */
	invalidatePositioners: () => void;
	/** Reset all scroll positions and positioners. */
	reset: () => void;
}

/** Zustand state for pipeline execution (imagine templates). */
export interface PipelineExecutionStoreState {
	stage: import("../enums/media").PipelineExecutionStage;
	templateId: string | null;
	templateName: string | null;
	templateInputs: Record<string, any> | null;
	inputUrls: string[];
	progress: number;
	steps: any[];
	postId: string | null;
	error: string | null;
	_abortController: AbortController | null;

	setTemplate: (templateId: string, templateName: string, inputs: Record<string, any>) => void;
	run: (inputUrls: string[]) => Promise<void>;
	runRedo: (post: any) => Promise<void>;
	_processStream: (stream: any) => Promise<void>;
	cancel: () => void;
	reset: () => void;
	_setError: (error: string | null) => void;
}

/** Module exports for the Media store. */
export interface MediaStoreModule {
	/** Zustand store hook for media state. */
	useMediaStore: ZustandStore<MediaStoreState>;
	/** Zustand store hook for imagine mode settings. */
	useImagineModeStore: ZustandStore<ImagineModeStoreState>;
	/** Zustand store hook for model override settings. */
	useImagineModelOverrideStore: ZustandStore<ImagineModelOverrideStoreState>;
	/** Zustand store hook for grid rendering permits. */
	useGridStore: ZustandStore<GridStoreState>;
	/** Zustand store hook for scroll positions. */
	useScrollStore: ZustandStore<ScrollStoreState>;
	/** Default aspect ratios for image generation: `[[2,3],[3,2],[1,1],[9,16],[16,9]]`. */
	ASPECT_RATIOS: [number, number][];
	/** Default resolution for video generation (`"480p"`). */
	DEFAULT_RESOLUTION: VideoResolution;
	/** Available resolution options (`["480p", "720p"]`). */
	RESOLUTION_OPTIONS: VideoResolution[];
	/** Maximum duration for video upscaling in seconds (`12`). */
	VIDEO_UPSCALE_MAX_DURATION: number;
	/** Normalize aspect ratio to max-1 scale. */
	getNormalizedPercentages: (aspectRatio: [number, number]) => [number, number];
	/** Noise image generator singleton. */
	noiseMaker: any;
	/** Zustand store hook for pipeline execution state. */
	usePipelineExecutionStore: ZustandStore<PipelineExecutionStoreState>;
	/** Initialize media store subscriptions. */
	useMediaStoreInit: () => void;
}
