/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { type AnyComponent, LazyComponent, setCreateElement } from "@utils/lazyReact";
import type ReactTypes from "react";
import type { ComponentType, ReactNode } from "react";

import { filters, waitFor } from "../turbopack";

export { type AnyComponent, LazyComponent };

type ReactInstance = typeof ReactTypes;

export let React: ReactInstance;
export let useState: ReactInstance["useState"];
export let useEffect: ReactInstance["useEffect"];
export let useLayoutEffect: ReactInstance["useLayoutEffect"];
export let useMemo: ReactInstance["useMemo"];
export let useRef: ReactInstance["useRef"];
export let useReducer: ReactInstance["useReducer"];
export let useCallback: ReactInstance["useCallback"];
export let useContext: ReactInstance["useContext"];
export let useId: ReactInstance["useId"];
export let useTransition: ReactInstance["useTransition"];
export let useDeferredValue: ReactInstance["useDeferredValue"];
export let useSyncExternalStore: ReactInstance["useSyncExternalStore"];
export let createElement: ReactInstance["createElement"];
export let useReducedMotion: () => boolean;

waitFor(filters.byProps("useReducedMotion"), mod => {
    ({ useReducedMotion } = mod as { useReducedMotion: () => boolean });
});

waitFor(filters.byProps("useState", "createElement"), mod => {
    const m = mod as ReactInstance;
    React = m;
    ({ useState, useEffect, useLayoutEffect, useMemo, useRef, useReducer, useCallback, useContext, useId, useTransition, useDeferredValue, useSyncExternalStore, createElement } = m);
    setCreateElement(m.createElement);
});

export const Fragment = Symbol.for("react.fragment") as unknown as ReactInstance["Fragment"];

export type { ComponentType, ReactNode };
