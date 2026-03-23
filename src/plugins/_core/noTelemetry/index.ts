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
            find: '"opentelemetry.js.api."',
            replacement: {
                match: /(\i\.s\(\["onRouterTransitionStart",\(\)=>)\i\],(\d+)\);var/,
                replace: "$1function(){}],$2);return;var",
            },
        },
        {
            find: '"after-init"),(0,',
            replacement: {
                match: /(function \i\(\)\{)if\(Object\.prototype\.hasOwnProperty\.call\(\i\.default,"get_distinct_id"\)\)return;/,
                replace: "$1return}function _ignore(){",
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
