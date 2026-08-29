import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { createClient } from "@supabase/supabase-js";

const getAdminSecretKey = () => process.env.ADMIN_SECRET_KEY || "";
const getAllowedAdminEmails = () => 
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

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

function getDBFilePath(): string {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), ".student_portal_sync_db.json");
  }
  return path.join(process.cwd(), ".student_portal_sync_db.json");
}

// Read from database
function getDiskAccounts() {
  try {
    const dbPath = getDBFilePath();
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      if (raw.trim()) {
        const parsed = JSON.parse(raw);
        return parsed.accounts || {};
      }
    }
  } catch (err) {
    console.error("Admin API disk read error:", err);
  }
  return {};
}

// Write back to database
function writeDiskAccounts(accounts: any) {
  try {
    const dbPath = getDBFilePath();
    let currentDB: any = { accounts: {}, pins: {} };
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, "utf-8");
      if (raw.trim()) {
        currentDB = JSON.parse(raw);
      }
    }
    currentDB.accounts = accounts;
    fs.writeFileSync(dbPath, JSON.stringify(currentDB, null, 2), "utf-8");
  } catch (err) {
    console.error("Admin API disk write error:", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passkey, adminEmail, action, targetEmail, targetDeviceId } = body;

    const allowedAdminEmails = getAllowedAdminEmails();
    const adminSecretKey = getAdminSecretKey();

    // Verify Master Admin Email Clearance from Environment
    if (!adminEmail || allowedAdminEmails.length === 0 || !allowedAdminEmails.includes(adminEmail.trim().toLowerCase())) {
      return NextResponse.json({ 
        error: `Access Denied: ${adminEmail || "Your account"} does not have Master Administrator clearance.` 
      }, { status: 403 });
    }

    // Verify Master Admin Key from Environment
    if (!adminSecretKey || !passkey || passkey !== adminSecretKey) {
      return NextResponse.json({ error: "Unauthorized. Invalid Master Admin Passkey." }, { status: 401 });
    }

    // Read from disk database and memory cache
    const diskAccounts = getDiskAccounts();
    const accounts: Record<string, any> = { ...diskAccounts };

    const memoryAccounts = global.__GLOBAL_STUDENT_PORTAL_ACCOUNTS;
    if (memoryAccounts && memoryAccounts.size > 0) {
      memoryAccounts.forEach((acc, email) => {
        accounts[email.toLowerCase()] = {
          ...(accounts[email.toLowerCase()] || {}),
          ...acc
        };
      });
    }

    // Sync from Supabase PostgreSQL profiles table & Auth Users
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data: supaProfiles } = await supabase.from("profiles").select("*");
        if (Array.isArray(supaProfiles)) {
          supaProfiles.forEach((p: any) => {
            if (p.email) {
              const emailKey = p.email.trim().toLowerCase();
              if (!accounts[emailKey]) {
                accounts[emailKey] = {
                  id: p.id,
                  email: emailKey,
                  passwordHash: p.password_hash || "OAuth Verified",
                  fullName: p.full_name || "Student",
                  university: p.university || "University of Delhi",
                  degree: p.degree || "Bachelor of Technology (B.Tech)",
                  major: p.major || "Computer Science",
                  semester: p.semester || "Semester 1",
                  googleCalendarSynced: p.google_calendar_synced ?? true,
                  createdAt: p.created_at || new Date().toISOString(),
                  lastLoginAt: p.last_login_at || new Date().toISOString(),
                  activeSessions: Array.isArray(p.active_sessions) ? p.active_sessions : [],
                  courses: Array.isArray(p.courses_json) ? p.courses_json : [],
                  tasks: Array.isArray(p.tasks_json) ? p.tasks_json : [],
                  exams: Array.isArray(p.exams_json) ? p.exams_json : [],
                  documents: Array.isArray(p.documents_json) ? p.documents_json : []
                };
              }
            }
          });
        }

        // Also discover users registered directly in Supabase Auth
        if (supabase.auth?.admin) {
          const { data: authUsers } = await supabase.auth.admin.listUsers();
          if (authUsers && Array.isArray(authUsers.users)) {
            authUsers.users.forEach((u: any) => {
              if (u.email) {
                const emailKey = u.email.trim().toLowerCase();
                if (!accounts[emailKey]) {
                  const meta = u.user_metadata || {};
                  accounts[emailKey] = {
                    id: u.id,
                    email: emailKey,
                    passwordHash: "Supabase Auth",
                    fullName: meta.full_name || "Student",
                    university: meta.university || "University of Delhi",
                    degree: meta.degree || "Bachelor of Technology (B.Tech)",
                    major: meta.major || "Computer Science",
                    semester: meta.semester || "Semester 1",
                    googleCalendarSynced: meta.google_calendar_synced ?? true,
                    createdAt: u.created_at || new Date().toISOString(),
                    lastLoginAt: u.last_sign_in_at || new Date().toISOString(),
                    activeSessions: [],
                    courses: [],
                    tasks: [],
                    exams: [],
                    documents: []
                  };
                }
              }
            });
          }
        }
      } catch (err) {
        console.warn("Admin Supabase sync notice:", err);
      }
    }

    // Support client accounts reconciliation passed by Admin browser
    if (Array.isArray(body.clientAccounts) && body.clientAccounts.length > 0) {
      body.clientAccounts.forEach((ca: any) => {
        if (ca && ca.email) {
          const eKey = ca.email.trim().toLowerCase();
          if (!accounts[eKey]) {
            accounts[eKey] = {
              id: ca.id || `usr_${Date.now()}`,
              email: eKey,
              passwordHash: ca.passwordHash || "Verified",
              fullName: ca.fullName || "Student",
              university: ca.university || "University of Delhi",
              degree: ca.degree || "Bachelor of Technology (B.Tech)",
              major: ca.major || "Computer Science",
              semester: ca.semester || "Semester 1",
              googleCalendarSynced: ca.googleCalendarSynced ?? true,
              createdAt: ca.createdAt || new Date().toISOString(),
              lastLoginAt: ca.lastLoginAt || new Date().toISOString(),
              activeSessions: ca.activeSessions || []
            };
          }
        }
      });
      writeDiskAccounts(accounts);
    }

    // 1. FETCH ALL ACCOUNTS & CONNECTED DEVICES
    if (!action || action === "list-all") {
      const registry = Object.values(accounts).map((acc: any) => ({
        id: acc.id,
        email: acc.email,
        passwordHash: acc.passwordHash || "OAuth Verified",
        fullName: acc.fullName || "Student",
        university: acc.university || "University of Delhi",
        degree: acc.degree || "B.Tech in Computer Science",
        major: acc.major || "Computer Science",
        semester: acc.semester || "Semester 1",
        googleCalendarSynced: acc.googleCalendarSynced ?? true,
        createdAt: acc.createdAt || new Date().toISOString(),
        lastLoginAt: acc.lastLoginAt || new Date().toISOString(),
        tasksCount: (acc.tasks || []).length,
        coursesCount: (acc.courses || []).length,
        examsCount: (acc.exams || []).length,
        documentsCount: (acc.documents || []).length,
        activeSessions: (acc.activeSessions || []).map((s: any) => ({
          deviceId: s.deviceId,
          deviceName: s.deviceName || "Desktop Device",
          deviceType: s.deviceType || "desktop",
          browser: s.browser || "Chrome",
          os: s.os || "Windows",
          loginTimestamp: s.loginTimestamp || acc.lastLoginAt || new Date().toISOString(),
          lastActiveTimestamp: s.lastActiveTimestamp || new Date().toISOString()
        }))
      }));

      // Calculate aggregates
      let totalDevices = 0;
      const universitiesSet = new Set<string>();
      registry.forEach(u => {
        totalDevices += u.activeSessions.length;
        if (u.university) universitiesSet.add(u.university);
      });

      return NextResponse.json({
        success: true,
        stats: {
          totalUsers: registry.length,
          totalDevices,
          totalUniversities: universitiesSet.size,
          serverTimestamp: new Date().toISOString()
        },
        users: registry
      });
    }

    // 2. ADMIN REVOKE SPECIFIC DEVICE SESSION
    if (action === "revoke-device") {
      if (!targetEmail || !targetDeviceId) {
        return NextResponse.json({ error: "Missing targetEmail or targetDeviceId" }, { status: 400 });
      }

      const email = targetEmail.trim().toLowerCase();
      const account = accounts[email];
      if (account) {
        account.activeSessions = (account.activeSessions || []).filter(
          (s: any) => s.deviceId !== targetDeviceId
        );
        accounts[email] = account;

        if (memoryAccounts) {
          memoryAccounts.set(email, account);
        }
        writeDiskAccounts(accounts);
      }

      return NextResponse.json({ success: true, message: "Device session revoked by Admin" });
    }

    // 3. ADMIN REVOKE ALL SESSIONS FOR A USER
    if (action === "revoke-all-sessions") {
      if (!targetEmail) {
        return NextResponse.json({ error: "Missing targetEmail" }, { status: 400 });
      }

      const email = targetEmail.trim().toLowerCase();
      const account = accounts[email];
      if (account) {
        account.activeSessions = [];
        accounts[email] = account;

        if (memoryAccounts) {
          memoryAccounts.set(email, account);
        }
        writeDiskAccounts(accounts);
      }

      return NextResponse.json({ success: true, message: "All device sessions revoked for user" });
    }

    // 4. ADMIN PURGE / DELETE ACCOUNT
    if (action === "delete-account") {
      if (!targetEmail) {
        return NextResponse.json({ error: "Missing targetEmail" }, { status: 400 });
      }

      const email = targetEmail.trim().toLowerCase();
      delete accounts[email];

      if (memoryAccounts) {
        memoryAccounts.delete(email);
      }
      writeDiskAccounts(accounts);

      // Clean from Supabase PostgreSQL table & Auth
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("profiles").delete().eq("email", email);
          if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            try {
              const { data: userData } = await supabase.auth.admin.listUsers();
              const authUser = userData?.users?.find(u => u.email?.toLowerCase() === email);
              if (authUser) {
                await supabase.auth.admin.deleteUser(authUser.id);
              }
            } catch {}
          }
        } catch (e) {
          console.warn("Supabase profile purge notice:", e);
        }
      }

      return NextResponse.json({ success: true, message: `Account ${email} permanently purged by Administrator` });
    }

    // 5. ADMIN PURGE ALL ACCOUNTS (Wipe entire database for fresh start)
    if (action === "purge-all-accounts") {
      Object.keys(accounts).forEach(k => delete accounts[k]);

      if (memoryAccounts) {
        memoryAccounts.clear();
      }
      writeDiskAccounts({});

      // Clean all from Supabase PostgreSQL tables
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("profiles").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase.from("tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase.from("courses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          await supabase.from("exams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } catch (e) {
          console.warn("Supabase all profile purge notice:", e);
        }
      }

      return NextResponse.json({ success: true, message: "All accounts permanently purged from database" });
    }

    return NextResponse.json({ error: "Unknown admin action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
