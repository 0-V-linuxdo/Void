import type { ZustandStore } from "../zustand";

/** Options for opening the image editor dialog. */
export interface ImageEditorOpenOptions {
    /** The initial source image to edit. */
    initialImage?: any;
    /** A pre-uploaded replacement image. */
    uploadedImage?: any;
}

/** Zustand state for the image editor dialog. */
export interface ImageEditorStoreState {
    /** Whether the image editor dialog is open. */
    isOpen: boolean;
    /** The initial source image passed when opening, or null when closed. */
    initialImage: any;
    /** The user's uploaded/edited image, or null. */
    uploadedImage: any;

    /** Open the image editor with the given images. */
    open: (options: ImageEditorOpenOptions) => void;
    /** Close the image editor and clear all image state. */
    close: () => void;
    /** Replace the uploaded/edited image. */
    setUploadedImage: (image: any) => void;
}

/** Module exports for the ImageEditor store. */
export interface ImageEditorStoreModule {
    /** Zustand store hook for the image editor dialog. */
    useImageEditorStore: ZustandStore<ImageEditorStoreState>;
}
