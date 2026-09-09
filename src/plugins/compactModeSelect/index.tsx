/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import { ChatBarButton } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { ConnectedAppsIcon, HammerIcon, LightbulbIcon, Minimize2Icon, RocketIcon, ZapIcon } from "@components/icons";
import type { ModesStoreState } from "@grok-types/stores/ModesStore";
import { React } from "@turbopack/common/react";
import { ModesStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType, StartAt } from "@utils/types";
import type { MouseEvent } from "react";

const logger = new Logger("CompactModeSelect");
const cl = classNameFactory("void-cms-");

const MODES = [
    { id: "auto", pin: "pinAuto", label: "Auto", Icon: RocketIcon },
    { id: "fast", pin: "pinFast", label: "Fast", Icon: ZapIcon },
    { id: "expert", pin: "pinExpert", label: "Expert", Icon: LightbulbIcon },
    { id: "heavy", pin: "pinHeavy", label: "Heavy", Icon: ConnectedAppsIcon },
    { id: "build", pin: "pinBuild", label: "Build", Icon: HammerIcon },
] as const;

const KNOWN_IDS = new Set<string>(MODES.map(m => m.id));
const PIN_BY_ID: Record<string, (typeof MODES)[number]["pin"]> = Object.fromEntries(MODES.map(m => [m.id, m.pin]));
const SETTING_KEYS = ["pinAuto", "pinFast", "pinExpert", "pinHeavy", "pinBuild", "showLabels"] as const;

const ITEM_SEL = "[role='menuitem'], [role='option'], [data-radix-collection-item]";
const MENU_ROOT_SEL = "[data-radix-popper-content-wrapper], [data-radix-menu-content], [role='menu'], [role='listbox']";
const TRIGGER_SEL = ".query-bar [data-query-bar-mode-select] button";
const PICK_MS = 900;
const POINTER: PointerEventInit = { bubbles: true, cancelable: true, pointerId: 1, pointerType: "mouse", button: 0 };

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

let picking = false;
let harvesting = false;
const harvested = new Map<string, string>();
const harvestListeners = new Set<() => void>();

function setPicking(on: boolean) {
    picking = on;
    document.documentElement.classList.toggle("void-cms-picking", on);
}

function notifyHarvest() {
    for (const fn of harvestListeners) fn();
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
    return titlesFor(id).some(t => hay === t || hay.startsWith(`${t} `));
}

function isModeMenu(items: HTMLElement[]) {
    return items.filter(el => MODES.some(m => matchItem(el, m.id))).length >= 2;
}

function menuItems(): HTMLElement[] {
    for (const root of document.querySelectorAll(MENU_ROOT_SEL)) {
        const items = [...root.querySelectorAll<HTMLElement>(ITEM_SEL)];
        if (isModeMenu(items)) return items;
    }
    return [];
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
    el.dispatchEvent(new PointerEvent("pointerdown", POINTER));
    el.dispatchEvent(new PointerEvent("pointerup", POINTER));
    el.click();
}

function paintCurrent(el: Element) {
    for (const attr of ["fill", "stroke"]) {
        const v = el.getAttribute(attr);
        if (!v || v === "none" || v === "currentColor") continue;
        el.setAttribute(attr, "currentColor");
    }
    for (const name of el.getAttributeNames()) {
        if (name.startsWith("on")) el.removeAttribute(name);
    }
    el.removeAttribute("class");
}

function normalizeSvg(src: SVGSVGElement) {
    const svg = src.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("width", "18");
    svg.setAttribute("height", "18");
    svg.setAttribute("aria-hidden", "true");
    svg.querySelectorAll("script").forEach(n => n.remove());
    paintCurrent(svg);
    svg.querySelectorAll("*").forEach(paintCurrent);
    return svg.outerHTML;
}

function stashGlyphs(items: HTMLElement[]) {
    let added = false;
    for (const item of items) {
        const mode = MODES.find(m => matchItem(item, m.id));
        if (!mode || harvested.has(mode.id)) continue;
        const svg = item.querySelector("svg");
        if (!(svg instanceof SVGSVGElement)) continue;
        harvested.set(mode.id, normalizeSvg(svg));
        added = true;
    }
    if (added) notifyHarvest();
}

async function harvestIcons() {
    if (harvesting || picking || harvested.size > 0) return;
    const trigger = nativeTrigger();
    if (!trigger) return;
    harvesting = true;
    setPicking(true);
    try {
        let items = menuItems();
        if (!items.length) {
            clickEl(trigger);
            items = await waitForItems();
        }
        stashGlyphs(items);
        if (menuItems().length) clickEl(trigger);
    } catch (e) {
        logger.warn("Failed to harvest mode icons:", e);
    } finally {
        setPicking(false);
        harvesting = false;
    }
}

async function selectMode(id: string) {
    if (picking) return;
    setPicking(true);
    try {
        await ModesStore.useModesStore.getState().ensureLoaded();

        let items = menuItems();
        if (!items.length) {
            const trigger = nativeTrigger();
            if (!trigger) {
                logger.warn("Native mode selector not found");
                return;
            }
            clickEl(trigger);
            items = await waitForItems();
        }

        stashGlyphs(items);
        const item = items.find(el => matchItem(el, id));
        if (!item) {
            logger.warn("Native mode item not found:", id);
            const open = menuItems();
            const trigger = nativeTrigger();
            if (open.length && trigger) clickEl(trigger);
            return;
        }
        clickEl(item);
    } catch (e) {
        logger.warn("Failed to select mode:", e);
    } finally {
        setPicking(false);
    }
}

function useNativeGlyph(id: string) {
    const [, bump] = React.useState(0);
    React.useEffect(() => {
        const onHarvest = () => bump(n => n + 1);
        harvestListeners.add(onHarvest);
        void harvestIcons();
        return () => {
            harvestListeners.delete(onHarvest);
        };
    }, [id]);
    return harvested.get(id);
}

function PinGlyph({ id, Icon, label, showLabels }: {
    id: string;
    Icon: (typeof MODES)[number]["Icon"];
    label: string;
    showLabels: boolean;
}) {
    const html = useNativeGlyph(id);
    const glyph = html
        ? <span className={cl("glyph")} dangerouslySetInnerHTML={{ __html: html }} />
        : <Icon size={18} />;
    if (!showLabels) return glyph;
    return (
        <>
            {glyph}
            <span className={cl("label")}>{label}</span>
        </>
    );
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
                    icon={<PinGlyph id={m.id} Icon={m.Icon} label={m.label} showLabels={showLabels} />}
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
        setPicking(false);
        harvested.clear();
        harvestListeners.clear();
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
