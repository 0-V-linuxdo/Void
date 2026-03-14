import type { AssetMetadata } from "../common/Asset";
import type {
	AssetOrderBy,
	AssetSearchSource,
	FilesPageCreatedByFilter,
	FilesPageFileType,
	FilesPageListStatus,
	FilesPageSortOption,
} from "../enums/files";
import type { ZustandStore } from "../zustand";

/** Wrapper for async asset data in assetsById. */
export interface AssetEntry {
	status: string;
	data: AssetMetadata | null;
	error: any;
}

/** Pending asset creation request tracked before the API responds. */
export interface AssetCreationRequest {
	name: string;
	content?: string;
	mimeType?: string;
	assetId?: string;
}

/** Options for loadFirstPage to filter and sort the asset list. */
export interface FilesPageLoadOptions {
	sort?: FilesPageSortOption;
	fileType?: FilesPageFileType;
	createdBy?: FilesPageCreatedByFilter;
	search?: string;
}

/** Artifact selection event data from the chat panel. */
export interface ArtifactSelectParams {
	id: string;
	versionId: string;
	content?: string;
	incomplete?: boolean;
}

/**
 * Zustand state for the files page, managing asset listing, filtering,
 * content editing, and file CRUD operations. Built on createImmerStore.
 */
export interface FilesPageStoreState {
	/** Cached asset entries keyed by asset ID. */
	assetsById: Record<string, AssetEntry>;
	/** File content (text or binary) keyed by asset ID. */
	contentById: Record<string, string | ArrayBuffer>;
	/** Search highlight matches keyed by query, then asset ID. */
	searchHighlight: Record<string, Record<string, string>>;
	/** Active file type filter for search results. */
	searchFileType: FilesPageFileType | null;
	/** Current sort order for the asset list. */
	orderBy: AssetOrderBy;
	/** Current source filter for the asset list. */
	source: AssetSearchSource;
	/** Ordered array of root asset IDs currently displayed. */
	list: string[];
	/** Loading status of the asset list. */
	listStatus: FilesPageListStatus;
	/** Pagination token for loading the next page. */
	listPageToken: string;
	/** In-flight asset creation requests. */
	creationRequests: AssetCreationRequest[];
	/** Maps root asset ID to the current (latest) version asset ID. */
	currentVersion: Record<string, string>;
	/** Debounced search query string. */
	debouncedSearchQuery: string;
	/** Whether own assets are currently being loaded. */
	isLoadingOwnAssets: boolean;
	/** Whether the file explorer sidebar is collapsed. */
	isFileExplorerCollapsed: boolean;
	/** Array of cleanup/unsubscribe functions for store teardown. */
	dispose: (() => void)[];

	/** Reset the store to initial state. */
	clear: () => void;
	/** Toggle the file explorer sidebar collapsed state. */
	setIsFileExplorerCollapsed: (collapsed: boolean) => void;
	/** Load the first page of assets with optional filters. */
	loadFirstPage: (options?: FilesPageLoadOptions) => Promise<void>;
	/** Load the next page of assets (pagination). */
	loadNextPage: () => Promise<void>;
	/** Load recently created assets. */
	loadRecent: () => Promise<void>;
	/** Fetch all versions of an asset by root asset ID. */
	fetchVersions: (rootAssetId: string) => Promise<void>;
	/** Create a new text asset with the given file name. */
	createAsset: (name: string, callback?: (assetId: string) => void) => void;
	/** Upload a file and create an asset from it. */
	uploadAsset: (file: File, callback?: (assetId: string) => void) => Promise<void>;
	/** Soft-delete an asset by ID. */
	deleteAsset: (assetId: string) => Promise<void>;
	/** Set local content for an asset, optionally skipping the API update. */
	setAssetContent: (assetId: string, content: string | ArrayBuffer, skipUpdate?: boolean) => Promise<void>;
	/** Update asset content via the API, optionally creating a new version. */
	updateAssetContent: (assetId: string, content: string | ArrayBuffer, makeNewVersion?: boolean) => Promise<void>;
	/** Rename an asset. */
	renameAsset: (assetId: string, name: string) => Promise<void>;
	/** Fetch text content for an asset from the CDN. */
	fetchContent: (assetId: string, baseUrl: string) => Promise<void>;
	/** Reset an asset's conversation association. */
	resetConversation: (assetId: string) => Promise<void>;
	/** Fetch binary content for an asset from the CDN. */
	fetchBinaryContent: (assetId: string, baseUrl: string) => Promise<void>;
	/** Fetch shared content for an asset (returns raw text). */
	fetchSharedContent: (asset: AssetMetadata, baseUrl: string) => Promise<string>;
	/** Fetch asset metadata by ID from the API. Note: original typo preserved. */
	getAssetMeatadata: (assetId: string) => Promise<AssetMetadata>;
	/** Set the current version mapping for a root asset. */
	setCurrentVersion: (rootAssetId: string, versionId: string) => void;
	/** Create a new version of an asset from its current content. */
	createVersion: (assetId: string) => Promise<AssetMetadata | undefined>;
	/** Share an asset and return the share response. */
	shareAsset: (assetId: string) => Promise<any>;
	/** Clone an asset and return the clone response. */
	cloneAsset: (assetId: string) => Promise<any>;
	/** Handle artifact selection from the chat panel. */
	handleArtifactSelect: (artifact: ArtifactSelectParams) => void;

	/** Internal: debounced setter for the search query. */
	_setQueryDebounced: () => void;
	/** Internal: insert or update a single asset in the cache. */
	_upsertAsset: (asset: any) => void;
	/** Internal: add search highlight matches for a query. */
	_addHighlights: (query: string, highlights: any) => void;
	/** Internal: check whether a new asset should appear in the current filtered list. */
	_shouldShowNewAssetInList: (asset: any) => boolean;
	/** Internal: load a page of assets from the API. */
	_loadPage: (options?: any) => Promise<void>;
	/** Internal: create a new asset with the given name. */
	_createAsset: (name: string, callback?: Function) => void;
	/** Internal: debounced text content update for the active asset. */
	_debouncedUpdateAssetContent: () => void;
	/** Internal: debounced binary content update for the active asset. */
	_debouncedUpdateBinaryAssetContent: () => void;
}

/** Module exports for the FilesPage store. */
export interface FilesPageStoreModule {
	/** Zustand store hook for files page state. */
	useFilesPageStore: ZustandStore<FilesPageStoreState>;
	/** Derived hook returning the current asset list as metadata objects. */
	useAssetsList: () => AssetMetadata[];
	/** Hook returning the current version metadata for a root asset ID. */
	useCurrentVersion: (rootAssetId: string) => AssetMetadata | undefined;
	/** Hook returning cached content for an asset by type. */
	useAssetContentWithType: (assetId: string, type: "binary" | "string") => string | ArrayBuffer | undefined;
}
