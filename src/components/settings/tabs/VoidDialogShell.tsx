/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "../shared.css";

import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Flex, Text } from "@components";
import { Cross2Icon } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classes } from "@utils/css";
import type { ReactNode } from "react";

export type DialogSize = "sm" | "md" | "lg";

export function VoidDialogShell({ title, subtitle, onClose, children, size = "md", nested }: {
    title: ReactNode;
    subtitle?: string;
    onClose(): void;
    children: ReactNode;
    size?: DialogSize;
    nested?: boolean;
}) {
    return (
        <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
            <DialogContent
                className={classes("void-dialog-content", `void-dialog-content-${size}`)}
                overlayClassname={nested ? "void-dialog-overlay-nested" : undefined}
                {...(subtitle ? {} : { "aria-describedby": undefined })}
            >
                <DialogClose asChild>
                    <Button variant="tertiary" size="sm" shape="square" aria-label="Close" className="void-dialog-close">
                        <Cross2Icon />
                    </Button>
                </DialogClose>
                <DialogHeader className="void-dialog-header">
                    <DialogTitle>{title}</DialogTitle>
                    {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

export function DialogField({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
    return (
        <Flex flexDirection="column" gap="0.25rem" className={className}>
            <Text size="sm" weight="medium">{label}</Text>
            {children}
        </Flex>
    );
}

export function DialogActions({ className, onCancel, confirmLabel, onConfirm, confirmDisabled }: {
    className?: string;
    onCancel(): void;
    confirmLabel: string;
    onConfirm(): void;
    confirmDisabled?: boolean;
}) {
    return (
        <DialogFooter className={classes("void-dialog-footer", className)}>
            <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={onConfirm} disabled={confirmDisabled}>{confirmLabel}</Button>
        </DialogFooter>
    );
}
