/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { React } from "@turbopack/common/react";
import { ClassNames } from "@turbopack/common/utils";
import type { HTMLAttributes, ReactNode } from "react";

import { Flex } from "./Flex";
import { Text, type TextColor } from "./Text";

export interface ParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
    color?: TextColor;
    children?: ReactNode;
}

export function Paragraph({ color = "secondary", className, children, ...props }: ParagraphProps) {
    return (
        <Text as="p" size="xs" color={color} className={ClassNames.cn("text-pretty", className)} {...props}>
            {children}
        </Text>
    );
}

export function SectionHeader({ title, description, className }: { title: string; description?: string; className?: string }) {
    return (
        <Flex flexDirection="column" gap="0" className={className}>
            <Text size="sm" weight="medium">{title}</Text>
            {description && <Paragraph>{description}</Paragraph>}
        </Flex>
    );
}
