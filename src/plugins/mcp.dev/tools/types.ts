/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { ModuleArgs } from "./schemas";

export type {
    EvalArgs,
    InterceptArgs,
    ModuleArgs,
    NetworkArgs,
    PatchArgs,
    PluginArgs,
    ReactArgs,
    ReconArgs,
    RequestArgs,
    SearchArgs,
    StoreArgs,
    ToolArgsFor,
    ToolName,
} from "./schemas";

export type AnyFn = (...args: unknown[]) => unknown;

export interface PageRequest {
    id: string | number;
    tool: string;
    arguments?: Record<string, unknown>;
}

export interface PageResponse {
    id: string | number;
    result?: unknown;
    error?: string;
}

type ValidationCode =
    | "find::no-module"
    | "find::ambiguous"
    | "replace::regex-invalid"
    | "replace::match-miss"
    | "replace::backref-invalid"
    | "replace::syntax-error"
    | "group::failed";

export interface ValidationIssue {
    plugin: string;
    find: string;
    code: ValidationCode;
    severity: "error" | "warn";
    message: string;
    moduleId?: number;
    replacementIndex?: number;
    detail?: string;
}

export type FilterDef = Pick<ModuleArgs, "props" | "code" | "displayName" | "storeName" | "componentByCode">;

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

export type { Fiber, FiberState } from "@utils/react";

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
    original: AnyFn;
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
