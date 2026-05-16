#!/usr/bin/env bun
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const isCI = process.env.GITHUB_ACTIONS === "true";
let errors = 0;

function fail(file, message) {
    errors++;
    if (isCI) console.log(`::error file=${file}::${message.replaceAll("\n", "%0A")}`);
    else console.log(`ERROR ${file} ${message}`);
}

function ok(label) {
    console.log(`  ok  ${label}`);
}

function parseJs(file) {
    const code = readFileSync(file, "utf8");
    try {
        new Bun.Transpiler({ loader: "js" }).scan(code);
        ok(`${file} parses (${(code.length / 1024).toFixed(1)} KB)`);
    } catch (e) {
        fail(file, `Parse error: ${e.message}`);
    }
}

function validateManifest(file, mv) {
    let m;
    try { m = JSON.parse(readFileSync(file, "utf8")); }
    catch (e) { fail(file, `Invalid JSON: ${e.message}`); return; }

    for (const k of ["manifest_version", "name", "version"]) {
        if (m[k] === undefined) fail(file, `Missing required field: ${k}`);
    }
    if (m.manifest_version !== mv) fail(file, `Expected manifest_version ${mv}, got ${m.manifest_version}`);
    if (typeof m.version === "string" && !/^\d+(\.\d+)*$/.test(m.version)) {
        fail(file, `Invalid version format: ${m.version}`);
    }
    ok(`${file} valid (v${m.version}, MV${m.manifest_version})`);
}

function validateExtensionDir(dir, mv) {
    try { statSync(dir); }
    catch { fail(dir, "Missing extension directory"); return; }

    for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (entry === "manifest.json") validateManifest(path, mv);
        else if (entry.endsWith(".json")) {
            try { JSON.parse(readFileSync(path, "utf8")); ok(`${path} valid JSON`); }
            catch (e) { fail(path, `Invalid JSON: ${e.message}`); }
        } else if (entry.endsWith(".js")) {
            parseJs(path);
        }
    }
}

console.log("→ Userscript");
parseJs("dist/Void.user.js");

console.log("→ Extension bundle");
parseJs("dist/Void.js");

console.log("→ Chrome (MV3)");
validateExtensionDir("dist/chrome-unpacked", 3);

console.log("→ Firefox (MV2)");
validateExtensionDir("dist/firefox-unpacked", 2);

console.log(`\n${errors} error(s)`);
if (errors > 0) process.exit(1);
