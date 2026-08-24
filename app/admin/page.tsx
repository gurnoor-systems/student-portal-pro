"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Search,
  RefreshCw,
  Trash2,
  LogOut,
  Users,
  GraduationCap,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Clock,
  Sparkles,
  BookOpen,
  Filter
} from "lucide-react";

interface AdminDeviceSession {
  deviceId: string;
  deviceName: string;
  deviceType: "mobile" | "desktop" | "tablet";
  browser: string;
  os: string;
  loginTimestamp: string;
  lastActiveTimestamp: string;
}

interface AdminUserRecord {
  id: string;
  email: string;
  passwordHash?: string;
  fullName: string;
  university: string;
  degree: string;
  major: string;
  semester: string;
  googleCalendarSynced: boolean;
  createdAt: string;
  lastLoginAt: string;
  tasksCount: number;
  coursesCount: number;
  examsCount: number;
  documentsCount: number;
  activeSessions: AdminDeviceSession[];
}

export default function AdminConsolePage() {
  const [adminEmail, setAdminEmail] = useState("gurnoors9507@gmail.com");
  const [passkey, setPasskey] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Registry Data
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDevices: 0,
    totalUniversities: 0,
    serverTimestamp: ""
  });

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [selectedDeviceType, setSelectedDeviceType] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Confirmation Modals
  const [userToDelete, setUserToDelete] = useState<AdminUserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check saved passkey on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("student_portal_admin_passkey");
    const savedEmail = localStorage.getItem("student_portal_admin_email");
    if (savedEmail) {
      setAdminEmail(savedEmail);
    }
    if (savedKey && savedEmail) {
      setPasskey(savedKey);
      fetchRegistry(savedKey, savedEmail);
    }
  }, []);

  const fetchRegistry = useCallback(async (key: string, email: string, silent: boolean = false) => {
    if (!silent) setIsRefreshing(true);
    setAuthError(null);
    try {
      let clientAccounts: any[] = [];
      try {
        const localRaw = localStorage.getItem("student_portal_registered_accounts");
        if (localRaw) {
          clientAccounts = JSON.parse(localRaw);
        }
      } catch {}

      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: email,
          passkey: key,
          action: "list-all",
          clientAccounts
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
        setStats(data.stats || { totalUsers: 0, totalDevices: 0, totalUniversities: 0, serverTimestamp: "" });
        setIsAuthenticated(true);
        localStorage.setItem("student_portal_admin_passkey", key);
        localStorage.setItem("student_portal_admin_email", email);
      } else {
        if (!silent) {
          setAuthError(data.error || "Invalid Master Administrator credentials");
          setIsAuthenticated(false);
          localStorage.removeItem("student_portal_admin_passkey");
          localStorage.removeItem("student_portal_admin_email");
        }
      }
    } catch (err: any) {
      if (!silent) {
        setAuthError("Failed to connect to Admin Server API");
        setIsAuthenticated(false);
      }
    } finally {
      if (!silent) setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Periodic Real-Time Live Auto-Polling (every 4 seconds)
  useEffect(() => {
    if (!isAuthenticated || !passkey || !adminEmail) return;

    const interval = setInterval(() => {
      fetchRegistry(passkey, adminEmail, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated, passkey, adminEmail, fetchRegistry]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passkey || !adminEmail) return;
    setIsLoading(true);
    fetchRegistry(passkey, adminEmail, false);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("student_portal_admin_passkey");
    localStorage.removeItem("student_portal_admin_email");
    setIsAuthenticated(false);
    setPasskey("");
    setUsers([]);
  };

  const handleRevokeDevice = async (targetEmail: string, deviceId: string) => {
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          passkey,
          action: "revoke-device",
          targetEmail,
          targetDeviceId: deviceId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback(`Revoked device session for ${targetEmail}`);
        fetchRegistry(passkey, adminEmail);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeAllSessions = async (targetEmail: string) => {
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          passkey,
          action: "revoke-all-sessions",
          targetEmail
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback(`All sessions terminated for ${targetEmail}`);
        fetchRegistry(passkey, adminEmail);
        setTimeout(() => setActionFeedback(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          passkey,
          action: "delete-account",
          targetEmail: userToDelete.email
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback(`Account ${userToDelete.email} permanently purged from database.`);
        setUserToDelete(null);
        fetchRegistry(passkey, adminEmail);
        setTimeout(() => setActionFeedback(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePurgeAllAccounts = async () => {
    if (!confirm("⚠️ DANGER: Are you sure you want to permanently purge ALL student accounts and reset the database to 0? This cannot be undone.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          passkey,
          action: "purge-all-accounts"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback("All student accounts and database records permanently reset to 0.");
        setUsers([]);
        fetchRegistry(passkey, adminEmail);
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for Device Icons
  const renderDeviceIcon = (type: string) => {
    if (type === "mobile") return <Smartphone className="w-4 h-4 text-emerald-400" />;
    if (type === "tablet") return <Tablet className="w-4 h-4 text-purple-400" />;
    return <Laptop className="w-4 h-4 text-blue-400" />;
  };

  // Extract unique universities for filter
  const universitiesList = Array.from(new Set(users.map(u => u.university).filter(Boolean)));

  // Filtered Users List
  const filteredUsers = users.filter(user => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.university.toLowerCase().includes(q) ||
      user.degree.toLowerCase().includes(q) ||
      user.activeSessions.some(s => s.deviceName.toLowerCase().includes(q) || s.os.toLowerCase().includes(q) || s.browser.toLowerCase().includes(q));

    const matchesUni = selectedUniversity === "all" || user.university === selectedUniversity;
    
    const matchesDeviceType = selectedDeviceType === "all" || 
      (selectedDeviceType === "none" && user.activeSessions.length === 0) ||
      user.activeSessions.some(s => s.deviceType === selectedDeviceType);

    return matchesSearch && matchesUni && matchesDeviceType;
  });

  return (
    <div className="min-h-screen bg-[#070b10] text-slate-100 font-sans selection:bg-[#1c69d4] selection:text-white">
      
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0c121a]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Portal</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-red-500/20 border border-red-500/40 rounded-lg flex items-center justify-center text-red-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  <span>ADMINISTRATOR CONSOLE</span>
                </h1>
              </div>
            </div>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-mono text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">LIVE SYNC (4s)</span>
              </div>

              <button
                onClick={() => fetchRegistry(passkey, adminEmail, false)}
                disabled={isRefreshing}
                className="px-3 py-1.5 bg-[#141d29] hover:bg-[#1d2a3a] border border-white/15 text-xs font-bold rounded-lg flex items-center gap-1.5 text-slate-200 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[var(--primary)] ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "Refreshing..." : "Refresh Registry"}</span>
              </button>

              <button
                onClick={handlePurgeAllAccounts}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-xs font-bold text-red-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Wipe all student accounts and reset to 0"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Purge All to 0</span>
              </button>

              <button
                onClick={handleAdminLogout}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Exit Admin</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {!isAuthenticated ? (
          /* MASTER PASSKEY LOGIN GATE */
          <div className="max-w-md mx-auto my-16 p-8 bg-[#0e1520] border border-white/15 rounded-2xl shadow-2xl space-y-6 animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto bg-red-500/15 border border-red-500/30 text-red-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Administrator Authentication</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your authorized Administrator Email and Master Passkey to view all registered student accounts, emails, usernames, and live connected devices.
              </p>
            </div>

            {authError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-slate-300">
                  MASTER ADMINISTRATOR EMAIL
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@domain.com"
                  className="w-full h-11 px-3 bg-[#080d14] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase text-slate-300">
                  MASTER ADMIN PASSKEY
                </label>
                <div className="relative">
                  <input
                    type={showPasskey ? "text" : "password"}
                    value={passkey}
                    onChange={(e) => setPasskey(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-3 pr-10 bg-[#080d14] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>VERIFYING CLEARANCE...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>UNLOCK ADMIN REGISTRY</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN REGISTRY VIEW */
          <div className="space-y-6 animate-in fade-in">
            
            {/* Feedback Banner */}
            {actionFeedback && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in slide-in-from-top duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{actionFeedback}</span>
              </div>
            )}

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-[#0f1622] border border-white/10 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">REGISTERED STUDENTS</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">
                  {stats.totalUsers}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Registered students
                </div>
              </div>

              <div className="p-5 bg-[#0f1622] border border-white/10 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">CONNECTED DEVICES</span>
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>{stats.totalDevices}</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono font-bold rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Active connected devices
                </div>
              </div>

              <div className="p-5 bg-[#0f1622] border border-white/10 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">CAMPUSES & UNIVERSITIES</span>
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">
                  {stats.totalUniversities}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Institutions represented
                </div>
              </div>

              <div className="p-5 bg-[#0f1622] border border-white/10 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">SYSTEM STATUS</span>
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="mt-2 text-lg font-bold text-emerald-400 flex items-center gap-2">
                  <span>100% OPERATIONAL</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Multi-tenant isolation verified
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-[#0c121a] border border-white/10 rounded-2xl flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student name, email, university, degree, or device OS..."
                  className="w-full h-10 pl-10 pr-4 bg-[#121a24] border border-white/10 text-xs text-white placeholder:text-slate-500 rounded-xl outline-none focus:border-[#1c69d4]"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex items-center gap-1.5 bg-[#121a24] border border-white/10 px-3 py-2 rounded-xl text-xs flex-1 md:flex-initial">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedUniversity}
                    onChange={(e) => setSelectedUniversity(e.target.value)}
                    className="bg-transparent text-slate-300 outline-none text-xs cursor-pointer"
                  >
                    <option value="all">All Universities ({users.length})</option>
                    {universitiesList.map((uni, idx) => (
                      <option key={idx} value={uni} className="bg-[#0c121a] text-white">{uni}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-[#121a24] border border-white/10 px-3 py-2 rounded-xl text-xs flex-1 md:flex-initial">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedDeviceType}
                    onChange={(e) => setSelectedDeviceType(e.target.value)}
                    className="bg-transparent text-slate-300 outline-none text-xs cursor-pointer"
                  >
                    <option value="all">All Device Types</option>
                    <option value="mobile" className="bg-[#0c121a] text-white">Mobile Only</option>
                    <option value="desktop" className="bg-[#0c121a] text-white">Desktop / Laptop Only</option>
                    <option value="tablet" className="bg-[#0c121a] text-white">Tablet Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Student Accounts Registry List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
                <span>SHOWING {filteredUsers.length} OF {users.length} REGISTERED STUDENT ACCOUNTS</span>
                <span>SORTED BY RECENT REGISTRATION</span>
              </div>

              {filteredUsers.length === 0 ? (
                <div className="p-12 text-center bg-[#0e1520] border border-white/10 rounded-2xl space-y-2">
                  <Users className="w-8 h-8 text-slate-500 mx-auto" />
                  <h3 className="text-sm font-bold text-white">No Matching Student Accounts</h3>
                  <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
                </div>
              ) : (
                filteredUsers.map((userRecord) => (
                  <div 
                    key={userRecord.id}
                    className="p-5 bg-[#0f1622] hover:bg-[#121a28] border border-white/10 hover:border-white/20 rounded-2xl shadow-md transition-all space-y-4"
                  >
                    {/* User Header Summary */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-[var(--primary)] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-md">
                          {userRecord.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white">{userRecord.fullName}</h3>
                            <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 font-mono text-[10px] font-bold rounded-md">
                              {userRecord.semester || "Fall 2026"}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 font-mono text-[10px] font-bold rounded-md">
                              VERIFIED
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <span className="text-blue-400 font-mono font-bold">{userRecord.email}</span>
                            <span>•</span>
                            <span className="text-slate-300">{userRecord.university}</span>
                            <span>•</span>
                            <span className="text-slate-400">{userRecord.degree}</span>
                          </div>

                          {/* Student Master Password Credential View */}
                          <div className="pt-1 flex items-center gap-2">
                            <div className="px-2.5 py-1 bg-[#090d14] border border-amber-500/30 rounded-lg text-xs font-mono flex items-center gap-2">
                              <span className="text-slate-400 text-[10px] uppercase font-bold">Password:</span>
                              <span className="text-amber-300 font-bold">
                                {revealedPasswords[userRecord.id] 
                                  ? (userRecord.passwordHash || "OAuth Managed") 
                                  : "••••••••••••"}
                              </span>
                              <button
                                type="button"
                                onClick={() => setRevealedPasswords(prev => ({
                                  ...prev,
                                  [userRecord.id]: !prev[userRecord.id]
                                }))}
                                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition-colors"
                                title={revealedPasswords[userRecord.id] ? "Hide Password" : "Show Password"}
                              >
                                {revealedPasswords[userRecord.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin User-Level Actions */}
                      <div className="flex items-center gap-2 self-end lg:self-center flex-shrink-0">
                        {userRecord.activeSessions.length > 0 && (
                          <button
                            onClick={() => handleRevokeAllSessions(userRecord.email)}
                            className="px-3 py-1.5 bg-[#1a2330] hover:bg-[#222e40] text-slate-300 hover:text-white border border-white/10 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5 text-amber-400" />
                            <span>Revoke All Devices</span>
                          </button>
                        )}

                        <button
                          onClick={() => setUserToDelete(userRecord)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge User</span>
                        </button>
                      </div>
                    </div>

                    {/* Academic Snapshot Pill Counters */}
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-[#090d14] p-2.5 rounded-xl border border-white/5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        <span>{userRecord.coursesCount} Enrolled Courses</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span>{userRecord.tasksCount} Tasks & Deadlines</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{userRecord.examsCount} Scheduled Exams</span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <div className="hidden sm:flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Registered: {new Date(userRecord.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* CONNECTED / LOGGED-IN DEVICES TRAY */}
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      <div className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          CONNECTED DEVICES & ACTIVE SESSIONS ({userRecord.activeSessions.length})
                        </span>
                        {userRecord.activeSessions.length > 1 && (
                          <span className="text-emerald-400 font-normal">Multi-Device Active</span>
                        )}
                      </div>

                      {userRecord.activeSessions.length === 0 ? (
                        <div className="p-3 bg-[#080d14] border border-white/5 rounded-xl text-xs text-slate-500 font-mono">
                          No active device sessions currently registered.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {userRecord.activeSessions.map((session, sIdx) => (
                            <div 
                              key={session.deviceId || sIdx}
                              className="p-3 bg-[#0a0f17] border border-white/10 rounded-xl flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                  {renderDeviceIcon(session.deviceType)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                    <span>{session.deviceName}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono truncate">
                                    {session.os} • {session.browser}
                                  </div>
                                  <div className="text-[9px] text-slate-500 font-mono truncate">
                                    Logged in: {new Date(session.loginTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRevokeDevice(userRecord.email, session.deviceId)}
                                title="Revoke this device session"
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>

          </div>
        )}

      </main>

      {/* CONFIRMATION PURGE DIALOG MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f141c] border border-red-500/40 text-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Purge Student Account</h3>
                <span className="text-[11px] font-mono text-red-400">ADMINISTRATIVE ACTION</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-bold text-white font-mono">{userToDelete.fullName}</span> (<span className="text-blue-400 font-mono">{userToDelete.email}</span>)?
            </p>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-300">
              This action immediately removes all enrolled courses, deliverables, syllabus extractions, and connected device sessions directly from the database.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase rounded-xl transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-red-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "PURGING..." : "CONFIRM PURGE"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
