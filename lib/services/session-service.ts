import { ActiveDeviceSession, UserProfile, UserData } from "@/lib/types";

/**
 * Domain Service: Client Session & Device Management
 * Manages device fingerprinting, session persistence, schema upgrades, and logout purges.
 */

export class SessionService {
  private static DEVICE_KEY = "student_portal_device_id";
  private static ACTIVE_USER_KEY = "student_portal_active_user";

  /**
   * Retrieves or generates a persistent device session fingerprint
   */
  static getDeviceDetails(): {
    deviceId: string;
    deviceName: string;
    deviceType: "mobile" | "desktop" | "tablet";
    browser: string;
    os: string;
  } {
    if (typeof window === "undefined") {
      return {
        deviceId: "srv_dev",
        deviceName: "Server",
        deviceType: "desktop",
        browser: "Node",
        os: "Server"
      };
    }

    let deviceId = localStorage.getItem(this.DEVICE_KEY);
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(this.DEVICE_KEY, deviceId);
    }

    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua);
    const deviceType: "mobile" | "desktop" | "tablet" = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

    let browser = "Browser";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Edg")) browser = "Edge";
    else if (ua.includes("Firefox")) browser = "Firefox";

    let os = "Desktop";
    if (ua.includes("iPhone")) os = "iOS";
    else if (ua.includes("iPad")) os = "iPadOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";

    return {
      deviceId,
      deviceName: `${browser} on ${os}`,
      deviceType,
      browser,
      os
    };
  }

  /**
   * Reads and auto-upgrades the active stored session profile
   */
  static getActiveSession(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(this.ACTIVE_USER_KEY);
      if (!stored) return null;

      const parsed: UserProfile = JSON.parse(stored);
      if (parsed && parsed.id && parsed.email) {
        // Schema upgrade backfill
        return {
          ...parsed,
          university: parsed.university || "University of Delhi",
          degree: parsed.degree || "B.Tech (Bachelor of Technology)",
          semester: parsed.semester || "Semester 1",
          major: parsed.major || "Computer Science",
          densityPreference: parsed.densityPreference || "comfortable",
          googleCalendarSynced: parsed.googleCalendarSynced ?? true,
          activeSessions: Array.isArray(parsed.activeSessions) ? parsed.activeSessions : []
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Saves active user profile to localStorage
   */
  static saveActiveSession(profile: UserProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.ACTIVE_USER_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save active session:", e);
    }
  }

  /**
   * Purges all active session and cache tokens on logout
   */
  static purgeSession(userId?: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(this.ACTIVE_USER_KEY);
      if (userId) {
        // Note: user data is kept partitioned under student_portal_user_${userId}_data
        // for offline capability unless account deletion is explicitly requested.
      }
    } catch {}
  }

  /**
   * Fully deletes all student records from device (on account deletion)
   */
  static deleteAccountStorage(userId: string): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(this.ACTIVE_USER_KEY);
      localStorage.removeItem(`student_portal_user_${userId}_data`);
      localStorage.removeItem(`student_portal_pending_sync_${userId}`);
      localStorage.removeItem(`student_portal_user_${userId}_focus_history`);
    } catch {}
  }
}
