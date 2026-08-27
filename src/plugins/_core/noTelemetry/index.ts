/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ShieldOffIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoTelemetry",
    icon: ShieldOffIcon,
    description: "Disables all tracking, telemetry, and event logging.",
    authors: [Devs.Prism],
    tags: ["privacy"],
    required: true,

    patches: [
        {
            find: '"opentelemetry.js.api."',
            replacement: {
                match: /("onRouterTransitionStart",0,)function\([^)]*\)\{[^}]{0,200}\}/,
                replace: "$1function(){}",
            },
        },
        {
            find: '"after-init"),(0,',
            group: true,
            replacement: [
                {
                    match: /(function \i\(\)\{)if\(Object\.prototype\.hasOwnProperty\.call\(\i\.default,"get_distinct_id"\)\)return;/,
                    replace: "$1return}function _ignore(){",
                },
                {
                    match: /"startRecordingImagineSession",0,function\(\)\{[\s\S]{0,300}?start_session_recording\(\)\}/,
                    replace: '"startRecordingImagineSession",0,function(){}',
                },
                {
                    match: /"stopRecordingImagineSession",0,function\(\)\{[\s\S]{0,300}?stop_session_recording\(\)\},\d+e?\d*\)\}/,
                    replace: '"stopRecordingImagineSession",0,function(){}',
                },
            ],
        },
        {
            find: "sendBatchLogEvent",
            all: true,
            group: true,
            replacement: [
                {
                    match: /sendBatchLogEvent=\i=>\{[^}]{0,150}\}/,
                    replace: "sendBatchLogEvent=()=>{}",
                },
                {
                    match: /sendBatchLogExperimentExposure=\i=>\{[^}]{0,150}\}/,
                    replace: "sendBatchLogExperimentExposure=()=>{}",
                },
            ],
        },
        {
            find: '"/api/log_metric"',
            replacement: {
                match: /"\/api\/log_metric",\i\)/,
                replace: '"/api/log_metric",[])',
            },
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
