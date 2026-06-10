/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button, Checkbox, ConfirmDialog } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { TrashIcon } from "@components/icons";
import { Fragment, React, useState } from "@turbopack/common/react";
import { FilesPageStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory, registerStyle, unregisterStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createSelectionStore } from "@utils/misc";
import { useSelectionHas, useSelectionSize } from "@utils/react";
import { pluralize } from "@utils/text";
import definePlugin from "@utils/types";

const logger = new Logger("BetterFiles");
const cl = classNameFactory("void-bf-");

const selection = createSelectionStore<string>();

async function deleteSelected() {
    const ids = selection.all();
    selection.clear();
    const { deleteAsset } = FilesPageStore.useFilesPageStore.getState();
    await Promise.allSettled(ids.map(id =>
        deleteAsset(id).catch(e => logger.error("Failed to delete asset", id, e)),
    ));
}

function DeleteAllButton() {
    const [open, setOpen] = useState(false);
    const list = FilesPageStore.useFilesPageStore(s => s.list);
    const deleteAsset = FilesPageStore.useFilesPageStore(s => s.deleteAsset);

    if (!list.length) return null;

    const handleConfirm = async () => {
        const ids = [...list];
        for (const id of ids) {
            try { await deleteAsset(id); } catch (e) { logger.error("Failed to delete asset", id, e); }
        }
    };

    return (
        <Fragment>
            <Button variant="tertiary" shape="square" size="sm" onClick={() => setOpen(true)}>
                <TrashIcon size={18} className="text-fg-secondary" />
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete all files"
                description={`Are you sure you want to delete all ${list.length} files? This cannot be undone.`}
                confirmText="Delete all"
                danger
                onConfirm={handleConfirm}
            />
        </Fragment>
    );
}

function FileSelectCheckbox({ id }: { id: string }) {
    const checked = useSelectionHas(selection, id);

    return (
        <div onClick={e => { e.stopPropagation(); e.preventDefault(); }} className={cl("wrap")}>
            <Checkbox
                checked={checked}
                onCheckedChange={() => selection.toggle(id)}
                className={cl("checkbox")}
            />
        </div>
    );
}

function FileActionBar() {
    const count = useSelectionSize(selection);
    const [open, setOpen] = useState(false);

    if (!count) return null;

    return (
        <Fragment>
            <div className={cl("action-bar")}>
                <span className={cl("count")}>Selected · {count}</span>
                <div className={cl("buttons")}>
                    <Button variant="primary" size="sm" shape="pill" onClick={() => selection.clear()}>Cancel</Button>
                    <Button variant="danger" size="sm" shape="pill" onClick={() => setOpen(true)}>Delete</Button>
                </div>
            </div>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete files"
                description={`Are you sure you want to delete ${pluralize(count, "file")}? This cannot be undone.`}
                confirmText="Delete"
                danger
                onConfirm={deleteSelected}
            />
        </Fragment>
    );
}

const HOVER_STYLE = "betterFiles-hover";

export default definePlugin({
    name: "BetterFiles",
    description: "Adds bulk delete to the files page.",
    authors: [Devs.Prism],

    start() {
        selection.clear();
        registerStyle(HOVER_STYLE, [
            ".void-bf-wrap{display:none;align-items:center}",
            ".void-bf-wrap:has([data-state=checked]){display:inline-flex}",
            // file rows use a bare `group` class, so reveal the checkbox on row hover
            ".group:hover .void-bf-wrap{display:inline-flex}",
            ".void-bf-checkbox{border-color:oklch(.9924 0 none/.15)!important}",
            ".void-bf-action-bar{display:flex;flex-direction:column;gap:0.5rem;padding:0.75rem}",
            ".void-bf-count{font-size:0.75rem;font-weight:600;color:var(--color-text-tertiary)}",
            ".void-bf-buttons{display:flex;gap:0.75rem}",
            ".void-bf-buttons>button{flex:1}",
        ].join(""));
    },

    stop() {
        selection.clear();
        unregisterStyle(HOVER_STYLE);
    },

    renderDeleteAllButton: ErrorBoundary.wrap(DeleteAllButton),
    _renderFileCheckbox: ErrorBoundary.wrap(FileSelectCheckbox, null),
    _renderFileActionBar: ErrorBoundary.wrap(FileActionBar, null),

    _wrapFileClick(onClick: () => void, asset: { assetId: string }) {
        return (e: MouseEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                selection.toggle(asset.assetId);
                return;
            }
            onClick();
        };
    },

    patches: [
        {
            find: "files.no-results\",'No files matching",
            all: true,
            noWarn: true,
            group: true,
            replacement: [
                // bulk "delete all" button next to the files search input
                {
                    match: /("files\.search","Search files"\).{0,600}?children:\[\i,\i)\]/,
                    replace: "$1,$self.renderDeleteAllButton()]",
                },
                // selection checkbox + ctrl/meta-click multi-select on each file row
                {
                    match: /role:"button",(tabIndex:\i,"aria-disabled":\i,)onClick:(\i),(.{0,120}?children:\[)/,
                    replace: "role:\"button\",$1onClick:$self._wrapFileClick($2,arguments[0].asset),$3$self._renderFileCheckbox({id:arguments[0].asset.assetId}),",
                },
                // action bar at the bottom of the list root, below the scroll container
                {
                    match: /("files\.show-less","Show less"\)(?:.{0,400}?children:\[\i,\i\]){2}.{0,400}?children:\[\i,\i)\]/,
                    replace: "$1,$self._renderFileActionBar()]",
                },
            ],
        },
    ],
});
