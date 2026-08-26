"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { 
  Search, 
  Plus, 
  Timer, 
  Calendar as CalendarIcon, 
  Sun, 
  Moon, 
  BookOpen, 
  CheckSquare, 
  Clock, 
  BarChart3, 
  Download, 
  FileText, 
  Users, 
  ArrowRight, 
  Command,
  Target,
  Sparkles
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickAdd: () => void;
  onOpenFocusSanctuary: () => void;
  onSelectTab: (tabId: string) => void;
}

interface CommandItem {
  id: string;
  category: "Actions" | "Navigation" | "Tasks" | "Courses" | "Exams";
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenQuickAdd,
  onOpenFocusSanctuary,
  onSelectTab
}: CommandPaletteProps) {
  const { userData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-focus when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Base System Commands
  const systemCommands: CommandItem[] = useMemo(() => {
    return [
      {
        id: "cmd_quick_add",
        category: "Actions",
        title: "Create New Assignment / Task",
        subtitle: "2-Click quick task modal with course binding",
        icon: Plus,
        action: () => {
          onClose();
          onOpenQuickAdd();
        }
      },
      {
        id: "cmd_focus",
        category: "Actions",
        title: "Launch Focus Sanctuary",
        subtitle: "Pomodoro study chamber with Parisian Cafe audio",
        icon: Timer,
        action: () => {
          onClose();
          onOpenFocusSanctuary();
        }
      },
      {
        id: "cmd_routine",
        category: "Navigation",
        title: "Open Daily Routine Timeblocking",
        subtitle: "Morning kickoff, lecture timeline & evening review",
        icon: Target,
        action: () => {
          onClose();
          onSelectTab("routine");
        }
      },
      {
        id: "cmd_theme",
        category: "Actions",
        title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`,
        subtitle: "Zero-flicker dynamic theme toggle",
        icon: theme === "dark" ? Sun : Moon,
        action: () => {
          toggleTheme();
          onClose();
        }
      },
      {
        id: "cmd_tasks",
        category: "Navigation",
        title: "Go to Tasks & Kanban Tracker",
        subtitle: "View all active assignments and deadlines",
        icon: CheckSquare,
        action: () => {
          onClose();
          onSelectTab("tracker");
        }
      },
      {
        id: "cmd_courses",
        category: "Navigation",
        title: "Go to Classes & Course Materials",
        subtitle: "View syllabi, lecture slides, and Google Meet links",
        icon: Users,
        action: () => {
          onClose();
          onSelectTab("classrooms");
        }
      },
      {
        id: "cmd_calendar",
        category: "Navigation",
        title: "Go to Interactive Calendar",
        subtitle: "2-Way synced schedule view",
        icon: CalendarIcon,
        action: () => {
          onClose();
          onSelectTab("calendar");
        }
      },
      {
        id: "cmd_exams",
        category: "Navigation",
        title: "Go to Exams & AI Study Plan",
        subtitle: "Milestone breakdown and exam countdowns",
        icon: Clock,
        action: () => {
          onClose();
          onSelectTab("exams");
        }
      }
    ];
  }, [theme, toggleTheme, onClose, onOpenQuickAdd, onOpenFocusSanctuary, onSelectTab]);

  // Dynamic Item Commands from User Data
  const dynamicCommands: CommandItem[] = useMemo(() => {
    const taskCmds: CommandItem[] = userData.tasks.slice(0, 10).map(t => ({
      id: `task_${t.id}`,
      category: "Tasks",
      title: t.title,
      subtitle: `${t.courseCode} • Due ${new Date(t.dueDate).toLocaleDateString()}`,
      icon: CheckSquare,
      action: () => {
        onClose();
        onSelectTab("tracker");
      }
    }));

    const courseCmds: CommandItem[] = (userData.courses || []).map(c => ({
      id: `course_${c.id}`,
      category: "Courses",
      title: `${c.courseCode} - ${c.courseName}`,
      subtitle: c.instructor || "Faculty Professor",
      icon: BookOpen,
      action: () => {
        onClose();
        onSelectTab("classrooms");
      }
    }));

    const examCmds: CommandItem[] = (userData.exams || []).map(e => ({
      id: `exam_${e.id}`,
      category: "Exams",
      title: `${e.courseCode} Exam: ${e.title}`,
      subtitle: `Date: ${new Date(e.examDate).toLocaleDateString()}`,
      icon: Clock,
      action: () => {
        onClose();
        onSelectTab("exams");
      }
    }));

    return [...taskCmds, ...courseCmds, ...examCmds];
  }, [userData, onClose, onSelectTab]);

  // Filtered Commands
  const filteredCommands = useMemo(() => {
    const all = [...systemCommands, ...dynamicCommands];
    if (!query.trim()) return systemCommands;

    const q = query.toLowerCase();
    return all.filter(c => 
      c.title.toLowerCase().includes(q) || 
      (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
      c.category.toLowerCase().includes(q)
    );
  }, [systemCommands, dynamicCommands, query]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-[var(--surface-strong)] border border-[var(--hairline)] shadow-2xl rounded-2xl overflow-hidden animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--hairline)] bg-[var(--canvas)]/50">
          <Search className="w-5 h-5 text-[var(--primary)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, assignment, or course code..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none"
          />
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase bg-[var(--surface-soft)] text-[var(--muted)] border border-[var(--hairline)] rounded">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--muted)]">
              No matching commands or courses found for "{query}".
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;

              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[var(--primary)] text-white shadow-md"
                      : "text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-white/20 text-white" : "bg-[var(--surface-soft)] text-[var(--primary)]"}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="truncate">
                      <div className="text-xs font-bold truncate">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div className={`text-[11px] truncate ${isSelected ? "text-white/80" : "text-[var(--muted)]"}`}>
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-[var(--canvas)] text-[var(--muted)]"
                    }`}>
                      {cmd.category}
                    </span>
                    <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? "text-white opacity-100" : "opacity-0"}`} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="px-4 py-2.5 border-t border-[var(--hairline)] bg-[var(--canvas)]/40 flex items-center justify-between text-[11px] text-[var(--muted)] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1">
            <Command className="w-3 h-3" />
            <span>K Spotlight</span>
          </div>
        </div>

      </div>
    </div>
  );
}
