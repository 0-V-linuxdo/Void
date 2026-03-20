/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface ModuleArgs {
    action:
        | "find"
        | "findAll"
        | "findBulk"
        | "findComponent"
        | "findModuleId"
        | "exports"
        | "stats"
        | "source"
        | "diff"
        | "imports"
        | "namedExports"
        | "load"
        | "loadChunks"
        | "findByFactory"
        | "mapMangled"
        | "css"
        | "unloaded"
        | "whereUsed"
        | "suggest"
        | "functionAt";
    props?: string[];
    code?: string[];
    id?: number;
    offset?: number;
    limit?: number;
    patched?: boolean;
    search?: string;
    async?: boolean;
    mappers?: Record<string, string>;
    pattern?: string;
    filters?: Array<{ props?: string[]; code?: string[] }>;
    displayName?: string;
    storeName?: string;
    componentByCode?: boolean;
}

export interface SearchArgs {
    pattern?: string;
    and?: string[];
    id?: number;
    max?: number;
    context?: number;
    filter?: "loaded" | "unloaded" | "patched";
    count?: boolean;
}

export interface EvalArgs {
    code?: string;
}

export interface PatchArgs {
    action: "test" | "analyze" | "list" | "conflicts" | "broken" | "lint" | "context" | "bench";
    find?: string;
    match?: string;
    replace?: string;
    flags?: string;
    window?: number;
    context?: number;
}

export interface PluginArgs {
    action: "list" | "enable" | "disable" | "toggle" | "settings" | "setSetting";
    name?: string;
    key?: string;
    value?: unknown;
}

export interface ReactArgs {
    action: "find" | "root" | "query" | "fiber" | "props" | "hooks" | "state" | "tree" | "owner";
    selector?: string;
    componentName?: string;
    depth?: number;
    limit?: number;
    includeProps?: boolean;
    breadth?: number;
}

export interface StoreArgs {
    action: "list" | "get" | "keys" | "methods" | "call" | "subscribe";
    query?: string | number;
    path?: string;
    depth?: number;
    method?: string;
    callArgs?: unknown[];
    duration?: number;
    maxCaptures?: number;
}

export interface InterceptArgs {
    action: "set" | "get" | "stop" | "stopAll" | "list";
    moduleId?: number;
    exportKey?: string;
    id?: number;
    duration?: number;
    maxCaptures?: number;
}

export interface GrokArgs {
    action: "send" | "read" | "models";
    message?: string;
    model?: string;
    conversationId?: string;
    responseId?: string;
    reasoningMode?: string;
}

export type ToolHandler = (args: any) => unknown;

export interface SuggestCandidate {
    text: string;
    type: string;
    unique: boolean;
    count: number;
}

export interface DiffChunk {
    at: number;
    orig: string;
    patched: string;
}

export interface SearchMatch {
    id: number;
    s: string;
    len?: number;
    at?: number;
    patched?: boolean;
    truncatedMatch?: boolean;
}

export interface EvalResult {
    ok: true;
    value: unknown;
}

export interface EvalError {
    ok: false;
    error: unknown;
}

export interface LintWarning {
    severity: "error" | "warn" | "info";
    message: string;
    fix?: string;
}

export interface Anchor {
    text: string;
    type: string;
    at: number;
    unique: boolean;
    dist?: number;
}

export interface Fiber {
    tag: number;
    type: { displayName?: string; name?: string } | string | null;
    stateNode: Element | null;
    return: Fiber | null;
    child: Fiber | null;
    sibling: Fiber | null;
    memoizedProps: Record<string, unknown> | null;
    memoizedState: FiberState | null;
    _debugOwner?: Fiber | null;
}

export interface FiberState {
    memoizedState: unknown;
    queue: { dispatch?: Function } | null;
    next: FiberState | null;
}

export interface ZustandLike {
    getState(): Record<string, unknown>;
    setState(partial: Record<string, unknown>): void;
    subscribe(listener: (state: Record<string, unknown>) => void): () => void;
    name?: string;
}

export interface StoreEntry {
    id: number;
    name: string | null;
    keys: string[];
}

export interface Capture {
    t: number;
    d: number;
    args: unknown;
    ret: unknown;
    err?: string;
}

export interface InterceptState {
    id: number;
    moduleId: number;
    exportKey: string;
    finalKey: string;
    captures: Capture[];
    startTime: number;
    original: Function;
    holder: Record<string, unknown>;
    timer: ReturnType<typeof setTimeout>;
}

export interface PluginInfo {
    name: string;
    enabled: boolean;
    started: boolean;
    required?: boolean;
    desc?: string;
}
