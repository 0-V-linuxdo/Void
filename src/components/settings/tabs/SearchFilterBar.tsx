/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components";
import { React } from "@turbopack/common/react";

import { type InputChangeEvent } from "../utils";

interface SearchFilterBarProps<F extends string> {
    placeholder: string;
    search: string;
    onSearchChange(value: string): void;
    filter: F;
    onFilterChange(value: F): void;
    options: readonly { value: F; label: string }[];
    selectClassName: string;
}

export function SearchFilterBar<F extends string>({ placeholder, search, onSearchChange, filter, onFilterChange, options, selectClassName }: SearchFilterBarProps<F>) {
    return (
        <Flex alignItems="center" gap="0.75rem">
            <Input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e: InputChangeEvent) => onSearchChange(e.target.value)}
                className="void-search-bar-input"
            />
            <Select value={filter} onValueChange={(v: string) => onFilterChange(v as F)}>
                <SelectTrigger className={selectClassName}>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {options.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Flex>
    );
}
