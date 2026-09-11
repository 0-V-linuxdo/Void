/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@turbopack/common/react";
import type { CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";

export interface FlexProps extends HTMLAttributes<HTMLDivElement> {
    flexDirection?: CSSProperties["flexDirection"];
    gap?: CSSProperties["gap"];
    justifyContent?: CSSProperties["justifyContent"];
    alignItems?: CSSProperties["alignItems"];
    flexWrap?: CSSProperties["flexWrap"];
    children?: ReactNode;
    ref?: Ref<HTMLDivElement>;
}

export function Flex({ flexDirection, gap = "1em", justifyContent, alignItems, flexWrap, children, style, ref, ...restProps }: FlexProps) {
    return (
        <div
            ref={ref}
            style={{
                display: "flex",
                flexDirection,
                gap,
                justifyContent,
                alignItems,
                flexWrap,
                ...style,
            }}
            {...restProps}
        >
            {children}
        </div>
    );
}
