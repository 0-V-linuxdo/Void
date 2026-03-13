/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ConfirmDialog.css";

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@turbopack/common/components";
import { React } from "@turbopack/common/react";
import type { ReactNode } from "react";

export interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string | ReactNode;
	confirmText?: string;
	cancelText?: string;
	danger?: boolean;
	onConfirm: () => void;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmText = "Confirm", cancelText = "Cancel", danger, onConfirm }: ConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="void-confirm-dialog">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="secondary" size="md" onClick={() => onOpenChange(false)}>
						{cancelText}
					</Button>
					<Button
						variant={danger ? "danger" : "primary"}
						size="md"
						onClick={() => {
							onOpenChange(false);
							onConfirm();
						}}
					>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
