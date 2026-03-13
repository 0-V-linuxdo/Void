/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./Notices.css";

import { Button } from "@turbopack/common/components";
import { createElement, React } from "@turbopack/common/react";
import { Toaster } from "@turbopack/common/utils";
import { classNameFactory } from "@utils/css";
import type { ReactNode } from "react";

export const enum NoticeType {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    SUCCESS = "success",
}

export interface NoticeAction {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
}

export interface NoticeOptions {
    message: string;
    type?: NoticeType;
    action?: NoticeAction;
    duration?: number;
}

const cl = classNameFactory("void-notice-");

const ICONS: Record<string, string> = {
    [NoticeType.INFO]: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    [NoticeType.WARNING]: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    [NoticeType.ERROR]: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    [NoticeType.SUCCESS]: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
};

let activeNoticeId: string | number | null = null;

function Notice({ message, type, action, onClose }: NoticeOptions & { onClose: () => void }) {
    const iconSvg = ICONS[type ?? NoticeType.INFO];

    return (
        <div className={cl("root")}>
            <span className={cl("icon")} dangerouslySetInnerHTML={{
                __html: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>`,
            }} />
            <span className={cl("message")}>{message}</span>
            {action && (
                <Button variant="primary" size="md" shape="pill" onClick={(e: React.MouseEvent) => { e.stopPropagation(); action.onClick(); }}>
                    {action.icon}
                    {action.label}
                </Button>
            )}
            <button className={cl("close")} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClose(); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
        </div>
    );
}

export function showNotice(options: NoticeOptions): string | number {
    closeNotice();

    const { toast } = Toaster;

    activeNoticeId = toast.custom(
        (id: string | number) => createElement(Notice, {
            ...options,
            onClose: () => toast.dismiss(id),
        }),
        { duration: options.duration ?? Infinity },
    );

    return activeNoticeId;
}

export function closeNotice() {
    if (activeNoticeId != null) {
        Toaster.toast.dismiss(activeNoticeId);
        activeNoticeId = null;
    }
}
