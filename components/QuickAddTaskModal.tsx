"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { X, Plus, Calendar, AlertCircle } from "lucide-react";

interface QuickAddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAddTaskModal({ isOpen, onClose }: QuickAddTaskModalProps) {
  const { user, userData, addTask } = useAuth();

  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [category, setCategory] = useState("Assignment");
  const [dueDateType, setDueDateType] = useState<"today" | "tomorrow" | "custom">("tomorrow");
  const [customDate, setCustomDate] = useState("");

  // Video Meeting Options
  const [hasMeeting, setHasMeeting] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [meetingTime, setMeetingTime] = useState("10:30 AM - 11:30 AM");

  useEffect(() => {
    if (userData.courses.length > 0 && !courseCode) {
      setCourseCode(userData.courses[0].courseCode);
    }
  }, [userData.courses, courseCode]);

  useEffect(() => {
    if (category === "Lecture / Meeting" || category === "Study Group") {
      setHasMeeting(true);
    }
  }, [category]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // Handled by parent
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let computedDate = new Date();
    if (dueDateType === "today") {
      computedDate.setHours(23, 59, 0, 0);
    } else if (dueDateType === "tomorrow") {
      computedDate.setDate(computedDate.getDate() + 1);
      computedDate.setHours(23, 59, 0, 0);
    } else if (customDate) {
      computedDate = new Date(customDate);
    } else {
      computedDate.setDate(computedDate.getDate() + 2);
    }

    addTask({
      title: title.trim(),
      courseCode: courseCode || (userData.courses[0]?.courseCode ?? "GEN 101"),
      dueDate: computedDate.toISOString(),
      dueTime: hasMeeting ? meetingTime.trim() : undefined,
      eventTime: hasMeeting ? meetingTime.trim() : undefined,
      meetingLink: hasMeeting && meetingUrl.trim() ? meetingUrl.trim() : (hasMeeting ? "https://meet.google.com/new" : undefined),
      priority,
      status: "todo",
      category,
    });

    // Reset and close
    setTitle("");
    setDueDateType("tomorrow");
    setPriority("medium");
    setHasMeeting(false);
    setMeetingUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
      <div 
        className="bg-[var(--canvas)] border border-[var(--hairline-strong)] w-full max-w-lg p-8 relative shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
          aria-label="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-6 pr-10">
          <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
            2-CLICK TASK CAPTURE (CTRL+K)
          </div>
          <h2 className="text-2xl font-bold text-[var(--ink)]">
            Add Academic Deliverable
          </h2>
          <p className="text-xs font-light text-[var(--muted)]">
            Assigned to account: <strong className="font-semibold text-[var(--ink)]">{user?.fullName}</strong> ({user?.university})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Task Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
              DELIVERABLE TITLE
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete Lab Report #4 / Midterm Revision Sheet"
              className="w-full h-12 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-sm text-[var(--ink)] focus:border-[var(--primary)] outline-none"
              required
            />
          </div>

          {/* Course & Category Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                COURSE CODE
              </label>
              <select
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-xs font-semibold text-[var(--ink)] focus:border-[var(--primary)] outline-none"
              >
                {userData.courses.map((c) => (
                  <option key={c.id} value={c.courseCode}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
                {userData.courses.length === 0 && (
                  <option value="GEN 101">GEN 101 - General Studies</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                CATEGORY
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-xs font-semibold text-[var(--ink)] focus:border-[var(--primary)] outline-none"
              >
                <option value="Assignment">Assignment</option>
                <option value="Lab Report">Lab Report</option>
                <option value="Problem Set">Problem Set</option>
                <option value="Project">Project Milestone</option>
                <option value="Reading">Reading / Prep</option>
                <option value="Lecture / Meeting">Lecture / Class Meeting</option>
                <option value="Study Group">Study Group Session</option>
              </select>
            </div>
          </div>

          {/* Optional Video / Meeting Link Section */}
          <div className="p-3.5 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--ink)] flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasMeeting}
                  onChange={(e) => setHasMeeting(e.target.checked)}
                  className="w-4 h-4 rounded text-[var(--primary)] focus:ring-0 cursor-pointer"
                />
                <span>Attach Live Meeting Link (Google Meet / Zoom)</span>
              </label>
              {hasMeeting && (
                <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                  CALENDAR SYNC
                </span>
              )}
            </div>

            {hasMeeting && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--muted)] mb-1">
                    MEETING TIME
                  </label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    placeholder="e.g. 10:30 AM - 11:30 AM"
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[var(--muted)] mb-1">
                    MEETING LINK URL
                  </label>
                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(e) => setMeetingUrl(e.target.value)}
                    placeholder="https://meet.google.com/xyz-abcd-efg"
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-xs text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Due Date Shortcut Pills */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
              DUE DATE HORIZON
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDueDateType("today")}
                className={`h-10 text-xs font-bold uppercase border transition-colors cursor-pointer ${
                  dueDateType === "today"
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                TODAY (11:59 PM)
              </button>

              <button
                type="button"
                onClick={() => setDueDateType("tomorrow")}
                className={`h-10 text-xs font-bold uppercase border transition-colors cursor-pointer ${
                  dueDateType === "tomorrow"
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                TOMORROW
              </button>

              <button
                type="button"
                onClick={() => setDueDateType("custom")}
                className={`h-10 text-xs font-bold uppercase border transition-colors cursor-pointer ${
                  dueDateType === "custom"
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                PICK DATE
              </button>
            </div>

            {dueDateType === "custom" && (
              <input
                type="datetime-local"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full h-10 mt-2 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-xs text-[var(--ink)] focus:border-[var(--primary)] outline-none"
                required={dueDateType === "custom"}
              />
            )}
          </div>

          {/* Priority Tier Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
              PRIORITY LEVEL
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={`h-10 text-xs font-bold uppercase border transition-colors cursor-pointer ${
                  priority === "high"
                    ? "bg-red-600 text-white border-red-600"
                    : "border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                HIGH URGENCY
              </button>

              <button
                type="button"
                onClick={() => setPriority("medium")}
                className={`h-10 text-xs font-bold uppercase border transition-colors cursor-pointer ${
                  priority === "medium"
                    ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                    : "border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                MEDIUM
              </button>

              <button
                type="button"
                onClick={() => setPriority("low")}
                className={`h-10 text-xs font-bold uppercase border transition-colors cursor-pointer ${
                  priority === "low"
                    ? "bg-[var(--surface-strong)] text-[var(--ink)] border-[var(--ink)]"
                    : "border-[var(--hairline-strong)] text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                }`}
              >
                LOW
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[var(--hairline)]">
            <button
              type="button"
              onClick={onClose}
              className="bmw-btn-secondary"
            >
              CANCEL
            </button>

            <button
              type="submit"
              className="bmw-btn-primary"
            >
              <span>CREATE TASK</span>
              <Plus className="w-4 h-4 ml-1" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
