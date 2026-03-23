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

type ToastMethod = "success" | "error" | "info" | "warning" | "loading";

const TOAST_FN: Record<ToastType, ToastMethod | null> = {
    [ToastType.MESSAGE]: null,
    [ToastType.SUCCESS]: "success",
    [ToastType.ERROR]: "error",
    [ToastType.INFO]: "info",
    [ToastType.WARNING]: "warning",
    [ToastType.LOADING]: "loading",
};

export function showToast(message: string, type: ToastType = ToastType.MESSAGE, options?: ToastOptions): string | number {
    const { toast } = Toaster;
    const key = TOAST_FN[type];
    return key ? toast[key](message, options) : toast(message, options);
}

export function dismissToast(id?: string | number) {
    Toaster.toast.dismiss(id);
}
