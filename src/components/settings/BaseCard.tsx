/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./BaseCard.css";

import { Card, Flex, Tooltip, TooltipContent, TooltipTrigger } from "@components";
import { React } from "@turbopack/common/react";
import { classes, classNameFactory } from "@utils/css";

const cl = classNameFactory("void-card-");

interface BaseCardProps {
    className?: string;
    name: string;
    nameClassName?: string;
    badges?: React.ReactNode;
    description?: string;
    controls: React.ReactNode;
    footer: React.ReactNode;
}

export default function BaseCard({ className, name, nameClassName, badges, description, controls, footer }: BaseCardProps) {
    return (
        <Card className={classes(cl("root"), className)}>
            <div className={cl("body")}>
                <Flex alignItems="center" justifyContent="space-between" gap="0.5rem">
                    <div className={classes(cl("name"), nameClassName)}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className={cl("title")}>{name}</span>
                            </TooltipTrigger>
                            <TooltipContent>{name}</TooltipContent>
                        </Tooltip>
                        {badges}
                    </div>
                    <Flex alignItems="center" gap="0.375rem" className={cl("controls")}>{controls}</Flex>
                </Flex>
                {description && <div className={cl("desc")}>{description}</div>}
            </div>
            <div className={cl("separator")} />
            <div className={cl("footer")}>{footer}</div>
        </Card>
    );
}
