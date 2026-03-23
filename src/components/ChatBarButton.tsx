/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ButtonWithTooltip } from "@components";
import { React } from "@turbopack/common/react";
import type { ReactNode } from "react";

export interface ChatBarButtonProps {
    icon: ReactNode;
    tooltip?: ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
    className?: string;
}

export function ChatBarButton({ icon, tooltip, onClick, className, "aria-label": ariaLabel }: ChatBarButtonProps) {
    const label = typeof tooltip === "string" ? tooltip : ariaLabel;

    return (
        <ButtonWithTooltip
            variant="ghost"
            size="iconMd"
            rounded
            className={className}
            tooltipContent={tooltip}
            tooltipProps={{ delayDuration: 600 }}
            tooltipContentProps={{ side: "top" }}
            onClick={onClick}
            aria-label={label}
        >
            {icon}
        </ButtonWithTooltip>
    );
}
