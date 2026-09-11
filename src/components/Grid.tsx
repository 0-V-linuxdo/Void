/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@turbopack/common/react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
    columns?: CSSProperties["gridTemplateColumns"];
    rows?: CSSProperties["gridTemplateRows"];
    gap?: CSSProperties["gap"];
    justifyItems?: CSSProperties["justifyItems"];
    alignItems?: CSSProperties["alignItems"];
    children?: ReactNode;
}

export function Grid({ columns, rows, gap = "0.75rem", justifyItems, alignItems, children, style, ...restProps }: GridProps) {
    return (
        <div
            style={{
                display: "grid",
                gridTemplateColumns: columns,
                gridTemplateRows: rows,
                gap,
                justifyItems,
                alignItems,
                ...style,
            }}
            {...restProps}
        >
            {children}
        </div>
    );
}
