/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ThemeCard.css";

import { disableTheme, enableTheme, type ThemeData } from "@api/Themes";
import { ButtonWithTooltip, Flex, Switch, Text } from "@components";
import { CopyIcon, Trash2Icon } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { copyToClipboard } from "@utils/misc";

const logger = new Logger("ThemeCard");
const cl = classNameFactory("void-theme-card-");

interface ThemeCardProps {
    theme: ThemeData;
    globalEnabled: boolean;
    onRemove(url: string): void;
    onToggle(): void;
}

export default function ThemeCard({ theme, globalEnabled, onRemove, onToggle }: ThemeCardProps) {
    const handleToggle = () => {
        if (theme.enabled) disableTheme(theme.url);
        else enableTheme(theme.url).catch(e => logger.error("Failed to enable theme:", e));
        onToggle();
    };

    return (
        <div className={cl("root")}>
            <div className={cl("body")}>
                <Flex alignItems="center" justifyContent="space-between" gap="0.5rem">
                    <Text as="span" className={cl("name")}>{theme.name ?? theme.url}</Text>
                    <Flex alignItems="center" gap="0.375rem" className={cl("controls")}>
                        <ButtonWithTooltip variant="tertiary" size="xs" shape="square" tooltipContent="Copy URL" onClick={() => { copyToClipboard(theme.url).catch(e => logger.error("Failed to copy URL:", e)); }}>
                            <CopyIcon size={16} />
                        </ButtonWithTooltip>
                        <ButtonWithTooltip variant="tertiary" size="xs" shape="square" tooltipContent="Remove" onClick={() => onRemove(theme.url)}>
                            <Trash2Icon size={16} />
                        </ButtonWithTooltip>
                        <Switch checked={theme.enabled} disabled={!globalEnabled} onCheckedChange={handleToggle} />
                    </Flex>
                </Flex>
                {theme.description && <div className={cl("desc")}>{theme.description}</div>}
            </div>
            <div className={cl("separator")} />
            <div className={cl("footer")}>
                <div className={cl("author")}>{theme.author ?? "\u00A0"}</div>
            </div>
        </div>
    );
}
