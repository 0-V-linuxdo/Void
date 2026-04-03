/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Text, Tooltip, TooltipContent, TooltipTrigger } from "@components";
import { ChromiumIcon, GhostFilledIcon, TelescopeIcon } from "@components/icons";
import { React } from "@turbopack/common/react";
import type { Plugin } from "@utils/types";
import type { ComponentType, ReactNode } from "react";

export function TooltipIcon({ icon: Icon, tooltip, className, as = "span" }: { icon: ComponentType; tooltip: ReactNode; className?: string; as?: string }) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Text as={as} className={className}><Icon /></Text>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
    );
}

interface BadgeDef {
    key: keyof Plugin;
    icon: ComponentType;
    tooltip: string;
}

const badges: BadgeDef[] = [
    { key: "dev", icon: GhostFilledIcon, tooltip: "Dev Only" },
    { key: "chrome", icon: ChromiumIcon, tooltip: "Chromium Only" },
    { key: "preview", icon: TelescopeIcon, tooltip: "Preview plugin, may be removed once Grok ships this." },
];

export function PluginBadges({ plugin, className }: { plugin: Plugin; className?: string }) {
    return badges
        .filter(b => plugin[b.key])
        .map(b => <TooltipIcon key={b.key} icon={b.icon} tooltip={b.tooltip} className={className} />);
}
