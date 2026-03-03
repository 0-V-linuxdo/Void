import type { ZustandStore } from "../zustand";

/** A product in the Grok Shop/marketplace. */
export interface ShopProduct {
    /** Unique product identifier. */
    productId: string;
}

/** A search result containing a product. */
export interface ShopSearchResult {
    /** The product in this search result. */
    product: ShopProduct;
}

/** Zustand state for the Shop/marketplace. */
export interface ShopStoreState {
    /** Cached shop products keyed by product ID. */
    byId: Record<string, ShopProduct>;

    /** Insert or update products from search results into the cache. */
    upsertSearchProductResults: (results: ShopSearchResult[]) => void;
}

/** Module exports for the Shop store. */
export interface ShopStoreModule {
    /** Zustand store hook for the Shop/marketplace. */
    useShopStore: ZustandStore<ShopStoreState>;
}
