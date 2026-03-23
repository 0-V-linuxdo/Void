/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./PluginCard.css";

import { dispatch } from "@api/Events";
import { isPluginEnabled, plugins, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings } from "@api/Settings";
import { Button, Switch, Text, Tooltip, TooltipContent, TooltipTrigger } from "@components";
import { CircleAlertIcon, EllipsisVertical, TriangleAlert } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import { useForceUpdater } from "@utils/react";

import BaseCard from "./BaseCard";
import { PluginBadges } from "./pluginBadges";
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
    const crashed = enabled && !plugin.started && !plugin.required;
    const hasPatches = !!plugin.patches?.length;

    const handleToggle = () => {
        Settings.plugins[name] = { ...Settings.plugins[name], enabled: !enabled };
        if (!enabled) startPlugin(plugin, true);
        else stopPlugin(plugin);
        forceUpdate();
        dispatch("pluginToggle");
        if (hasPatches) onReload(name);
    };

    return (
        <BaseCard
            className={plugin.required ? cl("required") : crashed ? cl("crashed") : undefined}
            name={
                <>
                    {name}
                    {crashed && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Text as="span" className={cl("crashed-icon")}>
                                    <TriangleAlert />
                                </Text>
                            </TooltipTrigger>
                            <TooltipContent>This plugin failed to start</TooltipContent>
                        </Tooltip>
                    )}
                    {plugin.required && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Text as="span" className={cl("required-icon")}>
                                    <CircleAlertIcon />
                                </Text>
                            </TooltipTrigger>
                            <TooltipContent>This plugin is required for Void to work</TooltipContent>
                        </Tooltip>
                    )}
                    <PluginBadges plugin={plugin} className={cl("badge")} />
                </>
            }
            description={plugin.description}
            controls={
                <>
                    {hasVisibleSettings(plugin) && (
                        <Button variant="tertiary" size="xs" shape="square" aria-label="Plugin settings" onClick={() => onSettings(name)}>
                            <EllipsisVertical size={14} />
                        </Button>
                    )}
                    <Switch checked={enabled} disabled={plugin.required} onCheckedChange={handleToggle} />
                </>
            }
            footer={<div className={cl("authors")}>{plugin.authors?.length ? plugin.authors.join(", ") : "\u00A0"}</div>}
        />
    );
}
