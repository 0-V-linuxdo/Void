/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ButtonWithPopover, ButtonWithTooltipOptimized } from "@components";
import type { ButtonShape, ButtonSize, ButtonVariant } from "@grok-types";
import { React } from "@turbopack/common/react";
import { classes } from "@utils/css";
import type { ReactNode } from "react";

export interface ChatBarButtonProps {
    icon: ReactNode;
    tooltip?: ReactNode;
    popover?: ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    shape?: ButtonShape;
    disabled?: boolean;
    active?: boolean;
    "aria-label"?: string;
    className?: string;
}

const TOOLTIP_PROPS = { delayDuration: 600 } as const;
const TOOLTIP_CONTENT_PROPS = { side: "top" } as const;
const POPOVER_CONTENT_PROPS = { side: "top", align: "end" } as const;

export function ChatBarButton({
    icon,
    tooltip,
    popover,
    onClick,
    variant = "tertiary",
    size = "md",
    shape = "circle",
    disabled,
    active,
    className,
    "aria-label": ariaLabel,
}: ChatBarButtonProps) {
    const cls = classes(active && "bg-button-ghost-hover", className);
    const label = ariaLabel ?? (typeof tooltip === "string" ? tooltip : undefined);

    if (popover) {
        return (
            <ButtonWithPopover
                variant={variant}
                size={size}
                shape={shape}
                disabled={disabled}
                className={cls}
                popoverContent={popover}
                popoverContentProps={POPOVER_CONTENT_PROPS}
                onClick={onClick}
                aria-label={label}
            >
                {icon}
            </ButtonWithPopover>
        );
    }

    return (
        <ButtonWithTooltipOptimized
            variant={variant}
            size={size}
            shape={shape}
            disabled={disabled}
            className={cls}
            tooltipContent={tooltip}
            tooltipProps={TOOLTIP_PROPS}
            tooltipContentProps={TOOLTIP_CONTENT_PROPS}
            onClick={onClick}
            aria-label={label}
        >
            {icon}
        </ButtonWithTooltipOptimized>
    );
}
