/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { createElement } from "@turbopack/common/react";
import { ClassNames } from "@turbopack/common/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
export type TextWeight = "normal" | "medium" | "semibold" | "bold";
export type TextColor = "primary" | "secondary" | "muted";

export interface TextProps extends HTMLAttributes<HTMLElement> {
    size?: TextSize;
    weight?: TextWeight;
    color?: TextColor;
    as?: string;
    children?: ReactNode;
}

const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
} as const satisfies Record<TextSize, string>;

const weightClasses = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
} as const satisfies Record<TextWeight, string>;

export const colorClasses = {
    primary: "",
    secondary: "text-secondary",
    muted: "text-muted-foreground",
} as const satisfies Record<TextColor, string>;

export function Text({ size = "sm", weight = "normal", color = "primary", as = "div", className, ...props }: TextProps) {
    return createElement(as, {
        className: ClassNames.cn(sizeClasses[size], weightClasses[weight], colorClasses[color], className),
        ...props,
    });
}
