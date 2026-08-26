import { openDB, DBSchema, IDBPDatabase } from "idb";

/**
 * Client-Side IndexedDB Storage & Automatic Versioned Cache-Busting Engine
 * - Powered by 'idb' Promise wrapper for async non-blocking execution
 * - Bypasses 5MB localStorage limit (can store 500MB+ locally)
 * - Detects re-uploaded or modified documents via versionId/contentHash
 * - Reclaims student device disk space when files are deleted
 */

const DB_NAME = "StudentPortal_DocCache_v1";
const STORE_NAME = "cached_documents";

interface DocDBSchema extends DBSchema {
  cached_documents: {
    key: string;
    value: {
      id: string;
      versionId: string;
      fileName: string;
      blob: Blob;
      cachedAt: number;
      fileSize: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<DocDBSchema>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<DocDBSchema>(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      }
    });
  }
  return dbPromise;
}

export class PDFCacheManager {
  /**
   * Retrieves a document from IndexedDB with Automatic Cache Busting.
   * If the remote versionId is newer, it evicts the stale cached file and returns null.
   */
  static async getCachedBlob(id: string, remoteVersionId: string): Promise<Blob | null> {
    try {
      const db = await getDB();
      if (!db) return null;

      const record = await db.get(STORE_NAME, id);
      if (!record) return null;

      // Cache-Busting Check: If remote version changed (e.g. professor re-upload), invalidate!
      if (record.versionId !== remoteVersionId) {
        await db.delete(STORE_NAME, id);
        return null;
      }

      return record.blob;
    } catch {
      return null;
    }
  }

  /**
   * Saves a document Blob into IndexedDB with its current versionId.
   */
  static async storeBlob(
    id: string,
    versionId: string,
    fileName: string,
    blob: Blob
  ): Promise<void> {
    try {
      const db = await getDB();
      if (!db) return;

      await db.put(STORE_NAME, {
        id,
        versionId,
        fileName,
        blob,
        cachedAt: Date.now(),
        fileSize: blob.size
      });
    } catch (err) {
      console.warn("Failed to store document in IndexedDB cache:", err);
    }
  }

  /**
   * Computes total bytes stored in local IndexedDB disk cache.
   */
  static async getTotalCacheSize(): Promise<number> {
    try {
      const db = await getDB();
      if (!db) return 0;

      const records = await db.getAll(STORE_NAME);
      return records.reduce((acc, curr) => acc + (curr.fileSize || curr.blob?.size || 0), 0);
    } catch {
      return 0;
    }
  }

  /**
   * Evicts a document from local device storage (Disk Cleanup on deletion).
   */
  static async evict(id: string): Promise<void> {
    try {
      const db = await getDB();
      if (db) await db.delete(STORE_NAME, id);
    } catch {
      // ignore
    }
  }

  /**
   * Clears all cached documents for this student to free local disk space.
   */
  static async clearAll(): Promise<void> {
    try {
      const db = await getDB();
      if (db) await db.clear(STORE_NAME);
    } catch {
      // ignore
    }
  }

  /**
   * Retrieves last-read page bookmark for a document.
   */
  static getBookmark(docId: string): number {
    if (typeof window === "undefined") return 1;
    try {
      const raw = localStorage.getItem(`student_portal_bookmark_${docId}`);
      return raw ? parseInt(raw, 10) || 1 : 1;
    } catch {
      return 1;
    }
  }

  /**
   * Saves last-read page bookmark.
   */
  static setBookmark(docId: string, pageNum: number): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`student_portal_bookmark_${docId}`, pageNum.toString());
    } catch {
      // ignore
    }
  }
}
