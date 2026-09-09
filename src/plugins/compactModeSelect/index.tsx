/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ChatBarButton, Flex } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { HammerIcon, LayoutGridIcon, LightbulbIcon, Minimize2Icon, RocketIcon, ZapIcon } from "@components/icons";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import { React } from "@turbopack/common/react";
import { ChatPageStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";

const cl = classNameFactory("void-cms-");

const MODES = [
    { id: "auto", pin: "pinAuto", label: "Auto", Icon: RocketIcon },
    { id: "fast", pin: "pinFast", label: "Fast", Icon: ZapIcon },
    { id: "expert", pin: "pinExpert", label: "Expert", Icon: LightbulbIcon },
    { id: "heavy", pin: "pinHeavy", label: "Heavy", Icon: LayoutGridIcon },
    { id: "build", pin: "pinBuild", label: "Build", Icon: HammerIcon },
] as const;

const PIN_KEYS = ["pinAuto", "pinFast", "pinExpert", "pinHeavy", "pinBuild", "showLabels"] as const;

const settings = definePluginSettings({
    pinAuto: {
        type: OptionType.BOOLEAN,
        description: "Pin Auto next to the compact selector.",
        default: false,
    },
    pinFast: {
        type: OptionType.BOOLEAN,
        description: "Pin Fast next to the compact selector.",
        default: false,
    },
    pinExpert: {
        type: OptionType.BOOLEAN,
        description: "Pin Expert next to the compact selector.",
        default: false,
    },
    pinHeavy: {
        type: OptionType.BOOLEAN,
        description: "Pin Heavy next to the compact selector.",
        default: true,
    },
    pinBuild: {
        type: OptionType.BOOLEAN,
        description: "Pin Build next to the compact selector.",
        default: true,
    },
    showLabels: {
        type: OptionType.BOOLEAN,
        description: "Show mode names on pinned chips.",
        default: false,
    },
});

function setMode(id: string) {
    ChatPageStore.useChatPageStore.getState().setModelMode(id);
}

function PinnedModes() {
    const cfg = settings.use([...PIN_KEYS]);
    const modelMode = ChatPageStore.useChatPageStore((s: ChatPageStoreState) => s.modelMode);
    const items = MODES.filter(m => cfg[m.pin]);
    if (!items.length) return null;

    const { showLabels } = cfg;
    const allPinned = MODES.every(m => cfg[m.pin]);

    return (
        <Flex alignItems="center" gap="0.125rem" className={classes(cl("pins"), allPinned && cl("all-pinned"))}>
            {items.map(m => (
                <ChatBarButton
                    key={m.id}
                    icon={(
                        <span className={classes(cl("chip"), showLabels && cl("labeled"))}>
                            <m.Icon />
                            {showLabels && <span className={cl("label")}>{m.label}</span>}
                        </span>
                    )}
                    tooltip={m.label}
                    onClick={() => setMode(m.id)}
                    active={modelMode === m.id}
                    aria-label={m.label}
                />
            ))}
        </Flex>
    );
}

export default definePlugin({
    name: "CompactModeSelect",
    icon: Minimize2Icon,
    description: "Pin 1–N chat modes as always-visible chips. Click a chip to switch without opening the menu.",
    authors: [Devs.p],
    tags: ["chat", "ui"],
    enabledByDefault: true,
    settings,
    managedStyle: "compactModeSelect",

    renderPinned: ErrorBoundary.wrap(PinnedModes),

    patches: [
        {
            find: "data-query-bar-mode-select",
            all: true,
            group: true,
            replacement: [
                {
                    match: /ModeSelect,\{compact:\i\|\|\i,/,
                    replace: "ModeSelect,{compact:!0,",
                },
                {
                    match: /\},"mode-select"\),/,
                    replace: "$&$self.renderPinned(),",
                },
            ],
        },
    ],
});
