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
import { ChatPageStore, ModesStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createExternalStore } from "@utils/misc";
import { useExternalStore } from "@utils/react";
import definePlugin, { OptionType, StartAt } from "@utils/types";

const logger = new Logger("CompactModeSelect");
const cl = classNameFactory("void-cms-");
const CHAT_POST = /\/rest\/app-chat\/conversations\/(?:new|[^/?#]+\/responses)(?:[/?#]|$)/;
const MODEL_MODES = new Set(["auto", "fast", "expert", "heavy"]);

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

const pendingStore = createExternalStore();
let pendingModeId: string | undefined;
let origFetch: typeof fetch | undefined;
let fetchHost: { fetch: typeof fetch } | undefined;
let unsubModes: (() => void) | undefined;

function setPending(id: string) {
    if (pendingModeId === id) return;
    pendingModeId = id;
    pendingStore.notify();
}

function syncUrl(id: string) {
    try {
        const url = new URL(location.href);
        if (url.searchParams.get("mode") === id) return;
        url.searchParams.set("mode", id);
        history.replaceState(history.state, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (e) {
        logger.warn("Failed to sync mode URL:", e);
    }
}

function applyNativeMode(id: string) {
    setPending(id);
    ModesStore.useModesStore.getState().setSelectedModeId(id);
    if (MODEL_MODES.has(id)) ChatPageStore.useChatPageStore.getState().setModelMode(id);
    syncUrl(id);
}

function rewriteBody(body: string, id: string): string | undefined {
    try {
        const payload = JSON.parse(body);
        if (payload == null || typeof payload !== "object" || Array.isArray(payload)) return;
        if (payload.modeId === id) return;
        payload.modeId = id;
        return JSON.stringify(payload);
    } catch (e) {
        logger.warn("Failed to rewrite chat payload:", e);
    }
}

function requestUrl(input: RequestInfo | URL): string {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.href;
    return input.url;
}

function patchedFetch(this: unknown, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const fetchFn = origFetch;
    const id = pendingModeId;
    if (!id || !fetchFn) return (fetchFn ?? fetch).call(this, input, init);

    const url = requestUrl(input);
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    if (method !== "POST" || !CHAT_POST.test(url)) return fetchFn.call(this, input, init);

    const raw = init?.body;
    if (typeof raw === "string") {
        const next = rewriteBody(raw, id);
        return next == null ? fetchFn.call(this, input, init) : fetchFn.call(this, input, { ...init, body: next });
    }

    if (input instanceof Request && init?.body == null) {
        return input.clone().text().then(text => {
            const next = rewriteBody(text, id);
            if (next == null) return fetchFn.call(this, input, init);
            return fetchFn.call(this, new Request(input, { body: next, method: "POST" }), init);
        });
    }

    return fetchFn.call(this, input, init);
}

function hookFetch() {
    const page = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    origFetch = page.fetch;
    fetchHost = page;
    page.fetch = patchedFetch as typeof fetch;
}

function unhookFetch() {
    if (origFetch && fetchHost) fetchHost.fetch = origFetch;
    origFetch = undefined;
    fetchHost = undefined;
}

function PinnedModes() {
    useExternalStore(pendingStore);
    const cfg = settings.use([...SETTING_KEYS]);
    const selectedModeId = ModesStore.useModesStore((s: ModesStoreState) => s.selectedModeId);
    const catalog = ModesStore.useModesStore((s: ModesStoreState) => s.modes);
    const current = pendingModeId ?? selectedModeId;
    const knownCatalog = catalog.filter(c => KNOWN_IDS.has(c.id));
    const items = MODES.filter(m => cfg[m.pin] && (m.id === "build" || !knownCatalog.length || knownCatalog.some(c => c.id === m.id)));
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
                    onClick={() => applyNativeMode(m.id)}
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
        const modes = ModesStore.useModesStore.getState();
        void modes.ensureLoaded();
        if (modes.selectedModeId) setPending(modes.selectedModeId);
        unsubModes = ModesStore.useModesStore.subscribe((s: ModesStoreState) => {
            if (s.selectedModeId) setPending(s.selectedModeId);
        });
        hookFetch();
    },

    stop() {
        unsubModes?.();
        unsubModes = undefined;
        unhookFetch();
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
