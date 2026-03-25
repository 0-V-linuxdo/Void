/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const encoder = new TextEncoder();

function crc32(data: Uint8Array): number {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
        crc ^= data[i];
        for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function u16(n: number): [number, number] {
    return [n & 0xFF, (n >> 8) & 0xFF];
}

function u32(n: number): [number, number, number, number] {
    return [n & 0xFF, (n >> 8) & 0xFF, (n >> 16) & 0xFF, (n >> 24) & 0xFF];
}

export function createZip(files: Record<string, Uint8Array>): Blob {
    const entries = Object.entries(files);
    const localHeaders: Uint8Array[] = [];
    const centralHeaders: Uint8Array[] = [];
    let offset = 0;

    for (const [name, data] of entries) {
        const nameBytes = encoder.encode(name);
        const crc = crc32(data);

        const local = new Uint8Array([
            0x50, 0x4B, 0x03, 0x04,
            0x0A, 0x00,
            0x00, 0x08,
            0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            ...u32(crc),
            ...u32(data.length),
            ...u32(data.length),
            ...u16(nameBytes.length),
            ...u16(0),
            ...nameBytes,
        ]);

        const central = new Uint8Array([
            0x50, 0x4B, 0x01, 0x02,
            0x14, 0x00,
            0x0A, 0x00,
            0x00, 0x08,
            0x00, 0x00,
            0x00, 0x00, 0x00, 0x00,
            ...u32(crc),
            ...u32(data.length),
            ...u32(data.length),
            ...u16(nameBytes.length),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u16(0),
            ...u32(0),
            ...u32(offset),
            ...nameBytes,
        ]);

        localHeaders.push(local, data);
        centralHeaders.push(central);
        offset += local.length + data.length;
    }

    const centralSize = centralHeaders.reduce((s, h) => s + h.length, 0);

    const eocd = new Uint8Array([
        0x50, 0x4B, 0x05, 0x06,
        ...u16(0),
        ...u16(0),
        ...u16(entries.length),
        ...u16(entries.length),
        ...u32(centralSize),
        ...u32(offset),
        ...u16(0),
    ]);

    const parts = [...localHeaders, ...centralHeaders, eocd] as BlobPart[];
    return new Blob(parts, { type: "application/zip" });
}
