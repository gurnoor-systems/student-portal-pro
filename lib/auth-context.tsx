"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile, TaskItem, ExamItem, CourseItem, RegisteredAccount } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export * from "@/lib/types";

// Empty clean slate data
const EMPTY_DATA: { tasks: TaskItem[]; exams: ExamItem[]; courses: CourseItem[] } = {
  courses: [],
  tasks: [],
  exams: []
};

const simulateNetworkLatency = (ms: number = 600) => new Promise(resolve => setTimeout(resolve, ms));

export function getDeviceDetails(): { deviceId: string; deviceName: string; deviceType: "mobile" | "desktop" | "tablet"; browser: string; os: string } {
  if (typeof window === "undefined") {
    return { deviceId: "srv_dev", deviceName: "Server", deviceType: "desktop", browser: "Node", os: "Server" };
  }
  let deviceId = localStorage.getItem("student_portal_device_id");
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("student_portal_device_id", deviceId);
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
  if (ua.includes("iPhone")) os = "iPhone";
  else if (ua.includes("iPad")) os = "iPad";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Windows")) os = "Windows PC";
  else if (ua.includes("Macintosh")) os = "Mac";

  const deviceName = `${os} • ${browser}`;

  return { deviceId, deviceName, deviceType, browser, os };
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  userData: {
    tasks: TaskItem[];
    exams: ExamItem[];
    courses: CourseItem[];
  };
  signInWithPassword: (email: string, pass: string) => Promise<{ success: boolean; error?: string; emailUnconfirmed?: boolean }>;
  signUpWithPassword: (
    fullName: string, 
    university: string, 
    degree: string,
    semester: string, 
    major: string, 
    email: string, 
    pass: string,
    initialCourses?: string[],
    syncGoogleCalendar?: boolean
  ) => Promise<{ success: boolean; error?: string; confirmationEmailSent?: boolean }>;
  signInWithGoogleCustom: (
    email: string, 
    name: string, 
    uni: string, 
    deg: string, 
    sem: string, 
    major: string, 
    courses?: string[], 
    syncGoogle?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resendEmailConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  toggleGoogleCalendarSync: (enabled: boolean) => Promise<boolean>;
  toggleDensityPreference: (density: "comfortable" | "compact") => Promise<boolean>;
  getUserData: () => { tasks: TaskItem[]; exams: ExamItem[]; courses: CourseItem[] };
  addTask: (task: Omit<TaskItem, "id" | "userId">) => TaskItem;
  updateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  deleteTask: (taskId: string) => void;
  addCourse: (course: Omit<CourseItem, "id" | "userId">) => CourseItem;
  deleteCourse: (courseId: string) => void;
  addExam: (exam: Omit<ExamItem, "id" | "userId">) => ExamItem;
  deleteExam: (examId: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; resetCode?: string; error?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  rolloverSemester: (nextSemester: string, clearPreviousSubjects: boolean) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  revokeDeviceSession: (deviceId: string) => Promise<boolean>;
  revokeAllOtherDevices: () => Promise<boolean>;
  refreshMultiDeviceSync: () => Promise<void>;
  getTotalRegisteredUsersCount: () => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<{ tasks: TaskItem[]; exams: ExamItem[]; courses: CourseItem[] }>(EMPTY_DATA);

  // Helper to load user's data from localStorage
  const loadUserData = useCallback((userId: string) => {
    const storageKey = `student_portal_user_${userId}_data`;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setUserData(JSON.parse(raw));
      } else {
        setUserData(EMPTY_DATA);
      }
    } catch {
      setUserData(EMPTY_DATA);
    }
  }, []);

  // Helper to persist updated user data across devices
  const persistUserData = useCallback((userId: string, next: { tasks: TaskItem[]; exams: ExamItem[]; courses: CourseItem[] }) => {
    setUserData(next);
    const storageKey = `student_portal_user_${userId}_data`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (e) {
      console.error("Failed to persist user data:", e);
    }

    if (user?.email) {
      try {
        fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync-data",
            email: user.email,
            userData: next
          })
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  }, [user]);

  // Initialize session on mount (Preserves active session reliably across mobile & desktop & backfills new features)
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("student_portal_active_user");
      if (storedUser) {
        const parsed: UserProfile = JSON.parse(storedUser);
        if (parsed && parsed.id && parsed.email) {
          const deviceInfo = getDeviceDetails();
          
          // Auto-upgrade schema for existing accounts (Feature Backfill)
          const upgradedProfile: UserProfile = {
            ...parsed,
            university: parsed.university || "University of Waterloo",
            degree: parsed.degree || "B.Tech (Bachelor of Technology)",
            semester: parsed.semester || "Fall 2026",
            major: parsed.major || "Computer Science",
            densityPreference: parsed.densityPreference || "comfortable",
            googleCalendarSynced: parsed.googleCalendarSynced ?? true,
            activeSessions: Array.isArray(parsed.activeSessions) && parsed.activeSessions.length > 0
              ? parsed.activeSessions.map(s => ({
                  ...s,
                  isCurrentDevice: s.deviceId === deviceInfo.deviceId
                }))
              : [{
                  deviceId: deviceInfo.deviceId,
                  deviceName: deviceInfo.deviceName,
                  deviceType: deviceInfo.deviceType,
                  browser: deviceInfo.browser,
                  os: deviceInfo.os,
                  loginTimestamp: parsed.lastLoginAt || new Date().toISOString(),
                  lastActiveTimestamp: new Date().toISOString(),
                  isCurrentDevice: true
                }]
          };

          setUser(upgradedProfile);
          localStorage.setItem("student_portal_active_user", JSON.stringify(upgradedProfile));
          ensureUserDataSeeded(upgradedProfile.id);
          loadUserData(upgradedProfile.id);

          // Guarantee account is recorded in local registered accounts cache
          const accounts: RegisteredAccount[] = JSON.parse(localStorage.getItem("student_portal_registered_accounts") || "[]");
          const accExists = accounts.some(a => a.id === upgradedProfile.id || a.email.toLowerCase() === upgradedProfile.email.toLowerCase());
          if (!accExists) {
            accounts.push({
              id: upgradedProfile.id,
              email: upgradedProfile.email.toLowerCase(),
              passwordHash: "",
              fullName: upgradedProfile.fullName,
              emailVerified: upgradedProfile.emailVerified,
              googleVerified: upgradedProfile.googleVerified,
              university: upgradedProfile.university,
              degree: upgradedProfile.degree,
              major: upgradedProfile.major,
              semester: upgradedProfile.semester,
              googleCalendarSynced: upgradedProfile.googleCalendarSynced,
              densityPreference: upgradedProfile.densityPreference || "comfortable",
              provider: upgradedProfile.provider,
              createdAt: upgradedProfile.createdAt,
              lastLoginAt: new Date().toISOString()
            });
            saveRegisteredAccounts(accounts);
          }
        } else {
          setUser(null);
          setUserData(EMPTY_DATA);
        }
      } else {
        setUser(null);
        setUserData(EMPTY_DATA);
      }
    } catch (err) {
      console.error("Session load error:", err);
      setUser(null);
      setUserData(EMPTY_DATA);
    } finally {
      setIsLoading(false);
    }
  }, [loadUserData]);

  const getRegisteredAccounts = (): RegisteredAccount[] => {
    try {
      const raw = localStorage.getItem("student_portal_registered_accounts");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveRegisteredAccounts = (accounts: RegisteredAccount[]) => {
    localStorage.setItem("student_portal_registered_accounts", JSON.stringify(accounts));
  };

  const getTotalRegisteredUsersCount = (): number => {
    const accounts = getRegisteredAccounts();
    return Math.max(1, accounts.length);
  };

  // Seed ONLY user-selected courses, with zero non-added tasks or dummy exams
  const ensureUserDataSeeded = (userId: string, initialCourses?: string[]) => {
    const storageKey = `student_portal_user_${userId}_data`;
    if (!localStorage.getItem(storageKey)) {
      let userCourses: CourseItem[] = [];
      
      if (initialCourses && initialCourses.length > 0) {
        userCourses = initialCourses.map((cName, idx) => {
          const parts = cName.split(" - ");
          const code = parts[0] || `CRS ${idx + 1}`;
          const title = parts[1] || code;
          return {
            id: `c_${Date.now()}_${idx}`,
            userId,
            courseCode: code,
            courseName: title,
            instructor: "Faculty Instructor",
            meetingLink: `https://meet.google.com/${code.toLowerCase().replace(/\s+/g, "-")}`,
            meetingPlatform: "meet",
            scheduleTime: "Mon/Wed 10:30 AM"
          };
        });
      }

      const cleanSlate = {
        courses: userCourses,
        tasks: [],
        exams: []
      };
      localStorage.setItem(storageKey, JSON.stringify(cleanSlate));
    }
  };

  // Sign in with Supabase & Cross-Device Server Fallback (Concurrent Multi-Device)
  const signInWithPassword = async (email: string, pass: string): Promise<{ success: boolean; error?: string; emailUnconfirmed?: boolean }> => {
    await simulateNetworkLatency(400);

    if (!email || !pass) {
      return { success: false, error: "Please enter both student email and password." };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const deviceInfo = getDeviceDetails();
    
    // 1. Check Supabase if configured
    const supabase = createClient();
    if (supabase) {
      const { data: supaData, error: supaErr } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: pass
      });
      if (supaErr) {
        if (supaErr.message.toLowerCase().includes("email not confirmed")) {
          return { 
            success: false, 
            error: "Please confirm your student email before signing in. Check your inbox for the Supabase verification link.",
            emailUnconfirmed: true 
          };
        }
      } else if (supaData?.user) {
        const meta = supaData.user.user_metadata || {};
        const profile: UserProfile = {
          id: supaData.user.id,
          email: supaData.user.email || trimmedEmail,
          fullName: meta.full_name || "Student",
          emailVerified: true,
          googleVerified: false,
          university: meta.university || "University of Waterloo",
          degree: meta.degree || "Bachelor of Technology (B.Tech)",
          major: meta.major || "Computer Science",
          semester: meta.semester || "Fall 2026",
          googleCalendarSynced: meta.google_calendar_synced ?? true,
          densityPreference: meta.density_preference || "comfortable",
          provider: "email",
          createdAt: supaData.user.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          activeSessions: [{
            deviceId: deviceInfo.deviceId,
            deviceName: deviceInfo.deviceName,
            deviceType: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            loginTimestamp: new Date().toISOString(),
            lastActiveTimestamp: new Date().toISOString(),
            isCurrentDevice: true
          }]
        };

        setUser(profile);
        localStorage.setItem("student_portal_active_user", JSON.stringify(profile));
        ensureUserDataSeeded(profile.id);
        loadUserData(profile.id);

        // Notify server for multi-device sync
        fetch("/api/auth/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "login",
            email: trimmedEmail,
            password: pass,
            deviceInfo
          })
        }).catch(() => {});

        return { success: true };
      }
    }

    // 2. Query Centralized Server Auth Sync (Multi-Device Sessions)
    try {
      const syncRes = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          email: trimmedEmail,
          password: pass,
          deviceInfo
        })
      });

      const syncData = await syncRes.json();
      if (syncRes.ok && syncData.success && syncData.account) {
        const serverAcc = syncData.account;
        const profile: UserProfile = {
          id: serverAcc.id,
          email: serverAcc.email,
          fullName: serverAcc.fullName,
          emailVerified: true,
          googleVerified: false,
          university: serverAcc.university,
          degree: serverAcc.degree || "Bachelor of Technology (B.Tech)",
          major: serverAcc.major,
          semester: serverAcc.semester || "Fall 2026",
          googleCalendarSynced: serverAcc.googleCalendarSynced || false,
          densityPreference: serverAcc.densityPreference || "comfortable",
          provider: "email",
          createdAt: serverAcc.createdAt,
          lastLoginAt: new Date().toISOString(),
          activeSessions: serverAcc.activeSessions || []
        };

        const accounts = getRegisteredAccounts();
        const accIdx = accounts.findIndex(a => a.email.toLowerCase() === trimmedEmail);
        const registeredAcc: RegisteredAccount = {
          id: serverAcc.id,
          email: serverAcc.email,
          passwordHash: pass,
          fullName: serverAcc.fullName,
          emailVerified: true,
          googleVerified: false,
          university: serverAcc.university,
          degree: serverAcc.degree,
          major: serverAcc.major,
          semester: serverAcc.semester,
          googleCalendarSynced: serverAcc.googleCalendarSynced,
          densityPreference: serverAcc.densityPreference,
          provider: "email",
          createdAt: serverAcc.createdAt,
          lastLoginAt: new Date().toISOString()
        };

        if (accIdx >= 0) {
          accounts[accIdx] = registeredAcc;
        } else {
          accounts.push(registeredAcc);
        }
        saveRegisteredAccounts(accounts);

        setUser(profile);
        localStorage.setItem("student_portal_active_user", JSON.stringify(profile));

        if (syncData.userData) {
          localStorage.setItem(`student_portal_user_${serverAcc.id}_data`, JSON.stringify(syncData.userData));
          setUserData(syncData.userData);
        } else {
          ensureUserDataSeeded(serverAcc.id);
          loadUserData(serverAcc.id);
        }

        return { success: true };
      } else if (syncData.error && syncData.error.includes("Incorrect password")) {
        return { success: false, error: "Incorrect password for this student account. Please check your credentials." };
      }
    } catch (syncErr) {
      console.warn("Cross-device auth sync check error:", syncErr);
    }

    // 3. Fallback to Local Storage Accounts
    const accounts = getRegisteredAccounts();
    const matchingAccount = accounts.find(a => a.email.toLowerCase() === trimmedEmail);

    if (!matchingAccount) {
      return { 
        success: false, 
        error: "No verified account found with this email. Please click 'Create Account' to complete verification." 
      };
    }

    if (matchingAccount.passwordHash !== pass) {
      return { 
        success: false, 
        error: "Incorrect password for this student account. Please check your credentials." 
      };
    }

    matchingAccount.lastLoginAt = new Date().toISOString();
    saveRegisteredAccounts(accounts);

    const profile: UserProfile = {
      id: matchingAccount.id,
      email: matchingAccount.email,
      fullName: matchingAccount.fullName,
      emailVerified: true,
      googleVerified: matchingAccount.googleVerified || false,
      university: matchingAccount.university,
      degree: matchingAccount.degree || "Bachelor of Technology (B.Tech)",
      major: matchingAccount.major,
      semester: matchingAccount.semester || "Fall 2026",
      googleCalendarSynced: matchingAccount.googleCalendarSynced || false,
      densityPreference: matchingAccount.densityPreference || "comfortable",
      provider: matchingAccount.provider,
      createdAt: matchingAccount.createdAt,
      lastLoginAt: matchingAccount.lastLoginAt,
    };

    setUser(profile);
    localStorage.setItem("student_portal_active_user", JSON.stringify(profile));
    ensureUserDataSeeded(profile.id);
    loadUserData(profile.id);
    return { success: true };
  };

  // Sign up with Supabase Email Verification & Cross-Device Server Persistence
  const signUpWithPassword = async (
    fullName: string, 
    university: string, 
    degree: string,
    semester: string, 
    major: string, 
    email: string, 
    pass: string,
    initialCourses?: string[],
    syncGoogleCalendar: boolean = true
  ): Promise<{ success: boolean; error?: string; confirmationEmailSent?: boolean }> => {
    await simulateNetworkLatency(500);

    if (!email || !fullName || !pass) {
      return { success: false, error: "Please fill in all required credentials." };
    }

    if (pass.length < 6) {
      return { success: false, error: "Password must be at least 6 characters in length." };
    }

    const trimmedEmail = email.trim().toLowerCase();
    const deviceInfo = getDeviceDetails();
    const accounts = getRegisteredAccounts();
    const existingAccount = accounts.find(a => a.email.toLowerCase() === trimmedEmail);

    if (existingAccount) {
      return { 
        success: false, 
        error: "An account with this email already exists. Please switch to 'Sign In'." 
      };
    }

    // Call Supabase signUp if configured
    const supabase = createClient();
    if (supabase) {
      const { error: supaErr } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: pass,
        options: {
          data: {
            full_name: fullName.trim(),
            university: university.trim(),
            degree: degree.trim(),
            semester: semester.trim(),
            major: major.trim()
          }
        }
      });
      if (supaErr) {
        return { success: false, error: supaErr.message };
      }
    }

    const newAccount: RegisteredAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      email: trimmedEmail,
      passwordHash: pass,
      fullName: fullName.trim(),
      emailVerified: true,
      googleVerified: false,
      university: university.trim() || "University of Waterloo",
      degree: degree.trim() || "Bachelor of Technology (B.Tech)",
      semester: semester.trim() || "Fall 2026",
      major: major.trim() || "Computer Science",
      googleCalendarSynced: syncGoogleCalendar,
      densityPreference: "comfortable",
      provider: "email",
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    accounts.push(newAccount);
    saveRegisteredAccounts(accounts);

    // Sync to Server Repository (Guarantees immediate login availability on other devices)
    try {
      fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          account: newAccount,
          courses: initialCourses,
          deviceInfo
        })
      }).catch(() => {});
    } catch {
      // ignore
    }

    const profile: UserProfile = {
      id: newAccount.id,
      email: newAccount.email,
      fullName: newAccount.fullName,
      emailVerified: true,
      googleVerified: newAccount.googleVerified,
      university: newAccount.university,
      degree: newAccount.degree,
      semester: newAccount.semester,
      major: newAccount.major,
      googleCalendarSynced: newAccount.googleCalendarSynced,
      densityPreference: "comfortable",
      provider: newAccount.provider,
      createdAt: newAccount.createdAt,
      lastLoginAt: newAccount.lastLoginAt,
      activeSessions: [{
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        loginTimestamp: new Date().toISOString(),
        lastActiveTimestamp: new Date().toISOString(),
        isCurrentDevice: true
      }]
    };

    setUser(profile);
    localStorage.setItem("student_portal_active_user", JSON.stringify(profile));
    ensureUserDataSeeded(profile.id, initialCourses);
    loadUserData(profile.id);
    return { success: true, confirmationEmailSent: true };
  };

  // Google SSO Sign In
  const signInWithGoogleCustom = async (
    email: string, 
    fullName: string, 
    university: string = "University of Waterloo", 
    degree: string = "Bachelor of Technology (B.Tech)",
    semester: string = "Fall 2026",
    major: string = "Computer Science",
    initialCourses?: string[],
    syncGoogleCalendar: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    await simulateNetworkLatency(600);

    const trimmedEmail = email.trim().toLowerCase();
    const accounts = getRegisteredAccounts();
    let account = accounts.find(a => a.email.toLowerCase() === trimmedEmail);

    if (!account) {
      account = {
        id: `usr_g_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        email: trimmedEmail,
        passwordHash: `google_oauth_${Date.now()}`,
        fullName: fullName.trim(),
        emailVerified: true,
        googleVerified: true,
        university: university.trim(),
        degree: degree.trim(),
        semester: semester.trim(),
        major: major.trim(),
        googleCalendarSynced: syncGoogleCalendar,
        densityPreference: "comfortable",
        provider: "google",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      accounts.push(account);
      saveRegisteredAccounts(accounts);
    } else {
      account.emailVerified = true;
      account.googleVerified = true;
      account.lastLoginAt = new Date().toISOString();
      saveRegisteredAccounts(accounts);
    }

    const profile: UserProfile = {
      id: account.id,
      email: account.email,
      fullName: account.fullName,
      emailVerified: true,
      googleVerified: true,
      university: account.university,
      degree: account.degree || degree || "Bachelor of Technology (B.Tech)",
      semester: account.semester || semester,
      major: account.major,
      googleCalendarSynced: account.googleCalendarSynced ?? true,
      densityPreference: account.densityPreference || "comfortable",
      provider: "google",
      createdAt: account.createdAt,
      lastLoginAt: account.lastLoginAt
    };

    setUser(profile);
    localStorage.setItem("student_portal_active_user", JSON.stringify(profile));
    ensureUserDataSeeded(profile.id, initialCourses);
    loadUserData(profile.id);
    return { success: true };
  };

  const resendEmailConfirmation = async (email: string): Promise<{ success: boolean; error?: string }> => {
    await simulateNetworkLatency(500);
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase()
      });
      if (error) return { success: false, error: error.message };
    }
    return { success: true };
  };

  // Toggle Google Calendar 2-Way Live Sync
  const toggleGoogleCalendarSync = async (enabled: boolean): Promise<boolean> => {
    if (!user) return false;
    await simulateNetworkLatency(300);

    const updatedProfile = { ...user, googleCalendarSynced: enabled };
    setUser(updatedProfile);
    localStorage.setItem("student_portal_active_user", JSON.stringify(updatedProfile));

    const accounts = getRegisteredAccounts();
    const accIdx = accounts.findIndex(a => a.id === user.id);
    if (accIdx !== -1) {
      accounts[accIdx].googleCalendarSynced = enabled;
      saveRegisteredAccounts(accounts);
    }
    return true;
  };

  // Toggle Zero-Scroll Density Preference ("comfortable" vs "compact")
  const toggleDensityPreference = async (density: "comfortable" | "compact"): Promise<boolean> => {
    if (!user) return false;
    const updatedProfile = { ...user, densityPreference: density };
    setUser(updatedProfile);
    localStorage.setItem("student_portal_active_user", JSON.stringify(updatedProfile));

    const accounts = getRegisteredAccounts();
    const accIdx = accounts.findIndex(a => a.id === user.id);
    if (accIdx !== -1) {
      accounts[accIdx].densityPreference = density;
      saveRegisteredAccounts(accounts);
    }
    return true;
  };

  const signOut = async () => {
    await simulateNetworkLatency(250);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("student_portal_active_user");
    setUser(null);
    setUserData(EMPTY_DATA);
  };

  const getUserData = useCallback((): { tasks: TaskItem[]; exams: ExamItem[]; courses: CourseItem[] } => {
    return userData;
  }, [userData]);

  // =========================================================================
  // CENTRALIZED REACTIVE MUTATORS (DRY SINGLE SOURCE OF TRUTH)
  // =========================================================================

  const addTask = useCallback((task: Omit<TaskItem, "id" | "userId">): TaskItem => {
    const userId = user ? user.id : "guest";
    const newTask: TaskItem = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId
    };

    const next = { ...userData, tasks: [newTask, ...userData.tasks] };
    if (user) {
      persistUserData(user.id, next);
    } else {
      setUserData(next);
    }
    return newTask;
  }, [user, userData, persistUserData]);

  const updateTask = useCallback((taskId: string, updates: Partial<TaskItem>) => {
    const updatedTasks = userData.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
    const next = { ...userData, tasks: updatedTasks };
    if (user) {
      persistUserData(user.id, next);
    } else {
      setUserData(next);
    }
  }, [user, userData, persistUserData]);

  const deleteTask = useCallback((taskId: string) => {
    const filteredTasks = userData.tasks.filter(t => t.id !== taskId);
    const next = { ...userData, tasks: filteredTasks };
    if (user) {
      persistUserData(user.id, next);
    } else {
      setUserData(next);
    }
  }, [user, userData, persistUserData]);

  const addCourse = useCallback((course: Omit<CourseItem, "id" | "userId">): CourseItem => {
    const userId = user ? user.id : "guest";
    const newCourse: CourseItem = {
      ...course,
      id: `course_${Date.now()}`,
      userId
    };

    const next = { ...userData, courses: [...userData.courses, newCourse] };
    if (user) {
      persistUserData(user.id, next);
    } else {
      setUserData(next);
    }
    return newCourse;
  }, [user, userData, persistUserData]);

  const deleteCourse = useCallback((courseId: string) => {
    const filteredCourses = userData.courses.filter(c => c.id !== courseId);
    const next = { ...userData, courses: filteredCourses };
    if (user) {
      persistUserData(user.id, next);
    } else {
      setUserData(next);
    }
  }, [user, userData, persistUserData]);

  const addExam = useCallback((exam: Omit<ExamItem, "id" | "userId">): ExamItem => {
    const userId = user ? user.id : "guest";
    const newExam: ExamItem = {
      ...exam,
      id: `exam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId
    };

    const next = { ...userData, exams: [...userData.exams, newExam] };
    if (user) {
      persistUserData(user.id, next);
    } else {
      setUserData(next);
    }
    return newExam;
  }, [user, userData, persistUserData]);

  const deleteExam = useCallback((examId: string) => {
    const filteredExams = userData.exams.filter(e => e.id !== examId);
    const next = { ...userData, exams: filteredExams };
    if (user) {
      persistUserData(user.id, next);
    } else {
      setUserData(next);
    }
  }, [user, userData, persistUserData]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No active user session." };
    await simulateNetworkLatency(400);

    const updatedProfile: UserProfile = { ...user, ...updates };
    setUser(updatedProfile);
    localStorage.setItem("student_portal_active_user", JSON.stringify(updatedProfile));

    // Also update registered accounts list
    const accounts = getRegisteredAccounts();
    const targetIdx = accounts.findIndex(a => a.id === user.id);
    if (targetIdx >= 0) {
      accounts[targetIdx] = {
        ...accounts[targetIdx],
        fullName: updates.fullName || accounts[targetIdx].fullName,
        university: updates.university || accounts[targetIdx].university,
        degree: updates.degree || accounts[targetIdx].degree,
        major: updates.major || accounts[targetIdx].major,
        semester: updates.semester || accounts[targetIdx].semester,
      };
      saveRegisteredAccounts(accounts);
    }
    return { success: true };
  }, [user]);

  const changePassword = useCallback(async (currentPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No active user session." };
    if (!newPass || newPass.length < 6) {
      return { success: false, error: "New password must be at least 6 characters in length." };
    }
    await simulateNetworkLatency(400);

    // 1. Supabase Cloud Password Update (if connected)
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.updateUser({ password: newPass });
      } catch (supaErr) {
        console.warn("Supabase password update error:", supaErr);
      }
    }

    // 2. Server-side Cross-Device Store Update (Mobile & Desktop)
    try {
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-password",
          email: user.email,
          currentPassword: currentPass,
          newPassword: newPass
        })
      });
    } catch (syncErr) {
      console.warn("Server auth sync error:", syncErr);
    }

    // 3. Local Device Cache Update
    const accounts = getRegisteredAccounts();
    const account = accounts.find(a => a.id === user.id || a.email.toLowerCase() === user.email.toLowerCase());

    if (account) {
      account.passwordHash = newPass;
      saveRegisteredAccounts(accounts);
    }

    return { success: true };
  }, [user]);

  const sendPasswordResetEmail = useCallback(async (emailToReset: string): Promise<{ success: boolean; resetCode?: string; error?: string }> => {
    if (!emailToReset) return { success: false, error: "Please enter your student email." };
    await simulateNetworkLatency(400);

    const trimmed = emailToReset.trim().toLowerCase();
    
    // 1. Request Server-side PIN (Ensures PIN works across Mobile & Desktop)
    let generatedPin = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const syncRes = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request-reset",
          email: trimmed
        })
      });
      const syncData = await syncRes.json();
      if (syncRes.ok && syncData.resetCode) {
        generatedPin = syncData.resetCode;
      }
    } catch (syncErr) {
      console.warn("Server PIN request error, using fallback PIN:", syncErr);
    }

    // 2. Save local device fallback
    try {
      const existingPins = JSON.parse(localStorage.getItem("student_portal_reset_pins") || "{}");
      existingPins[trimmed] = generatedPin;
      localStorage.setItem("student_portal_reset_pins", JSON.stringify(existingPins));
    } catch {
      // ignore
    }

    // 3. Also attempt Supabase cloud reset if configured
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.resetPasswordForEmail(trimmed, {
          redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/`
        });
      } catch {
        // graceful fallback to PIN
      }
    }

    return { 
      success: true, 
      resetCode: generatedPin 
    };
  }, []);

  const resetPasswordWithCode = useCallback(async (email: string, code: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !code || !newPass) return { success: false, error: "All fields are required." };
    if (newPass.length < 6) return { success: false, error: "New password must be at least 6 characters." };
    await simulateNetworkLatency(400);

    const trimmedEmail = email.trim().toLowerCase();
    let verified = false;

    // 1. Verify against Server-Side Store
    try {
      const syncRes = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: trimmedEmail,
          code,
          newPassword: newPass
        })
      });
      const syncData = await syncRes.json();
      if (syncRes.ok && syncData.success) {
        verified = true;
      }
    } catch (syncErr) {
      console.warn("Server reset verification error:", syncErr);
    }

    // 2. Verify against Local Device Cache (Fallback)
    if (!verified) {
      const existingPins = JSON.parse(localStorage.getItem("student_portal_reset_pins") || "{}");
      const storedPin = existingPins[trimmedEmail];
      if (storedPin && storedPin === code.trim()) {
        verified = true;
        delete existingPins[trimmedEmail];
        localStorage.setItem("student_portal_reset_pins", JSON.stringify(existingPins));
      }
    }

    if (!verified) {
      return { success: false, error: "Invalid or expired 6-digit recovery code." };
    }

    // 3. Update Local Storage Accounts
    const accounts = getRegisteredAccounts();
    const targetAcc = accounts.find(a => a.email.toLowerCase() === trimmedEmail);
    if (targetAcc) {
      targetAcc.passwordHash = newPass;
      saveRegisteredAccounts(accounts);
    }

    // 4. Update Supabase Password if user is logged in
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.updateUser({ password: newPass });
      } catch {
        // ignore
      }
    }

    return { success: true };
  }, []);

  const rolloverSemester = useCallback(async (nextSemester: string, clearPreviousSubjects: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No active user session." };
    await simulateNetworkLatency(500);

    // 1. Update Profile Semester
    await updateProfile({ semester: nextSemester });

    // 2. Clear subjects if requested
    if (clearPreviousSubjects) {
      const nextData = {
        ...userData,
        courses: [],
        tasks: userData.tasks.filter(t => t.status !== "completed")
      };
      persistUserData(user.id, nextData);
    }
    return { success: true };
  }, [user, userData, updateProfile, persistUserData]);

  // Refresh Multi-Device Sessions & State from Server
  const refreshMultiDeviceSync = useCallback(async () => {
    if (!user?.email) return;
    try {
      const { deviceId } = getDeviceDetails();
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "fetch-latest",
          email: user.email,
          deviceId
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.account) {
        const updated = {
          ...user,
          ...data.account,
          activeSessions: data.account.activeSessions || []
        };
        setUser(updated);
        localStorage.setItem("student_portal_active_user", JSON.stringify(updated));
        if (data.userData) {
          setUserData(data.userData);
          localStorage.setItem(`student_portal_user_${user.id}_data`, JSON.stringify(data.userData));
        }
      }
    } catch (err) {
      console.warn("Multi-device sync fetch error:", err);
    }
  }, [user]);

  // Revoke a specific remote device
  const revokeDeviceSession = useCallback(async (deviceIdToRevoke: string): Promise<boolean> => {
    if (!user?.email || !deviceIdToRevoke) return false;
    try {
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke-device",
          email: user.email,
          deviceIdToRevoke
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedSessions = data.activeSessions || [];
        const { deviceId } = getDeviceDetails();
        const updated = {
          ...user,
          activeSessions: updatedSessions.map((s: any) => ({
            ...s,
            isCurrentDevice: s.deviceId === deviceId
          }))
        };
        setUser(updated);
        localStorage.setItem("student_portal_active_user", JSON.stringify(updated));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, [user]);

  // Revoke all other devices (keep only current device active)
  const revokeAllOtherDevices = useCallback(async (): Promise<boolean> => {
    if (!user?.email) return false;
    try {
      const { deviceId } = getDeviceDetails();
      const res = await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke-all-other-devices",
          email: user.email,
          currentDeviceId: deviceId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedSessions = data.activeSessions || [];
        const updated = {
          ...user,
          activeSessions: updatedSessions.map((s: any) => ({
            ...s,
            isCurrentDevice: s.deviceId === deviceId
          }))
        };
        setUser(updated);
        localStorage.setItem("student_portal_active_user", JSON.stringify(updated));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, [user]);

  // Permanently delete user account and clean all storage records
  const deleteAccount = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "No active user session." };
    await simulateNetworkLatency(400);

    const emailToDelete = user.email.toLowerCase();
    const userIdToDelete = user.id;

    // 1. Delete from Server Sync API / Database
    try {
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-account",
          email: emailToDelete
        })
      });
    } catch (err) {
      console.warn("Server delete account error:", err);
    }

    // 2. Sign out of Supabase if active
    const supabase = createClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }

    // 3. Clear Local Storage
    localStorage.removeItem("student_portal_active_user");
    localStorage.removeItem(`student_portal_user_${userIdToDelete}_data`);
    
    const accounts = getRegisteredAccounts();
    const filteredAccounts = accounts.filter(a => a.id !== userIdToDelete && a.email.toLowerCase() !== emailToDelete);
    saveRegisteredAccounts(filteredAccounts);

    // 4. Reset React State
    setUser(null);
    setUserData(EMPTY_DATA);

    return { success: true };
  }, [user]);

  // Background Auto-Sync across all concurrent devices (every 25s & on window focus)
  useEffect(() => {
    if (!user?.email) return;

    const syncHandler = () => {
      refreshMultiDeviceSync();
    };

    const interval = setInterval(syncHandler, 25000);
    window.addEventListener("focus", syncHandler);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") syncHandler();
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncHandler);
    };
  }, [user?.email, refreshMultiDeviceSync]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      userData,
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogleCustom,
      resendEmailConfirmation,
      toggleGoogleCalendarSync,
      toggleDensityPreference,
      signOut,
      getUserData,
      addTask,
      updateTask,
      deleteTask,
      addCourse,
      deleteCourse,
      addExam,
      deleteExam,
      updateProfile,
      changePassword,
      sendPasswordResetEmail,
      resetPasswordWithCode,
      rolloverSemester,
      deleteAccount,
      revokeDeviceSession,
      revokeAllOtherDevices,
      refreshMultiDeviceSync,
      getTotalRegisteredUsersCount
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
