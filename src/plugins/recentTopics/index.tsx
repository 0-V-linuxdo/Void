/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import type { ChatPageStoreState } from "@grok-types/stores/ChatPageStore";
import type { GrokConversation } from "@grok-types/stores/ConversationStore";
import type { GrokPage, GrokRoute, RoutingStoreState } from "@grok-types/stores/RoutingStore";
import { ChatPageStore, ConversationStore, RoutingStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classes, classNameFactory } from "@utils/css";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("RecentTopics");
const cl = classNameFactory("void-rt-");
const HOME_ID = "";
const TRIGGER_CODES = new Set(["Backquote", "IntlBackslash"]);
const TRIGGER_KEYS = new Set(["`", "~", "·", "｀", "～", "Dead", "Process"]);
const TITLE_TAIL = /\s*[·|\u2014\u2013-]\s*Grok.*$/i;
const SKIP_LABEL = /^(more|history|today|yesterday|projects|new chat|new conversation)$/i;
const COUNT_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => ({ label: String(n), value: n, default: n === 5 }));
