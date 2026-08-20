"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  Video, 
  Sparkles, 
  AlertTriangle, 
  Settings, 
  Volume2, 
  VolumeX, 
  ArrowUpRight,
  Trash2
} from "lucide-react";

export interface InAppNotification {
  id: string;
  type: "deadline" | "lecture" | "exam" | "ai";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { user, getUserData } = useAuth();
  const userData = getUserData();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifications, setNotifications] = useState<InAppNotification[]>([
    {
      id: "n1",
      type: "deadline",
      title: "Deliverable Due in < 24h",
      message: `${userData.tasks[0]?.title || "SPICE Simulation Lab Report #3"} is due tomorrow at 11:59 PM.`,
      timestamp: "10 mins ago",
      isRead: false,
      actionLabel: "View Deliverables"
    },
    {
      id: "n2",
      type: "lecture",
      title: "Classroom Starting Soon",
      message: `${userData.courses[0]?.courseCode || "CS 341"} lecture with ${userData.courses[0]?.instructor || "Prof. Vance"} starts in 15 minutes.`,
      timestamp: "25 mins ago",
      isRead: false,
      actionUrl: userData.courses[0]?.meetingLink || "https://meet.google.com",
      actionLabel: "Join Google Meet"
    },
    {
      id: "n3",
      type: "ai",
      title: "AI Study Milestone Due",
      message: "Complete Day 2 Problem Sets for your upcoming midterm revision.",
      timestamp: "2 hours ago",
      isRead: true,
      actionLabel: "Open Study Planner"
    },
    {
      id: "n4",
      type: "exam",
      title: "Assessment Countdown",
      message: `${userData.exams[0]?.title || "Algorithms Midterm"} is scheduled in 4 days. Weight: 30%.`,
      timestamp: "Yesterday",
      isRead: true,
      actionLabel: "View Exam Info"
    }
  ]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [leadTimeMinutes, setLeadTimeMinutes] = useState(15);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity cursor-pointer"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--canvas)] border-l border-[var(--hairline-strong)] flex flex-col justify-between shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-[var(--hairline)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[var(--surface-soft)] text-[var(--primary)] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--ink)]">Notification Engine</h3>
                <p className="text-xs text-[var(--muted)] font-light">
                  {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                title="Notification Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings Sub-Drawer */}
          {isSettingsOpen && (
            <div className="p-4 bg-[var(--surface-soft)] border-b border-[var(--hairline)] space-y-3 animate-in fade-in duration-150 text-xs">
              <div className="flex justify-between items-center font-bold text-[var(--ink)]">
                <span>ALERT CONFIGURATION</span>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Close
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span>Audible Notification Cues</span>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 border cursor-pointer ${
                    soundEnabled ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-[var(--canvas)] text-[var(--muted)] border-[var(--hairline)]"
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Lecture Reminder Lead Time</span>
                  <span className="font-bold text-[var(--primary)]">{leadTimeMinutes} mins before</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={leadTimeMinutes}
                  onChange={(e) => setLeadTimeMinutes(Number(e.target.value))}
                  className="w-full accent-[var(--primary)]"
                />
              </div>
            </div>
          )}

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            
            {/* Quick Actions Row */}
            {notifications.length > 0 && (
              <div className="flex justify-between items-center pb-2 text-xs">
                <button
                  onClick={markAllAsRead}
                  className="text-[var(--primary)] font-bold hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
                <button
                  onClick={clearAll}
                  className="text-[var(--muted)] hover:text-red-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 border transition-colors space-y-2 ${
                  n.isRead
                    ? "bg-[var(--canvas)] border-[var(--hairline)] opacity-70"
                    : "bg-[var(--surface-soft)] border-[var(--primary)]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    {n.type === "deadline" && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {n.type === "lecture" && <Video className="w-3.5 h-3.5 text-[var(--primary)]" />}
                    {n.type === "exam" && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                    {n.type === "ai" && <Sparkles className="w-3.5 h-3.5 text-purple-500" />}
                    <span className="font-bold text-xs text-[var(--ink)]">{n.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">{n.timestamp}</span>
                </div>

                <p className="text-xs text-[var(--body)] font-light leading-relaxed">
                  {n.message}
                </p>

                <div className="pt-2 flex justify-between items-center border-t border-[var(--hairline)] text-xs">
                  {n.actionUrl ? (
                    <a
                      href={n.actionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[var(--primary)] hover:underline flex items-center gap-1"
                    >
                      <span>{n.actionLabel || "Open Action"}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="font-semibold text-[var(--primary)] text-[11px]">
                      {n.actionLabel}
                    </span>
                  )}

                  <button
                    onClick={() => toggleRead(n.id)}
                    className="text-[10px] font-bold text-[var(--muted)] hover:text-[var(--ink)] uppercase cursor-pointer"
                  >
                    {n.isRead ? "Mark Unread" : "Mark Read"}
                  </button>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="p-12 text-center text-xs text-[var(--muted)] font-light border border-dashed border-[var(--hairline)]">
                No active notifications. You are all caught up!
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--hairline)] bg-[var(--surface-soft)] flex justify-between items-center text-xs text-[var(--muted)]">
            <span className="font-light">Zero-Trust Push Sync</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">ONLINE</span>
          </div>

        </div>
      </div>
    </div>
  );
}
