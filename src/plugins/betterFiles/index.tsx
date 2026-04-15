/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button, Checkbox, ConfirmDialog } from "@components";
import { ErrorBoundary } from "@components/ErrorBoundary";
import { TrashIcon } from "@components/icons";
import { Fragment, React, useEffect, useRef, useState } from "@turbopack/common/react";
import { FilesPageStore } from "@turbopack/common/stores";
import { Devs } from "@utils/constants";
import { classNameFactory, registerStyle, unregisterStyle } from "@utils/css";
import { Logger } from "@utils/Logger";
import { createSelectionStore } from "@utils/misc";
import { pluralize } from "@utils/text";
import definePlugin, { OptionType } from "@utils/types";

const logger = new Logger("BetterFiles");
const cl = classNameFactory("void-bf-");

const settings = definePluginSettings({
    skipDeleteConfirm: {
        type: OptionType.BOOLEAN,
        description: "Skip the delete confirmation when deleting files from the list.",
        default: false,
    },
});

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
    const [checked, setChecked] = useState(selection.has(id));
    const idRef = useRef(id);
    idRef.current = id;

    useEffect(() => selection.subscribe(() => setChecked(selection.has(idRef.current))), []);

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
    const [count, setCount] = useState(selection.size());
    const [open, setOpen] = useState(false);

    useEffect(() => selection.subscribe(() => setCount(selection.size())), []);

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
    description: "Adds bulk delete and optional skip of delete confirmation on the files page.",
    authors: [Devs.Prism],
    settings,

    start() {
        selection.clear();
        registerStyle(HOVER_STYLE, [
            ".void-bf-wrap{display:none;align-items:center}",
            ".void-bf-wrap:has([data-state=checked]){display:inline-flex}",
            ".group\\/file-row:hover .void-bf-wrap{display:inline-flex}",
            ".group\\/file:hover .void-bf-wrap{display:inline-flex}",
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

    _wrapFileLinkClick(assetId: string) {
        return (e: MouseEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                selection.toggle(assetId);
            }
        };
    },

    _deleteFile(assetId: string) {
        Promise.resolve(FilesPageStore.useFilesPageStore.getState().deleteAsset(assetId))
            .catch(e => logger.error("Failed to delete asset", assetId, e));
    },

    patches: [
        {
            find: "title-and-button",
            group: true,
            replacement: [
                {
                    match: /"files-search-open-button.label".{0,25}\)\}\)\]\}\)/,
                    replace: "$&,$self.renderDeleteAllButton()",
                },
                {
                    match: /(\i)\(\{type:"delete",assetId:(\i)\.assetId\}\)/,
                    replace: "$self.settings.store.skipDeleteConfirm?$self._deleteFile($2.assetId):$1({type:\"delete\",assetId:$2.assetId})",
                },
                {
                    match: /"flex flex-shrink-0 items-center gap-4 p-2 border rounded-xl bg-card hover:bg-card-hover cursor-pointer/,
                    replace: '"group/file-row flex flex-shrink-0 items-center gap-4 p-2 border rounded-xl bg-card hover:bg-card-hover cursor-pointer',
                },
                {
                    match: /tabIndex:0,onClick:(\i),children:\[\(0,(\i)\.jsx\)\((\i)\.AssetIcon,\{metadata:\(0,(\i)\.convertAssetMetadataToFileMetadata\)\((\i),/,
                    replace: "tabIndex:0,onClick:$self._wrapFileClick($1,$5),children:[(0,$2.jsx)($self._renderFileCheckbox,{id:$5.assetId}),(0,$2.jsx)($3.AssetIcon,{metadata:(0,$4.convertAssetMetadataToFileMetadata)($5,",
                },
                {
                    match: /\(0,(\i)\.jsxs\)\((\i)\.FadeScrollContainer,\{children:\[\(0,(\i)\.jsxs\)\((\i)\.AnimatePresence,/,
                    replace: "$self._renderFileActionBar(),(0,$1.jsxs)($2.FadeScrollContainer,{children:[(0,$3.jsxs)($4.AnimatePresence,",
                },
                {
                    match: /className:"w-full flex flex-row gap-2 text-primary ps-2 items-center min-h-10",children:\[/,
                    replace: 'className:"w-full flex flex-row gap-2 text-primary ps-2 items-center min-h-10",children:[$self._renderFileCheckbox({id:arguments[0].asset.assetId}),',
                },
                {
                    match: /\((\i)\.Link,\{route:\{page:"files",fileId:null!=\((\i)=null!=\((\i)=(\i)\.rootAssetId\)/,
                    replace: "($1.Link,{onClick:$self._wrapFileLinkClick($4.assetId),route:{page:\"files\",fileId:null!=($2=null!=($3=$4.rootAssetId)",
                },
                {
                    match: /FadeScrollContainer,\{className:(\i),fadeSize:"md","aria-busy":"loading"===(\i),children:\[/,
                    replace: 'FadeScrollContainer,{className:$1,fadeSize:"md","aria-busy":"loading"===$2,children:[$self._renderFileActionBar(),',
                },
            ],
        },
    ],
});
