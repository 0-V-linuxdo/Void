/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton } from "@components/ChatBarButton";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { React } from "@turbopack/common/react";
import { createExternalStore, sortedEntries } from "@utils/misc";
import { type LazyNode, resolveLazyNode, useExternalStore } from "@utils/react";
import type { ReactNode } from "react";

export interface ChatBarButtonDef {
    icon?: LazyNode;
    tooltip?: LazyNode;
    order?: number;
    onClick?: () => void;
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

function renderEntry(def: ChatBarButtonDef) {
    return <ChatBarButton icon={resolveLazyNode(def.icon)} tooltip={resolveLazyNode(def.tooltip)} onClick={def.onClick} />;
}

export function VoidChatBarButtons(): ReactNode {
    useExternalStore(store);

    if (!buttons.size) return null;

    const sorted = sortedEntries(buttons);

    return (
        <>
            {sorted.map(([id, def]) => (
                <ErrorBoundary key={id}>{renderEntry(def)}</ErrorBoundary>
            ))}
        </>
    );
}
