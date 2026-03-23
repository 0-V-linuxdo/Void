/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./PluginCard.css";

import { dispatch } from "@api/Events";
import { isPluginEnabled, plugins, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings } from "@api/Settings";
import { Button, Flex, Switch, Text, Tooltip, TooltipContent, TooltipTrigger } from "@components";
import { CircleAlertIcon, EllipsisVertical, TriangleAlert } from "@components/icons";
import { React } from "@turbopack/common/react";
import { classes, classNameFactory } from "@utils/css";
import { useForceUpdater } from "@utils/react";

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
        <div className={classes(cl("root"), plugin.required && cl("required"), crashed && cl("crashed"))}>
            <div className={cl("body")}>
                <Flex alignItems="center" justifyContent="space-between" gap="0.5rem">
                    <Text as="span" className={cl("name")}>
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
                    </Text>
                    <Flex alignItems="center" gap="0.375rem" className={cl("controls")}>
                        {hasVisibleSettings(plugin) && (
                            <Button variant="tertiary" size="xs" shape="square" aria-label="Plugin settings" onClick={() => onSettings(name)}>
                                <EllipsisVertical size={14} />
                            </Button>
                        )}
                        <Switch checked={enabled} disabled={plugin.required} onCheckedChange={handleToggle} />
                    </Flex>
                </Flex>
                {plugin.description && <div className={cl("desc")}>{plugin.description}</div>}
            </div>
            <div className={cl("separator")} />
            <div className={cl("footer")}>
                <div className={cl("authors")}>{plugin.authors?.length ? plugin.authors.join(", ") : "\u00A0"}</div>
            </div>
        </div>
    );
}
