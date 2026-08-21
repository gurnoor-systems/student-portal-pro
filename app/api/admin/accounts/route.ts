import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import os from "os";

const getAdminSecretKey = () => process.env.ADMIN_SECRET_KEY || "";
const getAllowedAdminEmails = () => 
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

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

    // Merge disk accounts and in-memory accounts so no registered user or admin is ever missed
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

    // 1. FETCH ALL ACCOUNTS & CONNECTED DEVICES
    if (!action || action === "list-all") {
      const registry = Object.values(accounts).map((acc: any) => ({
        id: acc.id,
        email: acc.email,
        fullName: acc.fullName || "Student",
        university: acc.university || "University of Waterloo",
        degree: acc.degree || "B.Tech in Computer Science",
        major: acc.major || "Computer Science",
        semester: acc.semester || "Fall 2026",
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

      return NextResponse.json({ success: true, message: `Account ${email} permanently purged by Administrator` });
    }

    return NextResponse.json({ error: "Unknown admin action" }, { status: 400 });
  } catch (err: any) {
    console.error("Admin API error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
