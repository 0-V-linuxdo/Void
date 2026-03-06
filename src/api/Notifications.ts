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
}

export function showToast(message: string, type: ToastType = ToastType.MESSAGE, options?: ToastOptions) {
    const { toast } = Toaster;
    const fns = [toast, toast.success, toast.error, toast.info, toast.warning, toast.loading] as const;
    fns[type](message, options);
}
