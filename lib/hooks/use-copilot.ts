"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UserProfile, UserData } from "@/lib/types";

export interface AgentActionItem {
  type: "CREATE_TASK" | "SCHEDULE_ROUTINE" | "START_FOCUS" | "COMPLETE_TASK" | "NAVIGATE_TAB";
  payload: Record<string, any>;
  summary: string;
}

export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AgentActionItem[];
  timestamp: string;
}

interface UseCopilotOptions {
  user: UserProfile | null;
  userData: UserData;
  onExecuteAction?: (action: AgentActionItem) => void;
}

export function useCopilot({ user, userData, onExecuteAction }: UseCopilotOptions) {
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: "msg_init",
      role: "assistant",
      content: `Hello ${user?.fullName?.split(" ")[0] || "Scholar"}! 👋 I am your **Academic AI Copilot**.\n\nI have live awareness of your **${userData.courses.length} courses**, **${userData.tasks.filter(t => t.status !== "completed").length} active assignments**, and daily routine.\n\nHow can I help your studies today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Reactively hydrate initial welcome greeting when user or courses finish loading
  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        const studentName = user?.fullName?.split(" ")[0] || "Scholar";
        const courseCount = userData.courses.length;
        const activeTasks = userData.tasks.filter(t => t.status !== "completed").length;
        return [
          {
            id: "msg_init",
            role: "assistant",
            content: `Hello **${studentName}**! 👋 I am your **Academic AI Copilot** at **${user?.university || "University of Delhi"}**.\n\nI have live awareness of your **${courseCount} courses**, **${activeTasks} active assignments**, and daily routine.\n\nHow can I help your studies today?`,
            timestamp: prev[0]?.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ];
      }
      return prev;
    });
  }, [user, userData.courses.length, userData.tasks]);

  const sendMessage = useCallback(async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: AgentMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const storageKey = user ? `student_portal_user_${user.id}_routine_${todayStr}` : `student_portal_routine_${todayStr}`;
      let liveRoutines = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) liveRoutines = JSON.parse(raw);
      } catch {}

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          context: {
            userName: user?.fullName || "Student",
            university: user?.university,
            major: user?.major || user?.degree,
            semester: user?.semester,
            courses: userData.courses || [],
            tasks: userData.tasks || [],
            exams: userData.exams || [],
            routines: liveRoutines
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        const assistantMsg: AgentMessage = {
          id: `ai_${Date.now()}`,
          role: "assistant",
          content: data.reply,
          actions: data.actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages(prev => [...prev, assistantMsg]);

        if (data.actions && Array.isArray(data.actions) && onExecuteAction) {
          data.actions.forEach((act: AgentActionItem) => onExecuteAction(act));
        }
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: "Sorry, I had trouble processing that request. Please try again.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Network error connecting to AI agent. Please check your connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, user, userData, onExecuteAction]);

  const toggleVoiceInput = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput(transcript);
          sendMessage(transcript);
        }
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [isListening, sendMessage]);

  return {
    messages,
    input,
    setInput,
    isLoading,
    isListening,
    sendMessage,
    toggleVoiceInput
  };
}
