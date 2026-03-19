/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoTelemetry",
    description: "Disables all tracking, telemetry, and event logging.",
    authors: [Devs.Prism],
    required: true,

    patches: [
        {
            find: "ingest.us.sentry.io",
            replacement: {
                match: /e\.s\(\["onRouterTransitionStart",\(\)=>\i\],(\d+)\);var/,
                replace: 'e.s(["onRouterTransitionStart",()=>function(){}],$1);return;var',
            },
        },
        {
            find: '"after-init"),(0,',
            replacement: {
                match: /function (\i)\(\)\{if\(Object\.prototype\.hasOwnProperty.{0,450}setHasMixpanelInitialized\)\(!0\)\}\}\)\}/,
                replace: "function $1(){}",
            },
        },
        {
            find: "sendBatchLogEvent",
            all: true,
            replacement: [
                {
                    match: /"sendBatchLogEvent",\i=>\{\i\(this\.address\+.{0,40},\i\)\}/,
                    replace: '"sendBatchLogEvent",()=>{}',
                },
                {
                    match: /"sendBatchLogExperimentExposure",\i=>\{\i\(this\.address\+.{0,50},\i\)\}/,
                    replace: '"sendBatchLogExperimentExposure",()=>{}',
                },
                {
                    match: /"\/api\/log_metric",\i\)/,
                    replace: '"/api/log_metric",[])',
                },
            ],
        },
        {
            find: "isEnvVarsSet(){return void 0!=",
            replacement: {
                match: /isEnvVarsSet\(\)\{return void 0!=\i&&""!=\i\|\|!!this\.customEndpoint\}/,
                replace: "isEnvVarsSet(){return false}",
            },
        },
    ],
});
