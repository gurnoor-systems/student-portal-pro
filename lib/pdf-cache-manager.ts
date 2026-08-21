/**
 * Client-Side IndexedDB Storage & Automatic Versioned Cache-Busting Engine
 * - Bypasses 5MB localStorage limit (can store 500MB+ locally)
 * - Detects re-uploaded or modified documents via versionId/contentHash
 * - Reclaims student device disk space when files are deleted
 */

const DB_NAME = "StudentPortal_DocCache_v1";
const STORE_NAME = "cached_documents";

interface CachedDocRecord {
  id: string;
  versionId: string;
  fileName: string;
  blob: Blob;
  cachedAt: number;
  fileSize: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class PDFCacheManager {
  /**
   * Retrieves a document from IndexedDB with Automatic Cache Busting.
   * If the remote versionId is newer, it evicts the stale cached file and returns null.
   */
  static async getCachedBlob(id: string, remoteVersionId: string): Promise<Blob | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const record: CachedDocRecord | undefined = req.result;
          if (!record) {
            resolve(null);
            return;
          }

          // Cache-Busting Check: If remote version changed (e.g. professor re-upload), invalidate!
          if (record.versionId !== remoteVersionId) {
            console.log(`[Cache-Buster] Stale version detected for ${id} (Cached: ${record.versionId}, Remote: ${remoteVersionId}). Evicting...`);
            PDFCacheManager.evict(id).catch(() => {});
            resolve(null);
            return;
          }

          resolve(record.blob);
        };

        req.onerror = () => resolve(null);
      });
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
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        const record: CachedDocRecord = {
          id,
          versionId,
          fileName,
          blob,
          cachedAt: Date.now(),
          fileSize: blob.size
        };

        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn("Failed to store document in IndexedDB cache:", err);
    }
  }

  /**
   * Evicts a document from local device storage (Disk Cleanup on deletion).
   */
  static async evict(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }

  /**
   * Clears all cached documents for this student.
   */
  static async clearAll(): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {
      // ignore
    }
  }
}
