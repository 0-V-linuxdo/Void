/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components";
import type { IconProps } from "@components/icons";
import { React } from "@turbopack/common/react";
import type { ComponentType } from "react";

interface IconButtonProps {
    icon: ComponentType<IconProps>;
    label: string;
    onClick?(): void;
}

export function IconButton({ icon: Icon, label, onClick }: IconButtonProps) {
    return (
        <Button variant="tertiary" size="xs" shape="square" aria-label={label} onClick={onClick}>
            <Icon size={14} />
        </Button>
    );
}
