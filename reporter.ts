import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { resolve } from "path";

import { canonicalizeFind, canonicalizeMatch, canonicalizeReplacement } from "./src/utils/patches";
import type { Patch, Plugin } from "./src/utils/types";

const CACHE_DIR = ".void-cache";
const GROK_URL = "https://grok.com";
const CHUNK_RE = /\/_next\/static\/chunks\/[^"'\s]+\.js/g;

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;

interface PatchResult {
    plugin: string;
    find: string;
    findOk: boolean;
    replacements: Array<{ match: string; ok: boolean; timeMs: number }>;
}

interface FinderResult {
    source: string;
    args: string;
    ok: boolean;
}

function getCachePath(buildId: string, filename: string): string {
    const dir = resolve(CACHE_DIR, buildId);
    mkdirSync(dir, { recursive: true });
    return resolve(dir, filename);
}

async function fetchCached(url: string, buildId: string, name: string): Promise<string> {
    const path = getCachePath(buildId, name);
    if (existsSync(path)) return readFileSync(path, "utf-8");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const text = await res.text();
    writeFileSync(path, text);
    return text;
}

function scanPluginDirs(): string[] {
    const pluginDir = resolve("src/plugins");
    const entries: string[] = [];
    for (const name of readdirSync(pluginDir)) {
        const dir = resolve(pluginDir, name);
        if (!statSync(dir).isDirectory()) continue;
        const indexTsx = resolve(dir, "index.tsx");
        const indexTs = resolve(dir, "index.ts");
        if (existsSync(indexTsx)) entries.push(indexTsx);
        else if (existsSync(indexTs)) entries.push(indexTs);
        for (const sub of readdirSync(dir).filter(s => statSync(resolve(dir, s)).isDirectory())) {
            const subTsx = resolve(dir, sub, "index.tsx");
            const subTs = resolve(dir, sub, "index.ts");
            if (existsSync(subTsx)) entries.push(subTsx);
            else if (existsSync(subTs)) entries.push(subTs);
        }
    }
    return entries;
}

function extractPatchesStatic(src: string, pluginName: string): Patch[] {
    const patchesIdx = src.indexOf("patches:");
    if (patchesIdx === -1) return [];

    const bracketStart = src.indexOf("[", patchesIdx);
    if (bracketStart === -1) return [];

    let depth = 0;
    let end = bracketStart;
    for (let i = bracketStart; i < src.length; i++) {
        if (src[i] === "[") depth++;
        else if (src[i] === "]" && --depth === 0) { end = i + 1; break; }
    }

    const block = src.slice(bracketStart, end);
    const patches: Patch[] = [];
    const findRe = /find:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|`((?:[^`\\]|\\.)*)`)/g;
    let fm: RegExpExecArray | null;

    while ((fm = findRe.exec(block)) !== null) {
        const findStr = (fm[1] ?? fm[2] ?? fm[3])?.replace(/\\"/g, '"') ?? "";
        if (!findStr) continue;

        const rawAfter = block.slice(fm.index, Math.min(fm.index + 3000, block.length));
        const nextFind = rawAfter.indexOf("find:", 10);
        const afterFind = nextFind > 0 ? rawAfter.slice(0, nextFind) : rawAfter;
        const replacements: Array<{ match: string | RegExp; replace: string }> = [];

        for (const rm of afterFind.matchAll(/match:\s*\/((?:[^/\\]|\\.)+)\/(\w*)/g)) {
            try { replacements.push({ match: new RegExp(rm[1], rm[2]), replace: "" }); } catch { /* invalid regex in static extraction */ }
        }
        for (const sm of afterFind.matchAll(/match:\s*"((?:[^"\\]|\\.)*)"/g)) {
            replacements.push({ match: sm[1], replace: "" });
        }

        if (!replacements.length) continue;

        const hasNoWarn = afterFind.includes("noWarn:") && /noWarn:\s*true/.test(afterFind);
        const patch: Patch = { plugin: pluginName, find: findStr, replacement: replacements, noWarn: hasNoWarn || undefined };
        canonicalizeFind(patch);
        const pluginPath = `Void.plugins[${JSON.stringify(pluginName)}]`;
        for (const rep of replacements) canonicalizeReplacement(rep, pluginPath);
        patches.push(patch);
    }

    return patches;
}

function collectPatches(): { patches: Patch[]; skipped: string[] } {
    const patches: Patch[] = [];
    const skipped: string[] = [];

    for (const entry of scanPluginDirs()) {
        const name = entry.replace(/\\/g, "/").match(/plugins\/([^/]+)/)?.[1] ?? entry;
        const src = readFileSync(entry, "utf-8");
        if (!src.includes("patches:")) continue;
        const pluginName = src.slice(src.indexOf("definePlugin(")).match(/name:\s*"([^"]+)"/)?.[1] ?? name;

        let extracted = false;
        try {
            const mod = require(entry);
            const plugin: Plugin = mod.default ?? mod;
            if (plugin?.patches) {
                for (const rawPatch of plugin.patches) {
                    const patch: Patch = { ...rawPatch, plugin: pluginName };
                    canonicalizeFind(patch);
                    const replacements = Array.isArray(patch.replacement) ? patch.replacement : [patch.replacement];
                    const pluginPath = `Void.plugins[${JSON.stringify(pluginName)}]`;
                    for (const rep of replacements) canonicalizeReplacement(rep, pluginPath);
                    patch.replacement = replacements;
                    patches.push(patch);
                }
                extracted = true;
            }
        } catch { /* require failed, try static extraction below */ }

        if (!extracted) {
            const staticPatches = extractPatchesStatic(src, pluginName);
            if (staticPatches.length) {
                patches.push(...staticPatches);
            } else {
                skipped.push(pluginName);
            }
        }
    }

    return { patches, skipped };
}

function collectFinders(allChunkText: string): FinderResult[] {
    const results: FinderResult[] = [];

    const checkProps = (source: string, args: string[]) => {
        const ok = args.every(arg => allChunkText.includes(`"${arg}"`) || allChunkText.includes(`.${arg}=`));
        results.push({ source, args: `findByProps(${args.map(a => `"${a}"`).join(", ")})`, ok });
    };

    const check = (source: string, file: string) => {
        const content = readFileSync(resolve(file), "utf-8");
        for (const m of content.matchAll(/findByProps(?:Lazy)?\(([^)]+)\)/g)) {
            const args = m[1].replace(/"/g, "").split(",").map(s => s.trim()).filter(Boolean);
            if (args.length && !args.some(a => a.startsWith("..."))) checkProps(source, args);
        }
        for (const m of content.matchAll(/filters\.byProps\(([^)]+)\)/g)) {
            const args = m[1].replace(/"/g, "").split(",").map(s => s.trim()).filter(Boolean);
            if (args.length && !args.some(a => a.startsWith("..."))) checkProps(source, args);
        }
        for (const m of content.matchAll(/findExportedComponent\("([^"]+)"\)/g)) {
            results.push({ source, args: `findExportedComponent("${m[1]}")`, ok: allChunkText.includes(`"${m[1]}"`) });
        }
    };

    check("stores", "src/turbopack/common/stores.ts");
    check("utils", "src/turbopack/common/utils.ts");
    check("components", "src/turbopack/common/components.ts");
    check("react", "src/turbopack/common/react.tsx");
    return results;
}

function testPatch(patch: Patch, chunks: string[]): PatchResult {
    const findStr = Array.isArray(patch.find) ? patch.find.map(String).join(" + ") : String(patch.find);
    const finds = Array.isArray(patch.find) ? patch.find : [patch.find];

    let findOk = false;
    let matchedChunk = "";
    for (const chunk of chunks) {
        if (finds.every(f => typeof f === "string" ? chunk.includes(f) : (f.lastIndex = 0, f.test(chunk)))) {
            findOk = true;
            matchedChunk = chunk;
            break;
        }
    }

    const replacements = Array.isArray(patch.replacement) ? patch.replacement : [patch.replacement];
    const repResults: PatchResult["replacements"] = [];
    for (const rep of replacements) {
        if (!findOk) { repResults.push({ match: String(rep.match), ok: false, timeMs: 0 }); continue; }
        try {
            const m = rep.match;
            const start = performance.now();
            let ok: boolean;
            if (typeof m === "string") ok = matchedChunk.includes(m);
            else { m.lastIndex = 0; ok = m.test(matchedChunk); }
            repResults.push({ match: String(m), ok, timeMs: performance.now() - start });
        } catch { repResults.push({ match: String(rep.match), ok: false, timeMs: 0 }); }
    }
    return { plugin: patch.plugin, find: findStr, findOk, replacements: repResults };
}

async function main() {
    console.log(bold("\nVoid Reporter\n"));

    console.log(dim("Fetching grok.com..."));
    const resp = await fetch(GROK_URL, { redirect: "follow" });
    if (!resp.ok) throw new Error(`Failed to fetch grok.com (HTTP ${resp.status})`);
    const html = await resp.text();
    const chunkPaths = [...new Set(html.match(CHUNK_RE) ?? [])];
    const buildId = html.match(/"buildId":"([^"]+)"/)?.[1]
        ?? chunkPaths.map(p => p.split("/").pop()!.replace(/\.js$/, "")).sort().join("").slice(0, 12)
        ?? "unknown";

    if (!chunkPaths.length) { console.error(red("No chunks found in HTML.")); process.exit(1); }

    console.log(dim(`Downloading ${chunkPaths.length} chunks (build: ${buildId})...`));
    mkdirSync(CACHE_DIR, { recursive: true });
    const chunks: string[] = [];
    for (let i = 0; i < chunkPaths.length; i += 10) {
        const batch = chunkPaths.slice(i, i + 10);
        chunks.push(...await Promise.all(batch.map(p => fetchCached(`${GROK_URL}${p}`, buildId, p.split("/").pop()!))));
    }

    const allChunkText = chunks.join("\n");
    console.log(dim(`Loaded ${chunks.length} chunks (${(allChunkText.length / 1024 / 1024).toFixed(1)} MB)`));

    console.log(dim("\nLoading patches..."));
    const { patches, skipped } = collectPatches();
    for (const s of skipped) console.log(yellow("SKIP") + ` ${dim(s)}`);

    const SLOW_THRESHOLD = 10;
    let patchPassed = 0;
    let patchFailed = 0;
    const slowPatches: Array<{ plugin: string; find: string; match: string; timeMs: number }> = [];
    for (const patch of patches) {
        const r = testPatch(patch, chunks);
        const allOk = r.findOk && r.replacements.every(rep => rep.ok);
        if (allOk) {
            patchPassed++;
        } else if (patch.noWarn) {
            patchPassed++;
            console.log(dim("SKIP") + ` ${dim(r.plugin + ":")} ${dim(r.find.slice(0, 70))} ${dim("(noWarn)")}`);
        } else {
            patchFailed++;
            console.log(red("FAIL") + ` ${bold(r.plugin + ":")} ${r.find.slice(0, 70)}`);
            if (!r.findOk) console.log(`     ${red("find matched 0 chunks")}`);
            else for (const rep of r.replacements) { if (!rep.ok) console.log(`     ${yellow("match failed:")} ${rep.match.slice(0, 80)}`); }
        }
        for (const rep of r.replacements) {
            if (rep.ok && rep.timeMs > SLOW_THRESHOLD)
                slowPatches.push({ plugin: r.plugin, find: r.find.slice(0, 60), match: rep.match.slice(0, 100), timeMs: rep.timeMs });
        }
    }

    const finders = collectFinders(allChunkText);
    let finderPassed = 0;
    let finderFailed = 0;
    for (const f of finders) {
        if (f.ok) finderPassed++;
        else { finderFailed++; console.log(red("FAIL") + ` ${bold(f.source + ":")} ${f.args}`); }
    }

    const sriCount = (html.match(/integrity="sha/g) ?? []).length;
    const rscCount = (allChunkText.match(/createServerReference\(/g) ?? []).length;

    if (slowPatches.length) {
        console.log(bold("\nSlow Patches:"));
        slowPatches.sort((a, b) => b.timeMs - a.timeMs);
        for (const s of slowPatches)
            console.log(yellow(`${s.timeMs.toFixed(1)}ms`) + ` ${bold(s.plugin + ":")} Find: ${dim(s.find)}\n     ${dim(s.match)}`);
    }

    console.log(bold("\nResults:"));
    console.log(`Patches: ${green(`${patchPassed} passed`)}, ${patchFailed ? red(`${patchFailed} failed`) : dim("0 failed")}${skipped.length ? `, ${yellow(`${skipped.length} skipped`)}` : ""}`);
    console.log(`Finders: ${green(`${finderPassed} passed`)}, ${finderFailed ? red(`${finderFailed} failed`) : dim("0 failed")}`);

    if (sriCount) console.log(yellow("WARN") + ` SRI detected on ${sriCount} script tag(s) — runtime patching may break`);
    else console.log(dim("SRI: not enforced"));

    console.log(dim(`RSC: ${rscCount} server reference(s) found`));
    console.log();

    if (patchFailed || finderFailed) process.exit(1);
}

main().catch(e => { console.error(red(`Reporter error: ${e.message}`)); process.exit(1); });
