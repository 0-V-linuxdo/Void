/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./PluginCard.css";

import { dispatch } from "@api/Events";
import { isNewPlugin, isPluginEnabled, plugins, startPlugin, stopPlugin } from "@api/PluginManager";
import { isPluginPinned, mergePluginSettings, togglePluginPinned } from "@api/Settings";
import { Badge, Switch } from "@components";
import { CircleAlertIcon, EllipsisVertical, PinFilledIcon, PinIcon, TriangleAlert } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classes, classNameFactory } from "@utils/css";
import { useForceUpdater } from "@utils/react";

import BaseCard from "./BaseCard";
import { IconButton } from "./IconButton";
import { PluginBadges, TooltipIcon } from "./pluginBadges";
import { hasVisibleSettings } from "./utils";

const cl = classNameFactory("void-plugin-card-");

interface PluginCardProps {
    name: string;
    onSettings(name: string): void;
    onReload(pluginName: string): void;
}

export default function PluginCard({ name, onSettings, onReload }: PluginCardProps) {
    const plugin = plugins[name];
    const forceUpdate = useForceUpdater();
    const enabled = isPluginEnabled(name);
    const pinned = isPluginPinned(name);
    const crashed = enabled && !plugin.started && !plugin.required;
    const hasPatches = !!plugin.patches?.length;

    const handleToggle = () => {
        mergePluginSettings(name, { enabled: !enabled });
        if (!enabled) startPlugin(plugin, true);
        else stopPlugin(plugin);
        forceUpdate();
        dispatch("pluginToggle");
        if (hasPatches) onReload(name);
    };

    const handlePin = () => {
        togglePluginPinned(name);
        forceUpdate();
        dispatch("pluginPin");
    };

    return (
        <BaseCard
            className={classes(plugin.required && cl("required"), crashed && cl("crashed"))}
            name={name}
            badges={
                <>
                    {crashed && <TooltipIcon icon={TriangleAlert} tooltip="This plugin failed to start" className={cl("crashed-icon")} />}
                    {plugin.required && <TooltipIcon icon={CircleAlertIcon} tooltip="This plugin is required for Void to work" className={cl("required-icon")} />}
                    <PluginBadges plugin={plugin} className={cl("badge")} />
                    {isNewPlugin(name) && <Badge variant="accent">New</Badge>}
                </>
            }
            description={plugin.description}
            controls={
                <>
                    {!plugin.required && (
                        <IconButton
                            icon={pinned ? PinFilledIcon : PinIcon}
                            label={pinned ? "Unpin from top" : "Pin to top"}
                            className={classes(cl("pin"), pinned && cl("pin-active"))}
                            onClick={handlePin}
                        />
                    )}
                    {hasVisibleSettings(plugin) && (
                        <IconButton icon={EllipsisVertical} label="Plugin settings" onClick={() => onSettings(name)} />
                    )}
                    <Switch checked={enabled} disabled={plugin.required} onCheckedChange={handleToggle} />
                </>
            }
            footer={<div className="void-card-author">{plugin.authors?.join(", ") || "\u00A0"}</div>}
        />
    );
}
