/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DropdownMenuItem } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { React } from "@turbopack/common/react";
import { createExternalStore, mapGetOrCreate, sortedEntries } from "@utils/misc";
import { type LazyNode, resolveLazyNode, useExternalStore } from "@utils/react";
import type { ComponentType, ReactNode } from "react";

export interface ContextMenuLocationMap {
    conversation: { conversationId: string };
    message: { response: { responseId: string; conversationId: string; [key: string]: any } };
    user: {};
}

export type ContextMenuLocation = keyof ContextMenuLocationMap;

export interface ContextMenuItemDef<L extends ContextMenuLocation = ContextMenuLocation> {
    label: LazyNode;
    icon?: LazyNode;
    order?: number;
    render?: ComponentType<ContextMenuLocationMap[L]>;
    onSelect?: (ctx: ContextMenuLocationMap[L]) => void;
}

const items = new Map<ContextMenuLocation, Map<string, ContextMenuItemDef<any>>>();
const store = createExternalStore();

function getItems(location: ContextMenuLocation): Map<string, ContextMenuItemDef<any>> {
    return mapGetOrCreate(items, location, () => new Map());
}

export function addContextMenuItem<L extends ContextMenuLocation>(location: L, id: string, def: ContextMenuItemDef<L>) {
    getItems(location).set(id, def);
    store.notify();
}

export function removeContextMenuItem(location: ContextMenuLocation, id: string) {
    getItems(location).delete(id);
    store.notify();
}

function renderEntry(def: ContextMenuItemDef<any>, ctx: Record<string, any>) {
    if (def.render) {
        const Render = def.render;
        return <Render {...ctx} />;
    }
    return (
        <DropdownMenuItem onSelect={() => def.onSelect?.(ctx)}>
            {resolveLazyNode(def.icon)}
            {resolveLazyNode(def.label)}
        </DropdownMenuItem>
    );
}

export function VoidContextMenuItems<L extends ContextMenuLocation>({ location, ...ctx }: { location: L } & ContextMenuLocationMap[L]): ReactNode {
    useExternalStore(store);

    const map = items.get(location);
    if (!map?.size) return null;

    const sorted = sortedEntries(map);

    return (
        <>
            {sorted.map(([id, def]) => (
                <ErrorBoundary key={id} fallback={null}>
                    {renderEntry(def, ctx)}
                </ErrorBoundary>
            ))}
        </>
    );
}
