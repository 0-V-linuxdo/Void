import type { ZustandStore } from "../zustand";

/**
 * Zustand state for media folder management on the Imagine page.
 * Tracks folder lists, selected folder, and the bidirectional
 * mapping between posts and folders.
 */
export interface MediaFolderStoreState {
    /** List of folder objects, or null before first fetch. */
    folders: any[] | null;
    /** Currently selected folder ID (e.g. `"all"` for the default view). */
    selectedId: string;
    /** Post IDs contained in each folder, keyed by folder ID. */
    postIdsByFolderId: Record<string, string[]>;
    /** Folder IDs a post belongs to, keyed by post ID. */
    folderIdsByPostId: Record<string, string[]>;

    /** Fetch all folders from the API. */
    fetchFolders: () => Promise<void>;
    /** Select a folder by ID. */
    selectFolder: (folderId: string) => void;
    /** Create a new folder with the given name. */
    createFolder: (name: string) => Promise<any>;
    /** Rename a folder. */
    renameFolder: (folderId: string, name: string) => Promise<any>;
    /** Delete a folder by ID. */
    deleteFolder: (folderId: string) => Promise<any>;
    /** Fetch the posts contained in a folder. */
    fetchFolderPosts: (folderId: string) => Promise<any>;
    /** Add a post to a folder. */
    addPostToFolder: (postId: string, folderId: string, options?: any) => Promise<any>;
    /** Remove a post from a folder. */
    removePostFromFolder: (postId: string, folderId: string, options?: any) => Promise<any>;
    /** Fetch the folders a post belongs to. */
    fetchPostFolders: (postId: string) => Promise<any>;
    /** Add multiple posts to a folder in one request. */
    bulkAddPostsToFolder: (postIds: string[], folderId: string) => Promise<any>;
    /** Remove multiple posts from a folder in one request. */
    bulkRemovePostsFromFolder: (postIds: string[], folderId: string) => Promise<any>;
}

/** Module exports for the MediaFolder store. */
export interface MediaFolderStoreModule {
    /** Zustand store hook for media folder state. */
    useMediaFolderStore: ZustandStore<MediaFolderStoreState>;
    /** Hook returning the folder IDs a post belongs to. */
    usePostFolderIds: (postId: string) => string[];
}
