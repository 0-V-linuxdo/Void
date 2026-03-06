/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const isBrowser = typeof window !== "undefined";

const ANSI = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
} as const;

export class Logger {
    constructor(
        public name: string,
        public color = "white",
    ) {}

    private _log(level: "log" | "error" | "warn" | "info" | "debug", args: any[]) {
        if (isBrowser) {
            console[level](
                `%c Void %c %c ${this.name} `,
                "background: white; color: black; font-weight: bold; border-radius: 5px;",
                "",
                `background: ${this.color}; color: black; font-weight: bold; border-radius: 5px;`,
                ...args,
            );
            return;
        }

        const LEVEL_ANSI: Record<string, string> = { error: ANSI.red, warn: ANSI.yellow };
        const levelAnsi = LEVEL_ANSI[level] ?? ANSI.green;
        const prefix = `${ANSI.bold}${levelAnsi}[${this.name}]${ANSI.reset}`;
        console[level](prefix, ...args);
    }

    public log(...args: any[]) {
        this._log("log", args);
    }
    public info(...args: any[]) {
        this._log("info", args);
    }
    public error(...args: any[]) {
        this._log("error", args);
    }
    public warn(...args: any[]) {
        this._log("warn", args);
    }
    public debug(...args: any[]) {
        this._log("debug", args);
    }
}
