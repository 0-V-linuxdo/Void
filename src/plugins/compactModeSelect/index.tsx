/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ChatBarButton } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { HammerIcon, LayoutGridIcon, LightbulbIcon, Minimize2Icon, RocketIcon, ZapIcon } from "@components/icons";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import type { ModesStoreState } from "@grok-types/stores/ModesStore";
import { React } from "@turbopack/common/react";
import { ChatPageStore, ModesStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const logger = new Logger("CompactModeSelect");
const cl = classNameFactory("void-cms-");
const SELECTED_KEY = "modes-selected-id";

const MODES = [
    { id: "auto", pin: "pinAuto", label: "Auto", Icon: RocketIcon },
    { id: "fast", pin: "pinFast", label: "Fast", Icon: ZapIcon },
    { id: "expert", pin: "pinExpert", label: "Expert", Icon: LightbulbIcon },
    { id: "heavy", pin: "pinHeavy", label: "Heavy", Icon: LayoutGridIcon },
    { id: "build", pin: "pinBuild", label: "Build", Icon: HammerIcon },
] as const;

const KNOWN_IDS = new Set<string>(MODES.map(m => m.id));
const PIN_BY_ID: Record<string, (typeof MODES)[number]["pin"]> = Object.fromEntries(MODES.map(m => [m.id, m.pin]));
const SETTING_KEYS = ["pinAuto", "pinFast", "pinExpert", "pinHeavy", "pinBuild", "showLabels"] as const;

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

function applyMode(id: string) {
    ModesStore.useModesStore.getState().setSelectedModeId(id);
    try {
        localStorage.setItem(SELECTED_KEY, id);
    } catch (e) {
        logger.warn("Failed to persist mode:", e);
    }
    if (id !== "build") ChatPageStore.useChatPageStore.getState().setModelMode(id);
}

function PinnedModes() {
    const cfg = settings.use([...SETTING_KEYS]);
    const selectedModeId = ModesStore.useModesStore((s: ModesStoreState) => s.selectedModeId);
    const catalog = ModesStore.useModesStore((s: ModesStoreState) => s.modes);
    const modelMode = ChatPageStore.useChatPageStore((s: ChatPageStoreState) => s.modelMode);
    const current = selectedModeId || modelMode;
    const knownCatalog = catalog.filter(c => KNOWN_IDS.has(c.id));
    const items = MODES.filter(m => cfg[m.pin] && (!knownCatalog.length || knownCatalog.some(c => c.id === m.id)));
    if (!items.length) return null;

    const { showLabels } = cfg;
    const allCovered = knownCatalog.length > 0 && knownCatalog.every(c => cfg[PIN_BY_ID[c.id]]);

    return (
        <div className={classes(cl("pins"), allCovered && cl("all-covered"))}>
            {items.map(m => (
                <ChatBarButton
                    key={m.id}
                    size="sm"
                    icon={showLabels
                        ? (
                            <>
                                <m.Icon size={18} />
                                <span className={cl("label")}>{m.label}</span>
                            </>
                        )
                        : <m.Icon size={18} />}
                    tooltip={m.label}
                    onClick={() => applyMode(m.id)}
                    className={classes(cl("pin"), current === m.id && cl("on"), showLabels && cl("labeled"))}
                    aria-label={m.label}
                />
            ))}
        </div>
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
    startAt: StartAt.TurbopackReady,

    start() {
        void ModesStore.useModesStore.getState().ensureLoaded();
    },

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
