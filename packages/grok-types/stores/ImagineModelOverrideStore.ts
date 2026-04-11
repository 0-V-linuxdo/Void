import type { ImagineModelOverrideStoreState } from "./MediaStore";
import type { ZustandStore } from "../zustand";

export type { ImagineModelOverrideStoreState };

/** Module exports for the ImagineModelOverride store. */
export interface ImagineModelOverrideStoreModule {
    /** Zustand store hook for imagine model override settings. */
    useImagineModelOverrideStore: ZustandStore<ImagineModelOverrideStoreState>;
}
