/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { Button, ConfirmDialog, SelectionActionBar, SelectionCheckbox } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { TrashIcon } from "@components/icons";
import { Fragment, React, useState } from "@turbopack/common/react";
import { FilesPageStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { createSelectionStore } from "@utils/misc";
import { pluralize } from "@utils/text";
import definePlugin from "@utils/types";

const logger = new Logger("BetterFiles");

const selection = createSelectionStore<string>();

async function deleteAssets(ids: string[]) {
    const { deleteAsset } = FilesPageStore.useFilesPageStore.getState();
    for (const id of ids) {
        try { await deleteAsset(id); } catch (e) { logger.error("Failed to delete asset", id, e); }
    }
}

function DeleteAllButton() {
    const [open, setOpen] = useState(false);
    const list = FilesPageStore.useFilesPageStore(s => s.list);

    if (!list.length) return null;

    return (
        <Fragment>
            <Button variant="tertiary" shape="square" size="sm" onClick={() => setOpen(true)}>
                <TrashIcon size={18} className="text-fg-secondary" />
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="Delete all files"
                description={`Are you sure you want to delete all ${pluralize(list.length, "file")}? This cannot be undone.`}
                confirmText="Delete all"
                danger
                onConfirm={() => deleteAssets([...list])}
            />
        </Fragment>
    );
}

export default definePlugin({
    name: "BetterFiles",
    description: "Adds bulk delete to the files page.",
    authors: [Devs.Prism],
    managedStyle: "betterFiles",

    start() {
        selection.clear();
    },

    stop() {
        selection.clear();
    },

    renderDeleteAllButton: ErrorBoundary.wrap(DeleteAllButton),
    _renderFileCheckbox: ErrorBoundary.wrap(({ id }: { id: string }) => <SelectionCheckbox selection={selection} id={id} />, null),
    _renderFileActionBar: ErrorBoundary.wrap(() => <SelectionActionBar selection={selection} noun="file" title="Delete files" onDelete={deleteAssets} />, null),

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
                {
                    match: /("files\.search","Search files"\).{0,600}?children:\[\i,\i)\]/,
                    replace: "$1,$self.renderDeleteAllButton()]",
                },
                {
                    match: /role:"button",(tabIndex:\i,"aria-disabled":\i,)onClick:(\i),(.{0,120}?children:\[)/,
                    replace: "role:\"button\",$1onClick:$self._wrapFileClick($2,arguments[0].asset),$3$self._renderFileCheckbox({id:arguments[0].asset.assetId}),",
                },
                {
                    match: /("files\.show-less","Show less"\)(?:.{0,400}?children:\[\i,\i\]){2}.{0,400}?children:\[\i,\i)\]/,
                    replace: "$1,$self._renderFileActionBar()]",
                },
            ],
        },
    ],
});
