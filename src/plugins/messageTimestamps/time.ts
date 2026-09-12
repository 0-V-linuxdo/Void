/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export const FRESH_MS = 2 * 60 * 1000;
export const BORROW_MS = 1000;
const MIN_MS = Date.UTC(2020, 0, 1);
const MAX_SKEW_MS = 24 * 60 * 60 * 1000;
const TIME_KEYS = ["thinkingStartTime", "createTime", "create_time", "createdAt", "created_at"] as const;

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

export function recordId(record: Record<string, unknown>): string {
    const { responseId, _id } = record;
    if (typeof responseId === "string" && responseId) return responseId;
    return typeof _id === "string" ? _id : "";
}

export function isHumanSender(sender: unknown): boolean {
    if (typeof sender !== "string") return false;
    const normalized = sender.toLowerCase();
    return normalized === "human" || normalized === "user";
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

export function oldestTrusted(values: Array<number | null | undefined>, now = Date.now()): number | null {
    let best: number | null = null;
    for (const ms of values) {
        if (ms == null || isFresh(ms, now)) continue;
        if (best == null || ms < best) best = ms;
    }
    return best;
}

export function chooseTime(opts: {
    fieldTimes: number[];
    stored: number | null;
    uuid: number | null;
    now?: number;
}): number | null {
    const now = opts.now ?? Date.now();
    const trusted = oldestTrusted([opts.stored, ...opts.fieldTimes, opts.uuid], now);
    if (trusted != null) return trusted;
    return opts.stored ?? opts.fieldTimes[0] ?? opts.uuid ?? null;
}

export function trustedTime(opts: {
    fieldTimes: number[];
    stored?: number | null;
    uuid: number | null;
    now?: number;
}): number | null {
    const now = opts.now ?? Date.now();
    return oldestTrusted([opts.stored ?? null, ...opts.fieldTimes, opts.uuid], now);
}

export function shouldKeepStored(prev: number, incoming: number, now = Date.now()): boolean {
    if (incoming === prev) return true;
    if (isFresh(incoming, now) && incoming >= prev) return true;
    if (!isFresh(prev, now) && incoming > prev) return true;
    return false;
}

export function preferHumanTime(own: number | null, borrowed: number | null): number | null {
    if (borrowed == null) return own;
    if (own == null || own > borrowed) return borrowed;
    return own;
}

export function familyUserTime(record: Record<string, unknown>, id: string, now = Date.now()): number | null {
    const uuid = uuidTime(id, now);
    const thinking = parseTime(record.thinkingStartTime, now);
    if (isHumanSender(record.sender) && thinking == null && uuid == null) return null;
    const ms = trustedTime({ fieldTimes: pickTimes(record, now), uuid, now });
    return ms == null ? null : ms - BORROW_MS;
}

export function neighborTime(id: string, records: Array<Record<string, unknown>>, now = Date.now()): number | null {
    if (!id) return null;
    let next: Record<string, unknown> | null = null;
    for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        const recId = recordId(rec);
        if (rec.parentResponseId === id) {
            const ms = trustedTime({ fieldTimes: pickTimes(rec, now), uuid: uuidTime(recId, now), now });
            if (ms != null) return ms - BORROW_MS;
        }
        if (recId === id && i + 1 < records.length) next = records[i + 1];
    }
    if (!next || isHumanSender(next.sender)) return null;
    const ms = trustedTime({ fieldTimes: pickTimes(next, now), uuid: uuidTime(recordId(next), now), now });
    return ms == null ? null : ms - BORROW_MS;
}

export function shouldPersistStamp(sender: unknown, ms: number, stored: number | null, now = Date.now()): boolean {
    if (stored != null) return !shouldKeepStored(stored, ms, now);
    return !(isHumanSender(sender) && isFresh(ms, now));
}

export interface HarvestedTime {
    id: string;
    ms: number;
}

export function harvestResponses(value: unknown, now = Date.now()): HarvestedTime[] {
    const records: Record<string, unknown>[] = [];
    collectRecords(value, 0, records, new Set<object>());
    const out: HarvestedTime[] = [];
    const seen = new Set<string>();
    for (const rec of records) {
        const id = recordId(rec);
        if (!id || seen.has(id)) continue;
        const fieldTimes = pickTimes(rec, now);
        const uuid = uuidTime(id, now);
        let ms = chooseTime({ fieldTimes, stored: null, uuid, now });
        const { sender } = rec;
        if (isHumanSender(sender)) {
            ms = preferHumanTime(ms, neighborTime(id, records, now));
            if (ms != null && isFresh(ms, now)) ms = null;
        }
        if (ms == null) continue;
        seen.add(id);
        out.push({ id, ms });
    }
    return out;
}

function collectRecords(value: unknown, depth: number, out: Record<string, unknown>[], seen: Set<object>): void {
    if (value == null || depth > 8) return;
    if (typeof value !== "object") return;
    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
        for (const item of value) collectRecords(item, depth + 1, out, seen);
        return;
    }

    const rec = value as Record<string, unknown>;
    if (recordId(rec)) out.push(rec);
    for (const child of Object.values(rec)) collectRecords(child, depth + 1, out, seen);
}
