/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Toaster } from "@turbopack/common/utils";

export const enum ToastType {
    MESSAGE,
    SUCCESS,
    ERROR,
    INFO,
    WARNING,
    LOADING,
}

export interface ToastOptions {
    duration?: number;
    id?: string | number;
    description?: string;
    action?: { label: string; onClick: () => void };
}

const TOAST_FNS = ["", "success", "error", "info", "warning", "loading"] as const;

export function showToast(message: string, type: ToastType = ToastType.MESSAGE, options?: ToastOptions): string | number {
    const { toast } = Toaster;
    const fn = type === ToastType.MESSAGE ? toast : toast[TOAST_FNS[type] as "success"];
    return fn(message, options);
}

export function dismissToast(id?: string | number) {
    Toaster.toast.dismiss(id);
}
