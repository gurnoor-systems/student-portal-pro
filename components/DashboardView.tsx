"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth, TaskItem, CourseItem, ExamItem } from "@/lib/auth-context";
import AssignmentTracker from "@/components/AssignmentTracker";
import ClassroomsHub from "@/components/ClassroomsHub";
import CalendarView from "@/components/CalendarView";
import ExamsHub from "@/components/ExamsHub";
import AnalyticsHub from "@/components/AnalyticsHub";
import FlashcardsHub from "@/components/FlashcardsHub";
import CourseDocumentViewer from "@/components/CourseDocumentViewer";
import FocusSanctuary from "@/components/FocusSanctuary";
import ProfileModal from "@/components/ProfileModal";
import { playSuccessChime } from "@/lib/audio";
import { 
  Plus, 
  Check, 
  Clock, 
  Video, 
  Flame, 
  Calendar as CalendarIcon, 
  GraduationCap, 
  BookOpen, 
  Filter, 
  CheckCircle2, 
  Circle, 
  ArrowUpRight, 
  ShieldCheck, 
  BrainCircuit, 
  FolderPlus, 
  Kanban, 
  LayoutGrid, 
  Sparkles,
  BarChart3,
  Download,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  CheckSquare,
  Users,
  CalendarCheck,
  Timer,
  Brain,
  FileText,
  AlignJustify,
  Rows
} from "lucide-react";

interface DashboardViewProps {
  onOpenQuickAdd: () => void;
  onOpenWalkthrough: () => void;
}

export default function DashboardView({ onOpenQuickAdd, onOpenWalkthrough }: DashboardViewProps) {
  const { user, userData, updateTask, toggleDensityPreference } = useAuth();
  const [dashboardTab, setDashboardTab] = useState<"summary" | "tracker" | "classrooms" | "calendar" | "exams" | "flashcards" | "documents" | "analytics">("summary");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isFocusSanctuaryOpen, setIsFocusSanctuaryOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">(user?.densityPreference || "comfortable");
  const [greeting, setGreeting] = useState("Good Day");
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState("");
  const [currentDateFormatted, setCurrentDateFormatted] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (user?.densityPreference) {
      setDensity(user.densityPreference);
    }
  }, [user]);

  // Online / offline detector
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Global shortcut Ctrl+Shift+F for Focus Sanctuary
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsFocusSanctuaryOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Live time and dynamic greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 17) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");

      setCurrentTimeFormatted(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
      setCurrentDateFormatted(now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Toggle density
  const handleToggleDensity = () => {
    const next = density === "comfortable" ? "compact" : "comfortable";
    setDensity(next);
    toggleDensityPreference(next);
  };

  // Handlers for task status
  const handleToggleTask = useCallback((taskId: string) => {
    const target = userData.tasks.find(t => t.id === taskId);
    if (!target) return;
    const nextStatus: "todo" | "in_progress" | "completed" = target.status === "completed" ? "todo" : "completed";
    if (nextStatus === "completed") {
      playSuccessChime();
    }
    updateTask(taskId, { status: nextStatus });
  }, [userData.tasks, updateTask]);

  // Metrics computation derived reactively
  const metrics = useMemo(() => {
    const total = userData.tasks.length;
    const completed = userData.tasks.filter(t => t.status === "completed").length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 100;
    const urgentCount = userData.tasks.filter(t => t.priority === "high" && t.status !== "completed").length;
    const activeClasses = (userData.courses || []).length;

    return { total, completed, completionRate, urgentCount, activeClasses };
  }, [userData]);

  // Export semester snapshot to JSON
  const handleExportData = () => {
    const jsonStr = JSON.stringify(userData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Academic_Snapshot_${user?.fullName.replace(/\s+/g, "_") || "Portal"}_${user?.semester.replace(/\s+/g, "_") || "Semester"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: "summary", label: "Today", icon: LayoutDashboard, badge: metrics.urgentCount > 0 ? `${metrics.urgentCount}` : null },
    { id: "tracker", label: "Tasks", icon: CheckSquare, badge: `${userData.tasks.filter(t => t.status !== "completed").length}` },
    { id: "classrooms", label: "Classes & Links", icon: Users, badge: `${metrics.activeClasses}` },
    { id: "calendar", label: "Calendar", icon: CalendarIcon, badge: user?.googleCalendarSynced ? "Sync" : null },
    { id: "exams", label: "Exams & Plan", icon: Clock, badge: "AI" },
    { id: "flashcards", label: "Flashcards & Recall", icon: Brain, badge: "Recall" },
    { id: "documents", label: "Course Documents", icon: FileText, badge: "Docs" },
    { id: "analytics", label: "Analytics & GPA", icon: BarChart3, badge: "14d" },
  ];

  return (
    <div className="flex-1 flex min-h-[calc(100vh-64px)] bg-[var(--canvas)] text-[var(--ink)]">
      
      {/* 1. SLEEK COLLAPSIBLE LEFT SIDEBAR */}
      <aside 
        className={`bg-[var(--surface-soft)] border-r border-[var(--hairline)] flex flex-col justify-between transition-all duration-300 z-20 ${
          isSidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="p-3 space-y-4">
          
          {/* Sidebar Header & Toggle */}
          <div className={`flex items-center pb-2 border-b border-[var(--hairline)] ${isSidebarCollapsed ? "justify-center" : "justify-between px-2"}`}>
            {!isSidebarCollapsed && (
              <div className="text-[10px] font-mono tracking-[1.5px] uppercase text-[var(--muted)] font-bold">
                WORKSPACE
              </div>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer rounded hover:bg-[var(--surface-strong)]"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Action Buttons: New Task + Focus Sanctuary */}
          <div className="space-y-1.5">
            <button
              onClick={onOpenQuickAdd}
              className={`w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 rounded shadow-sm cursor-pointer ${
                isSidebarCollapsed ? "px-0" : "px-3"
              }`}
              title="Quick Add Task (Ctrl+K)"
            >
              <Plus className="w-4 h-4" />
              {!isSidebarCollapsed && <span>NEW TASK</span>}
            </button>

            <button
              onClick={() => setIsFocusSanctuaryOpen(true)}
              className={`w-full py-2 bg-[var(--surface-card)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] hover:border-[#d4af37] text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 rounded cursor-pointer ${
                isSidebarCollapsed ? "px-0 text-[#d4af37]" : "px-3 text-[var(--ink)]"
              }`}
              title="Open Focus Sanctuary (Ctrl+Shift+F)"
            >
              <Timer className="w-3.5 h-3.5 text-[#d4af37]" />
              {!isSidebarCollapsed && <span>FOCUS ROOM</span>}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 pt-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = dashboardTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setDashboardTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded transition-all cursor-pointer ${
                    isActive
                      ? "bg-[var(--surface-card)] text-[var(--primary)] shadow-sm border border-[var(--hairline)] font-bold"
                      : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-strong)]"
                  } ${isSidebarCollapsed ? "justify-center px-0" : "justify-between"}`}
                  title={item.label}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[var(--primary)]" : "text-[var(--muted)]"}`} />
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </div>

                  {!isSidebarCollapsed && item.badge && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      item.badge === "AI" || item.badge === "Recall"
                        ? "bg-amber-500/15 text-[#d4af37]"
                        : item.badge === "Sync"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-[var(--surface-strong)] text-[var(--muted)]"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Student Profile / Campus info */}
        <div className="p-3 border-t border-[var(--hairline)] space-y-2">
          {!isSidebarCollapsed ? (
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="px-3 py-2 bg-[var(--surface-card)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] hover:border-[var(--primary)] rounded text-xs space-y-1 cursor-pointer transition-colors group"
              title="Click to manage subjects, semester rollover, or change password"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-[var(--ink)] truncate">{user?.university || "University"}</div>
                <span className="text-[9px] font-mono text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity font-bold">EDIT ›</span>
              </div>
              <div className="text-[10px] text-[var(--muted)] font-mono flex items-center justify-between">
                <span>{user?.semester || "Active Semester"}</span>
                <span className="text-[var(--primary)] font-bold truncate max-w-[120px]" title={user?.degree || user?.major || "Student"}>
                  {user?.degree ? user.degree.split(" ")[0] : user?.major || "Student"}
                </span>
              </div>
              <div className="text-[10px] text-[var(--muted)] font-mono flex items-center gap-1.5 pt-1 border-t border-[var(--hairline)]">
                <span className={`w-1.5 h-1.5 rounded-full ${user?.googleCalendarSynced ? "bg-emerald-500" : "bg-blue-500"}`} />
                <span>{user?.googleCalendarSynced ? "Google Calendar: Live" : "Local Sandbox"}</span>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="flex justify-center py-1 cursor-pointer"
              title="Manage Profile & Subjects"
            >
              <span className={`w-2 h-2 rounded-full ${user?.googleCalendarSynced ? "bg-emerald-500" : "bg-blue-500"}`} title={user?.googleCalendarSynced ? "Google Calendar Synced" : "Local"} />
            </div>
          )}
        </div>

      </aside>

      {/* 2. MAIN WORKSPACE CONTENT */}
      <main className={`flex-1 ${density === "compact" ? "p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-5" : "p-3.5 sm:p-6 lg:p-10 space-y-5 sm:space-y-8"} max-w-[1440px] mx-auto overflow-y-auto w-full`}>
        
        {/* Mobile Swipeable Tab Switcher (Visible on < 1024px) */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-2 -mx-3.5 px-3.5 sm:-mx-6 sm:px-6 scrollbar-none border-b border-[var(--hairline)]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = dashboardTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setDashboardTab(item.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isActive 
                    ? "bg-[var(--primary)] text-white shadow-md shadow-blue-500/20" 
                    : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--hairline)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[var(--hairline)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className={`${density === "compact" ? "text-lg sm:text-2xl" : "text-xl sm:text-3xl"} font-bold tracking-tight text-[var(--ink)]`}>
                {greeting}, {user?.fullName.split(" ")[0] || "Scholar"}
              </h1>
              {user?.googleCalendarSynced && (
                <span className="hidden sm:inline-flex px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[10px] font-mono font-bold rounded items-center gap-1">
                  <CalendarCheck className="w-3 h-3" />
                  <span>SYNCED</span>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[var(--muted)] font-mono">
              {currentDateFormatted} • <span className="text-[var(--primary)] font-semibold">{user?.university || "University"}</span> {user?.degree ? `(${user.degree.split(" ")[0]} • ${user.semester || "Active"})` : `(${user?.semester || "Active"})`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Zero-Scroll Density Switcher */}
            <button
              onClick={handleToggleDensity}
              className={`px-2.5 sm:px-3 py-1.5 rounded border text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                density === "compact"
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                  : "bg-[var(--surface-soft)] text-[var(--muted)] border-[var(--hairline)] hover:text-[var(--ink)]"
              }`}
              title="Toggle Zero-Scroll Density Mode"
            >
              {density === "compact" ? <Rows className="w-3.5 h-3.5" /> : <AlignJustify className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{density === "compact" ? "COMPACT" : "COMFORTABLE"}</span>
            </button>

            <button
              onClick={() => setIsFocusSanctuaryOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] border border-[#d4af37]/40 text-[11px] sm:text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5 rounded transition-all cursor-pointer"
              title="Open Focus Sanctuary"
            >
              <Timer className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Focus</span>
            </button>

            <button
              onClick={onOpenQuickAdd}
              className="px-3 sm:px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded transition-all cursor-pointer shadow-sm ml-auto sm:ml-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* 3. ACTIVE VIEW CONTENT */}
        {dashboardTab === "summary" && (
          <div className={`${density === "compact" ? "space-y-4 sm:space-y-5" : "space-y-6 sm:space-y-8"} animate-in fade-in duration-200`}>
            
            {/* Top 4 KPI Metrics */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 ${density === "compact" ? "gap-3" : "gap-4 sm:gap-6"}`}>
              
              <div className={`${density === "compact" ? "p-3.5 space-y-1" : "p-5 space-y-2"} bg-[var(--surface-card)] border border-[var(--hairline)] rounded-xl shadow-sm`}>
                <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">COMPLETION RATE</div>
                <div className={`${density === "compact" ? "text-2xl" : "text-3xl"} font-bold text-[var(--ink)]`}>{metrics.completionRate}%</div>
                <div className="text-[11px] text-[var(--muted)] font-light">{metrics.completed} of {metrics.total} deliverables completed</div>
              </div>

              <div className={`${density === "compact" ? "p-3.5 space-y-1" : "p-5 space-y-2"} bg-[var(--surface-card)] border border-[var(--hairline)] rounded-xl shadow-sm`}>
                <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">URGENT TASKS</div>
                <div className={`${density === "compact" ? "text-2xl" : "text-3xl"} font-bold text-red-500`}>{metrics.urgentCount}</div>
                <div className="text-[11px] text-[var(--muted)] font-light">Due within 24-48 hours</div>
              </div>

              <div className={`${density === "compact" ? "p-3.5 space-y-1" : "p-5 space-y-2"} bg-[var(--surface-card)] border border-[var(--hairline)] rounded-xl shadow-sm`}>
                <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">STUDY STREAK</div>
                <div className={`${density === "compact" ? "text-2xl" : "text-3xl"} font-bold text-amber-500 flex items-center gap-1.5`}>
                  <span>14</span>
                  <Flame className="w-4 h-4 text-amber-500 fill-current" />
                </div>
                <div className="text-[11px] text-[var(--muted)] font-light">Days continuous focus</div>
              </div>

              <div className={`${density === "compact" ? "p-3.5 space-y-1" : "p-5 space-y-2"} bg-[var(--surface-card)] border border-[var(--hairline)] rounded-xl shadow-sm`}>
                <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">ACTIVE COURSES</div>
                <div className={`${density === "compact" ? "text-2xl" : "text-3xl"} font-bold text-[var(--primary)]`}>{metrics.activeClasses}</div>
                <div className="text-[11px] text-[var(--muted)] font-light">{user?.googleCalendarSynced ? "Google Calendar Synced" : "Local Sandbox"}</div>
              </div>

            </div>

            {/* Two Column Split: Deliverables + Live Meeting Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Deliverables */}
              <div className="lg:col-span-8 p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                  <h3 className="text-sm font-bold text-[var(--ink)]">Active Deliverables</h3>
                  <button 
                    onClick={() => setDashboardTab("tracker")}
                    className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    Open Kanban Board ›
                  </button>
                </div>

                {userData.tasks.length > 0 ? (
                  <div className={`${density === "compact" ? "space-y-1.5" : "space-y-2.5"}`}>
                    {userData.tasks.slice(0, 5).map(task => (
                      <div 
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`${density === "compact" ? "p-2.5" : "p-3.5"} bg-[var(--surface-soft)] border border-[var(--hairline)] hover:border-[var(--primary)] rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            task.status === "completed" 
                              ? "bg-[var(--primary)] border-[var(--primary)] text-white" 
                              : "border-slate-400"
                          }`}>
                            {task.status === "completed" && <Check className="w-3 h-3" />}
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${task.status === "completed" ? "line-through text-[var(--muted)]" : "text-[var(--ink)]"}`}>
                              {task.title}
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                              {task.courseCode} • Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          task.priority === "high" 
                            ? "bg-red-500/15 text-red-500 border border-red-500/20"
                            : "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                        }`}>
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Clean Slate Empty State */
                  <div className="py-10 text-center space-y-3">
                    <CheckCircle2 className="w-8 h-8 text-[var(--primary)] mx-auto opacity-70" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-[var(--ink)]">No Active Tasks in Backlog</div>
                      <p className="text-[11px] text-[var(--muted)] font-light max-w-sm mx-auto">
                        Your workspace is clear. Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[var(--surface-strong)] text-[var(--ink)] border border-[var(--hairline)] rounded shadow-xs">Ctrl+K</kbd> or click below to capture your first assignment.
                      </p>
                    </div>
                    <button
                      onClick={onOpenQuickAdd}
                      className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                    >
                      + ADD FIRST DELIVERABLE
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Live Classrooms Hub */}
              <div className="lg:col-span-4 p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                    <h3 className="text-sm font-bold text-[var(--ink)]">Live Lectures</h3>
                    <span className="text-[10px] font-mono text-emerald-500 font-bold">READY</span>
                  </div>

                  {/* Scheduled Video Meetings */}
                  {userData.tasks.filter(t => t.meetingLink && t.status !== "completed").length > 0 && (
                    <div className="space-y-2 mb-3">
                      <div className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1.5">
                        <Video className="w-3 h-3 text-purple-400" />
                        <span>SCHEDULED MEETINGS ({userData.tasks.filter(t => t.meetingLink && t.status !== "completed").length})</span>
                      </div>
                      {userData.tasks.filter(t => t.meetingLink && t.status !== "completed").slice(0, 2).map(task => (
                        <div key={task.id} className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-purple-300 font-bold">{task.courseCode}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{task.eventTime || "Scheduled Time"}</span>
                          </div>
                          <div className="text-xs font-bold text-white truncate">{task.title}</div>
                          <a
                            href={task.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors mt-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>JOIN LIVE MEETING</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enrolled Subjects List */}
                  {userData.courses.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">
                        ENROLLED SUBJECTS ({userData.courses.length})
                      </div>
                      {userData.courses.slice(0, 3).map(c => (
                        <div key={c.id} className="p-2.5 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[var(--primary)] font-bold">{c.courseCode}</span>
                              <span className="text-xs font-bold text-[var(--ink)] truncate max-w-[140px]">{c.courseName}</span>
                            </div>
                            <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5">{c.instructor || "Faculty Professor"}</div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-[var(--surface-card)] border border-[var(--hairline)] text-[var(--muted)] font-mono rounded">
                            {userData.tasks.filter(t => t.courseCode === c.courseCode && t.status !== "completed").length} active
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center space-y-2">
                      <BookOpen className="w-6 h-6 text-[var(--muted)] mx-auto opacity-70" />
                      <div className="text-xs font-bold text-[var(--ink)]">No Enrolled Courses</div>
                      <p className="text-[11px] text-[var(--muted)] font-light">
                        Add subjects in Profile or Classrooms Hub to organize your semester.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setDashboardTab("classrooms")}
                  className="w-full py-2 border border-[var(--hairline)] hover:border-[var(--ink)] text-xs font-bold text-[var(--ink)] rounded-lg uppercase transition-colors cursor-pointer mt-3"
                >
                  Manage Courses & Files
                </button>
              </div>

            </div>
          </div>
        )}

        {dashboardTab === "tracker" && (
          <AssignmentTracker onOpenQuickAdd={onOpenQuickAdd} />
        )}

        {dashboardTab === "classrooms" && (
          <ClassroomsHub />
        )}

        {dashboardTab === "calendar" && (
          <CalendarView onOpenQuickAdd={onOpenQuickAdd} />
        )}

        {dashboardTab === "exams" && (
          <ExamsHub />
        )}

        {dashboardTab === "flashcards" && (
          <FlashcardsHub />
        )}

        {dashboardTab === "documents" && (
          <CourseDocumentViewer />
        )}

        {dashboardTab === "analytics" && (
          <AnalyticsHub />
        )}

      </main>

      {/* Dedicated Fullscreen Focus Sanctuary Overlay */}
      <FocusSanctuary 
        isOpen={isFocusSanctuaryOpen}
        onClose={() => setIsFocusSanctuaryOpen(false)}
        onTaskCompleted={handleToggleTask}
      />

      {/* Student Profile, Subjects & Password Management Modal */}
      <ProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

    </div>
  );
}
