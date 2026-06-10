/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isObject } from "@utils/guards";
import { idbGet, idbSet } from "@utils/idb";

const ROOT_KEY_ID = "VoidCryptoRootHKDF";
const HKDF_SALT_BYTES = 32;
const AES_IV_BYTES = 12;
const AES_KEY_BITS = 256;
const CURRENT_VERSION = 1 as const;

export type EncryptedBlob = {
    readonly v: 1;
    readonly alg: "AES-GCM-256";
    readonly kdf: "HKDF-SHA256";
    readonly iv: string;
    readonly salt: string;
    readonly ct: string;
};

type Bytes = Uint8Array<ArrayBuffer>;

const utf8 = new TextEncoder();

let rootKeyPromise: Promise<CryptoKey> | null = null;

function randomBytes(n: number): Bytes {
    return crypto.getRandomValues(new Uint8Array(n));
}

function toBytes(b64: string): Bytes {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function fromBytes(bytes: ArrayBuffer | Uint8Array): string {
    const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    return btoa(String.fromCharCode(...arr));
}

async function generateRootKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey("raw", randomBytes(32), "HKDF", false, ["deriveKey"]);
}

async function getRootKey(): Promise<CryptoKey> {
    if (rootKeyPromise) return rootKeyPromise;

    rootKeyPromise = (async () => {
        const stored = await idbGet<CryptoKey | undefined>(ROOT_KEY_ID);
        if (stored instanceof CryptoKey) return stored;

        const fresh = await generateRootKey();
        await idbSet(ROOT_KEY_ID, fresh);
        return fresh;
    })().catch(e => { rootKeyPromise = null; throw e; });

    return rootKeyPromise;
}

async function deriveAccountKey(root: CryptoKey, salt: Bytes, aad: Bytes, usage: KeyUsage): Promise<CryptoKey> {
    return crypto.subtle.deriveKey(
        { name: "HKDF", hash: "SHA-256", salt, info: aad },
        root,
        { name: "AES-GCM", length: AES_KEY_BITS },
        false,
        [usage],
    );
}

function encodeUtf8(s: string): Bytes {
    return utf8.encode(s) as Bytes;
}

function buildAad(accountId: string): Bytes {
    return encodeUtf8(`grok|${accountId}|v${CURRENT_VERSION}`);
}

export async function encryptForAccount(accountId: string, plaintext: string): Promise<EncryptedBlob> {
    const root = await getRootKey();
    const salt = randomBytes(HKDF_SALT_BYTES);
    const iv = randomBytes(AES_IV_BYTES);
    const aad = buildAad(accountId);
    const key = await deriveAccountKey(root, salt, aad, "encrypt");
    const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: aad },
        key,
        encodeUtf8(plaintext),
    );

    return {
        v: CURRENT_VERSION,
        alg: "AES-GCM-256",
        kdf: "HKDF-SHA256",
        iv: fromBytes(iv),
        salt: fromBytes(salt),
        ct: fromBytes(ct),
    } satisfies EncryptedBlob;
}

export async function decryptForAccount(accountId: string, blob: EncryptedBlob): Promise<string> {
    if (blob.v !== CURRENT_VERSION) throw new Error(`Unsupported blob version: ${blob.v}`);

    const root = await getRootKey();
    const aad = buildAad(accountId);
    const key = await deriveAccountKey(root, toBytes(blob.salt), aad, "decrypt");
    const pt = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: toBytes(blob.iv), additionalData: aad },
        key,
        toBytes(blob.ct),
    );

    return new TextDecoder().decode(pt);
}

export function isEncryptedBlob(value: unknown): value is EncryptedBlob {
    return isObject(value)
        && value.v === CURRENT_VERSION && value.alg === "AES-GCM-256" && value.kdf === "HKDF-SHA256"
        && typeof value.iv === "string" && typeof value.salt === "string" && typeof value.ct === "string";
}
