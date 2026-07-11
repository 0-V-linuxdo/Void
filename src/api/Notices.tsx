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

interface NoticeAction {
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

const ICONS: Record<NoticeType, () => ReactNode> = {
    [NoticeType.INFO]: () => <CircleAlertIcon size={18} />,
    [NoticeType.WARNING]: () => <TriangleAlert size={18} />,
    [NoticeType.ERROR]: () => <CircleXIcon size={18} />,
    [NoticeType.SUCCESS]: () => <CircleCheckIcon size={18} />,
};

let activeNoticeId: string | number | null = null;

function Notice({ message, type, action, onClose }: NoticeOptions & { onClose: () => void }) {
    return (
        <div className={cl("root")}>
            <span className={cl("icon")}>{ICONS[type ?? NoticeType.INFO]()}</span>
            <span className={cl("message")}>{message}</span>
            {action && (
                <Button variant="primary" size="sm" shape="pill" onClick={action.onClick}>
                    {action.icon}
                    {action.label}
                </Button>
            )}
            <Button variant="tertiary" size="sm" shape="square" className={cl("close")} onClick={onClose}>
                <Cross2Icon size={16} />
            </Button>
        </div>
    );
}

export function showNotice(options: NoticeOptions): string | number {
    closeNotice();

    const { toast } = Toaster;
    if (!toast) return -1;

    activeNoticeId = toast.custom(
        (id: string | number) => <Notice {...options} onClose={() => { toast.dismiss(id); activeNoticeId = null; }} />,
        { duration: options.duration ?? Infinity },
    );

    return activeNoticeId;
}

export function closeNotice() {
    if (activeNoticeId != null) {
        Toaster.toast?.dismiss(activeNoticeId);
        activeNoticeId = null;
    }
}
