/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ButtonWithTooltip } from "@components";
import { React } from "@turbopack/common/react";
import { classes } from "@utils/css";
import type { ReactNode } from "react";

export interface ChatBarButtonProps {
    icon: ReactNode;
    tooltip?: ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
    className?: string;
}

const TOOLTIP_PROPS = { delayDuration: 600 } as const;
const TOOLTIP_CONTENT_PROPS = { side: "top" } as const;

export function ChatBarButton({ icon, tooltip, onClick, className, "aria-label": ariaLabel }: ChatBarButtonProps) {
    return (
        <ButtonWithTooltip
            variant="tertiary"
            size="md"
            shape="circle"
            className={classes("text-primary", className)}
            tooltipContent={tooltip}
            tooltipProps={TOOLTIP_PROPS}
            tooltipContentProps={TOOLTIP_CONTENT_PROPS}
            onClick={onClick}
            aria-label={typeof tooltip === "string" ? tooltip : ariaLabel}
        >
            {icon}
        </ButtonWithTooltip>
    );
}
