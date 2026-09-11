/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ErrorCard.css";

import { React } from "@turbopack/common/react";
import { classes, classNameFactory } from "@utils/css";
import type { HTMLAttributes, ReactNode } from "react";

const cl = classNameFactory("void-error-card-");

export interface ErrorCardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    children?: ReactNode;
}

export function ErrorCard({ title, children, className, ...restProps }: ErrorCardProps) {
    return (
        <div className={classes(cl("root"), className)} {...restProps}>
            {title && <div className={cl("header")}>{title}</div>}
            {children}
        </div>
    );
}
