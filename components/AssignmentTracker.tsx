"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useAuth, TaskItem } from "@/lib/auth-context";
import { playSuccessChime } from "@/lib/audio";
import { fireMilestoneConfetti } from "@/lib/confetti";
import { 
  Kanban, 
  Table, 
  Grid, 
  Search, 
  Plus, 
  Clock, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Trash2, 
  Filter, 
  ArrowUpDown,
  AlertCircle,
  Calendar
} from "lucide-react";

interface AssignmentTrackerProps {
  onOpenQuickAdd: () => void;
}

export default function AssignmentTracker({ onOpenQuickAdd }: AssignmentTrackerProps) {
  const { user, userData, updateTask, deleteTask: deleteAuthTask } = useAuth();
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "matrix">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [sortField, setSortField] = useState<"dueDate" | "priority" | "title">("dueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [mobileKanbanTab, setMobileKanbanTab] = useState<"all" | "todo" | "in_progress" | "completed">("all");

  const updateTaskStatus = useCallback((taskId: string, newStatus: "todo" | "in_progress" | "completed") => {
    updateTask(taskId, { status: newStatus });
    if (newStatus === "completed") {
      playSuccessChime();
      fireMilestoneConfetti("standard");
    }
  }, [updateTask]);

  const deleteTask = useCallback((taskId: string) => {
    deleteAuthTask(taskId);
  }, [deleteAuthTask]);

  // Memoized filter and sort
  const sortedTasks = useMemo(() => {
    const filtered = userData.tasks.filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.courseCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCourse = selectedCourse === "all" || t.courseCode === selectedCourse;
      const matchesPriority = selectedPriority === "all" || t.priority === selectedPriority;
      return matchesSearch && matchesCourse && matchesPriority;
    });

    return [...filtered].sort((a, b) => {
      if (sortField === "dueDate") {
        const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return sortOrder === "asc" ? diff : -diff;
      }
      if (sortField === "priority") {
        const pWeights = { high: 3, medium: 2, low: 1 };
        const diff = pWeights[b.priority] - pWeights[a.priority];
        return sortOrder === "asc" ? diff : -diff;
      }
      if (sortField === "title") {
        return sortOrder === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
      }
      return 0;
    });
  }, [userData.tasks, searchQuery, selectedCourse, selectedPriority, sortField, sortOrder]);

  // Kanban groupings
  const todoTasks = useMemo(() => sortedTasks.filter(t => t.status === "todo"), [sortedTasks]);
  const inProgressTasks = useMemo(() => sortedTasks.filter(t => t.status === "in_progress"), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter(t => t.status === "completed"), [sortedTasks]);

  // Proximity label helper
  const getProximityLabel = useCallback((dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { label: "OVERDUE", color: "bg-red-600 text-white" };
    }
    if (diffHours <= 24) {
      return { label: "DUE IN 24H", color: "bg-amber-500 text-black font-bold" };
    }
    if (diffHours <= 72) {
      return { label: "DUE IN 3 DAYS", color: "bg-[var(--surface-soft)] text-[var(--primary)] font-bold border border-[var(--primary)]/30" };
    }
    return { label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }), color: "bg-[var(--surface-soft)] text-[var(--muted)]" };
  }, []);

  return (
    <div className="space-y-6">
      
      {/* 1. Control Toolbar */}
      <div className="bmw-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left View Mode Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--muted)] mr-2 hidden sm:inline">
              TRACKER VIEW:
            </span>
            <div className="flex items-center border border-[var(--hairline)]">
              <button
                onClick={() => setViewMode("kanban")}
                className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>KANBAN BOARD</span>
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer border-l border-[var(--hairline)] ${
                  viewMode === "table"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>DATA TABLE</span>
              </button>

              <button
                onClick={() => setViewMode("matrix")}
                className={`px-4 py-2 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer border-l border-[var(--hairline)] ${
                  viewMode === "matrix"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--canvas)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>PRIORITY MATRIX</span>
              </button>
            </div>
          </div>

          {/* Right Action Button */}
          <button
            onClick={onOpenQuickAdd}
            className="bmw-btn-primary !h-10 !text-xs !py-2 self-start lg:self-auto"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">ADD DELIVERABLE (CTRL+K)</span>
            <span className="sm:hidden">ADD DELIVERABLE</span>
          </button>
        </div>

        {/* Search & Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[var(--hairline)] text-xs">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deliverables or course codes..."
              className="w-full h-10 pl-9 pr-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-semibold outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All Registered Courses</option>
              {userData.courses.map(c => (
                <option key={c.id} value={c.courseCode}>#{c.courseCode} - {c.courseName}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-semibold outline-none focus:border-[var(--primary)]"
            >
              <option value="all">All Urgency Tiers</option>
              <option value="high">High Urgency Only</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* Sort By Field */}
          <div className="flex items-center gap-1">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-semibold outline-none focus:border-[var(--primary)]"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="priority">Sort by Urgency</option>
              <option value="title">Sort by Deliverable Name</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              className="h-10 px-3 bg-[var(--surface-soft)] border border-[var(--hairline-strong)] hover:border-[var(--primary)] text-[var(--ink)] cursor-pointer"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>

      {/* 2. View Mode 1: Kanban Board */}
      {viewMode === "kanban" && (
        <div className="space-y-4">
          
          {/* Mobile Single Column Selector Pills */}
          <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setMobileKanbanTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === "all" 
                  ? "bg-[var(--primary)] text-white shadow-sm" 
                  : "bg-[var(--surface-soft)] text-[var(--muted)] border border-[var(--hairline)]"
              }`}
            >
              All Columns ({sortedTasks.length})
            </button>
            <button
              onClick={() => setMobileKanbanTab("todo")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === "todo" 
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm" 
                  : "bg-[var(--surface-soft)] text-[var(--muted)] border border-[var(--hairline)]"
              }`}
            >
              To Do ({todoTasks.length})
            </button>
            <button
              onClick={() => setMobileKanbanTab("in_progress")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === "in_progress" 
                  ? "bg-[var(--primary)] text-white shadow-sm" 
                  : "bg-[var(--surface-soft)] text-[var(--muted)] border border-[var(--hairline)]"
              }`}
            >
              In Progress ({inProgressTasks.length})
            </button>
            <button
              onClick={() => setMobileKanbanTab("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-colors ${
                mobileKanbanTab === "completed" 
                  ? "bg-emerald-500 text-white shadow-sm" 
                  : "bg-[var(--surface-soft)] text-[var(--muted)] border border-[var(--hairline)]"
              }`}
            >
              Completed ({completedTasks.length})
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: TO DO */}
            <div className={`bmw-card space-y-4 bg-[var(--surface-soft)] ${
              mobileKanbanTab === "all" || mobileKanbanTab === "todo" ? "block" : "hidden lg:block"
            }`}>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-amber-500" />
                <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--ink)]">
                  TO DO
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)]">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[220px]">
              {todoTasks.map((task) => {
                const prox = getProximityLabel(task.dueDate);
                return (
                  <div key={task.id} className="p-4 bg-[var(--canvas)] border border-[var(--hairline)] space-y-3 hover:border-[var(--primary)] transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[var(--primary)]">#{task.courseCode}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${prox.color}`}>
                        {prox.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[var(--ink)] leading-snug">{task.title}</h4>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)] text-xs">
                      <span className={`text-[10px] font-bold uppercase ${
                        task.priority === "high" ? "text-red-600 dark:text-red-400" : "text-[var(--muted)]"
                      }`}>
                        {task.priority} PRIORITY
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-[var(--muted)] hover:text-red-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => updateTaskStatus(task.id, "in_progress")}
                          className="px-2 py-1 bg-[var(--primary)] text-white text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                          title="Move to In Progress"
                        >
                          <span>START</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {todoTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--muted)] font-light border border-dashed border-[var(--hairline)]">
                  No deliverables in To Do
                </div>
              )}
            </div>
          </div>

          {/* Column 2: IN PROGRESS */}
          <div className={`bmw-card space-y-4 bg-[var(--surface-soft)] ${
            mobileKanbanTab === "all" || mobileKanbanTab === "in_progress" ? "block" : "hidden lg:block"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[var(--primary)]" />
                <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--ink)]">
                  IN PROGRESS
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)]">
                {inProgressTasks.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[220px]">
              {inProgressTasks.map((task) => {
                const prox = getProximityLabel(task.dueDate);
                return (
                  <div key={task.id} className="p-4 bg-[var(--canvas)] border border-[var(--primary)] space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-[var(--primary)]">#{task.courseCode}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${prox.color}`}>
                        {prox.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[var(--ink)] leading-snug">{task.title}</h4>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)] text-xs">
                      <button
                        onClick={() => updateTaskStatus(task.id, "todo")}
                        className="px-2 py-1 bg-[var(--surface-soft)] text-[var(--ink)] text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer border border-[var(--hairline)]"
                        title="Move back to To Do"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>BACK</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-1 text-[var(--muted)] hover:text-red-600 cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => updateTaskStatus(task.id, "completed")}
                          className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer"
                          title="Mark Complete"
                        >
                          <Check className="w-3 h-3" />
                          <span>FINISH</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {inProgressTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--muted)] font-light border border-dashed border-[var(--hairline)]">
                  No deliverables currently in progress
                </div>
              )}
            </div>
          </div>

          {/* Column 3: COMPLETED */}
          <div className={`bmw-card space-y-4 bg-[var(--surface-soft)] ${
            mobileKanbanTab === "all" || mobileKanbanTab === "completed" ? "block" : "hidden lg:block"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500" />
                <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--ink)]">
                  COMPLETED
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[var(--canvas)] border border-[var(--hairline)] text-[var(--ink)]">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[220px]">
              {completedTasks.map((task) => (
                <div key={task.id} className="p-4 bg-[var(--canvas)] border border-[var(--hairline)] space-y-2 opacity-75">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">#{task.courseCode}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      DONE
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[var(--ink)] line-through">{task.title}</h4>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)] text-xs">
                    <button
                      onClick={() => updateTaskStatus(task.id, "in_progress")}
                      className="text-[10px] font-bold text-[var(--muted)] hover:text-[var(--ink)] uppercase cursor-pointer"
                    >
                      REOPEN DELIVERABLE
                    </button>

                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-[var(--muted)] hover:text-red-600 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {completedTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-[var(--muted)] font-light border border-dashed border-[var(--hairline)]">
                  No completed deliverables yet
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
      )}

      {/* 3. View Mode 2: Sortable Data Table */}
      {viewMode === "table" && (
        <div className="bmw-card overflow-x-auto p-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--surface-soft)] text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--muted)]">
                <th className="p-4">STATUS</th>
                <th className="p-4">DELIVERABLE TITLE</th>
                <th className="p-4">COURSE</th>
                <th className="p-4">DUE DATE</th>
                <th className="p-4">URGENCY</th>
                <th className="p-4">CATEGORY</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {sortedTasks.map((task) => {
                const isCompleted = task.status === "completed";
                const prox = getProximityLabel(task.dueDate);
                return (
                  <tr key={task.id} className="hover:bg-[var(--surface-soft)] transition-colors">
                    
                    {/* Checkbox / Status */}
                    <td className="p-4">
                      <button
                        onClick={() => updateTaskStatus(task.id, isCompleted ? "todo" : "completed")}
                        className={`w-5 h-5 border flex items-center justify-center cursor-pointer transition-colors ${
                          isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-[var(--hairline-strong)] hover:border-[var(--primary)] bg-[var(--canvas)]"
                        }`}
                      >
                        {isCompleted && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    {/* Title */}
                    <td className="p-4 font-bold text-sm text-[var(--ink)]">
                      <span className={isCompleted ? "line-through text-[var(--muted)]" : ""}>
                        {task.title}
                      </span>
                    </td>

                    {/* Course */}
                    <td className="p-4 font-bold text-[var(--primary)]">
                      #{task.courseCode}
                    </td>

                    {/* Due Horizon */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${prox.color}`}>
                        {prox.label}
                      </span>
                    </td>

                    {/* Urgency Tier */}
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === "high"
                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                          : task.priority === "medium"
                          ? "bg-[var(--surface-soft)] text-[var(--primary)]"
                          : "bg-[var(--surface-soft)] text-[var(--muted)]"
                      }`}>
                        {task.priority}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="p-4 text-[var(--muted)] font-light">
                      {task.category}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 text-[var(--muted)] hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete Task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {sortedTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[var(--muted)] font-light">
                    No deliverables found matching the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. View Mode 3: Eisenhower Priority Matrix */}
      {viewMode === "matrix" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Quadrant 1: Urgent & Important (High Urgency & Due < 48h) */}
          <div className="bmw-card space-y-3 border-l-4 border-l-red-600">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--hairline)]">
              <div>
                <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-red-600 dark:text-red-400">
                  QUADRANT 1: DO FIRST
                </span>
                <h4 className="text-sm font-bold text-[var(--ink)]">High Urgency Deliverables</h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-red-500/10 text-red-600">
                {sortedTasks.filter(t => t.priority === "high" && t.status !== "completed").length}
              </span>
            </div>

            <div className="space-y-2">
              {sortedTasks.filter(t => t.priority === "high" && t.status !== "completed").map(t => (
                <div key={t.id} className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-[var(--ink)]">{t.title}</div>
                    <div className="text-[10px] text-[var(--primary)] font-semibold mt-0.5">#{t.courseCode}</div>
                  </div>
                  <button
                    onClick={() => updateTaskStatus(t.id, "completed")}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase cursor-pointer"
                  >
                    FINISH
                  </button>
                </div>
              ))}
              {sortedTasks.filter(t => t.priority === "high" && t.status !== "completed").length === 0 && (
                <p className="text-xs text-[var(--muted)] font-light p-4 text-center">No critical urgent tasks.</p>
              )}
            </div>
          </div>

          {/* Quadrant 2: Important, Not Urgent (Medium Priority) */}
          <div className="bmw-card space-y-3 border-l-4 border-l-[var(--primary)]">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--hairline)]">
              <div>
                <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
                  QUADRANT 2: SCHEDULE
                </span>
                <h4 className="text-sm font-bold text-[var(--ink)]">Medium Term Projects & Problem Sets</h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)]">
                {sortedTasks.filter(t => t.priority === "medium" && t.status !== "completed").length}
              </span>
            </div>

            <div className="space-y-2">
              {sortedTasks.filter(t => t.priority === "medium" && t.status !== "completed").map(t => (
                <div key={t.id} className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-[var(--ink)]">{t.title}</div>
                    <div className="text-[10px] text-[var(--primary)] font-semibold mt-0.5">#{t.courseCode}</div>
                  </div>
                  <button
                    onClick={() => updateTaskStatus(t.id, "completed")}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase cursor-pointer"
                  >
                    FINISH
                  </button>
                </div>
              ))}
              {sortedTasks.filter(t => t.priority === "medium" && t.status !== "completed").length === 0 && (
                <p className="text-xs text-[var(--muted)] font-light p-4 text-center">No scheduled tasks.</p>
              )}
            </div>
          </div>

          {/* Quadrant 3: Low Priority Tasks */}
          <div className="bmw-card space-y-3 border-l-4 border-l-[var(--muted)]">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--hairline)]">
              <div>
                <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--muted)]">
                  QUADRANT 3: DELEGATE / AUTOMATE
                </span>
                <h4 className="text-sm font-bold text-[var(--ink)]">Readings & Reference Material</h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-[var(--surface-soft)] text-[var(--muted)]">
                {sortedTasks.filter(t => t.priority === "low" && t.status !== "completed").length}
              </span>
            </div>

            <div className="space-y-2">
              {sortedTasks.filter(t => t.priority === "low" && t.status !== "completed").map(t => (
                <div key={t.id} className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] flex justify-between items-center">
                  <div>
                    <div className="font-bold text-xs text-[var(--ink)]">{t.title}</div>
                    <div className="text-[10px] text-[var(--muted)] mt-0.5">#{t.courseCode}</div>
                  </div>
                  <button
                    onClick={() => updateTaskStatus(t.id, "completed")}
                    className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase cursor-pointer"
                  >
                    FINISH
                  </button>
                </div>
              ))}
              {sortedTasks.filter(t => t.priority === "low" && t.status !== "completed").length === 0 && (
                <p className="text-xs text-[var(--muted)] font-light p-4 text-center">No low priority tasks.</p>
              )}
            </div>
          </div>

          {/* Quadrant 4: Completed Archive */}
          <div className="bmw-card space-y-3 border-l-4 border-l-emerald-600">
            <div className="flex justify-between items-center pb-2 border-b border-[var(--hairline)]">
              <div>
                <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-emerald-600">
                  QUADRANT 4: COMPLETED ARCHIVE
                </span>
                <h4 className="text-sm font-bold text-[var(--ink)]">Submitted Deliverables</h4>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600">
                {completedTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {completedTasks.map(t => (
                <div key={t.id} className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] flex justify-between items-center opacity-70">
                  <div>
                    <div className="font-bold text-xs text-[var(--ink)] line-through">{t.title}</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">#{t.courseCode} • Done</div>
                  </div>
                </div>
              ))}
              {completedTasks.length === 0 && (
                <p className="text-xs text-[var(--muted)] font-light p-4 text-center">No completed tasks yet.</p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
