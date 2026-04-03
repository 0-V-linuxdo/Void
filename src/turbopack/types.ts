/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type ModuleFactory = (helpers: TurbopackHelpers, module?: TurbopackModule, exports?: Record<string, any>) => void;

export const SYM_ORIGINAL = Symbol("Void.originalFactory");
export const SYM_PATCHED = Symbol("Void.patched");
export const SYM_PATCHED_BY = Symbol("Void.patchedBy");
export const SYM_PATCHED_CODE = Symbol("Void.patchedCode");

export interface PatchedModuleFactory extends ModuleFactory {
    [SYM_ORIGINAL]?: ModuleFactory;
    [SYM_PATCHED]?: boolean;
    [SYM_PATCHED_BY]?: string[];
    [SYM_PATCHED_CODE]?: string;
    toString(): string;
}

export interface TurbopackRequireFn {
    (id: string): any;
    keys(): string[];
    resolve(id: string): number;
    import(id: string): Promise<any>;
}

export interface TurbopackHelpers {
    /**
     * ESM require. Loads a module by ID and returns its namespace object (the `{ default, ...namedExports }` wrapper).
     * Creates and caches the namespace wrapper on first access. Used by ~1637 factories, most common import helper.
     * 1-param factories that only take `e` use `e.i(id)` for all their imports.
     */
    i(moduleId: number): any;
    /**
     * Raw require. Returns `module.exports` directly without any namespace wrapping.
     * Only used by 3-param webpack-compat factories `(e,t,r)` where `e` is the helpers object.
     * If you need `.default`, use `R()` instead.
     */
    r(moduleId: number): any;
    /**
     * Require default. Shorthand for `this.r(id)?.default ?? this.r(id)`.
     * Used when a module only needs the default export from a CJS/ESM module.
     */
    R(moduleId: number): any;
    /**
     * Define ESM exports on the current module. Takes an array of `["ExportName", () => value]` tuples.
     * Optional second arg is the module ID, used by shared factories that serve multiple module IDs
     * (e.g. icon factories where the same source handles 157+ different icon modules).
     * @example `e.s([["Button", () => Button], ["ButtonGroup", () => ButtonGroup]], 12345)`
     */
    s(exports: [string, () => any][], moduleId?: number): void;
    /**
     * Define CJS exports via a Proxy-based merge. Supports re-exports by merging the source
     * objects properties onto the current modules exports through a Proxy getter.
     */
    j(exports: object | null, moduleId?: number): void;
    /** Set module exports to a single value (replaces the entire exports object). */
    v(value: any, moduleId?: number): void;
    /** Set both module.exports and module.namespaceObject to the same value. */
    n(value: any, moduleId?: number): void;
    /**
     * Resolve an async module. Calls `this.r(id)` to get the module, then invokes the result
     * with `this.i` bound as the require function. Used for top-level await modules where the
     * factory returns a promise that must resolve before dependents can access exports.
     */
    A(moduleId: number): Promise<any>;
    /** Register the current module as async (top-level await). Called at the start of async module factories. */
    a(asyncModule: any, hasAwait: boolean): void;
    /**
     * Create a `require()` function from a resolve map. Used for dynamic `require()` calls where
     * turbopack precomputes which modules the dynamic require could resolve to. The resolve map
     * maps string specifiers to `{ id(), module() }` objects.
     */
    f(resolveMap: Record<string, { id(): number; module(): any }>): TurbopackRequireFn;
    /** Throws "dynamic usage of require is not supported". Called when turbopack cant statically analyze a require. */
    z(specifier: string): never;
    /** Throws "Unexpected use of runtime require". Dead code guard for require paths that shouldnt be reached. */
    t(): never;
    /**
     * Chunk loader. Loads a single JS chunk by path and returns a Promise that resolves when the chunk
     * is executed. Used by ~1530 factories for dynamic imports / code splitting. The chunk path is
     * relative to `_next/static/chunks/`.
     */
    l(chunkPath: string): Promise<void>;
    /** Alternate chunk loader. Same as `l()` but used in different runtime contexts. */
    L(chunkPath: string): Promise<void>;
    /**
     * Pseudo-URL constructor. Creates a URL-like object from a relative path, not an actual `URL` instance.
     * Used internally by turbopack for asset references.
     */
    U: new (
        path: string,
    ) => URL;
    /** Resolve path relative to app root. Returns `/ROOT/${path}` or just `/ROOT/` if no path given. */
    P(path?: string): string;
    /** Create a web worker from an array of chunk paths. Bundles the chunks into a blob URL worker. */
    b(chunkPaths: string[]): Worker;
    /** Load a WASM module with imports object and a JS fallback if WASM isnt supported. */
    w(wasmPath: string, imports: any, fallback: any): Promise<any>;
    /** Load a WASM module with imports object (no fallback). */
    u(wasmPath: string, imports: any): Promise<any>;
    /** The current module being initialized. Set by the runtime before calling the factory. */
    m: TurbopackModule;
    /**
     * Runtime module cache. Plain object (not a Map) keyed by module ID. Every module that has been
     * instantiated lives here. This is the main cache we capture to scan for modules.
     */
    c: Record<number, TurbopackModule>;
    /** The current modules exports object. Same reference as `this.m.exports`. */
    e: Record<string, any>;
    /** Factory registry. Map of module ID to factory function. Contains all registered but not necessarily instantiated factories. */
    M: Map<number, ModuleFactory>;
    /** Reference to `window` / `globalThis`. */
    g: typeof globalThis;
}

export interface TurbopackModule {
    exports: any;
    error: any;
    id: number;
    namespaceObject: any;
}

export type FilterFn = (mod: any) => boolean;

export interface TurbopackPushable {
    push: (...args: any[]) => any;
    [key: string]: any;
}

export type PageWindow = Window & typeof globalThis & { TURBOPACK: TurbopackPushable | any[] | undefined };

export type PatchReplacementStatus = "applied" | "noEffect" | "error" | "reverted";

export interface PatchResult {
    plugin: string;
    find: string;
    moduleId: number;
    noWarn?: boolean;
    replacements: Array<{
        match: string;
        status: PatchReplacementStatus;
    }>;
}

export interface PatchStats {
    applied: number;
    noEffect: number;
    errors: number;
    runtimeFallbacks: number;
    patchedModules: Set<number>;
}

export interface PatchReport {
    stats: Omit<PatchStats, "patchedModules"> & { patchedModules: number[] };
    results: PatchResult[];
    orphaned: Array<{ plugin: string; find: string }>;
    pending: Array<{ plugin: string; find: string }>;
}
