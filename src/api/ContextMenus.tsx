/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { React } from "@turbopack/common/react";
import { mapGetOrCreate } from "@utils/misc";
import { type LazyNode, resolveLazyNode, useExternalStore } from "@utils/react";
import type { ComponentType, ReactNode } from "react";

import { createRegistry, type Registry } from "./registry";

export interface ContextMenuLocationMap {
    conversation: { conversationId: string };
    message: { response: { responseId: string; conversationId: string; [key: string]: unknown } };
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

// Radix menu primitives injected by the ContextMenuAPI patch; their prop shapes
// live in grok's bundle and aren't importable here, so props stay untyped.
type MenuPrimitive = ComponentType<Record<string, unknown>>;

export interface MenuPrimitives {
    Item: MenuPrimitive;
    Sub: MenuPrimitive;
    SubTrigger: MenuPrimitive;
    SubContent: MenuPrimitive;
    Separator: MenuPrimitive;
}

let menuPrimitivesContext: React.Context<MenuPrimitives | null> | null = null;
function getMenuPrimitivesContext(): React.Context<MenuPrimitives | null> {
    return menuPrimitivesContext ??= React.createContext<MenuPrimitives | null>(null);
}

function makeMenuPrimitive(key: keyof MenuPrimitives, fallback: MenuPrimitive): MenuPrimitive {
    return props => {
        const ctx = React.useContext(getMenuPrimitivesContext());
        const C = ctx?.[key] ?? fallback;
        return <C {...props} />;
    };
}

export const MenuItem = makeMenuPrimitive("Item", DropdownMenuItem);
export const MenuSub = makeMenuPrimitive("Sub", DropdownMenuSub);
export const MenuSubTrigger = makeMenuPrimitive("SubTrigger", DropdownMenuSubTrigger);
export const MenuSubContent = makeMenuPrimitive("SubContent", DropdownMenuSubContent);
export const MenuSeparator = makeMenuPrimitive("Separator", DropdownMenuSeparator);

const registries = new Map<ContextMenuLocation, Registry<ContextMenuItemDef<any>>>();

function getRegistry(location: ContextMenuLocation): Registry<ContextMenuItemDef<any>> {
    return mapGetOrCreate(registries, location, () => createRegistry<ContextMenuItemDef<any>>());
}

export function addContextMenuItem<L extends ContextMenuLocation>(location: L, id: string, def: ContextMenuItemDef<L>) {
    getRegistry(location).set(id, def);
}

export function removeContextMenuItem(location: ContextMenuLocation, id: string) {
    getRegistry(location).delete(id);
}

function renderEntry(def: ContextMenuItemDef<any>, ctx: ContextMenuLocationMap[ContextMenuLocation]) {
    if (def.render) {
        const Render = def.render;
        return <Render {...ctx} />;
    }
    return (
        <MenuItem onSelect={() => def.onSelect?.(ctx)}>
            {resolveLazyNode(def.icon)}
            {resolveLazyNode(def.label)}
        </MenuItem>
    );
}

export function VoidContextMenuItems<L extends ContextMenuLocation>({ location, menu, ...ctx }: { location: L; menu?: MenuPrimitives } & ContextMenuLocationMap[L]): ReactNode {
    const registry = getRegistry(location);
    useExternalStore(registry.store);

    if (!registry.size) return null;

    const sorted = registry.sorted();

    const content = (
        <>
            {sorted.map(([id, def]) => (
                <ErrorBoundary key={id} fallback={null}>
                    {renderEntry(def, ctx)}
                </ErrorBoundary>
            ))}
        </>
    );

    if (menu) {
        const Ctx = getMenuPrimitivesContext();
        return <Ctx.Provider value={menu}>{content}</Ctx.Provider>;
    }
    return content;
}
