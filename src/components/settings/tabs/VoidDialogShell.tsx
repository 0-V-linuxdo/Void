/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, DialogClose, DialogContent, DialogHeader, DialogTitle, Paragraph } from "@components";
import { Cross2Icon } from "@components/icons";
import { React } from "@turbopack/common/react";
import type { ReactNode } from "react";

export function VoidDialogShell({ title, subtitle, children }: { title: ReactNode; subtitle?: string; children: ReactNode }) {
    return (
        <DialogContent className="void-dialog-content" aria-describedby={undefined}>
            <DialogClose asChild>
                <Button variant="tertiary" size="sm" shape="square" aria-label="Close" className="void-dialog-close">
                    <Cross2Icon />
                </Button>
            </DialogClose>
            <DialogHeader className="void-dialog-header">
                <DialogTitle>{title}</DialogTitle>
                {subtitle && <Paragraph>{subtitle}</Paragraph>}
            </DialogHeader>
            {children}
        </DialogContent>
    );
}
