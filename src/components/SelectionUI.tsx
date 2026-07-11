/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./SelectionUI.css";

import { Button, Checkbox, ConfirmDialog } from "@components";
import { Fragment, React, useState } from "@turbopack/common/react";
import { classNameFactory } from "@utils/css";
import type { SelectionStore } from "@utils/misc";
import { useSelectionHas, useSelectionSize } from "@utils/react";
import { pluralize } from "@utils/text";

const cl = classNameFactory("void-sel-");

export function SelectionCheckbox({ selection, id }: { selection: SelectionStore<string>; id: string }) {
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

export function SelectionActionBar({ selection, noun, title, onDelete }: {
    selection: SelectionStore<string>;
    noun: string;
    title: string;
    onDelete: (ids: string[]) => void | Promise<void>;
}) {
    const count = useSelectionSize(selection);
    const [open, setOpen] = useState(false);

    if (!count) return null;

    const handleConfirm = async () => {
        const ids = selection.all();
        selection.clear();
        await onDelete(ids);
    };

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
                title={title}
                description={`Are you sure you want to delete ${pluralize(count, noun)}? This cannot be undone.`}
                confirmText="Delete"
                danger
                onConfirm={handleConfirm}
            />
        </Fragment>
    );
}
