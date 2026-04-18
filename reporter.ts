/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { run } from "./reporter/index";

run().catch(e => {
    console.error(e);
    process.exitCode = 1;
});
