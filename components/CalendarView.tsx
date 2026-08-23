"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import GoogleCalendarConnectModal from "@/components/GoogleCalendarConnectModal";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Video, 
  BookOpen, 
  Check, 
  AlertCircle,
  RefreshCw,
  X,
  Plus,
  Settings
} from "lucide-react";

interface CalendarViewProps {
  onOpenQuickAdd: () => void;
}

export default function CalendarView({ onOpenQuickAdd }: CalendarViewProps) {
  const { user, userData } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 20)); // August 2026
  const [selectedDay, setSelectedDay] = useState<number | null>(20);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState("Last synced 2 mins ago");
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 7, 20));
    setSelectedDay(20);
  };

  const handleSyncGoogleCalendar = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus("Just now");
    }, 800);
  };

  // Helper to retrieve deliverables for a specific day
  const getTasksForDay = (day: number) => {
    return userData.tasks.filter(t => {
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  // Helper to retrieve exams for a specific day
  const getExamsForDay = (day: number) => {
    return userData.exams.filter(e => {
      const d = new Date(e.examDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  // Selected Day Events
  const selectedDayTasks = selectedDay ? getTasksForDay(selectedDay) : [];
  const selectedDayExams = selectedDay ? getExamsForDay(selectedDay) : [];

  return (
    <div className="space-y-6">
      
      {/* Calendar Top Control Header */}
      <div className="bmw-card flex flex-col md:flex-row md:items-center justify-between gap-4 p-6">
        
        {/* Month Title & Nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
              {monthNames[month]} {year}
            </h2>
          </div>

          <div className="flex items-center border border-[var(--hairline-strong)] rounded">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-[var(--surface-soft)] text-[var(--ink)] cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 text-xs font-bold font-mono hover:bg-[var(--surface-soft)] text-[var(--ink)] border-x border-[var(--hairline-strong)] cursor-pointer"
            >
              TODAY
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-[var(--surface-soft)] text-[var(--ink)] cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync & Action Group */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="px-3 py-2 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5 rounded transition-all cursor-pointer"
            title="Configure Google Calendar Connection"
          >
            <Settings className="w-3.5 h-3.5 text-[#4285F4]" />
            <span>Google Sync Options</span>
          </button>

          <button
            onClick={handleSyncGoogleCalendar}
            disabled={isSyncing}
            className="bmw-btn-secondary !h-10 !text-xs !py-2 flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[var(--primary)] ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "SYNCING..." : "PULL LATEST"}</span>
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="bmw-btn-primary !h-10 !text-xs !py-2"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>ADD DELIVERABLE</span>
          </button>
        </div>

      </div>

      {/* Sync Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs text-[var(--muted)] font-mono rounded">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${user?.googleCalendarSynced ? "bg-emerald-500 animate-pulse" : "bg-blue-500"}`} />
          <span>{user?.googleCalendarSynced ? "Google Calendar: Live 2-Way Sync Active" : "Local Sandbox Mode (Google Sync Optional)"}</span>
          <span>•</span>
          <span>{syncStatus}</span>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" />
            <span>High Priority / Exams</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" />
            <span>Assignments</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm" />
            <span>Lectures</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar Grid (8 cols) + Day Details Drawer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 1. Interactive Month Grid */}
        <div className="lg:col-span-8 bmw-card p-4 sm:p-6 overflow-hidden">
          
          {/* Day Headers (Sun - Sat) */}
          <div className="grid grid-cols-7 border-b border-[var(--hairline)] pb-3 mb-2 text-center text-[11px] font-mono font-bold tracking-wider text-[var(--muted)]">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            
            {/* Blank offset cells */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div 
                key={`empty-${idx}`} 
                className="h-24 sm:h-28 bg-[var(--surface-soft)]/40 border border-transparent rounded opacity-30"
              />
            ))}

            {/* Active days in month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayTasks = getTasksForDay(dayNum);
              const dayExams = getExamsForDay(dayNum);
              const isSelected = selectedDay === dayNum;
              const isToday = dayNum === 20 && month === 7 && year === 2026;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`h-24 sm:h-28 p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between rounded group ${
                    isSelected 
                      ? "border-[var(--primary)] bg-[var(--surface-strong)] shadow-sm ring-1 ring-[var(--primary)]" 
                      : isToday
                        ? "border-[var(--hairline-strong)] bg-[var(--surface-card)]"
                        : "border-[var(--hairline)] bg-[var(--canvas)] hover:border-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                      isToday 
                        ? "bg-[var(--primary)] text-white" 
                        : isSelected
                          ? "text-[var(--primary)] font-extrabold"
                          : "text-[var(--ink)]"
                    }`}>
                      {dayNum}
                    </span>

                    {/* Indicators dot */}
                    {(dayTasks.length > 0 || dayExams.length > 0) && (
                      <div className="flex items-center gap-1">
                        {dayExams.length > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                        {dayTasks.length > 0 && <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full" />}
                      </div>
                    )}
                  </div>

                  {/* Micro Task Badges (up to 2 preview pills) */}
                  <div className="space-y-1 overflow-hidden my-1">
                    {dayExams.map(ex => (
                      <div 
                        key={ex.id}
                        className="text-[9px] font-mono px-1 py-0.5 bg-red-500/15 border border-red-500/30 text-red-500 truncate rounded font-bold"
                        title={`Exam: ${ex.title}`}
                      >
                        🔥 {ex.courseCode} EXAM
                      </div>
                    ))}

                    {dayTasks.slice(0, 2).map(task => (
                      <div 
                        key={task.id}
                        className={`text-[9px] font-mono px-1 py-0.5 border truncate rounded flex items-center gap-1 ${
                          task.meetingLink
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-400 font-bold"
                            : task.priority === "high" 
                              ? "bg-red-500/10 border-red-500/20 text-red-500" 
                              : "bg-blue-500/10 border-blue-500/20 text-[var(--primary)]"
                        }`}
                        title={task.meetingLink ? `Live Meeting: ${task.title}` : task.title}
                      >
                        {task.meetingLink && <Video className="w-2.5 h-2.5 flex-shrink-0 text-purple-400" />}
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}

                    {dayTasks.length > 2 && (
                      <div className="text-[8px] font-mono text-[var(--muted)] text-right pr-1">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Bottom Day footer indicator */}
                  <div className="text-[8.5px] font-mono text-[var(--muted)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Select</span>
                  </div>
                </div>
              );
            })}

          </div>

        </div>

        {/* 2. Selected Day Detail View Drawer (4 cols) */}
        <div className="lg:col-span-4 bmw-card p-6 flex flex-col justify-between space-y-6">
          
          <div className="space-y-5">
            {/* Header of selected day */}
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
              <div>
                <div className="text-[10px] font-mono tracking-[1.5px] uppercase text-[var(--primary)] font-bold">
                  SCHEDULE FOR
                </div>
                <h3 className="text-xl font-bold text-[var(--ink)]">
                  {selectedDay ? `${monthNames[month]} ${selectedDay}, ${year}` : "Select a Date"}
                </h3>
              </div>

              {selectedDay && (
                <button
                  onClick={onOpenQuickAdd}
                  className="p-2 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] text-[var(--primary)] rounded border border-[var(--hairline)] transition-colors cursor-pointer"
                  title="Add Task for this day"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* List of events on this day */}
            {selectedDay ? (
              <div className="space-y-3">
                {selectedDayExams.length === 0 && selectedDayTasks.length === 0 && (
                  <div className="py-12 text-center text-xs text-[var(--muted)] font-light space-y-3">
                    <CalendarIcon className="w-8 h-8 mx-auto text-[var(--muted)] opacity-50" />
                    <div>No scheduled deliverables or exams on this date.</div>
                    <button
                      onClick={onOpenQuickAdd}
                      className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      + Add Deliverable
                    </button>
                  </div>
                )}

                {/* Major Exams */}
                {selectedDayExams.map(ex => (
                  <div 
                    key={ex.id}
                    className="p-3.5 bg-red-500/10 border border-red-500/30 rounded space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-red-500 font-bold tracking-wider uppercase">
                        EXAMINATION ({ex.weightPercent}%)
                      </span>
                      <span className="text-[10px] font-mono text-red-500">
                        {new Date(ex.examDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[var(--ink)]">
                      {ex.title}
                    </div>
                    <div className="text-[11px] text-[var(--muted)] font-light">
                      📍 {ex.location || "To Be Announced"}
                    </div>
                  </div>
                ))}

                {/* Deliverable Tasks & Scheduled Meetings */}
                {selectedDayTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`p-3.5 rounded space-y-2 transition-all ${
                      task.meetingLink 
                        ? "bg-purple-500/10 border border-purple-500/30 hover:border-purple-500/60 shadow-sm"
                        : "bg-[var(--surface-soft)] border border-[var(--hairline)] hover:border-[var(--primary)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                        task.meetingLink ? "text-purple-400" : "text-[var(--primary)]"
                      }`}>
                        {task.meetingLink && <Video className="w-3.5 h-3.5 text-purple-400" />}
                        <span>{task.courseCode} • {task.category}</span>
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        task.priority === "high" ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-[var(--ink)]">
                      {task.title}
                    </div>

                    {task.eventTime && (
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span>{task.eventTime}</span>
                      </div>
                    )}

                    {task.meetingLink && (
                      <a
                        href={task.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md shadow-purple-500/20"
                      >
                        <Video className="w-4 h-4" />
                        <span>JOIN LIVE MEETING / CLASS</span>
                      </a>
                    )}

                    <div className="text-[10px] text-[var(--muted)] font-mono flex items-center justify-between pt-1 border-t border-[var(--hairline)]">
                      <span>Status: {task.status.replace("_", " ").toUpperCase()}</span>
                      <span>Google Sync: Active</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[var(--muted)] font-light">
                Click any day on the calendar grid to inspect deadlines and exams.
              </div>
            )}
          </div>

          {/* Bottom Card Footer */}
          <div className="pt-4 border-t border-[var(--hairline)] text-xs text-[var(--muted)] flex items-center justify-between">
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="text-[var(--primary)] hover:underline font-bold font-mono text-[11px] cursor-pointer"
            >
              Configure Google Calendar ›
            </button>
            <span className="font-mono text-[10px]">{userData.tasks.length} total deliverables</span>
          </div>

        </div>

      </div>

      {/* Optional Google Calendar Connect Modal */}
      <GoogleCalendarConnectModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

    </div>
  );
}
