/*
 * Void, a modification for grok.com
 * Copyright (c) 2026 Void contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Logger } from "./Logger";

const logger = new Logger("IDB");

const DB_NAME = "Void";
const STORE_NAME = "kv";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    const promise = new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE_NAME)) {
                req.result.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    promise.catch(e => { dbPromise = null; if (IS_DEV) logger.warn(e); });
    dbPromise = promise;
    return promise;
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore, resolve: (value: T) => void) => void): Promise<T> {
    const db = await open();
    return new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        run(tx.objectStore(STORE_NAME), resolve);
        tx.onerror = () => reject(tx.error);
    });
}

export function idbGet<T = unknown>(key: string): Promise<T | undefined> {
    return withStore("readonly", (store, resolve) => {
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
    });
}

export function idbSet(key: string, value: unknown): Promise<void> {
    return withStore("readwrite", (store, resolve) => {
        store.put(value, key);
        store.transaction.oncomplete = () => resolve();
    });
}
