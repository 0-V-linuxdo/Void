/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ChatBarButton.css";

import { ButtonWithTooltip, MotionDiv } from "@components";
import { AnimatePresence } from "@turbopack/common/components";
import { React, useEffect, useReducedMotion, useRef } from "@turbopack/common/react";
import { classes, classNameFactory } from "@utils/css";
import type { ReactNode } from "react";

const cl = classNameFactory("void-chatbar-");

const EXPAND = { width: "auto", opacity: 1 };
const COLLAPSE = { width: 0, opacity: 0 };
const TRANSITION = { duration: 0.2, ease: "easeOut" as const };

export interface ChatBarButtonProps {
    icon: ReactNode;
    children?: ReactNode;
    tooltip?: ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
    className?: string;
    iconOnly?: boolean;
}

export function ChatBarButton({ icon, children, tooltip, onClick, className, iconOnly, "aria-label": ariaLabel }: ChatBarButtonProps) {
    const label = typeof tooltip === "string" ? tooltip : ariaLabel;
    const reducedMotion = useReducedMotion();
    const hasShownText = useRef(false);
    const showText = !iconOnly && !!children;

    useEffect(() => {
        if (showText) hasShownText.current = true;
    }, [showText]);

    return (
        <ButtonWithTooltip
            variant="none"
            size="none"
            className={cl("wrapper")}
            tooltipContent={tooltip}
            tooltipProps={{ delayDuration: 600 }}
            tooltipContentProps={{ side: "top" }}
            onClick={onClick}
            aria-label={label}
        >
            <div className={classes(cl("button"), showText ? cl("button-with-text") : cl("button-icon-only"), className)}>
                {icon}
                {iconOnly != null ? (
                    <AnimatePresence>
                        {showText && (
                            <MotionDiv
                                initial={reducedMotion || !hasShownText.current ? false : COLLAPSE}
                                animate={EXPAND}
                                exit={COLLAPSE}
                                transition={reducedMotion ? { duration: 0 } : TRANSITION}
                                className={cl("motion")}
                            >
                                {children}
                            </MotionDiv>
                        )}
                    </AnimatePresence>
                ) : children}
            </div>
        </ButtonWithTooltip>
    );
}
