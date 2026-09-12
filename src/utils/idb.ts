/*
 * Void++, a modification for grok.com
 * Copyright (c) 2026 Void++ Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { LEGACY_WRITE_STOPPED } from "./constants";
import { Logger } from "./Logger";

const logger = new Logger("IDB");

const DB_NAME = "VoidPP";
const LEGACY_DB_NAME = "Void";
const STORE_NAME = "kv";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openNamed(name: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name, DB_VERSION);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE_NAME)) {
                req.result.createObjectStore(STORE_NAME);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function copyStore(from: IDBDatabase, to: IDBDatabase): Promise<void> {
    if (!from.objectStoreNames.contains(STORE_NAME) || !to.objectStoreNames.contains(STORE_NAME)) return;
    const destCount = await request(to.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).count());
    if (destCount > 0) return;
    const src = from.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
    const keys = await request(src.getAllKeys());
    if (!keys.length) return;
    const values = await request(src.getAll());
    const destTx = to.transaction(STORE_NAME, "readwrite");
    const dest = destTx.objectStore(STORE_NAME);
    for (let i = 0; i < keys.length; i++) dest.put(values[i], keys[i]);
    await new Promise<void>((resolve, reject) => {
        destTx.oncomplete = () => resolve();
        destTx.onerror = () => reject(destTx.error);
    });
}

function openExisting(name: string): Promise<IDBDatabase | null> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(name);
        let created = false;
        req.onupgradeneeded = () => { created = true; };
        req.onsuccess = () => {
            const db = req.result;
            if (created) {
                db.close();
                indexedDB.deleteDatabase(name);
                resolve(null);
                return;
            }
            resolve(db);
        };
        req.onerror = () => reject(req.error);
    });
}

function dropLegacyDatabase(): Promise<void> {
    return new Promise(resolve => {
        const req = indexedDB.deleteDatabase(LEGACY_DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });
}

async function migrateLegacy(db: IDBDatabase): Promise<void> {
    let legacy: IDBDatabase | null = null;
    let drop = false;
    try {
        legacy = await openExisting(LEGACY_DB_NAME);
        if (legacy) {
            await copyStore(legacy, db);
            logger.info(`Migrated leftover IndexedDB ${LEGACY_DB_NAME} onto ${DB_NAME}; writes to ${LEGACY_DB_NAME} stopped at ${LEGACY_WRITE_STOPPED}`);
            drop = true;
        }
    } catch (e) {
        if (IS_DEV) logger.warn(e);
    } finally {
        legacy?.close();
    }
    if (drop) await dropLegacyDatabase();
}

function open(): Promise<IDBDatabase> {
    if (dbPromise) return dbPromise;
    const promise = openNamed(DB_NAME).then(async db => {
        await migrateLegacy(db);
        return db;
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

export function idbDelete(key: string): Promise<void> {
    return withStore("readwrite", (store, resolve) => {
        store.delete(key);
        store.transaction.oncomplete = () => resolve();
    });
}
