import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { createClient } from "@supabase/supabase-js";
import { ActiveDeviceSession } from "@/lib/types";
import { sendPasswordResetEmailViaResend } from "@/lib/email-service";
import { hashPassword, verifyPassword } from "@/lib/password-security";
import { verifyGoogleIdToken } from "@/lib/google-auth-verifier";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limiter";

// Dual-layer Persistent Store (In-Memory + Disk File Database + Supabase Cloud Sync)
// Supports Concurrent Multi-Device Sessions:
// - Students can be logged in simultaneously on Phone, Tablet, Laptop, and Desktop.
// - Logging in on Device B keeps Device A active with real-time state synchronization.
// - View active devices and remotely revoke sessions if needed.

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: { persistSession: false }
    });
  } catch {
    return null;
  }
}

async function getAccountFromSupabase(email: string): Promise<StoredAccount | undefined> {
  const supabase = getSupabaseClient();
  if (!supabase) return undefined;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (data && !error) {
      return {
        id: data.id,
        email: (data.email || email).trim().toLowerCase(),
        passwordHash: data.password_hash || "",
        fullName: data.full_name || "Student",
        university: data.university || "University of Waterloo",
        degree: data.degree || "Bachelor of Technology (B.Tech)",
        major: data.major || "Computer Science",
        semester: data.semester || "Fall 2026",
        googleCalendarSynced: data.google_calendar_synced ?? true,
        densityPreference: data.density_preference || "comfortable",
        createdAt: data.created_at || new Date().toISOString(),
        lastLoginAt: data.last_login_at || new Date().toISOString(),
        activeSessions: Array.isArray(data.active_sessions) ? data.active_sessions : [],
        courses: Array.isArray(data.courses_json) ? data.courses_json : [],
        tasks: Array.isArray(data.tasks_json) ? data.tasks_json : [],
        exams: Array.isArray(data.exams_json) ? data.exams_json : [],
        documents: Array.isArray(data.documents_json) ? data.documents_json : []
      };
    }
  } catch (err) {
    console.warn("Supabase profile read notice:", err);
  }
  return undefined;
}

async function saveAccountToSupabase(acc: StoredAccount): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from("profiles").upsert({
      id: acc.id,
      email: acc.email.toLowerCase(),
      full_name: acc.fullName,
      university: acc.university,
      major: acc.major,
      degree: acc.degree,
      semester: acc.semester,
      password_hash: acc.passwordHash,
      google_calendar_synced: acc.googleCalendarSynced,
      density_preference: acc.densityPreference,
      last_login_at: acc.lastLoginAt,
      active_sessions: acc.activeSessions,
      courses_json: acc.courses || [],
      tasks_json: acc.tasks || [],
      exams_json: acc.exams || [],
      documents_json: acc.documents || [],
      updated_at: new Date().toISOString()
    }, { onConflict: "email" });
  } catch (err) {
    console.warn("Supabase profile save notice:", err);
  }
}

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
  failedAttempts?: number;
}

interface PersistentDB {
  accounts: Record<string, StoredAccount>;
  pins: Record<string, ResetPinRecord>;
}

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

      const rawPassword = account.passwordHash || "";
      const securePasswordHash = rawPassword ? (rawPassword.startsWith("pbkdf2$") ? rawPassword : hashPassword(rawPassword)) : "";

      const record: StoredAccount = {
        id: account.id || existing?.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        email,
        passwordHash: securePasswordHash,
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
      await saveAccountToSupabase(record);

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
        account = await getAccountFromSupabase(trimmedEmail);
        if (account) {
          accountsStore.set(trimmedEmail, account);
          syncToDisk();
        }
      }

      if (!account) {
        return NextResponse.json({ 
          success: false, 
          notFound: true,
          error: "Account not registered. Please switch to 'Create Account' to register your student profile first." 
        }, { status: 200 });
      }

      // Rate Limit: Max 5 failed password attempts per IP/email in 5 minutes
      const loginLimitKey = `login_fail:${trimmedEmail}:${ip}`;
      const loginLimit = checkRateLimit(loginLimitKey, 5, 5 * 60 * 1000);
      if (!loginLimit.allowed) {
        return NextResponse.json({
          success: false,
          error: `Too many failed login attempts. For security, please wait ${loginLimit.retryAfterSeconds} seconds before trying again.`
        }, { status: 429 });
      }

      const { isValid, needsUpgrade } = verifyPassword(password, account.passwordHash);
      if (!isValid) {
        return NextResponse.json({ 
          success: false, 
          error: "Incorrect password for this student account. Please check your credentials." 
        }, { status: 200 });
      }

      // Clear login fail rate limit on successful authentication
      clearRateLimit(loginLimitKey);

      // Automatically upgrade legacy plaintext password to secure PBKDF2 salt hash
      if (needsUpgrade) {
        account.passwordHash = hashPassword(password);
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
      await saveAccountToSupabase(account);

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
      const { email, googleIdToken, deviceInfo } = body;
      if (!email) {
        return NextResponse.json({ error: "Google email is required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Cryptographic Google OAuth ID Token Verification
      if (googleIdToken) {
        const verification = await verifyGoogleIdToken(googleIdToken);
        if (!verification.valid || !verification.payload) {
          return NextResponse.json({ 
            success: false, 
            error: verification.error || "Google Identity verification failed. Please authenticate with Google again." 
          }, { status: 401 });
        }
        if (verification.payload.email.toLowerCase() !== trimmedEmail) {
          return NextResponse.json({ 
            success: false, 
            error: "Security Alert: Google token email does not match requested student email." 
          }, { status: 403 });
        }
      }

      let account = accountsStore.get(trimmedEmail);

      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
        if (account) {
          accountsStore.set(trimmedEmail, account);
        }
      }

      if (!account) {
        account = await getAccountFromSupabase(trimmedEmail);
        if (account) {
          accountsStore.set(trimmedEmail, account);
          syncToDisk();
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
      await saveAccountToSupabase(account);

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

      // Query Supabase for newest updates made from another device
      const supaAccount = await getAccountFromSupabase(trimmedEmail);
      if (supaAccount) {
        account = {
          ...(account || supaAccount),
          ...supaAccount,
          courses: supaAccount.courses || account?.courses || [],
          tasks: supaAccount.tasks || account?.tasks || [],
          exams: supaAccount.exams || account?.exams || [],
          documents: supaAccount.documents || account?.documents || []
        };
        accountsStore.set(trimmedEmail, account);
        syncToDisk();
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
        await saveAccountToSupabase(account);
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
        await saveAccountToSupabase(account);
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
        account = await getAccountFromSupabase(trimmedEmail);
      }

      if (!account) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      if (currentPassword) {
        const { isValid } = verifyPassword(currentPassword, account.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
        }
      }

      account.passwordHash = hashPassword(newPassword);
      accountsStore.set(trimmedEmail, account);
      syncToDisk();
      await saveAccountToSupabase(account);

      return NextResponse.json({ success: true });
    }

    // 7. REQUEST RESET PIN & DISPATCH VIA GMAIL SMTP / RESEND
    if (action === "request-reset") {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Rate Limit: Max 3 reset email dispatches per 15 minutes per email/IP to prevent quota exhaustion
      const resetLimit = checkRateLimit(`reset_req:${trimmedEmail}:${ip}`, 3, 15 * 60 * 1000);
      if (!resetLimit.allowed) {
        return NextResponse.json({ 
          success: false, 
          error: `Too many password reset requests. For security, please wait ${Math.ceil(resetLimit.retryAfterSeconds / 60)} minute(s) before requesting another code.` 
        }, { status: 429 });
      }
      
      // Check if account exists in memory, disk, or Supabase
      let account: StoredAccount | undefined = accountsStore.get(trimmedEmail) || readDiskDB().accounts[trimmedEmail];
      if (!account) {
        account = await getAccountFromSupabase(trimmedEmail);
      }
      if (!account) {
        return NextResponse.json({ 
          success: false, 
          error: "No registered student account found with this email. Please click 'Create Account' to register first." 
        }, { status: 404 });
      }

      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      
      const pinRecord: ResetPinRecord = {
        code: pin,
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        failedAttempts: 0
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

    // 8. RESET PASSWORD WITH PIN (Includes 5-Attempt Lockout)
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

      if (!pinRecord || Date.now() > pinRecord.expiresAt) {
        return NextResponse.json({ error: "Invalid or expired recovery PIN code. Please request a new code." }, { status: 400 });
      }

      // Check PIN validity with strict 5-attempt lockout defense
      if (pinRecord.code !== code.trim()) {
        pinRecord.failedAttempts = (pinRecord.failedAttempts || 0) + 1;
        pinsStore.set(trimmedEmail, pinRecord);
        syncToDisk();

        if (pinRecord.failedAttempts >= 5) {
          pinsStore.delete(trimmedEmail);
          syncToDisk();
          return NextResponse.json({ 
            error: "Security Alert: Too many incorrect PIN attempts. This recovery code has been invalidated. Please request a new code." 
          }, { status: 403 });
        }

        return NextResponse.json({ 
          error: `Incorrect recovery code. ${5 - pinRecord.failedAttempts} attempt(s) remaining before invalidation.` 
        }, { status: 400 });
      }

      let account = accountsStore.get(trimmedEmail);
      if (!account) {
        const disk = readDiskDB();
        account = disk.accounts[trimmedEmail];
      }
      if (!account) {
        account = await getAccountFromSupabase(trimmedEmail);
      }

      if (account) {
        account.passwordHash = hashPassword(newPassword);
        accountsStore.set(trimmedEmail, account);
        await saveAccountToSupabase(account);
      }

      pinsStore.delete(trimmedEmail);
      syncToDisk();

      return NextResponse.json({ success: true });
    }

    // 9. SYNC USER DATA (Cross-device tasks, exams, documents with ID-based Conflict Resolution)
    if (action === "sync-data" || action === "sync") {
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
      if (!account) {
        account = await getAccountFromSupabase(trimmedEmail);
      }

      if (account) {
        // Intelligent ID-based merge for tasks (prevents multi-device overwrite race)
        if (Array.isArray(userData.tasks)) {
          const taskMap = new Map<string, any>();
          (account.tasks || []).forEach((t: any) => { if (t?.id) taskMap.set(t.id, t); });
          userData.tasks.forEach((t: any) => { if (t?.id) taskMap.set(t.id, t); });
          account.tasks = Array.from(taskMap.values());
        }

        // Intelligent ID-based merge for exams
        if (Array.isArray(userData.exams)) {
          const examMap = new Map<string, any>();
          (account.exams || []).forEach((e: any) => { if (e?.id) examMap.set(e.id, e); });
          userData.exams.forEach((e: any) => { if (e?.id) examMap.set(e.id, e); });
          account.exams = Array.from(examMap.values());
        }

        // Intelligent ID-based merge for course documents & materials
        if (Array.isArray(userData.documents)) {
          const docMap = new Map<string, any>();
          (account.documents || []).forEach((d: any) => { if (d?.id) docMap.set(d.id, d); });
          userData.documents.forEach((d: any) => { if (d?.id) docMap.set(d.id, d); });
          account.documents = Array.from(docMap.values());
        }

        if (Array.isArray(userData.courses) && userData.courses.length > 0) {
          account.courses = userData.courses;
        }

        accountsStore.set(trimmedEmail, account);
        syncToDisk();
        await saveAccountToSupabase(account);
      }

      return NextResponse.json({ 
        success: true, 
        userData: {
          courses: account?.courses || [],
          tasks: account?.tasks || [],
          exams: account?.exams || [],
          documents: account?.documents || []
        }
      });
    }

    // 10. DELETE ACCOUNT (Permanently purge from memory, disk database, and Supabase Cloud)
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

      // Cascade delete from Supabase PostgreSQL cloud database
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("profiles").delete().eq("email", trimmedEmail);
        } catch (err) {
          console.warn("Supabase profile delete notice:", err);
        }
      }

      return NextResponse.json({ success: true, message: "Account permanently purged from database" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("Auth sync error:", err);
    return NextResponse.json({ error: err.message || "Server auth sync error" }, { status: 500 });
  }
}
