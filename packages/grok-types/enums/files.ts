/**
 * File source types as used by `GrokApiV2UploadedFileSourceType`.
 * Determines how a file was uploaded or generated.
 */
export type FileSourceType =
	| "SELF_UPLOAD_FILE_SOURCE"
	| "GOOGLE_DRIVE_FILE_SOURCE"
	| "ONE_DRIVE_FILE_SOURCE"
	| "IMAGINE_SELF_UPLOAD_FILE_SOURCE"
	| "IMAGINE_GENERATED_FILE_SOURCE"
	| (string & {});

/**
 * Artifact inline display status.
 * Controls whether model-generated artifacts render inline or in the sidebar.
 */
export type ArtifactInlineStatus =
	| "DEFAULT_ARTIFACT_INLINE_STATUS"
	| "SHOW_INLINE_ARTIFACT_INLINE_STATUS"
	| "SHOW_SIDEBAR_ARTIFACT_INLINE_STATUS"
	| (string & {});

/** Ordering options for asset repository queries. */
export type AssetOrderBy =
	| "ORDER_BY_INVALID"
	| "ORDER_BY_RELEVANCY"
	| "ORDER_BY_CREATE_TIME"
	| "ORDER_BY_LAST_USE_TIME"
	| "ORDER_BY_NAME"
	| "ORDER_BY_MIME_TYPE"
	| "ORDER_BY_CONTENT_SIZE"
	| (string & {});

/** Asset search source filter. */
export type AssetSearchSource =
	| "SOURCE_ANY"
	| "SOURCE_UPLOADED"
	| "SOURCE_GENERATED"
	| (string & {});

/**
 * File type identifiers from Grok's `FILE_DESCRIPTIONS` registry.
 * Each ID maps to a {@link FileTypeDescriptor} with extensions, MIME types, and icons.
 */
export type FileTypeId =
	| "markdown"
	| "csv"
	| "spreadsheet"
	| "image"
	| "video"
	| "audio"
	| "html"
	| "python"
	| "javascript"
	| "jsx"
	| "tsx"
	| "json"
	| "typescript"
	| "java"
	| "csharp"
	| "go"
	| "ruby"
	| "rust"
	| "ipynb"
	| "shellscript"
	| "yaml"
	| "txt"
	| "log"
	| "pdf"
	| "word"
	| "powerpoint"
	| "archive"
	| "git"
	| "dockerfile"
	| "c"
	| "css"
	| "scss"
	| "vue"
	| "svelte"
	| "swift"
	| "kotlin"
	| "php"
	| "sql"
	| "xml"
	| "toml"
	| "ini"
	| "env"
	| "proto"
	| "graphql"
	| "makefile"
	| "bazel"
	| "cpp"
	| "unknown"
	| (string & {});

/**
 * High-level file category groupings.
 * Used by `getFileCategoryForAsset` to classify files into broad groups.
 */
export type FileCategory =
	| "markdown"
	| "csv"
	| "spreadsheet"
	| "image"
	| "code"
	| "unknown"
	| (string & {});

/** File type filter categories for the files page search/filter UI. */
export type FilesPageFileType =
	| "image"
	| "document"
	| "pdf"
	| "code"
	| "spreadsheet";

/** Sort option keys passed to FilesPageStore.loadFirstPage. */
export type FilesPageSortOption =
	| "name"
	| "size"
	| "used"
	| "created";

/** Created-by filter keys passed to FilesPageStore.loadFirstPage. */
export type FilesPageCreatedByFilter =
	| "grok"
	| "user";

/** Async loading status for the files page asset list. */
export type FilesPageListStatus =
	| "initial"
	| "loading"
	| "ready"
	| "error";
