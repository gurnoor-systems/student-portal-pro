import { UserData, UserProfile } from "@/lib/types";

/**
 * Domain Service: Cloud & Offline Synchronization
 * Decouples synchronization network calls, debounce timing, and offline queues
 * from React component re-renders.
 */

export class SyncService {
  private static syncDebounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Persists user data locally and triggers debounced background cloud sync (300ms)
   */
  static persistUserData(
    userId: string,
    email: string | undefined,
    data: UserData,
    onSuccess?: () => void,
    onError?: (err: any) => void
  ): void {
    if (typeof window === "undefined") return;

    // 1. Instant 0ms local write for UI fluidity
    const storageKey = `student_portal_user_${userId}_data`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage write error:", e);
    }

    // 2. Debounced Cloud Synchronization
    if (email) {
      const existingTimer = this.syncDebounceTimers.get(userId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        try {
          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "sync-data",
              email,
              userData: data
            })
          });

          if (!res.ok) {
            this.enqueuePendingSync(userId, data);
            onError?.(new Error("Server returned non-200"));
          } else {
            this.clearPendingSync(userId);
            onSuccess?.();
          }
        } catch (err) {
          // Network dropped / offline: Queue mutation
          this.enqueuePendingSync(userId, data);
          onError?.(err);
        }
      }, 300);

      this.syncDebounceTimers.set(userId, timer);
    }
  }

  /**
   * Enqueues a failed mutation payload into local pending queue
   */
  static enqueuePendingSync(userId: string, data: UserData): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`student_portal_pending_sync_${userId}`, JSON.stringify(data));
    } catch {}
  }

  /**
   * Clears pending sync queue
   */
  static clearPendingSync(userId: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(`student_portal_pending_sync_${userId}`);
    } catch {}
  }

  /**
   * Flushes offline pending sync queue to server when connection resumes
   */
  static async flushPendingSync(userId: string, email: string): Promise<boolean> {
    if (typeof window === "undefined" || !email) return false;
    try {
      const pendingRaw = localStorage.getItem(`student_portal_pending_sync_${userId}`);
      if (pendingRaw) {
        const pendingData = JSON.parse(pendingRaw);
        const res = await fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync-data",
            email,
            userData: pendingData
          })
        });

        if (res.ok) {
          this.clearPendingSync(userId);
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  /**
   * Fetches latest state from cloud for multi-device sync
   */
  static async fetchLatestState(
    email: string,
    deviceId: string
  ): Promise<{ account?: UserProfile; userData?: UserData } | null> {
    if (typeof window === "undefined" || !email) return null;
    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch-latest",
          email,
          deviceId
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          return { account: data.account, userData: data.userData };
        }
      }
    } catch {
      return null;
    }
    return null;
  }
}
