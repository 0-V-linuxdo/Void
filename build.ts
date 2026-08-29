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
const VERSION_DATE = "20260829.10";
const displayVersion = `[${VERSION_DATE}] v${pkg.version}`;
