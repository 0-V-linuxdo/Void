/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const FRESH_MS = 2 * 60 * 1000;
const MIN_MS = Date.UTC(2020, 0, 1);
const MAX_SKEW_MS = 24 * 60 * 60 * 1000;
const TIME_KEYS = ["createTime", "create_time", "createdAt", "created_at", "thinkingStartTime"] as const;

export function isFresh(ms: number, now = Date.now()): boolean {
    return Math.abs(now - ms) < FRESH_MS;
}

function inRange(ms: number, now = Date.now()): boolean {
    return Number.isFinite(ms) && ms >= MIN_MS && ms <= now + MAX_SKEW_MS;
}

function fromUnixish(n: number, now = Date.now()): number | null {
    if (!Number.isFinite(n) || n <= 0) return null;
    const ms = n < 1e12 ? n * 1000 : n;
    return inRange(ms, now) ? Math.round(ms) : null;
}

export function parseTime(value: unknown, now = Date.now()): number | null {
    if (value == null || value === "") return null;
    if (typeof value === "number") return fromUnixish(value, now);
    if (typeof value === "bigint") return fromUnixish(Number(value), now);
    if (value instanceof Date) {
        const t = value.getTime();
        return Number.isNaN(t) || !inRange(t, now) ? null : t;
    }
    if (typeof value === "string") {
        const s = value.trim();
        if (!s) return null;
        if (/^\d+(\.\d+)?$/.test(s)) return fromUnixish(Number(s), now);
        const t = Date.parse(s);
        return Number.isNaN(t) || !inRange(t, now) ? null : t;
    }
    if (typeof value !== "object") return null;

    const rec = value as Record<string, unknown>;
    if (rec.seconds != null) {
        const sec = typeof rec.seconds === "string" ? Number(rec.seconds) : Number(rec.seconds);
        const nanos = Number(rec.nanos) || 0;
        if (!Number.isFinite(sec)) return null;
        const ms = sec * 1000 + Math.floor(nanos / 1e6);
        return inRange(ms, now) ? Math.round(ms) : null;
    }
    if (rec.$date != null) {
        const date = rec.$date;
        if (date && typeof date === "object" && "$numberLong" in date) {
            return parseTime((date as { $numberLong: unknown }).$numberLong, now);
        }
        return parseTime(date, now);
    }
    if (rec.$numberLong != null) return parseTime(rec.$numberLong, now);

    return parseTime(rec.createTime ?? rec.create_time ?? rec.createdAt ?? rec.created_at, now);
}

export function uuidTime(id: unknown, now = Date.now()): number | null {
    if (typeof id !== "string") return null;
    const compact = id.trim().replaceAll("-", "").toLowerCase();
    if (compact.length !== 32) return null;
    if (compact.charAt(12) !== "7") return null;
    const variant = parseInt(compact.charAt(16), 16);
    if (!Number.isFinite(variant) || (variant & 0xc) !== 0x8) return null;
    const ms = parseInt(compact.slice(0, 12), 16);
    return inRange(ms, now) ? ms : null;
}

export function asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : null;
}

export function pickTimes(record: Record<string, unknown>, now = Date.now()): number[] {
    const out: number[] = [];
    const seen = new Set<number>();
    const add = (value: unknown) => {
        const ms = parseTime(value, now);
        if (ms == null || seen.has(ms)) return;
        seen.add(ms);
        out.push(ms);
    };
    for (const key of TIME_KEYS) add(record[key]);
    const meta = asRecord(record.metadata);
    if (meta) {
        for (const key of TIME_KEYS) add(meta[key]);
    }
    return out;
}

export function chooseTime(opts: {
    fieldTimes: number[];
    stored: number | null;
    uuid: number | null;
    now?: number;
}): number | null {
    const now = opts.now ?? Date.now();
    const { stored } = opts;
    const { uuid } = opts;
    const { fieldTimes } = opts;

    if (stored != null && !isFresh(stored, now)) return stored;
    const trustedField = fieldTimes.find(ms => !isFresh(ms, now));
    if (trustedField != null) return trustedField;
    if (uuid != null && !isFresh(uuid, now)) return uuid;

    return stored ?? fieldTimes[0] ?? uuid ?? null;
}

export interface HarvestedTime {
    id: string;
    ms: number;
}

export function harvestResponses(value: unknown, now = Date.now()): HarvestedTime[] {
    const out: HarvestedTime[] = [];
    walkHarvest(value, 0, now, out, new Set<object>());
    return out;
}

function walkHarvest(value: unknown, depth: number, now: number, out: HarvestedTime[], seen: Set<object>): void {
    if (value == null || depth > 8) return;
    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
        for (const item of value) walkHarvest(item, depth + 1, now, out, seen);
        return;
    }

    const rec = value as Record<string, unknown>;
    const { responseId } = rec;
    const id = typeof responseId === "string" ? responseId : "";
    if (id) {
        const fieldTimes = pickTimes(rec, now);
        const ms = chooseTime({ fieldTimes, stored: null, uuid: uuidTime(id, now), now });
        if (ms != null) out.push({ id, ms });
    }

    for (const child of Object.values(rec)) walkHarvest(child, depth + 1, now, out, seen);
}

export function shouldKeepStored(prev: number, incoming: number, now = Date.now()): boolean {
    if (incoming === prev) return true;
    if (isFresh(incoming, now) && incoming >= prev) return true;
    if (!isFresh(prev, now) && incoming > prev) return true;
    return false;
}
