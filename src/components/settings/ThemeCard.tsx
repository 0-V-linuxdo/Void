/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ThemeCard.css";

import { disableTheme, enableTheme, type ThemeData } from "@api/Themes";
import { Button, Switch } from "@components";
import { CopyIcon, FolderIcon, GlobeIcon, PencilIcon, Trash2Icon } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { copyToClipboard } from "@utils/misc";

import BaseCard from "./BaseCard";

const logger = new Logger("ThemeCard");
const cl = classNameFactory("void-theme-card-");

interface ThemeCardProps {
    theme: ThemeData;
    globalEnabled: boolean;
    onRemove(url: string): void;
    onToggle(): void;
    onEdit?(): void;
}

export default function ThemeCard({ theme, globalEnabled, onRemove, onToggle, onEdit }: ThemeCardProps) {
    const handleToggle = () => {
        if (theme.enabled) disableTheme(theme.url);
        else enableTheme(theme.url).catch(e => logger.error("Failed to enable theme:", e));
        onToggle();
    };

    return (
        <BaseCard
            name={theme.name ?? theme.url}
            nameClassName={cl("name")}
            description={theme.description}
            controls={
                <>
                    {theme.local ? (
                        <Button variant="tertiary" size="xs" shape="square" aria-label="Edit" onClick={onEdit}>
                            <PencilIcon size={14} />
                        </Button>
                    ) : (
                        <Button variant="tertiary" size="xs" shape="square" aria-label="Copy URL" onClick={() => { copyToClipboard(theme.url).catch(e => logger.error("Failed to copy URL:", e)); }}>
                            <CopyIcon size={14} />
                        </Button>
                    )}
                    <Button variant="tertiary" size="xs" shape="square" aria-label="Remove" onClick={() => onRemove(theme.url)}>
                        <Trash2Icon size={14} />
                    </Button>
                    <Switch checked={theme.enabled} disabled={!globalEnabled} onCheckedChange={handleToggle} />
                </>
            }
            footer={
                <>
                    {theme.local ? <FolderIcon size={12} className={cl("footer-icon")} /> : <GlobeIcon size={12} className={cl("footer-icon")} />}
                    <div className={cl("author")}>{theme.author ?? "\u00A0"}</div>
                </>
            }
        />
    );
}
