/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./BaseCard.css";

import { Card, Flex, Separator, Text } from "@components";
import { React } from "@turbopack/common/react";
import { classes, classNameFactory } from "@utils/css";

const cl = classNameFactory("void-card-");

interface BaseCardProps {
    className?: string;
    name: React.ReactNode;
    nameClassName?: string;
    description?: string;
    controls: React.ReactNode;
    footer: React.ReactNode;
}

export default function BaseCard({ className, name, nameClassName, description, controls, footer }: BaseCardProps) {
    return (
        <Card className={classes(cl("root"), className)}>
            <div className={cl("body")}>
                <Flex alignItems="center" justifyContent="space-between" gap="0.5rem">
                    <Text as="span" className={classes(cl("name"), nameClassName)}>{name}</Text>
                    <Flex alignItems="center" gap="0.375rem" className={cl("controls")}>{controls}</Flex>
                </Flex>
                {description && <div className={cl("desc")}>{description}</div>}
            </div>
            <Separator />
            <div className={cl("footer")}>{footer}</div>
        </Card>
    );
}
