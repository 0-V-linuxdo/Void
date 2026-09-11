/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { TextCursorInputIcon } from "@components/icons";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin from "@utils/types";

const logger = new Logger("KeepCaret");

interface Caret {
    from: number;
    to: number;
}

interface TiptapEditor {
    isFocused: boolean;
    view: { composing: boolean };
    state: { selection: Caret };
    getJSON(): object;
    commands: {
        setContent(doc: object, options: { emitUpdate: boolean }): boolean;
        setTextSelection(range: Caret): boolean;
    };
}

const caretByDoc = new WeakMap<object, Caret>();

export default definePlugin({
    name: "KeepCaret",
    icon: TextCursorInputIcon,
    description: "Keep the caret where you are typing when Grok re-syncs the composer draft, and never rewrite the text mid-composition.",
    authors: [Devs.p],
    tags: ["chat"],
    enabledByDefault: true,

    _remember(editor: TiptapEditor, doc: object) {
        const { from, to } = editor.state.selection;
        caretByDoc.set(doc, { from, to });
    },

    _sync(editor: TiptapEditor, doc: object) {
        if (editor.view.composing) {
            logger.info("Draft sync skipped during IME composition.");
            return;
        }
        const focused = editor.isFocused;
        const caret = focused ? editor.state.selection : caretByDoc.get(doc);
        const changed = JSON.stringify(editor.getJSON()) !== JSON.stringify(doc);
        if (changed) editor.commands.setContent(doc, { emitUpdate: false });
        if (caret && (changed || !focused)) editor.commands.setTextSelection({ from: caret.from, to: caret.to });
        logger.info(`Draft sync: ${changed ? "content replaced" : "same content"}, editor ${focused ? "focused" : "unfocused"}, caret ${caret ? `kept at ${caret.from}` : "left at end"}.`);
    },

    patches: [
        {
            find: '"TiptapEditorWithFallback",0,',
            group: true,
            replacement: [
                {
                    match: /(?<=let (\i)=(\i)\.getJSON\(\),\i=\i\.)getText\(\{blockSeparator:"\\n"\}\);/,
                    replace: "getText({blockSeparator:\"\\n\"});$self._remember($2,$1);",
                },
                {
                    match: /(?<=(\i)\.commands\.)setContent\((\i),\{emitUpdate:!1\}\)/,
                    replace: "setContent&&$self._sync($1,$2)",
                },
            ],
        },
    ],
});
