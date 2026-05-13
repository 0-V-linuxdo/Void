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
import { createExternalStore, mapGetOrCreate, sortedEntries } from "@utils/misc";
import { type LazyNode, resolveLazyNode, useExternalStore } from "@utils/react";
import type { ComponentType, ReactNode } from "react";

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

export interface MenuPrimitives {
    Item: ComponentType<any>;
    Sub: ComponentType<any>;
    SubTrigger: ComponentType<any>;
    SubContent: ComponentType<any>;
    Separator: ComponentType<any>;
}

let menuPrimitivesContext: React.Context<MenuPrimitives | null> | null = null;
function getMenuPrimitivesContext(): React.Context<MenuPrimitives | null> {
    return menuPrimitivesContext ??= React.createContext<MenuPrimitives | null>(null);
}

function useMenuPrimitive<K extends keyof MenuPrimitives>(key: K, fallback: MenuPrimitives[K]): MenuPrimitives[K] {
    const ctx = React.useContext(getMenuPrimitivesContext());
    return ctx?.[key] ?? fallback;
}

export const MenuItem: ComponentType<any> = props => {
    const C = useMenuPrimitive("Item", DropdownMenuItem);
    return <C {...props} />;
};
export const MenuSub: ComponentType<any> = props => {
    const C = useMenuPrimitive("Sub", DropdownMenuSub);
    return <C {...props} />;
};
export const MenuSubTrigger: ComponentType<any> = props => {
    const C = useMenuPrimitive("SubTrigger", DropdownMenuSubTrigger);
    return <C {...props} />;
};
export const MenuSubContent: ComponentType<any> = props => {
    const C = useMenuPrimitive("SubContent", DropdownMenuSubContent);
    return <C {...props} />;
};
export const MenuSeparator: ComponentType<any> = props => {
    const C = useMenuPrimitive("Separator", DropdownMenuSeparator);
    return <C {...props} />;
};

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
    useExternalStore(store);

    const map = items.get(location);
    if (!map?.size) return null;

    const sorted = sortedEntries(map);

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
