import type { MediaPostType } from "../enums/media";
import type { ZustandStore } from "../zustand";

/** A media folder in the Imagine system. */
export interface MediaFolder {
	id: string;
	name: string;
}

/** Options passed to addPostToFolder/removePostFromFolder. */
export interface MediaFolderPostOptions {
	source?: string;
	mediaType?: MediaPostType;
}

/** Zustand state for the media folder store (imagine folders). */
export interface MediaFolderStoreState {
	/** Available folders, null until fetched. */
	folders: MediaFolder[] | null;
	/** Currently selected folder ID, defaults to "all". */
	selectedId: string;
	/** Map of folder ID to post IDs in that folder. */
	postIdsByFolderId: Record<string, string[]>;
	/** Map of post ID to folder IDs it belongs to. */
	folderIdsByPostId: Record<string, string[]>;

	fetchFolders: () => Promise<void>;
	selectFolder: (id: string) => void;
	createFolder: (name: string) => Promise<MediaFolder | undefined>;
	renameFolder: (id: string, name: string) => Promise<void>;
	deleteFolder: (id: string) => Promise<void>;
	fetchFolderPosts: (folderId: string) => Promise<void>;
	addPostToFolder: (postId: string, folderId: string, opts?: MediaFolderPostOptions) => Promise<void>;
	removePostFromFolder: (postId: string, folderId: string, opts?: MediaFolderPostOptions) => Promise<void>;
}

/** Module exports for the media folder store. Not a standard findable store — captured via patch or accessed via API. */
export interface MediaFolderStoreModule {
	useMediaFolderStore: ZustandStore<MediaFolderStoreState>;
}
