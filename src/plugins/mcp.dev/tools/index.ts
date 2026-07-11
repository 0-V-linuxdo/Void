/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { z } from "zod";

import { handleEval } from "./evaluate";
import { handleIntercept } from "./intercept";
import { handleModule } from "./module";
import { handleNetwork } from "./network";
import { handlePatch } from "./patch";
import { handlePlugin } from "./plugin";
import { handleReact } from "./react";
import { handleRecon } from "./recon";
import { handleRequest } from "./request";
import { type ToolName, toolSchemas } from "./schemas";
import { handleSearch } from "./search";
import { handleStore } from "./store";

function bindTool<S extends z.ZodType>(schema: S, handler: (args: z.output<S>) => unknown): (raw: unknown) => unknown {
    return raw => {
        const parsed = schema.safeParse(raw ?? {});
        return parsed.success ? handler(parsed.data) : { error: `Invalid arguments: ${z.prettifyError(parsed.error)}` };
    };
}

export const toolHandlers = {
    module: bindTool(toolSchemas.module.input, handleModule),
    search: bindTool(toolSchemas.search.input, handleSearch),
    evaluateCode: bindTool(toolSchemas.evaluateCode.input, handleEval),
    patch: bindTool(toolSchemas.patch.input, handlePatch),
    plugin: bindTool(toolSchemas.plugin.input, handlePlugin),
    react: bindTool(toolSchemas.react.input, handleReact),
    store: bindTool(toolSchemas.store.input, handleStore),
    intercept: bindTool(toolSchemas.intercept.input, handleIntercept),
    network: bindTool(toolSchemas.network.input, handleNetwork),
    recon: bindTool(toolSchemas.recon.input, handleRecon),
    request: bindTool(toolSchemas.request.input, handleRequest),
} satisfies Record<ToolName, (raw: unknown) => unknown>;
