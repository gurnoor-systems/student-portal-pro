"use client";

import React, { useEffect, useRef } from "react";
import { useAuth, TaskItem } from "@/lib/auth-context";
import { playSuccessChime } from "@/lib/audio";
import { fireMilestoneConfetti } from "@/lib/confetti";
import { useToast } from "@/lib/toast-context";
import { useCopilot, AgentActionItem } from "@/lib/hooks/use-copilot";
import { 
  Bot, 
  User, 
  Send, 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Plus, 
  Play, 
  ChevronRight, 
  RotateCcw,
  Zap,
  ArrowRight,
  BookOpen,
  Target,
  Coffee
} from "lucide-react";

interface FormattedMessageProps {
  content: string;
  onSelectPrompt?: (prompt: string) => void;
}

function FormattedMessage({ content, onSelectPrompt }: FormattedMessageProps) {
  if (!content) return null;

  const renderInline = (text: string) => {
    // Parse `code` and **bold**
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="px-1.5 py-0.5 bg-[var(--canvas)] text-[var(--primary)] font-mono text-[11px] rounded border border-[var(--hairline)]">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-[var(--ink)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const lines = content.split("\n");

  return (
    <div className="space-y-1.5 text-xs sm:text-sm text-[var(--ink)]">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="font-bold text-sm text-[var(--ink)] pt-1 pb-0.5">
              {renderInline(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }

        // Header 4
        if (trimmed.startsWith("#### ")) {
          return (
            <h4 key={idx} className="font-bold text-xs uppercase tracking-wider text-[var(--primary)] pt-1">
              {renderInline(trimmed.replace(/^####\s+/, ""))}
            </h4>
          );
        }

        // Divider
        if (trimmed === "---" || trimmed === "***") {
          return <hr key={idx} className="border-[var(--hairline)] my-2" />;
        }

        // Bullet Point with Prompt Chip
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          const rawBullet = trimmed.replace(/^[\*\-•]\s+/, "");
          
          // Check if it's a quoted prompt recommendation like *"Generate me an exam prep..."*
          const quoteMatch = rawBullet.match(/^[\*_\"]*\"([^\"]+)\"[\*_\"]*$/) || rawBullet.match(/\"([^\"]+)\"/);
          if (quoteMatch && onSelectPrompt) {
            const promptText = quoteMatch[1];
            return (
              <div key={idx} className="my-1">
                <button
                  onClick={() => onSelectPrompt(promptText)}
                  className="w-full text-left flex items-center gap-2 p-2 bg-[var(--canvas)] hover:bg-[var(--primary)] hover:text-white border border-[var(--hairline)] hover:border-[var(--primary)] rounded-xl text-xs font-semibold text-[var(--ink)] transition-all cursor-pointer shadow-xs group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:text-white flex-shrink-0" />
                  <span className="flex-1">{promptText}</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 flex-shrink-0" />
                </button>
              </div>
            );
          }

          return (
            <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed pl-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-1.5 flex-shrink-0" />
              <span className="flex-1">{renderInline(rawBullet)}</span>
            </div>
          );
        }

        // Standard text paragraph
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

interface AcademicAIAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFocusSanctuary: () => void;
  onSelectTab: (tabId: string) => void;
  initialPrompt?: string;
}

export default function AcademicAIAgent({
  isOpen,
  onClose,
  onOpenFocusSanctuary,
  onSelectTab,
  initialPrompt
}: AcademicAIAgentProps) {
  const { user, userData, addTask, updateTask } = useAuth();
  const { showToast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Execute in-app actions returned by the AI agent
  const handleExecuteAction = (action: AgentActionItem) => {
    try {
      if (action.type === "CREATE_TASK") {
        const payload = action.payload;
        const newTask: TaskItem = {
          id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId: user?.id || "local_user",
          title: payload.title || "New Task",
          courseCode: payload.courseCode || (userData.courses[0]?.courseCode || "GEN-101"),
          dueDate: payload.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
          priority: payload.priority || "medium",
          status: "todo",
          category: payload.category || "Assignment",
          syncedToCalendar: false
        };
        addTask(newTask);
        fireMilestoneConfetti("standard");
        showToast({
          type: "success",
          title: "Assignment Created",
          description: `${newTask.title} [${newTask.courseCode}] added to Kanban.`,
          undoAction: () => updateTask(newTask.id, { status: "completed" })
        });
      }
      else if (action.type === "SCHEDULE_ROUTINE") {
        const payload = action.payload;
        const todayStr = new Date().toISOString().split("T")[0];
        const storageKey = user ? `student_portal_user_${user.id}_routine_${todayStr}` : `student_portal_routine_${todayStr}`;
        
        const raw = localStorage.getItem(storageKey);
        const currentRoutine = raw ? JSON.parse(raw) : [];

        const [hStr, mStr] = (payload.startTime || "14:00").split(":");
        const h = parseInt(hStr, 10) || 14;
        const m = parseInt(mStr, 10) || 0;
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 || 12;

        const newBlock = {
          id: `rt_${Date.now()}`,
          title: payload.title || "Deep Focus Block",
          category: payload.category || "focus",
          timeSlot: `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period} (${payload.durationMinutes || 45} min)`,
          startHour: h,
          startMinute: m,
          durationMinutes: payload.durationMinutes || 45,
          completed: false,
          notes: payload.notes || "Scheduled by AI Copilot"
        };

        const updated = [...currentRoutine, newBlock].sort((a: any, b: any) => 
          (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
        );

        localStorage.setItem(storageKey, JSON.stringify(updated));
        playSuccessChime();
        showToast({
          type: "success",
          title: "Routine Block Scheduled",
          description: `"${newBlock.title}" added to today's timeline.`
        });
      }
      else if (action.type === "START_FOCUS") {
        onClose();
        onOpenFocusSanctuary();
      }
      else if (action.type === "NAVIGATE_TAB") {
        if (action.payload.tabId) {
          onClose();
          onSelectTab(action.payload.tabId);
        }
      }
    } catch (err) {
      console.warn("Failed to execute agent action:", err);
    }
  };

  // Modular Headless Hook
  const {
    messages,
    input,
    setInput,
    isLoading,
    isListening,
    sendMessage,
    toggleVoiceInput
  } = useCopilot({
    user,
    userData,
    onExecuteAction: handleExecuteAction
  });

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input or auto-send initialPrompt when opened
  useEffect(() => {
    if (isOpen) {
      if (initialPrompt && initialPrompt.trim()) {
        sendMessage(initialPrompt);
      } else {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen, initialPrompt, sendMessage]);

  // 4 Core Dedicated Action Tabs
  const actionTabs = [
    { label: "🎯 Exam Prep", query: "Generate me an exam prep based on my past record and enrolled courses", actionTab: "exam_prep" as const },
    { label: "📋 What's Due?", query: "What assignments and deadlines are due in the next 7 days?", actionTab: "due_this_week" as const },
    { label: "⚡ Focus Block", query: "Schedule a 45-minute Deep Focus study block for today", actionTab: "focus_block" as const },
    { label: "🎧 Sanctuary", query: "Start a 25-minute Pomodoro Focus Sanctuary session", actionTab: "sanctuary" as const }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--surface)] border-l sm:border border-[var(--hairline)] h-full sm:h-[92vh] w-full sm:max-w-lg rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-left">
        
        {/* 1. Header */}
        <div className="p-4 border-b border-[var(--hairline)] bg-[var(--surface-soft)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--primary)] to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-[var(--ink)]">Academic AI Copilot</h2>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)]">Aware of your degree, courses & routine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-strong)] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Dedicated Quick Action Tabs */}
        <div className="px-3 py-2 border-b border-[var(--hairline)] bg-[var(--surface)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {actionTabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(tab.query, tab.actionTab)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-soft)] hover:bg-[var(--primary)] hover:text-white border border-[var(--hairline)] hover:border-[var(--primary)] rounded-xl text-xs font-semibold text-[var(--ink)] whitespace-nowrap transition-all cursor-pointer shadow-xs group flex-shrink-0"
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 2. Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                  msg.role === "user"
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-soft)] text-[var(--primary)] border border-[var(--hairline)]"
                }`}
              >
                {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`space-y-2 max-w-[88%] sm:max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white rounded-tr-none shadow-md whitespace-pre-wrap"
                      : "bg-[var(--surface-soft)] border border-[var(--hairline)] text-[var(--ink)] rounded-tl-none space-y-2"
                  }`}
                >
                  {msg.role === "user" ? (
                    msg.content
                  ) : (
                    <FormattedMessage 
                      content={msg.content} 
                      onSelectPrompt={(p) => sendMessage(p)} 
                    />
                  )}
                </div>

                {/* Interactive Action Badges */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {msg.actions.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 bg-[var(--canvas)] border border-[var(--primary)]/30 rounded-xl text-xs text-[var(--ink)] shadow-sm"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-semibold text-[11px] flex-1">{act.summary}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-[var(--muted)] px-1 font-mono">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[var(--surface-soft)] text-[var(--primary)] border border-[var(--hairline)] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce delay-200" />
                <span className="ml-1 font-mono">Analyzing portal context...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-[var(--hairline)] bg-[var(--surface-soft)]/50 overflow-x-auto flex items-center gap-2 scrollbar-none">
          {actionTabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => sendMessage(tab.query, tab.actionTab)}
              disabled={isLoading}
              className="px-2.5 py-1.5 bg-[var(--canvas)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] hover:border-[var(--primary)] text-[11px] font-bold text-[var(--ink)] rounded-xl whitespace-nowrap transition-all flex-shrink-0 cursor-pointer"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4. Input Bar with Voice Support */}
        <div className="p-3 border-t border-[var(--hairline)] bg-[var(--surface)]">
          <form
            onSubmit={e => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white border-red-500 animate-pulse"
                  : "bg-[var(--canvas)] text-[var(--muted)] hover:text-[var(--ink)] border-[var(--hairline)]"
              }`}
              title="Voice Dictation"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              placeholder={isListening ? "Listening to your voice..." : "Ask copilot or command an action..."}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-xs sm:text-sm text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-[var(--primary)] disabled:opacity-40 text-white rounded-xl hover:bg-[var(--primary-active)] transition-all cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
