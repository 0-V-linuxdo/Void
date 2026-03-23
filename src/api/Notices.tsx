/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./Notices.css";

import { CircleAlertIcon, CircleCheckIcon, CircleXIcon, Cross2Icon, TriangleAlert } from "@components/icons";
import { Button } from "@turbopack/common/components";
import { React } from "@turbopack/common/react";
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

const ICONS: Record<string, (size: number) => ReactNode> = {
    [NoticeType.INFO]: size => <CircleAlertIcon size={size} />,
    [NoticeType.WARNING]: size => <TriangleAlert size={size} />,
    [NoticeType.ERROR]: size => <CircleXIcon size={size} />,
    [NoticeType.SUCCESS]: size => <CircleCheckIcon size={size} />,
};

let activeNoticeId: string | number | null = null;

function Notice({ message, type, action, onClose }: NoticeOptions & { onClose: () => void }) {
    const renderIcon = ICONS[type ?? NoticeType.INFO];

    return (
        <div className={cl("root")}>
            <span className={cl("icon")}>{renderIcon(18)}</span>
            <span className={cl("message")}>{message}</span>
            {action && (
                <Button variant="primary" size="md" shape="pill" onClick={(e: React.MouseEvent) => { e.stopPropagation(); action.onClick(); }}>
                    {action.icon}
                    {action.label}
                </Button>
            )}
            <button className={cl("close")} onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClose(); }}>
                <Cross2Icon size={16} />
            </button>
        </div>
    );
}

export function showNotice(options: NoticeOptions): string | number {
    closeNotice();

    const { toast } = Toaster;

    activeNoticeId = toast.custom(
        (id: string | number) => <Notice {...options} onClose={() => toast.dismiss(id)} />,
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
