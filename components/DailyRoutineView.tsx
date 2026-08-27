"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth, CourseItem, TaskItem } from "@/lib/auth-context";
import { playSuccessChime } from "@/lib/audio";
import { fireMilestoneConfetti } from "@/lib/confetti";
import { 
  Sun, 
  Moon, 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Clock, 
  Play, 
  Video, 
  BookOpen, 
  Coffee, 
  Check, 
  Trash2, 
  Calendar as CalendarIcon,
  ChevronRight,
  Sliders,
  Target,
  Zap
} from "lucide-react";

interface RoutineItem {
  id: string;
  title: string;
  category: "morning" | "lecture" | "focus" | "evening" | "custom";
  timeSlot: string; // e.g. "08:00 AM - 08:30 AM"
  startHour: number; // 0-23
  startMinute: number; // 0-59
  durationMinutes: number;
  completed: boolean;
  notes?: string;
  courseCode?: string;
  meetingLink?: string;
  isRecurring?: boolean;
}

interface DailyRoutineViewProps {
  onOpenFocusSanctuary: () => void;
  onOpenQuickAdd: () => void;
}

export default function DailyRoutineView({ onOpenFocusSanctuary, onOpenQuickAdd }: DailyRoutineViewProps) {
  const { user, userData } = useAuth();
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState<number>(new Date().getMinutes());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<"morning" | "focus" | "evening" | "custom">("focus");
  const [newStartTime, setNewStartTime] = useState("14:00");
  const [newEndTime, setNewEndTime] = useState("15:30");
  const [newNotes, setNewNotes] = useState("");

  const calculatedDuration = useMemo(() => {
    const [h1, m1] = newStartTime.split(":").map(Number);
    const [h2, m2] = newEndTime.split(":").map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) diff += 24 * 60; // Handle rollover
    return diff;
  }, [newStartTime, newEndTime]);

  const handleSetPresetDuration = (mins: number) => {
    const [h, m] = newStartTime.split(":").map(Number);
    const totalMins = (h * 60 + m + mins) % (24 * 60);
    const newH = Math.floor(totalMins / 60);
    const newM = totalMins % 60;
    setNewEndTime(`${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`);
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const storageKey = useMemo(() => {
    return user ? `student_portal_user_${user.id}_routine_${todayStr}` : `student_portal_routine_${todayStr}`;
  }, [user, todayStr]);

  // Initial default routine blocks
  const defaultRoutine: RoutineItem[] = useMemo(() => {
    return [
      {
        id: "rt_morning",
        title: "Morning Academic Kickoff & Priority Alignment",
        category: "morning",
        timeSlot: "08:00 AM - 08:30 AM (30 min)",
        startHour: 8,
        startMinute: 0,
        durationMinutes: 30,
        completed: false,
        notes: "Review today's lecture schedule and pin top 3 urgent assignments."
      },
      {
        id: "rt_focus_1",
        title: "Deep Work Block • High-Priority Assignment",
        category: "focus",
        timeSlot: "10:30 AM - 12:00 PM (90 min)",
        startHour: 10,
        startMinute: 30,
        durationMinutes: 90,
        completed: false,
        notes: "50-minute Pomodoro focus block in Focus Sanctuary."
      },
      {
        id: "rt_focus_2",
        title: "Afternoon Revision & Lecture Catch-up",
        category: "focus",
        timeSlot: "03:00 PM - 04:30 PM (90 min)",
        startHour: 15,
        startMinute: 0,
        durationMinutes: 90,
        completed: false,
        notes: "Review classroom materials and AI summary flashcards."
      },
      {
        id: "rt_evening",
        title: "Evening Wind-Down & Tomorrow's Preparation",
        category: "evening",
        timeSlot: "09:00 PM - 09:30 PM (30 min)",
        startHour: 21,
        startMinute: 0,
        durationMinutes: 30,
        completed: false,
        notes: "Check off completed daily tasks, log study streak, preview upcoming exams."
      }
    ];
  }, []);

  // Routine State
  const [routines, setRoutines] = useState<RoutineItem[]>(() => {
    if (typeof window === "undefined") return defaultRoutine;
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : defaultRoutine;
    } catch {
      return defaultRoutine;
    }
  });

  // Track live clock for timeline current-time indicator
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentHour(d.getHours());
      setCurrentMinute(d.getMinutes());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Save changes to localStorage
  const saveRoutines = useCallback((updated: RoutineItem[]) => {
    setRoutines(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {}
  }, [storageKey]);

  // Toggle routine item completion
  const handleToggleRoutine = (id: string) => {
    const updated = routines.map(r => {
      if (r.id === id) {
        const nextState = !r.completed;
        if (nextState) {
          playSuccessChime();
        }
        return { ...r, completed: nextState };
      }
      return r;
    });

    saveRoutines(updated);

    // Check if 100% routine completed
    const allDone = updated.every(r => r.completed);
    if (allDone && updated.length > 0) {
      fireMilestoneConfetti("streak");
    }
  };

  // Add custom routine with directly chosen End Time
  const handleAddRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const [h1Str, m1Str] = newStartTime.split(":");
    const h1 = parseInt(h1Str, 10) || 12;
    const m1 = parseInt(m1Str, 10) || 0;

    const [h2Str, m2Str] = newEndTime.split(":");
    const h2 = parseInt(h2Str, 10) || 13;
    const m2 = parseInt(m2Str, 10) || 0;

    const format12 = (h: number, m: number) => {
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 || 12;
      return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    };

    const timeSlotStr = `${format12(h1, m1)} - ${format12(h2, m2)}`;

    const newBlock: RoutineItem = {
      id: `rt_custom_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      timeSlot: `${timeSlotStr} (${calculatedDuration} min)`,
      startHour: h1,
      startMinute: m1,
      durationMinutes: calculatedDuration,
      completed: false,
      notes: newNotes.trim() || undefined
    };

    const updated = [...routines, newBlock].sort((a, b) => {
      return (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute);
    });

    saveRoutines(updated);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewNotes("");
  };

  const handleDeleteRoutine = (id: string) => {
    const updated = routines.filter(r => r.id !== id);
    saveRoutines(updated);
  };

  // Metrics
  const completedCount = routines.filter(r => r.completed).length;
  const totalCount = routines.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered Routines
  const filteredRoutines = useMemo(() => {
    if (filterCategory === "all") return routines;
    return routines.filter(r => r.category === filterCategory);
  }, [routines, filterCategory]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Overview & Progress Card */}
      <div className="bmw-card bg-gradient-to-br from-[var(--surface-soft)] via-[var(--surface)] to-[var(--surface-soft)] border border-[var(--hairline)] p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30 rounded-md flex items-center gap-1">
                <Target className="w-3 h-3" /> DAILY TIMEBLOCKING ENGINE
              </span>
              <span className="text-xs text-[var(--muted)] font-mono">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--ink)] tracking-tight">
              Academic Daily Routine
            </h1>
            <p className="text-sm text-[var(--muted)] mt-1 max-w-xl">
              Structured timeblocking balancing morning rituals, live course lectures, deep focus blocks, and evening reviews.
            </p>
          </div>

          {/* Progress Indicator & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Circular Progress Ring */}
            <div className="flex items-center gap-3 bg-[var(--canvas)] border border-[var(--hairline)] px-4 py-3 rounded-xl">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-[var(--hairline)]"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[var(--primary)] transition-all duration-700 ease-out"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-extrabold text-[var(--ink)]">
                  {progressPercent}%
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-[var(--ink)]">
                  {completedCount} of {totalCount} Completed
                </div>
                <div className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Active Streak Tracking
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-3 bg-[var(--primary)] text-white text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg hover:bg-[var(--primary-active)] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Routine Block</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-[var(--hairline)]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mr-2">
            Filter:
          </span>
          {[
            { id: "all", label: "All Blocks" },
            { id: "morning", label: "🌅 Morning" },
            { id: "focus", label: "⚡ Deep Focus" },
            { id: "evening", label: "🌙 Evening" },
            { id: "custom", label: "✨ Custom Habits" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filterCategory === cat.id
                  ? "bg-[var(--primary)] text-white shadow"
                  : "bg-[var(--canvas)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--hairline)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Timeblocking Timeline */}
      <div className="space-y-4">
        {filteredRoutines.length === 0 ? (
          <div className="bmw-card p-12 text-center border border-[var(--hairline)] rounded-2xl">
            <Clock className="w-12 h-12 text-[var(--muted)] mx-auto mb-3 opacity-40" />
            <h3 className="text-base font-bold text-[var(--ink)]">No routine blocks in this category</h3>
            <p className="text-xs text-[var(--muted)] mt-1">Click "Add Routine Block" above to customize your day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRoutines.map((item, idx) => {
              const isPast = (item.startHour * 60 + item.startMinute) < (currentHour * 60 + currentMinute);
              const isCurrent = Math.abs((item.startHour * 60 + item.startMinute) - (currentHour * 60 + currentMinute)) <= 30;

              return (
                <div 
                  key={item.id}
                  className={`bmw-card p-5 border transition-all rounded-2xl relative overflow-hidden ${
                    item.completed 
                      ? "bg-[var(--surface-soft)]/50 border-[var(--hairline)] opacity-70"
                      : isCurrent
                      ? "bg-[var(--surface)] border-[var(--primary)] shadow-lg ring-1 ring-[var(--primary)]/30"
                      : "bg-[var(--surface)] border-[var(--hairline)] hover:border-[var(--muted)]"
                  }`}
                >
                  {/* Current Active Indicator Accent */}
                  {isCurrent && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[var(--primary)]" />
                  )}

                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Checkbox & Content */}
                    <div className="flex items-start gap-4 flex-1">
                      <button
                        onClick={() => handleToggleRoutine(item.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                          item.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-[var(--muted)] hover:border-[var(--primary)] bg-[var(--canvas)]"
                        }`}
                        title={item.completed ? "Mark Incomplete" : "Mark Complete"}
                      >
                        {item.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-[var(--primary)] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {item.timeSlot}
                          </span>

                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded animate-pulse">
                              CURRENT TIMEBLOCK
                            </span>
                          )}

                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--surface-soft)] text-[var(--muted)]">
                            {item.category}
                          </span>
                        </div>

                        <h3 className={`text-base font-bold text-[var(--ink)] ${item.completed ? "line-through text-[var(--muted)]" : ""}`}>
                          {item.title}
                        </h3>

                        {item.notes && (
                          <p className="text-xs text-[var(--muted)] mt-1.5 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Quick Action Launchers */}
                    <div className="flex items-center gap-2">
                      {item.category === "focus" && (
                        <button
                          onClick={onOpenFocusSanctuary}
                          className="px-3 py-2 bg-[var(--primary)]/15 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white border border-[var(--primary)]/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Open Focus Sanctuary with Parisian Cafe ambient audio"
                        >
                          <Coffee className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Launch Focus Block</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteRoutine(item.id)}
                        className="p-2 text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Routine Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Add Custom Routine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[var(--primary)]" />
                Add Daily Routine Block
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddRoutine} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                  Block Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus Problem Set & Lecture Prep"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={newStartTime}
                    onChange={e => setNewStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5 flex items-center justify-between">
                    <span>End Time</span>
                    <span className="text-[10px] font-mono text-[var(--primary)] font-bold">
                      {calculatedDuration} min
                    </span>
                  </label>
                  <input
                    type="time"
                    required
                    value={newEndTime}
                    onChange={e => setNewEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Quick Duration Preset Chips */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] uppercase font-mono font-bold text-[var(--muted)] mr-1">
                  Quick:
                </span>
                {[
                  { label: "+25m", mins: 25 },
                  { label: "+45m", mins: 45 },
                  { label: "+1h", mins: 60 },
                  { label: "+1.5h", mins: 90 },
                  { label: "+2h", mins: 120 }
                ].map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSetPresetDuration(p.mins)}
                    className="px-2 py-1 bg-[var(--canvas)] hover:bg-[var(--surface-soft)] text-[10px] font-mono font-bold text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--hairline)] hover:border-[var(--primary)] rounded-lg transition-all cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="morning">🌅 Morning Kickoff</option>
                  <option value="focus">⚡ Deep Focus Study Block</option>
                  <option value="evening">🌙 Evening Wind-down</option>
                  <option value="custom">✨ Custom Habit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                  Notes / Objectives (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Key deliverables or focus goals for this block..."
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold uppercase text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--primary)] text-white text-xs font-bold uppercase rounded-xl hover:bg-[var(--primary-active)] transition-all cursor-pointer shadow-md"
                >
                  Save Routine Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
