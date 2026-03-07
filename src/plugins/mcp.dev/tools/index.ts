/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { handleEval } from "./evaluate";
import { handleIntercept } from "./intercept";
import { handleModule } from "./module";
import { handlePatch } from "./patch";
import { handlePlugin } from "./plugin";
import { handleReact } from "./react";
import { handleSearch } from "./search";
import { handleStore } from "./store";
import type { ToolHandler } from "./types";

export { TOOL_DEFINITIONS } from "./definitions";

export const toolHandlers: Record<string, ToolHandler> = {
    module: handleModule,
    search: handleSearch,
    evaluateCode: handleEval,
    patch: handlePatch,
    plugin: handlePlugin,
    react: handleReact,
    store: handleStore,
    intercept: handleIntercept,
};
