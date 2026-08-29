/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ScrollTextIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { registerStyle, unregisterStyle } from "@utils/css";
import definePlugin from "@utils/types";

const STYLE_NAME = "themedScrollbar";
const FRAME_STYLE_ID = "void-themed-scrollbar";
const MSG = "void-themed-scrollbar";
const MSG_HELLO = "void-themed-scrollbar-hello";

const SCROLLER = '[class*="pane-card"] :is([class*="overflow-auto"],[class*="overflow-y-auto"],[class*="overflow-scroll"],[class*="overflow-y-scroll"])';
const IFRAME_SEL = 'iframe[title="Preview"], [class*="pane-card"] iframe';

const THUMB = "hsl(var(--border-l2))";
const THUMB_HOVER = "hsl(var(--fg-tertiary))";
const TRACK = "hsl(var(--surface-l1))";

const CSS = `
${SCROLLER} {
    scrollbar-width: thin !important;
    scrollbar-color: ${THUMB} ${TRACK} !important;
}

${SCROLLER}::-webkit-scrollbar {
    width: 0.5rem !important;
    height: 0.5rem !important;
}

${SCROLLER}::-webkit-scrollbar-track,
${SCROLLER}::-webkit-scrollbar-corner {
    background: ${TRACK} !important;
}

${SCROLLER}::-webkit-scrollbar-thumb {
    background-color: ${THUMB} !important;
    background-clip: padding-box !important;
    border: 0.125rem solid transparent !important;
    border-radius: 999px !important;
}

${SCROLLER}::-webkit-scrollbar-thumb:hover {
    background-color: ${THUMB_HOVER} !important;
}
`;

let domObs: MutationObserver | null = null;
let themeObs: MutationObserver | null = null;
const hooked = new WeakSet<HTMLIFrameElement>();

export function isGrokPreviewFrame() {
    const host = location.hostname;
    return host === "grok-sandbox.com" || host.endsWith(".grok-sandbox.com");
}

function isDark() {
    const html = document.documentElement;
    const tokens = `${html.className} ${document.body?.className ?? ""} ${html.getAttribute("data-theme") ?? ""} ${html.getAttribute("data-color-scheme") ?? ""}`.toLowerCase();
    return html.classList.contains("dark") || html.getAttribute("data-theme") === "dark" || /(^|[\s_-])(dark|night)([\s_-]|$)/.test(tokens);
}

function frameCss(dark: boolean) {
    const thumb = dark ? "#4a4a52" : "#c4c4cc";
    const track = dark ? "#141416" : "#f4f4f5";
    const hover = dark ? "#9a9aa3" : "#8a8a94";
    return `html,body{scrollbar-width:thin!important;scrollbar-color:${thumb} ${track}!important}`
        + "html::-webkit-scrollbar,body::-webkit-scrollbar{width:.5rem!important;height:.5rem!important}"
        + `html::-webkit-scrollbar-track,body::-webkit-scrollbar-track,html::-webkit-scrollbar-corner,body::-webkit-scrollbar-corner{background:${track}!important}`
        + `html::-webkit-scrollbar-thumb,body::-webkit-scrollbar-thumb{background-color:${thumb}!important;background-clip:padding-box!important;border:.125rem solid transparent!important;border-radius:999px!important}`
        + `html::-webkit-scrollbar-thumb:hover,body::-webkit-scrollbar-thumb:hover{background-color:${hover}!important}`;
}

export function applyToDocument(doc: Document, dark: boolean) {
    let el = doc.getElementById(FRAME_STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = doc.createElement("style");
        el.id = FRAME_STYLE_ID;
        (doc.head ?? doc.documentElement).appendChild(el);
    }
    el.textContent = frameCss(dark);
}

export function bootstrapPreviewFrame() {
    applyToDocument(document, matchMedia("(prefers-color-scheme: dark)").matches);
    window.addEventListener("message", onFrameMessage);
    try {
        window.parent.postMessage({ type: MSG_HELLO }, "*");
    } catch {
        void 0;
    }
}

function onFrameMessage(event: MessageEvent) {
    const { data } = event;
    if (!data || data.type !== MSG) return;
    applyToDocument(document, data.dark === true);
}

function paintIframe(iframe: HTMLIFrameElement) {
    const dark = isDark();
    try {
        const doc = iframe.contentDocument;
        if (doc) applyToDocument(doc, dark);
    } catch {
        void 0;
    }
    try {
        iframe.contentWindow?.postMessage({ type: MSG, dark }, "*");
    } catch {
        void 0;
    }
}

function hookIframe(iframe: HTMLIFrameElement) {
    paintIframe(iframe);
    if (hooked.has(iframe)) return;
    hooked.add(iframe);
    iframe.addEventListener("load", () => paintIframe(iframe));
}

function scanIframes() {
    document.querySelectorAll<HTMLIFrameElement>(IFRAME_SEL).forEach(hookIframe);
}

function onParentMessage(event: MessageEvent) {
    const { data } = event;
    if (!data || data.type !== MSG_HELLO) return;
    const src = event.source as Window | null;
    if (!src) return;
    try {
        src.postMessage({ type: MSG, dark: isDark() }, event.origin === "null" ? "*" : event.origin);
    } catch {
        src.postMessage({ type: MSG, dark: isDark() }, "*");
    }
}

function startParent() {
    registerStyle(STYLE_NAME, CSS);
    scanIframes();
    window.addEventListener("message", onParentMessage);
    domObs = new MutationObserver(scanIframes);
    domObs.observe(document.documentElement, { childList: true, subtree: true });
    themeObs = new MutationObserver(scanIframes);
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-color-scheme"] });
}

function stopParent() {
    unregisterStyle(STYLE_NAME);
    window.removeEventListener("message", onParentMessage);
    domObs?.disconnect();
    themeObs?.disconnect();
    domObs = null;
    themeObs = null;
}

export default definePlugin({
    name: "ThemedScrollbar",
    icon: ScrollTextIcon,
    description: "Makes the project pane scrollbar follow Grok's dark and light theme.",
    authors: [Devs.p],
    tags: ["ui"],
    enabledByDefault: true,

    start() {
        startParent();
    },

    stop() {
        stopParent();
    },
});
