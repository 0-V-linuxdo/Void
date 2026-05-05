/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton } from "@components/ChatBarButton";
import { ErrorBoundary } from "@components/ErrorBoundary";
import type { ButtonShape, ButtonSize, ButtonVariant } from "@grok-types";
import { React } from "@turbopack/common/react";
import { createExternalStore, sortedEntries } from "@utils/misc";
import { type LazyNode, resolveLazyNode, useExternalStore } from "@utils/react";
import type { ReactNode } from "react";

export interface ChatBarButtonDef {
    icon?: LazyNode;
    tooltip?: LazyNode;
    popover?: LazyNode;
    order?: number;
    onClick?: (e: React.MouseEvent) => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    disabled?: boolean | (() => boolean);
    active?: boolean | (() => boolean);
    "aria-label"?: string;
    className?: string;
}

const buttons = new Map<string, ChatBarButtonDef>();
const store = createExternalStore();

export function addChatBarButton(id: string, def: ChatBarButtonDef) {
    buttons.set(id, def);
    store.notify();
}

export function removeChatBarButton(id: string) {
    buttons.delete(id);
    store.notify();
}

export function updateChatBarButton(id: string, patch: Partial<ChatBarButtonDef>) {
    const existing = buttons.get(id);
    if (!existing) return;
    buttons.set(id, { ...existing, ...patch });
    store.notify();
}

const resolve = <T,>(v: T | (() => T) | undefined): T | undefined =>
    typeof v === "function" ? (v as () => T)() : v;

function renderEntry(def: ChatBarButtonDef): ReactNode {
    return (
        <ChatBarButton
            icon={resolveLazyNode(def.icon)}
            tooltip={resolveLazyNode(def.tooltip)}
            popover={resolveLazyNode(def.popover)}
            onClick={def.onClick}
            variant={def.variant}
            size={def.size}
            shape={def.shape}
            disabled={resolve(def.disabled)}
            active={resolve(def.active)}
            aria-label={def["aria-label"]}
            className={def.className}
        />
    );
}

export function VoidChatBarButtons(): ReactNode {
    useExternalStore(store);

    if (!buttons.size) return null;

    return (
        <>
            {sortedEntries(buttons).map(([id, def]) => (
                <ErrorBoundary key={id}>{renderEntry(def)}</ErrorBoundary>
            ))}
        </>
    );
}
