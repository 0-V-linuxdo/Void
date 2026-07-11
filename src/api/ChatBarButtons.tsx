/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton } from "@components/ChatBarButton";
import { ErrorBoundary } from "@components/ErrorBoundary";
import type { ButtonShape, ButtonSize, ButtonVariant } from "@grok-types";
import { React } from "@turbopack/common/react";
import { type LazyNode, type Resolvable, resolveLazy, useExternalStore } from "@utils/react";
import type { ReactNode } from "react";

import { createRegistry } from "./registry";

export type ChatBarLocation = "chat" | "imagine";

export interface ChatBarButtonDef {
    icon?: LazyNode;
    tooltip?: LazyNode;
    popover?: LazyNode;
    order?: number;
    onClick?: (e: React.MouseEvent) => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    disabled?: Resolvable<boolean>;
    active?: Resolvable<boolean>;
    "aria-label"?: string;
    className?: string;
    locations?: ChatBarLocation[];
}

const buttons = createRegistry<ChatBarButtonDef>();

export function addChatBarButton(id: string, def: ChatBarButtonDef) {
    buttons.set(id, def);
}

export function removeChatBarButton(id: string) {
    buttons.delete(id);
}

function renderEntry(def: ChatBarButtonDef): ReactNode {
    return (
        <ChatBarButton
            icon={resolveLazy(def.icon)}
            tooltip={resolveLazy(def.tooltip)}
            popover={resolveLazy(def.popover)}
            onClick={def.onClick}
            variant={def.variant}
            size={def.size}
            shape={def.shape}
            disabled={resolveLazy(def.disabled)}
            active={resolveLazy(def.active)}
            aria-label={def["aria-label"]}
            className={def.className}
        />
    );
}

export function VoidChatBarButtons({ location = "chat" }: { location?: ChatBarLocation; }): ReactNode {
    useExternalStore(buttons.store);

    if (!buttons.size) return null;

    const entries = buttons.sorted().filter(([, def]) => (def.locations ?? ["chat"]).includes(location));
    if (!entries.length) return null;

    return (
        <>
            {entries.map(([id, def]) => (
                <ErrorBoundary key={id}>{renderEntry(def)}</ErrorBoundary>
            ))}
        </>
    );
}
