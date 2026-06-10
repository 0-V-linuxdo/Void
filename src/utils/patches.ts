/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { Patch, PatchReplacement, ReplaceFn } from "./types";

const iToken = "(?:[A-Za-z_$][\\w$]*)";

export function canonicalizeMatch<T extends RegExp | string>(match: T): T {
    const isString = typeof match === "string";
    let canonSource = isString ? match : match.source;

    canonSource = canonSource.replaceAll(/#{i18n::([^}]+)}/g, (_, key: string) => (isString ? `"${key}"` : `"${key.replaceAll(".", "\\.")}"`));

    if (!isString) {
        canonSource = canonSource.replaceAll(/(\\*)\\i/g, (_m, leadingEscapes: string) => (leadingEscapes.length % 2 === 0 ? `${leadingEscapes}${iToken}` : `${leadingEscapes}\\i`));

        canonSource = canonSource.replaceAll(/\\e\{(\w+)\}/g, (_, name) => `["']${name}["'],(?:\\d+,|\\(\\)=>${iToken})`);
    }

    if (canonSource === (isString ? match : (match as RegExp).source)) return match;
    if (isString) return canonSource as T;

    const re = match as RegExp;
    const canonRegex = new RegExp(canonSource, re.flags);
    canonRegex.toString = re.toString.bind(re);
    return canonRegex as T;
}

export function canonicalizeReplace<T extends string | ReplaceFn>(replace: T, pluginPath: string): T {
    if (typeof replace !== "function") return replace.replaceAll("$self", pluginPath) as T;

    return ((match: string, ...groups: string[]) => replace(match, ...groups).replaceAll("$self", pluginPath)) as ReplaceFn as T;
}

export function canonicalizeReplacement(replacement: Pick<PatchReplacement, "match" | "replace">, pluginPath: string) {
    replacement.match = canonicalizeMatch(replacement.match);
    replacement.replace = canonicalizeReplace(replacement.replace, pluginPath);
}

export function canonicalizeFind(patch: Patch) {
    patch.find = Array.isArray(patch.find)
        ? patch.find.map(f => canonicalizeMatch(f))
        : canonicalizeMatch(patch.find);
}

export function countCaptureGroups(matchStr: string): number {
    let count = 0;
    let inCharClass = false;
    for (let i = 0; i < matchStr.length; i++) {
        if (matchStr[i] === "\\" && i + 1 < matchStr.length) {
            i++;
            continue;
        }
        if (inCharClass) {
            if (matchStr[i] === "]") inCharClass = false;
            continue;
        }
        if (matchStr[i] === "[") {
            inCharClass = true;
            continue;
        }
        if (matchStr[i] === "(") {
            if (matchStr[i + 1] !== "?") count++;
            else if (matchStr[i + 2] === "<" && matchStr[i + 3] !== "!" && matchStr[i + 3] !== "=") count++;
        }
    }
    return count;
}
