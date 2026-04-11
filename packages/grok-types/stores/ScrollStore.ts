import type { ScrollStoreState } from "./MediaStore";
import type { ZustandStore } from "../zustand";

export type { ScrollStoreState };

/** Module exports for the Scroll store. */
export interface ScrollStoreModule {
    /** Zustand store hook for scroll positions and masonry positioners. */
    useScrollStore: ZustandStore<ScrollStoreState>;
}
