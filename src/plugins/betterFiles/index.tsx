/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button, ConfirmDialog } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { TrashIcon } from "@components/icons";
import { Fragment, React, useState } from "@turbopack/common/react";
import { FilesPageStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("BetterFiles");

const settings = definePluginSettings({
    skipDeleteConfirm: {
        type: OptionType.BOOLEAN,
        description: "Skip the delete confirmation when deleting files from the list.",
        default: false,
    },
});

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
            <Button
                variant="tertiary"
                shape="square"
                size="sm"
                onClick={() => setOpen(true)}
            >
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

export default definePlugin({
    name: "BetterFiles",
    description: "Adds bulk delete and optional skip of delete confirmation on the files page.",
    authors: [Devs.Prism],
    settings,

    renderDeleteAllButton: ErrorBoundary.wrap(DeleteAllButton),

    _deleteFile(assetId: string) {
        FilesPageStore.useFilesPageStore.getState().deleteAsset(assetId);
    },

    patches: [
        {
            find: "title-and-button",
            noWarn: true,
            replacement: [
                {
                    match: /"files-search-open-button.label".{0,25}\)\}\)\]\}\)/,
                    replace: "$&,$self.renderDeleteAllButton()",
                },
                {
                    match: /(\i)\(\{type:"delete",assetId:(\i)\.assetId\}\)/,
                    replace: "$self.settings.store.skipDeleteConfirm?$self._deleteFile($2.assetId):$1({type:\"delete\",assetId:$2.assetId})",
                },
            ],
        },
    ],
});
