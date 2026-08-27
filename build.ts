import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "fs";
import { basename, dirname, resolve } from "path";

import { Logger } from "./src/utils/Logger";

const isDev = process.argv.includes("--dev");
const isWatch = process.argv.includes("--watch");

const logger = new Logger("Build", "#89b4fa");
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const repoUrl: string = pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, "");
const repoRawUrl = repoUrl.replace("github.com", "raw.githubusercontent.com");

const environment = isDev ? "Development" : "Production";

const FORK_URL = "https://github.com/0-V-linuxdo/Void";
const FORK_RAW_URL = "https://raw.githubusercontent.com/0-V-linuxdo/Void/Void%2B%2B";
const iso = new Date().toISOString();
const VERSION_DATE = `${iso.slice(0, 4)}${iso.slice(5, 7)}${iso.slice(8, 10)}.${iso.slice(11, 13)}`;
const displayVersion = `[${VERSION_DATE}] v${pkg.version}`;

const LICENSE_BANNER = `/**
 * Void++ ${displayVersion} — A modification for grok.com
 * (c) ${new Date().getFullYear()} Prism & Void Contributors
 * Licensed under GPL-3.0-or-later
 * Source: ${FORK_URL}
 */`;

const USERSCRIPT_HEADER = `// ==UserScript==
// @name         Void++
// @namespace    ${FORK_URL}
// @version      ${displayVersion}
// @description  A modification for grok.com
// @author       ${pkg.author} & Void Contributors
// @environment  ${environment}
// @homepageURL  ${FORK_URL}
// @icon         ${FORK_RAW_URL}/assets/logos/app-icon/voidpp-256.png
// @match        *://grok.com/*
// @run-at       document-start
// @noframes
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @connect      raw.githubusercontent.com
// @connect      *
// @compatible   chrome
// @compatible   firefox
// @compatible   edge
// @compatible   opera
// @license      GPL-3.0-or-later
// @supportURL   ${FORK_URL}
// @downloadURL  ${FORK_RAW_URL}/userscript/Void.user.js
// @updateURL    ${FORK_RAW_URL}/userscript/Void.user.js
// ==/UserScript==
`;

const pluginDir = resolve("src/plugins");

interface FolderConvention {
    suffix: string;
    skip?: (ctx: { isExt: boolean }) => boolean;
    mutations(varName: string): string;
}

const FOLDER_CONVENTIONS: FolderConvention[] = [
    { suffix: ".dev", skip: () => !isDev, mutations: v => `${v}.dev=true;` },
    { suffix: ".chrome", mutations: v => `${v}.chrome=true;${v}.hidden=!window.chrome;` },
    { suffix: ".extension", skip: ({ isExt }) => !isExt, mutations: v => `${v}.extension=true;` },
];

function scanPluginDir(baseDir: string, imports: string[], exports: string[], mutations: string[], counter: { i: number }, isExt: boolean) {
    if (!existsSync(baseDir)) return;
    const entries = readdirSync(baseDir, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith("_") || entry.name.startsWith(".")) continue;

        const convention = FOLDER_CONVENTIONS.find(c => entry.name.endsWith(c.suffix));
        if (convention?.skip?.({ isExt })) continue;

        const pluginDir = `${baseDir}/${entry.name}`;
        if (!existsSync(`${pluginDir}/index.ts`) && !existsSync(`${pluginDir}/index.tsx`)) continue;

        const varName = `p${counter.i++}`;
        imports.push(`import ${varName} from "${resolve(baseDir, entry.name).replaceAll("\\", "/")}";`);
        exports.push(`[${varName}.name]: ${varName}`);

        if (convention) mutations.push(convention.mutations(varName));
    }
}

function generatePluginModule(isExt: boolean): string {
    const imports: string[] = [];
    const exports: string[] = [];
    const mutations: string[] = [];
    const counter = { i: 0 };

    scanPluginDir(resolve(pluginDir, "_core"), imports, exports, mutations, counter, isExt);
    scanPluginDir(resolve(pluginDir, "_api"), imports, exports, mutations, counter, isExt);
    scanPluginDir(pluginDir, imports, exports, mutations, counter, isExt);

    logger.info(`Found ${counter.i} plugins`);

    if (!imports.length) return "export default {} as Record<string, unknown>;\n";
    const mutationBlock = mutations.length ? `\n${mutations.join("\n")}\n` : "";
    return `${imports.join("\n")}\n${mutationBlock}\nexport default { ${exports.join(", ")} } as Record<string, unknown>;\n`;
}

function pluginsPlugin(isExt: boolean): import("bun").BunPlugin {
    return {
        name: "virtual-plugins",
        setup(build) {
            build.onResolve({ filter: /^~plugins$/ }, () => ({
                path: "~plugins",
                namespace: "virtual",
            }));
            build.onLoad({ filter: /^~plugins$/, namespace: "virtual" }, () => ({
                contents: generatePluginModule(isExt),
                loader: "ts",
            }));
        },
    };
}

function cssPlugin(): import("bun").BunPlugin {
    return {
        name: "void-css",
        setup(build) {
            build.onResolve({ filter: /\.css$/ }, args => ({
                path: resolve(args.resolveDir, args.path),
                namespace: "void-css",
            }));
            build.onLoad({ filter: /.*/, namespace: "void-css" }, async args => {
                const css = await Bun.file(args.path).text();
                const file = basename(args.path, ".css");
                const dir = basename(dirname(args.path));
                const name = file === "styles" ? dir : file;
                return {
                    contents: `import{registerStyle}from"${resolve("src/utils/css.ts").replaceAll("\\", "/")}";registerStyle(${JSON.stringify(name)},${JSON.stringify(css)});`,
                    loader: "js",
                };
            });
        },
    };
}

async function buildCore(outfile: string, isExt: boolean) {
    const result = await Bun.build({
        entrypoints: ["src/index.ts"],
        outdir: "dist",
        target: "browser",
        format: "iife",
        sourcemap: isDev ? "inline" : "none",
        define: {
            IS_DEV: JSON.stringify(isDev),
            IS_EXTENSION: JSON.stringify(isExt),
            VERSION: JSON.stringify(displayVersion),
            REPO_URL: JSON.stringify(repoUrl),
            GIT_HASH: JSON.stringify((() => {
                try {
                    const result = Bun.spawnSync(["git", "rev-parse", "--short", "HEAD"]);
                    return result.success ? result.stdout.toString().trim() : "unknown";
                } catch {
                    return "unknown";
                }
            })()),
        },
        naming: outfile,
        plugins: [pluginsPlugin(isExt), cssPlugin()],
    });

    if (!result.success) {
        logger.error("Build failed:");
        for (const log of result.logs) logger.error(log);
        process.exit(1);
    }

    return result.outputs[0];
}

async function buildUserscript() {
    const output = await buildCore("Void.user.js", false);
    const code = await output.text();
    const content = USERSCRIPT_HEADER + "\n" + LICENSE_BANNER + "\n" + code;
    await Bun.write("dist/Void.user.js", content);
    mkdirSync("userscript", { recursive: true });
    await Bun.write("userscript/Void.user.js", content);
    logger.info(`Built Void.user.js (${(content.length / 1024).toFixed(1)} KB)`);
}

async function buildExtensions() {
    const output = await buildCore("Void.js", true);
    const code = LICENSE_BANNER + "\n" + await output.text();
    await Bun.write("dist/Void.js", code);
    const size = (code.length / 1024).toFixed(1);
    logger.info(`Built dist/Void.js (${size} KB)`);

    const targets = [
        {
            name: "chrome-unpacked",
            files: ["manifest.json", "content.js", "background.js", "modifyResponseHeaders.json"],
        },
        {
            name: "firefox-unpacked",
            files: ["manifestv2.json", "content.js", "background.js"],
        },
    ];

    for (const target of targets) {
        const outDir = resolve("dist", target.name);
        rmSync(outDir, { recursive: true, force: true });
        mkdirSync(outDir, { recursive: true });

        cpSync("dist/Void.js", resolve(outDir, "Void.js"));
        cpSync("browser/icons", resolve(outDir, "icons"), { recursive: true });

        for (const file of target.files) {
            const destName = file === "manifestv2.json" ? "manifest.json" : file;
            let content = readFileSync(resolve("browser", file), "utf-8");

            if (file.endsWith("manifest.json") || file === "manifestv2.json") {
                const manifest = JSON.parse(content);
                manifest.version = pkg.version.replace(/-.*$/, "");
                content = JSON.stringify(manifest, null, 4);
            }

            await Bun.write(resolve(outDir, destName), content);
        }

        logger.info(`Packaged dist/${target.name}/`);
    }
}

async function build() {
    mkdirSync("dist", { recursive: true });
    await Promise.all([buildUserscript(), buildExtensions()]);
}

if (isWatch) {
    logger.info("Watching for changes...");
    const { watch } = await import("fs");
    let building = false;
    let pendingBuild = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const doBuild = async () => {
        if (building) { pendingBuild = true; return; }
        building = true;
        try { await build(); }
        catch (e) { logger.error(e); }
        building = false;
        if (pendingBuild) { pendingBuild = false; doBuild(); }
    };

    await doBuild();
    watch("src", { recursive: true }, () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => { debounceTimer = null; doBuild(); }, 200);
    });
} else {
    await build();
}
