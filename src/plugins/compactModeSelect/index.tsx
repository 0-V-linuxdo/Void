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
import type { ModesStoreState } from "@grok-types/stores/ModesStore";
import { React } from "@turbopack/common/react";
import { ModesStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";
import type { ComponentType, MouseEvent } from "react";

const logger = new Logger("CompactModeSelect");
const cl = classNameFactory("void-cms-");

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

const ITEM_SEL = "[role='menuitem'], [role='option'], [data-radix-collection-item]";
const TRIGGER_SEL = ".query-bar [data-query-bar-mode-select] button";
const PICK_MS = 900;

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

const nativeHandlers = new Map<string, () => void>();
let picking = false;

function setPicking(on: boolean) {
    picking = on;
    document.documentElement.classList.toggle("void-cms-picking", on);
}

function itemText(el: Element) {
    return `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`.replaceAll(/\s+/g, " ").trim().toLowerCase();
}

function titlesFor(id: string) {
    const mode = MODES.find(m => m.id === id);
    const catalogTitle = ModesStore.useModesStore.getState().modes.find(m => m.id === id)?.title;
    return [catalogTitle, mode?.label, id].filter((t): t is string => !!t).map(t => t.toLowerCase());
}

function matchItem(el: Element, id: string) {
    const hay = itemText(el);
    if (!hay) return false;
    return titlesFor(id).some(t => hay === t || hay.startsWith(`${t} `) || hay.includes(t));
}

type FiberNode = {
    memoizedProps?: { onClick?: unknown; onSelect?: unknown; };
    pendingProps?: { onClick?: unknown; onSelect?: unknown; };
    return?: FiberNode;
};

function fiberHandler(node: Element): (() => void) | undefined {
    const propsKey = Object.keys(node).find(k => k.startsWith("__reactProps$"));
    if (propsKey) {
        const props = (node as unknown as Record<string, FiberNode["memoizedProps"]>)[propsKey];
        if (typeof props?.onClick === "function") return props.onClick as () => void;
        if (typeof props?.onSelect === "function") return props.onSelect as () => void;
    }

    const fiberKey = Object.keys(node).find(k => k.startsWith("__reactFiber$"));
    let fiber = fiberKey ? (node as unknown as Record<string, FiberNode>)[fiberKey] : undefined;

    for (let i = 0; i < 8 && fiber; i++) {
        const props = fiber.memoizedProps ?? fiber.pendingProps;
        if (typeof props?.onClick === "function") return props.onClick as () => void;
        if (typeof props?.onSelect === "function") return props.onSelect as () => void;
        fiber = fiber.return;
    }

    return;
}

function harvest(items: HTMLElement[]) {
    for (const el of items) {
        const mode = MODES.find(m => matchItem(el, m.id));
        if (!mode) continue;
        const fn = fiberHandler(el);
        if (fn) nativeHandlers.set(mode.id, fn);
    }
}

function menuItems() {
    return [...document.querySelectorAll<HTMLElement>(ITEM_SEL)];
}

function waitForItems() {
    const start = performance.now();
    return new Promise<HTMLElement[]>(resolve => {
        const tick = () => {
            const items = menuItems();
            if (items.length) {
                resolve(items);
                return;
            }
            if (performance.now() - start > PICK_MS) {
                resolve([]);
                return;
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

function nativeTrigger() {
    return document.querySelector<HTMLButtonElement>(TRIGGER_SEL);
}

function clickEl(el: HTMLElement) {
    const opts: PointerEventInit = { bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", button: 0 };
    el.dispatchEvent(new PointerEvent("pointerdown", opts));
    el.dispatchEvent(new PointerEvent("pointerup", opts));
    el.click();
}

async function clickNativeItem(id: string) {
    const trigger = nativeTrigger();
    if (!trigger) {
        logger.warn("Native mode selector not found");
        return;
    }

    setPicking(true);
    try {
        let items = menuItems();
        if (!items.length) {
            clickEl(trigger);
            items = await waitForItems();
        }
        harvest(items);

        const item = items.find(el => matchItem(el, id));
        if (!item) {
            logger.warn("Native mode item not found:", id);
            if (menuItems().length) clickEl(trigger);
            return;
        }
        clickEl(item);
    } finally {
        setPicking(false);
    }
}

async function selectMode(id: string) {
    if (picking) return;
    await ModesStore.useModesStore.getState().ensureLoaded();

    const cached = nativeHandlers.get(id);
    if (cached) {
        try {
            cached();
            return;
        } catch (e) {
            logger.warn("Native handler failed, opening menu:", e);
            nativeHandlers.delete(id);
        }
    }

    await clickNativeItem(id);
}

function wrapModeSelect(ModeSelect: ComponentType<Record<string, unknown>>) {
    function VoidModeSelect(props: Record<string, unknown>) {
        return React.createElement(ModeSelect, props);
    }
    VoidModeSelect.displayName = "VoidModeSelect";
    return VoidModeSelect;
}

function PinnedModes() {
    const cfg = settings.use([...SETTING_KEYS]);
    const selectedModeId = ModesStore.useModesStore((s: ModesStoreState) => s.selectedModeId);
    const catalog = ModesStore.useModesStore((s: ModesStoreState) => s.modes);
    const knownCatalog = catalog.filter(c => KNOWN_IDS.has(c.id));
    const items = MODES.filter(m => cfg[m.pin] && (m.id === "build" || !knownCatalog.length || knownCatalog.some(c => c.id === m.id)));
    if (!items.length) return null;

    const { showLabels } = cfg;
    const allCovered = knownCatalog.length > 0 && knownCatalog.every(c => cfg[PIN_BY_ID[c.id]]);

    const onPin = (id: string) => (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        void selectMode(id);
    };

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
                    onClick={onPin(m.id)}
                    className={classes(cl("pin"), selectedModeId === m.id && cl("on"), showLabels && cl("labeled"))}
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

    stop() {
        nativeHandlers.clear();
        setPicking(false);
    },

    wrapModeSelect,
    renderPinned: ErrorBoundary.wrap(PinnedModes),

    patches: [
        {
            find: "data-query-bar-mode-select",
            all: true,
            group: true,
            replacement: [
                {
                    match: /ModeSelect,\{compact:\i\|\|\i,/,
                    replace: "$self.wrapModeSelect(ModeSelect),{compact:!0,",
                },
                {
                    match: /\},"mode-select"\),/,
                    replace: "$&$self.renderPinned(),",
                },
            ],
        },
    ],
});
