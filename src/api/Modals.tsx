/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Dialog, DialogContent } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { React, useCallback } from "@turbopack/common/react";
import { createExternalStore } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import type { ReactNode } from "react";

export interface ModalProps {
    onClose(): void;
}

interface ModalOptions {
    modalKey?: string;
}

interface ModalEntry {
    key: string;
    render: (props: ModalProps) => ReactNode;
}

let nextId = 0;
const modalStack: ModalEntry[] = [];
const store = createExternalStore();

export function openModal(render: (props: ModalProps) => ReactNode, options?: ModalOptions): string {
    const key = options?.modalKey ?? `void-modal-${nextId++}`;
    const idx = modalStack.findIndex(m => m.key === key);
    if (idx !== -1) modalStack.splice(idx, 1);
    modalStack.push({ key, render });
    store.notify();
    return key;
}

export function closeModal(key: string) {
    const idx = modalStack.findIndex(m => m.key === key);
    if (idx !== -1) {
        modalStack.splice(idx, 1);
        store.notify();
    }
}

export function closeAllModals() {
    modalStack.length = 0;
    store.notify();
}

const ModalInstance = ErrorBoundary.wrap(function ModalInstance({ entry }: { entry: ModalEntry }) {
    const onClose = useCallback(() => closeModal(entry.key), [entry.key]);

    return (
        <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent aria-describedby={undefined}>{entry.render({ onClose })}</DialogContent>
        </Dialog>
    );
});

export function ModalContainer() {
    useExternalStore(store);

    if (!modalStack.length) return null;

    return (
        <>
            {modalStack.map(entry => (
                <ModalInstance key={entry.key} entry={entry} />
            ))}
        </>
    );
}
