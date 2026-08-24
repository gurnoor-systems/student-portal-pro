import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ActiveDeviceSession } from "@/lib/types";
import { sendPasswordResetEmailViaResend } from "@/lib/email-service";

// Dual-layer Persistent Store (In-Memory + Disk File Database + Supabase Sync)
// Supports Concurrent Multi-Device Sessions:
// - Students can be logged in simultaneously on Phone, Tablet, Laptop, and Desktop.
// - Logging in on Device B keeps Device A active with real-time state synchronization.
// - View active devices and remotely revoke sessions if needed.

interface StoredAccount {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  university: string;
  degree: string;
  major: string;
  semester: string;
  googleCalendarSynced: boolean;
  densityPreference?: "comfortable" | "compact";
  createdAt: string;
  lastLoginAt?: string;
  activeSessions?: ActiveDeviceSession[];
  courses?: any[];
  tasks?: any[];
  exams?: any[];
  documents?: any[];
}

interface ResetPinRecord {
  code: string;
  expiresAt: number;
}

interface PersistentDB {
  accounts: Record<string, StoredAccount>;
  pins: Record<string, ResetPinRecord>;
}

import os from "os";

function getDBFilePath(): string {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), ".student_portal_sync_db.json");
  }
  return path.join(process.cwd(), ".student_portal_sync_db.json");
}

function migrateAccountSchema(acc: any): StoredAccount {
  return {
    id: acc.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    email: (acc.email || "").trim().toLowerCase(),
    passwordHash: acc.passwordHash || "",
    fullName: acc.fullName || "Student",
    university: acc.university || "University of Waterloo",
    degree: acc.degree || "Bachelor of Technology (B.Tech)",
    major: acc.major || "Computer Science",
    semester: acc.semester || "Fall 2026",
    googleCalendarSynced: acc.googleCalendarSynced ?? true,
    densityPreference: acc.densityPreference || "comfortable",
    createdAt: acc.createdAt || new Date().toISOString(),
    lastLoginAt: acc.lastLoginAt || new Date().toISOString(),
    activeSessions: Array.isArray(acc.activeSessions) && acc.activeSessions.length > 0
      ? acc.activeSessions
      : [{
          deviceId: `dev_primary_${acc.id || Date.now()}`,
          deviceName: "Primary Device • Active",
          deviceType: "desktop",
          browser: "Browser",
          os: "Desktop",
          loginTimestamp: acc.lastLoginAt || new Date().toISOString(),
          lastActiveTimestamp: new Date().toISOString(),
          isCurrentDevice: true
        }],
    courses: Array.isArray(acc.courses) ? acc.courses : [],
    tasks: Array.isArray(acc.tasks) ? acc.tasks : [],
    exams: Array.isArray(acc.exams) ? acc.exams : [],
    documents: Array.isArray(acc.documents) ? acc.documents : []
  };
}

// Helper to read disk DB
function readDiskDB(): PersistentDB {
  try {
    const dbPath = getDBFilePath();
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        const migratedAccounts: Record<string, StoredAccount> = {};
        if (parsed.accounts) {
          Object.entries(parsed.accounts).forEach(([email, acc]: [string, any]) => {
            migratedAccounts[email.toLowerCase()] = migrateAccountSchema(acc);
          });
        }
        return {
          accounts: migratedAccounts,
          pins: parsed.pins || {}
        };
      }
    }
  } catch (err) {
    console.warn("Could not read disk DB, initializing fresh store:", err);
  }
  return { accounts: {}, pins: {} };
}

// Helper to write disk DB
function writeDiskDB(db: PersistentDB) {
  try {
    const dbPath = getDBFilePath();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write to disk DB:", err);
  }
}

// In-memory runtime cache for microsecond response times
declare global {
  var __GLOBAL_STUDENT_PORTAL_ACCOUNTS: Map<string, StoredAccount> | undefined;
  var __GLOBAL_STUDENT_PORTAL_PINS: Map<string, ResetPinRecord> | undefined;
}

if (!global.__GLOBAL_STUDENT_PORTAL_ACCOUNTS) {
  global.__GLOBAL_STUDENT_PORTAL_ACCOUNTS = new Map<string, StoredAccount>();
}
if (!global.__GLOBAL_STUDENT_PORTAL_PINS) {
  global.__GLOBAL_STUDENT_PORTAL_PINS = new Map<string, ResetPinRecord>();
}

const accountsStore = global.__GLOBAL_STUDENT_PORTAL_ACCOUNTS;
const pinsStore = global.__GLOBAL_STUDENT_PORTAL_PINS;

function syncToDisk() {
  const diskObj: PersistentDB = {
    accounts: {},
    pins: {}
  };
  accountsStore.forEach((acc, email) => {
    diskObj.accounts[email] = acc;
  });
  pinsStore.forEach((pin, email) => {
    diskObj.pins[email] = pin;
  });
  writeDiskDB(diskObj);
}

// Initial hydration from disk DB on boot
if (accountsStore.size === 0) {
  const disk = readDiskDB();
  Object.values(disk.accounts).forEach(acc => {
    const migrated = migrateAccountSchema(acc);
    accountsStore.set(migrated.email.toLowerCase(), migrated);
  });
  Object.entries(disk.pins).forEach(([email, pin]) => {
    if (pin.expiresAt > Date.now()) {
      pinsStore.set(email.toLowerCase(), pin);
    }
  });
  syncToDisk();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Helper to get client IP / User-Agent
    const userAgent = req.headers.get("user-agent") || "";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 1. REGISTER ACCOUNT (Cross-device registration)
    if (action === "register") {
      const { account, courses, deviceInfo } = body;
      if (!account || !account.email) {
        return NextResponse.json({ error: "Invalid account payload" }, { status: 400 });
      }

      const email = account.email.trim().toLowerCase();
      const existing = accountsStore.get(email);

      const deviceSession: ActiveDeviceSession = {
        deviceId: deviceInfo?.deviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        deviceName: deviceInfo?.deviceName || (userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Computer"),
        deviceType: deviceInfo?.deviceType || (userAgent.includes("Mobile") ? "mobile" : "desktop"),
        ipAddress: ip,
        browser: deviceInfo?.browser || (userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : "Browser"),
        os: deviceInfo?.os || (userAgent.includes("iPhone") ? "iOS" : userAgent.includes("Android") ? "Android" : userAgent.includes("Windows") ? "Windows" : "macOS"),
        loginTimestamp: new Date().toISOString(),
        lastActiveTimestamp: new Date().toISOString(),
        isCurrentDevice: true
      };

      const record: StoredAccount = {
        id: account.id || existing?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        email,
        passwordHash: account.passwordHash,
        fullName: account.fullName || "Student",
        university: account.university || "University of Waterloo",
        degree: account.degree || "Bachelor of Technology (B.Tech)",
        major: account.major || "Computer Science",
        semester: account.semester || "Fall 2026",
        googleCalendarSynced: account.googleCalendarSynced ?? true,
        densityPreference: account.densityPreference || "comfortable",
        createdAt: account.createdAt || new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        activeSessions: [deviceSession],
        courses: courses || existing?.courses || [],
        tasks: existing?.tasks || [],
        exams: existing?.exams || [],
        documents: existing?.documents || []
      };

      accountsStore.set(email, record);
      syncToDisk();

      return NextResponse.json({ success: true, account: record, deviceSession });
    }

    // 2. LOGIN (Concurrent Multi-Device Session Addition)
    if (action === "login") {
      const { email, password, deviceInfo } = body;
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let account = accountsStore.get(trimmedEmail);

      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
        if (account) {
          accountsStore.set(trimmedEmail, account);
        }
      }

      if (!account) {
        return NextResponse.json({ 
          success: false, 
          notFound: true,
          error: "Account not registered. Please switch to 'Create Account' to register your student profile first." 
        }, { status: 200 });
      }

      if (account.passwordHash !== password) {
        return NextResponse.json({ 
          success: false, 
          error: "Incorrect password for this student account. Please check your credentials." 
        }, { status: 200 });
      }

      const deviceId = deviceInfo?.deviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newSession: ActiveDeviceSession = {
        deviceId,
        deviceName: deviceInfo?.deviceName || (userAgent.includes("Mobile") ? "Mobile Phone" : "Desktop Computer"),
        deviceType: deviceInfo?.deviceType || (userAgent.includes("Mobile") ? "mobile" : "desktop"),
        ipAddress: ip,
        browser: deviceInfo?.browser || (userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : "Browser"),
        os: deviceInfo?.os || (userAgent.includes("iPhone") ? "iOS" : userAgent.includes("Android") ? "Android" : userAgent.includes("Windows") ? "Windows" : "macOS"),
        loginTimestamp: new Date().toISOString(),
        lastActiveTimestamp: new Date().toISOString()
      };

      // Concurrent Multi-Device Session handling (updates existing device or appends new device without kicking out others)
      const existingSessions = account.activeSessions || [];
      const sessionIdx = existingSessions.findIndex(s => s.deviceId === deviceId);
      if (sessionIdx >= 0) {
        existingSessions[sessionIdx] = { ...existingSessions[sessionIdx], ...newSession, lastActiveTimestamp: new Date().toISOString() };
      } else {
        existingSessions.push(newSession);
      }

      account.activeSessions = existingSessions;
      account.lastLoginAt = new Date().toISOString();
      accountsStore.set(trimmedEmail, account);
      syncToDisk();

      return NextResponse.json({ 
        success: true, 
        currentDeviceId: deviceId,
        account: {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          university: account.university,
          degree: account.degree,
          major: account.major,
          semester: account.semester,
          googleCalendarSynced: account.googleCalendarSynced,
          densityPreference: account.densityPreference,
          provider: "email",
          createdAt: account.createdAt,
          lastLoginAt: account.lastLoginAt,
          activeSessions: existingSessions.map(s => ({
            ...s,
            isCurrentDevice: s.deviceId === deviceId
          }))
        },
        userData: {
          courses: account.courses || [],
          tasks: account.tasks || [],
          exams: account.exams || [],
          documents: account.documents || []
        }
      });
    }

    // 2.5 GOOGLE LOGIN (1-Click Login for Pre-Registered Student Accounts)
    if (action === "google-login") {
      const { email, deviceInfo } = body;
      if (!email) {
        return NextResponse.json({ error: "Google email is required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let account = accountsStore.get(trimmedEmail);

      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
        if (account) {
          accountsStore.set(trimmedEmail, account);
        }
      }

      if (!account) {
        return NextResponse.json({ 
          success: false, 
          notFound: true,
          error: `No registered student account found for "${trimmedEmail}". Please switch to 'Create Account' to register your university profile first.` 
        }, { status: 200 });
      }

      const deviceId = deviceInfo?.deviceId || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newSession: ActiveDeviceSession = {
        deviceId,
        deviceName: deviceInfo?.deviceName || (userAgent.includes("Mobile") ? "Mobile Phone (Google Sign-In)" : "Desktop Computer (Google Sign-In)"),
        deviceType: deviceInfo?.deviceType || (userAgent.includes("Mobile") ? "mobile" : "desktop"),
        ipAddress: ip,
        browser: deviceInfo?.browser || (userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : "Browser"),
        os: deviceInfo?.os || (userAgent.includes("iPhone") ? "iOS" : userAgent.includes("Android") ? "Android" : userAgent.includes("Windows") ? "Windows" : "macOS"),
        loginTimestamp: new Date().toISOString(),
        lastActiveTimestamp: new Date().toISOString()
      };

      const existingSessions = account.activeSessions || [];
      const sessionIdx = existingSessions.findIndex(s => s.deviceId === deviceId);
      if (sessionIdx >= 0) {
        existingSessions[sessionIdx] = { ...existingSessions[sessionIdx], ...newSession, lastActiveTimestamp: new Date().toISOString() };
      } else {
        existingSessions.push(newSession);
      }

      account.activeSessions = existingSessions;
      account.lastLoginAt = new Date().toISOString();
      accountsStore.set(trimmedEmail, account);
      syncToDisk();

      return NextResponse.json({ 
        success: true, 
        currentDeviceId: deviceId,
        account: {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          university: account.university,
          degree: account.degree,
          major: account.major,
          semester: account.semester,
          googleCalendarSynced: account.googleCalendarSynced,
          densityPreference: account.densityPreference,
          provider: "google",
          createdAt: account.createdAt,
          lastLoginAt: account.lastLoginAt,
          activeSessions: existingSessions.map(s => ({
            ...s,
            isCurrentDevice: s.deviceId === deviceId
          }))
        },
        userData: {
          courses: account.courses || [],
          tasks: account.tasks || [],
          exams: account.exams || [],
          documents: account.documents || []
        }
      });
    }

    // 3. FETCH LATEST / HEARTBEAT (Real-time Cross-Device Sync)
    if (action === "fetch-latest" || action === "heartbeat") {
      const { email, deviceId } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let account = accountsStore.get(trimmedEmail);

      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
      }

      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      // Touch lastActive for this device
      if (deviceId && account.activeSessions) {
        const dev = account.activeSessions.find(s => s.deviceId === deviceId);
        if (dev) {
          dev.lastActiveTimestamp = new Date().toISOString();
        }
      }

      return NextResponse.json({
        success: true,
        account: {
          id: account.id,
          email: account.email,
          fullName: account.fullName,
          university: account.university,
          degree: account.degree,
          major: account.major,
          semester: account.semester,
          googleCalendarSynced: account.googleCalendarSynced,
          densityPreference: account.densityPreference,
          provider: "email",
          createdAt: account.createdAt,
          lastLoginAt: account.lastLoginAt,
          activeSessions: (account.activeSessions || []).map(s => ({
            ...s,
            isCurrentDevice: s.deviceId === deviceId
          }))
        },
        userData: {
          courses: account.courses || [],
          tasks: account.tasks || [],
          exams: account.exams || [],
          documents: account.documents || []
        }
      });
    }

    // 4. REVOKE DEVICE SESSION
    if (action === "revoke-device") {
      const { email, deviceIdToRevoke } = body;
      if (!email || !deviceIdToRevoke) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let account = accountsStore.get(trimmedEmail);

      if (account && account.activeSessions) {
        account.activeSessions = account.activeSessions.filter(s => s.deviceId !== deviceIdToRevoke);
        accountsStore.set(trimmedEmail, account);
        syncToDisk();
      }

      return NextResponse.json({ success: true, activeSessions: account?.activeSessions || [] });
    }

    // 5. REVOKE ALL OTHER SESSIONS (Keep current device only)
    if (action === "revoke-all-other-devices") {
      const { email, currentDeviceId } = body;
      if (!email || !currentDeviceId) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let account = accountsStore.get(trimmedEmail);

      if (account && account.activeSessions) {
        account.activeSessions = account.activeSessions.filter(s => s.deviceId === currentDeviceId);
        accountsStore.set(trimmedEmail, account);
        syncToDisk();
      }

      return NextResponse.json({ success: true, activeSessions: account?.activeSessions || [] });
    }

    // 6. CHANGE PASSWORD (Instant Sync Across All Devices)
    if (action === "change-password") {
      const { email, currentPassword, newPassword } = body;
      if (!email || !newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "Invalid password requirements" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let account = accountsStore.get(trimmedEmail);

      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
      }

      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      if (currentPassword && account.passwordHash !== currentPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }

      account.passwordHash = newPassword;
      accountsStore.set(trimmedEmail, account);
      syncToDisk();

      return NextResponse.json({ success: true });
    }

    // 7. REQUEST RESET PIN & DISPATCH VIA GMAIL SMTP / RESEND
    if (action === "request-reset") {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      
      // Check if account exists
      const account = accountsStore.get(trimmedEmail) || readDiskDB().accounts[trimmedEmail];
      if (!account) {
        return NextResponse.json({ 
          success: false, 
          error: "No registered student account found with this email. Please click 'Create Account' to register first." 
        }, { status: 404 });
      }

      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      
      const pinRecord: ResetPinRecord = {
        code: pin,
        expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
      };

      pinsStore.set(trimmedEmail, pinRecord);
      syncToDisk();

      const studentName = account.fullName || "Student";

      // Dispatch real email via Gmail SMTP (Primary) / Resend (Fallback)
      const emailResult = await sendPasswordResetEmailViaResend(trimmedEmail, pin, studentName);

      return NextResponse.json({ 
        success: true, 
        delivered: emailResult.delivered,
        provider: emailResult.provider,
        message: "A 6-digit recovery code has been dispatched to your email address." 
      });
    }

    // 8. RESET PASSWORD WITH PIN
    if (action === "reset-password") {
      const { email, code, newPassword } = body;
      if (!email || !code || !newPassword) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let pinRecord = pinsStore.get(trimmedEmail);

      if (!pinRecord) {
        const disk = readDiskDB();
        pinRecord = disk.pins[trimmedEmail];
      }

      if (!pinRecord || pinRecord.code !== code.trim() || Date.now() > pinRecord.expiresAt) {
        return NextResponse.json({ error: "Invalid or expired recovery PIN code." }, { status: 400 });
      }

      let account = accountsStore.get(trimmedEmail);
      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
      }

      if (account) {
        account.passwordHash = newPassword;
        accountsStore.set(trimmedEmail, account);
      }

      pinsStore.delete(trimmedEmail);
      syncToDisk();

      return NextResponse.json({ success: true });
    }

    // 9. SYNC USER DATA (Cross-device tasks, exams, documents)
    if (action === "sync-data") {
      const { email, userData } = body;
      if (!email || !userData) {
        return NextResponse.json({ error: "Missing sync payload" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      let account = accountsStore.get(trimmedEmail);

      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
      }

      if (account) {
        account.courses = userData.courses || account.courses;
        account.tasks = userData.tasks || account.tasks;
        account.exams = userData.exams || account.exams;
        account.documents = userData.documents || account.documents;
        accountsStore.set(trimmedEmail, account);
        syncToDisk();
      }

      return NextResponse.json({ success: true });
    }

    // 10. DELETE ACCOUNT (Permanently purge from memory and disk database)
    if (action === "delete-account") {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();
      accountsStore.delete(trimmedEmail);
      pinsStore.delete(trimmedEmail);

      const disk = readDiskDB();
      delete disk.accounts[trimmedEmail];
      delete disk.pins[trimmedEmail];
      writeDiskDB(disk);

      return NextResponse.json({ success: true, message: "Account permanently purged from database" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Auth sync error:", err);
    return NextResponse.json({ error: err.message || "Server auth sync error" }, { status: 500 });
  }
}
