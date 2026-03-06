/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Tooltip, TooltipContent, TooltipTrigger } from "@components";
import { ChromiumIcon, GhostFilledIcon, TelescopeIcon } from "@components/icons";
import { React } from "@turbopack/common/react";
import type { Plugin } from "@utils/types";

interface BadgeDef {
    key: keyof Plugin;
    icon: React.ComponentType;
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
        .map(b => (
            <Tooltip key={b.key}>
                <TooltipTrigger asChild>
                    <span className={className}>
                        <b.icon />
                    </span>
                </TooltipTrigger>
                <TooltipContent>{b.tooltip}</TooltipContent>
            </Tooltip>
        ));
}
