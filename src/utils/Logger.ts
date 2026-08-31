/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type LogLevel = "log" | "error" | "warn" | "info" | "debug";

const isBrowser = typeof window !== "undefined";

const CAP_GRADIENT: Record<LogLevel, string> = {
    log: "linear-gradient(135deg,#b4befe,#cba6f7)",
    info: "linear-gradient(135deg,#89b4fa,#74c7ec)",
    warn: "linear-gradient(135deg,#f9e2af,#fab387)",
    error: "linear-gradient(135deg,#f38ba8,#eba0ac)",
    debug: "linear-gradient(135deg,#6c7086,#9399b2)",
};

const LEVEL_ANSI: Record<LogLevel, string> = {
    log: "\x1b[32m",
    info: "\x1b[34m",
    warn: "\x1b[33m",
    error: "\x1b[31m",
    debug: "\x1b[90m",
};

const CAP = "color:#11111b;font-weight:700;padding:2px 7px;border-radius:7px 0 0 7px;";
const BODY = "background:#1e1e2e;font-weight:600;padding:2px 8px;border-radius:0 7px 7px 0;";

export class Logger {
    constructor(
        public name: string,
        public color = "#cdd6f4",
    ) {}

    private _log(level: LogLevel, args: unknown[]) {
        if (isBrowser) {
            const sink = level === "debug" ? console.debug : console.log;
            sink(
                `%cVoid++%c${this.name}%c`,
                `${CAP}background:${CAP_GRADIENT[level]};`,
                `${BODY}color:${this.color};`,
                "",
                ...args,
            );
            return;
        }

        console[level](`${LEVEL_ANSI[level]}\x1b[1m${this.name}\x1b[0m`, ...args);
    }

    public log(...args: unknown[]) { this._log("log", args); }
    public info(...args: unknown[]) { this._log("info", args); }
    public error(...args: unknown[]) { this._log("error", args); }
    public warn(...args: unknown[]) { this._log("warn", args); }
    public debug(...args: unknown[]) { this._log("debug", args); }
}
