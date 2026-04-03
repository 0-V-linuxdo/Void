/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "./Logger";

const logger = new Logger("Styles", "#a6d189");

const styleRegistry = new Map<string, string>();
const activeStyles = new Map<string, HTMLStyleElement>();
let container: HTMLElement | null = null;
let pendingStyles: Array<[string, string]> = [];

function getContainer(): HTMLElement | null {
    if (container?.isConnected) return container;
    if (!document.head) return null;

    const wasDisconnected = container != null;
    container = document.createElement("void-styles") as HTMLElement;
    document.head.appendChild(container);

    if (wasDisconnected) {
        for (const [name, el] of activeStyles) {
            if (!el.isConnected) {
                const css = styleRegistry.get(name);
                if (css) {
                    const fresh = document.createElement("style");
                    fresh.dataset.void = name;
                    fresh.textContent = css;
                    fresh.disabled = el.disabled;
                    container.appendChild(fresh);
                    activeStyles.set(name, fresh);
                }
            }
        }
    }

    return container;
}

function flushPending() {
    const root = getContainer();
    if (!root) return;

    for (const [name, css] of pendingStyles) {
        inject(root, name, css);
    }
    pendingStyles = [];
}

function inject(root: HTMLElement, name: string, css: string) {
    const existing = activeStyles.get(name);
    if (existing) {
        if (existing.textContent !== css) existing.textContent = css;
        return;
    }

    const el = document.createElement("style");
    el.dataset.void = name;
    el.textContent = css;
    root.appendChild(el);
    activeStyles.set(name, el);
}

export function registerStyle(name: string, css: string) {
    styleRegistry.set(name, css);

    const root = getContainer();
    if (root) {
        inject(root, name, css);
    } else {
        pendingStyles.push([name, css]);
        if (pendingStyles.length === 1) {
            if (document.readyState === "loading") {
                document.addEventListener("DOMContentLoaded", flushPending, { once: true });
            } else {
                flushPending();
            }
        }
    }
}

export function enableStyle(name: string) {
    const existing = activeStyles.get(name);
    if (existing) {
        if (existing.disabled) {
            existing.disabled = false;
            return true;
        }
        return false;
    }

    const css = styleRegistry.get(name);
    if (!css) {
        logger.warn(`Style "${name}" not registered.`);
        return false;
    }

    const root = getContainer();
    if (!root) return false;

    inject(root, name, css);
    return true;
}

export function disableStyle(name: string) {
    const el = activeStyles.get(name);
    if (!el) return false;

    el.disabled = true;
    return true;
}

export function unregisterStyle(name: string) {
    activeStyles.get(name)?.remove();
    activeStyles.delete(name);
    styleRegistry.delete(name);
}

export type ClassNameFactoryArg = string | string[] | Record<string, unknown> | false | null | undefined | 0 | "";

export const classNameFactory =
    (prefix = "") =>
    (...args: ClassNameFactoryArg[]) => {
        if (args.length === 1 && typeof args[0] === "string") return prefix + args[0];
        const classNames = new Set<string>();
        for (const arg of args) {
            if (typeof arg === "string") classNames.add(arg);
            else if (Array.isArray(arg)) { for (const name of arg) classNames.add(name); }
            else if (arg && typeof arg === "object") { for (const [name, value] of Object.entries(arg)) { if (value) classNames.add(name); } }
        }
        return Array.from(classNames, name => prefix + name).join(" ");
    };

export function classes(...names: Array<string | false | null | undefined>): string {
    return names.filter(Boolean).join(" ");
}
