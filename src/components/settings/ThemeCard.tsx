/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./ThemeCard.css";

import { disableTheme, enableTheme, type ThemeData } from "@api/Themes";
import { Button, Switch } from "@components";
import { CopyIcon, FolderIcon, GlobeIcon, type IconProps, PencilIcon, Trash2Icon } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { copyToClipboard } from "@utils/misc";
import type { ComponentType } from "react";

import BaseCard from "./BaseCard";

function IconButton({ icon: Icon, label, onClick }: { icon: ComponentType<IconProps>; label: string; onClick?(): void }) {
    return (
        <Button variant="tertiary" size="xs" shape="square" aria-label={label} onClick={onClick}>
            <Icon size={14} />
        </Button>
    );
}

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

    const SourceIcon = theme.local ? FolderIcon : GlobeIcon;

    return (
        <BaseCard
            name={theme.name ?? theme.url}
            nameClassName={cl("name")}
            description={theme.description}
            controls={
                <>
                    {theme.local
                        ? <IconButton icon={PencilIcon} label="Edit" onClick={onEdit} />
                        : <IconButton icon={CopyIcon} label="Copy URL" onClick={() => { copyToClipboard(theme.url).catch(e => logger.error("Failed to copy URL:", e)); }} />
                    }
                    <IconButton icon={Trash2Icon} label="Remove" onClick={() => onRemove(theme.url)} />
                    <Switch checked={theme.enabled} disabled={!globalEnabled} onCheckedChange={handleToggle} />
                </>
            }
            footer={
                <>
                    <SourceIcon size={12} className={cl("footer-icon")} />
                    <div className={cl("author")}>{theme.author ?? "\u00A0"}</div>
                </>
            }
        />
    );
}
