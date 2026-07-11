/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { skipBalanced, skipTrivia } from "./ast";

const CACHE_DIR = ".void-cache";
const CHUNK_RE = /(?:\/_next\/)?static\/chunks\/[^"'\s)`<>]+\.js/g;
const BUILD_ID_RE = /"buildId":"([^"]+)"/;

export interface Chunk {
    path: string;
    name: string;
    source: string;
}

export interface ModuleEntry {
    id: number;
    factory: string;
    chunkName: string;
}

export interface ChunkMap {
    origin: string;
    buildId: string;
    chunks: Map<string, Chunk>;
    modules: Map<number, ModuleEntry>;
    moduleOffsets: Map<number, { chunkName: string; offset: number }>;
    html: string;
}

function normalizeChunkPath(raw: string): string {
    return raw.startsWith("/_next/") ? raw : `/_next/${raw.replace(/^\/*/, "")}`;
}

function cachePath(buildId: string, name: string): string {
    const dir = resolve(CACHE_DIR, buildId);
    mkdirSync(dir, { recursive: true });
    return resolve(dir, name);
}

async function fetchCached(url: string, buildId: string, name: string): Promise<string | null> {
    const p = cachePath(buildId, name);
    if (existsSync(p)) return readFileSync(p, "utf-8");
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    writeFileSync(p, text);
    return text;
}

async function fetchMany(origin: string, paths: string[], buildId: string, concurrency = 16): Promise<Map<string, string>> {
    const out = new Map<string, string>();
    let cursor = 0;
    const worker = async (): Promise<void> => {
        while (cursor < paths.length) {
            const p = paths[cursor++];
            const name = p.split("/").pop()!;
            const src = await fetchCached(`${origin}${p}`, buildId, name);
            if (src != null) out.set(p, src);
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, paths.length) }, worker));
    return out;
}

async function crawlChunks(origin: string, initial: string[], buildId: string, onProgress: (current: number, total: number) => void): Promise<Map<string, string>> {
    const seen = new Set<string>();
    const queue: string[] = [];
    for (const p of initial) if (!seen.has(p)) { seen.add(p); queue.push(p); }
    const sources = new Map<string, string>();

    while (queue.length) {
        const batch = queue.splice(0, 24);
        const fetched = await fetchMany(origin, batch, buildId);
        for (const [p, src] of fetched) {
            sources.set(p, src);
            for (const m of src.matchAll(CHUNK_RE)) {
                const ref = normalizeChunkPath(m[0]);
                if (!seen.has(ref)) { seen.add(ref); queue.push(ref); }
            }
        }
        onProgress(sources.size, seen.size);
    }
    return sources;
}

async function tryFetchManifests(origin: string, buildId: string): Promise<string[]> {
    const out = new Set<string>();
    for (const name of ["_buildManifest.js", "_ssgManifest.js", "_app-build-manifest.json"]) {
        const url = `${origin}/_next/static/${buildId}/${name}`;
        try {
            const res = await fetch(url);
            if (!res.ok) continue;
            const text = await res.text();
            for (const m of text.matchAll(CHUNK_RE)) out.add(normalizeChunkPath(m[0]));
            for (const m of text.matchAll(/"(?:static\/chunks\/)?([\w-]+\.js)"/g)) {
                if (m[1].includes("chunks/") || /^[0-9a-f]{8,}/.test(m[1])) out.add(`/_next/static/chunks/${m[1].replace(/^static\/chunks\//, "")}`);
            }
        } catch {
            continue;
        }
    }
    return [...out];
}

export function parseModulesFromChunk(src: string): Array<{ id: number; offset: number; length: number }> {
    const out: Array<{ id: number; offset: number; length: number }> = [];
    const pushIdx = src.indexOf(".push([");
    if (pushIdx === -1) return out;
    const arrayStart = src.indexOf("[", pushIdx);
    if (arrayStart === -1) return out;
    const arrayEnd = skipBalanced(src, arrayStart, "[", "]");
    if (arrayEnd === src.length) return out;

    let i = skipToTopLevelComma(src, arrayStart + 1, arrayEnd);
    while (i < arrayEnd) {
        if (src[i] === ",") i++;
        while (i < arrayEnd && /\s/.test(src[i])) i++;
        if (i >= arrayEnd) break;

        const ids: number[] = [];
        while (i < arrayEnd && /[0-9]/.test(src[i])) {
            const idStart = i;
            while (i < arrayEnd && /[0-9]/.test(src[i])) i++;
            if ((src[i] === "e" || src[i] === "E") && /[0-9]/.test(src[i + 1])) {
                i++;
                while (i < arrayEnd && /[0-9]/.test(src[i])) i++;
            }
            ids.push(Number(src.slice(idStart, i)));
            let lookahead = i;
            while (lookahead < arrayEnd && /\s/.test(src[lookahead])) lookahead++;
            if (src[lookahead] !== ",") break;
            let peek = lookahead + 1;
            while (peek < arrayEnd && /\s/.test(src[peek])) peek++;
            if (/[0-9]/.test(src[peek])) { i = peek; continue; }
            i = peek;
            break;
        }
        if (!ids.length) break;

        while (i < arrayEnd && /\s/.test(src[i])) i++;
        const factoryStart = i;
        const factoryEnd = skipToTopLevelComma(src, factoryStart, arrayEnd);
        if (factoryEnd > factoryStart) {
            for (const id of ids) out.push({ id, offset: factoryStart, length: factoryEnd - factoryStart });
        }
        i = factoryEnd;
    }
    return out;
}

function skipToTopLevelComma(src: string, start: number, end: number): number {
    let i = start;
    let depth = 0;
    while (i < end) {
        const before = i;
        const after = skipTrivia(src, i);
        if (after !== before) { i = after; continue; }
        const c = src[i];
        if (c === "(" || c === "{" || c === "[") depth++;
        else if (c === ")" || c === "}" || c === "]") {
            depth--;
            if (depth < 0) return i;
        } else if (c === "," && depth === 0) return i;
        i++;
    }
    return end;
}

export async function loadChunkMap(origin: string, onPhase: (name: string, current?: number, total?: number) => void): Promise<ChunkMap> {
    onPhase("html");
    const res = await fetch(origin, { redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${origin}`);
    const html = await res.text();

    const initial = [...new Set((html.match(CHUNK_RE) ?? []).map(normalizeChunkPath))];
    const buildId = html.match(BUILD_ID_RE)?.[1]
        ?? initial.map(p => p.split("/").pop()!.replace(/\.js$/, "")).sort().join("").slice(0, 12)
        ?? "unknown";

    onPhase("manifests");
    const manifestPaths = await tryFetchManifests(origin, buildId);
    const allInitial = [...new Set([...initial, ...manifestPaths])];

    onPhase("crawl", 0, allInitial.length);
    const sources = await crawlChunks(origin, allInitial, buildId, (cur, total) => onPhase("crawl", cur, total));

    const chunks = new Map<string, Chunk>();
    const modules = new Map<number, ModuleEntry>();
    const moduleOffsets = new Map<number, { chunkName: string; offset: number }>();

    onPhase("parse", 0, sources.size);
    let parsed = 0;
    for (const [path, source] of sources) {
        const name = path.split("/").pop()!.replace(/\.js$/, "");
        chunks.set(name, { path, name, source });
        for (const { id, offset, length } of parseModulesFromChunk(source)) {
            if (!modules.has(id)) {
                modules.set(id, { id, factory: source.slice(offset, offset + length), chunkName: name });
                moduleOffsets.set(id, { chunkName: name, offset });
            }
        }
        parsed++;
        if (parsed % 50 === 0) onPhase("parse", parsed, sources.size);
    }
    onPhase("parse", sources.size, sources.size);

    return { origin, buildId, chunks, modules, moduleOffsets, html };
}

export function chunkStats(map: ChunkMap): { chunks: number; modules: number; bytes: number } {
    let bytes = 0;
    for (const c of map.chunks.values()) bytes += c.source.length;
    return { chunks: map.chunks.size, modules: map.modules.size, bytes };
}
