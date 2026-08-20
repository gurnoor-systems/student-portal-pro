"use client";

import React, { useState, useEffect, useRef } from "react";
import Logo from "@/components/Logo";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Video, 
  Brain, 
  Calculator, 
  ArrowRight,
  MousePointer2,
  Minimize2,
  Kanban,
  Timer,
  Radio
} from "lucide-react";

interface InteractiveDemoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

interface Chapter {
  id: number;
  title: string;
  badge: string;
  duration: number; // in seconds
  desc: string;
}

const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "1. 2-Click Deliverable Capture (Ctrl+K)",
    badge: "00:00 - 00:10",
    duration: 10,
    desc: "Simulated rapid keyboard shortcuts & live Kanban matrix dispatch."
  },
  {
    id: 2,
    title: "2. Live Lecture & Course Hub",
    badge: "00:10 - 00:20",
    duration: 10,
    desc: "Single-click Google Meet & Zoom meeting launcher with room codes."
  },
  {
    id: 3,
    title: "3. Focus Sanctuary & Mini PiP Mode",
    badge: "00:20 - 00:32",
    duration: 12,
    desc: "Deep work countdown, 40Hz Gamma soundscape & dockable floating PiP widget."
  },
  {
    id: 4,
    title: "4. AI Final Exam Grade Predictor",
    badge: "00:32 - 00:44",
    duration: 12,
    desc: "Reverse-engineers required final exam percentage to lock in target GPA."
  },
  {
    id: 5,
    title: "5. Active Recall Spaced Repetition",
    badge: "00:44 - 00:55",
    duration: 11,
    desc: "3D interactive flip cards with SM-2 memory retention intervals."
  }
];

const TOTAL_DURATION = 55; // 55 seconds rich simulation

export default function InteractiveDemoPlayer({ isOpen, onClose, onOpenAuth }: InteractiveDemoPlayerProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sandbox interactive states (when user wants to play directly)
  const [sandboxTab, setSandboxTab] = useState<"kanban" | "focus" | "calculator" | "flashcard">("kanban");
  const [sandboxTimerRunning, setSandboxTimerRunning] = useState<boolean>(false);
  const [sandboxTimerSecs, setSandboxTimerSecs] = useState<number>(25 * 60);
  const [sandboxCardFlipped, setSandboxCardFlipped] = useState<boolean>(false);
  const [sandboxCurrentGrade, setSandboxCurrentGrade] = useState<number>(82);
  const [sandboxTargetGrade, setSandboxTargetGrade] = useState<number>(85);
  const [sandboxExamWeight, setSandboxExamWeight] = useState<number>(40);

  // Auto-play timer
  useEffect(() => {
    if (isOpen && isPlaying && !isSandboxMode) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= TOTAL_DURATION) {
            return 0; // loop
          }
          return Math.round((prev + 0.1 * playbackSpeed) * 10) / 10;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying, playbackSpeed, isSandboxMode]);

  if (!isOpen) return null;

  // Find active chapter
  let accumulated = 0;
  let currentChapter = CHAPTERS[0];
  for (const chap of CHAPTERS) {
    if (currentTime >= accumulated && currentTime < accumulated + chap.duration) {
      currentChapter = chap;
      break;
    }
    accumulated += chap.duration;
  }

  // Format time MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Chapter jump handler
  const handleJumpToChapter = (chapterId: number) => {
    let targetTime = 0;
    for (let i = 0; i < chapterId - 1; i++) {
      targetTime += CHAPTERS[i].duration;
    }
    setCurrentTime(targetTime);
  };

  // Speed toggler
  const handleToggleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      
      <div 
        className="bg-[#0b1017] border border-white/15 text-white w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col relative max-h-[96vh]"
        role="dialog"
        aria-modal="true"
      >
        
        {/* 1. Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#070b10]">
          <div className="flex items-center gap-3">
            <Logo size={24} variant="gold" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-[1.5px] uppercase text-[#d4af37]">
                  STUDENT PORTAL PRO TOUR
                </span>
                <span className="px-2 py-0.2 bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold rounded">
                  {isSandboxMode ? "INTERACTIVE SANDBOX ACTIVE" : "REAL ACTION SIMULATION"}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light truncate max-w-[280px] sm:max-w-md">
                {isSandboxMode ? "Click any buttons or cards below to test features live" : `${currentChapter.title} • ${currentChapter.desc}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sandbox Mode Toggle */}
            <button
              onClick={() => {
                setIsSandboxMode(!isSandboxMode);
                if (!isSandboxMode) setIsPlaying(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSandboxMode 
                  ? "bg-[#d4af37] text-slate-950 shadow-md" 
                  : "bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10"
              }`}
            >
              <MousePointer2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isSandboxMode ? "Exit Sandbox" : "🖐️ Try Sandbox Mode"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close Tour"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Interactive Simulation Stage */}
        <div className="relative aspect-[16/9] w-full bg-[#05080d] flex items-center justify-center overflow-hidden p-4 sm:p-8">
          
          {/* Subtle Ambient Background Mesh */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(29,99,255,0.12)_0%,transparent_70%)] pointer-events-none" />

          {/* ========================================================
              SIMULATED SCENARIO 1: QUICK TASK ADD & KANBAN (0s - 10s)
             ======================================================== */}
          {!isSandboxMode && currentTime < 10 && (
            <div className="w-full max-w-xl bg-[#0e141f] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[var(--primary)] text-white text-[10px] font-mono font-bold rounded">
                    Ctrl + K
                  </span>
                  <span className="text-xs font-bold text-white font-mono">QUICK ADD DELIVERABLE</span>
                </div>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-mono font-bold rounded">
                  PRIORITY: HIGH
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 mb-1">TASK TITLE</div>
                  <div className="p-3 bg-[#070b10] border border-[var(--primary)]/60 text-white font-mono rounded-lg flex items-center justify-between">
                    <span>
                      {currentTime < 3 ? "CS 350 " : currentTime < 6 ? "CS 350 - Distributed Systems " : "CS 350 - Distributed Systems Lab Paging"}
                      <span className="animate-pulse">|</span>
                    </span>
                    <span className="text-[10px] text-slate-500">Auto-filled</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-[#070b10] border border-white/10 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-mono">Course:</span>
                    <span className="font-bold text-[var(--primary)]">CS 350 (Operating Systems)</span>
                  </div>
                  <div className="p-2.5 bg-[#070b10] border border-white/10 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-mono">Due Date:</span>
                    <span className="font-bold text-white">Friday, 11:59 PM (in 24h)</span>
                  </div>
                </div>
              </div>

              <div className="w-full py-2.5 bg-[var(--primary)] text-white text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25">
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVED & LOGGED TO KANBAN BOARD</span>
              </div>

              {/* Animated Hardware Cursor */}
              <div 
                className="absolute pointer-events-none transition-all duration-700 ease-out z-30"
                style={{
                  top: currentTime < 4 ? "45%" : currentTime < 7 ? "75%" : "85%",
                  left: currentTime < 4 ? "50%" : currentTime < 7 ? "70%" : "50%"
                }}
              >
                <div className="relative">
                  <MousePointer2 className="w-6 h-6 text-white fill-[#1d63ff] drop-shadow-md" />
                  {currentTime >= 7 && (
                    <div className="absolute -inset-2 bg-blue-400/40 rounded-full animate-ping" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SIMULATED SCENARIO 2: LIVE LECTURE HUB (10s - 20s)
             ======================================================== */}
          {!isSandboxMode && currentTime >= 10 && currentTime < 20 && (
            <div className="w-full max-w-xl bg-[#0e141f] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-mono">TODAY&apos;S LIVE CLASSROOMS</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded">
                  2 SESSIONS TODAY
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#070b10] border border-[var(--primary)] rounded-xl space-y-2 relative overflow-hidden">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[var(--primary)] font-bold">#CS 341</span>
                    <span className="text-emerald-400 font-bold">● LIVE NOW</span>
                  </div>
                  <div className="font-bold text-white truncate">Algorithms & Complexity</div>
                  <div className="text-[10px] text-slate-400 font-mono">Prof. Vance • 10:30 AM</div>
                  <button className="w-full py-2 bg-[var(--primary)] text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
                    <Video className="w-3.5 h-3.5" />
                    <span>LAUNCH GOOGLE MEET</span>
                  </button>
                </div>

                <div className="p-3.5 bg-[#070b10] border border-white/10 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-[var(--primary)] font-bold">#MATH 201</span>
                    <span className="text-slate-400">01:30 PM</span>
                  </div>
                  <div className="font-bold text-white truncate">Linear Algebra & Matrices</div>
                  <div className="text-[10px] text-slate-400 font-mono">Dr. Evans • Hall 2B</div>
                  <button className="w-full py-2 bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Course Materials</span>
                  </button>
                </div>
              </div>

              {/* Animated Cursor on Launch Button */}
              <div 
                className="absolute pointer-events-none transition-all duration-700 ease-out z-30"
                style={{
                  top: currentTime < 14 ? "60%" : "72%",
                  left: currentTime < 14 ? "40%" : "28%"
                }}
              >
                <div className="relative">
                  <MousePointer2 className="w-6 h-6 text-white fill-[#1d63ff] drop-shadow-md" />
                  {currentTime >= 16 && (
                    <div className="absolute -inset-2 bg-emerald-400/40 rounded-full animate-ping" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SIMULATED SCENARIO 3: FOCUS SANCTUARY & PIP (20s - 32s)
             ======================================================== */}
          {!isSandboxMode && currentTime >= 20 && currentTime < 32 && (
            <div className="w-full max-w-xl bg-[#090d14] border border-white/15 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-bold text-white font-mono">FOCUS IMMERSION SANCTUARY</span>
                </div>
                <button className="px-2.5 py-1 bg-white/10 border border-white/20 text-slate-300 rounded text-[10px] font-mono flex items-center gap-1">
                  <Minimize2 className="w-3 h-3 text-[#d4af37]" />
                  <span>PiP Mode</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Simulated Timer Ring */}
                <div className="relative flex flex-col items-center justify-center p-4 bg-[#05080d] border border-white/10 rounded-2xl">
                  <div className="w-28 h-28 rounded-full border-4 border-[#1d63ff] border-t-transparent animate-spin duration-3000 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="font-mono text-xl font-bold text-white">24:45</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-2">Deep Work (25m)</div>
                </div>

                {/* Soundscape & Deliverable */}
                <div className="space-y-3 text-xs">
                  <div className="p-2.5 bg-[#0e141f] border border-white/10 rounded-xl space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Target Deliverable:</span>
                    <div className="font-bold text-white truncate">CS 350 - OS Virtual Memory Lab</div>
                  </div>

                  <div className="p-2.5 bg-[#0e141f] border border-[#1d63ff]/50 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-[#1d63ff] animate-pulse" />
                      <span className="font-bold text-white text-[11px]">⚡ 40Hz Gamma Binaural</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">SYNTHESIZED</span>
                  </div>
                </div>
              </div>

              {/* Floating PiP Demonstration Pill at Bottom-Right */}
              {currentTime >= 26 && (
                <div className="absolute bottom-4 right-4 bg-[#090d14]/95 border border-[#1d63ff] rounded-xl p-2.5 shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 z-40">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold text-white">24:45</span>
                  <span className="text-[9px] text-slate-400 truncate max-w-[90px]">CS 350 Lab</span>
                  <span className="px-1.5 py-0.5 bg-[var(--primary)] text-white text-[8px] font-bold rounded">PiP DOCKED</span>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              SIMULATED SCENARIO 4: GRADE PREDICTOR (32s - 44s)
             ======================================================== */}
          {!isSandboxMode && currentTime >= 32 && currentTime < 44 && (
            <div className="w-full max-w-xl bg-[#0e141f] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-bold text-white font-mono">SMART EXAM GRADE PREDICTOR</span>
                </div>
                <span className="px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] text-[10px] font-mono font-bold rounded">
                  AI WEIGHTED ALGORITHM
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-[#070b10] border border-white/10 rounded-lg text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">CURRENT GRADE</span>
                  <span className="text-base font-bold text-white font-mono">82%</span>
                </div>
                <div className="p-2.5 bg-[#070b10] border border-white/10 rounded-lg text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">TARGET GPA</span>
                  <span className="text-base font-bold text-[#d4af37] font-mono">A (85%)</span>
                </div>
                <div className="p-2.5 bg-[#070b10] border border-white/10 rounded-lg text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">EXAM WEIGHT</span>
                  <span className="text-base font-bold text-[var(--primary)] font-mono">40%</span>
                </div>
              </div>

              {/* Calculated Result Card */}
              <div className="p-4 bg-[#070b10] border border-emerald-500/50 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-500/10 animate-in fade-in">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">PREDICTED SCORE NEEDED ON FINAL EXAM:</span>
                  <div className="text-xl font-bold font-mono text-white">89.5%</div>
                </div>
                <span className="px-3 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg uppercase">
                  Achievable Target
                </span>
              </div>
            </div>
          )}

          {/* ========================================================
              SIMULATED SCENARIO 5: 3D FLASHCARDS (44s - 55s)
             ======================================================== */}
          {!isSandboxMode && currentTime >= 44 && (
            <div className="w-full max-w-xl bg-[#0e141f] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-bold text-white font-mono">ACTIVE RECALL & SPACED REPETITION</span>
                </div>
                <span className="px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-mono font-bold rounded">
                  SM-2 MEMORY RETENTION
                </span>
              </div>

              {/* 3D Flashcard */}
              <div className="p-6 bg-[#070b10] border border-white/15 rounded-xl text-center space-y-3 min-h-[140px] flex flex-col justify-center shadow-lg">
                <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                  {currentTime < 49 ? "QUESTION (CLICK TO REVEAL)" : "ANSWER & CORE FORMULA"}
                </span>
                <p className="text-sm font-bold text-white leading-relaxed">
                  {currentTime < 49 
                    ? "What is the amortized time complexity of inserting into a Dynamic Array?" 
                    : "O(1) Amortized (Doubling array capacity when full ensures total cost is linear)."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono font-bold">
                <button className="py-2 bg-red-500/20 text-red-300 rounded border border-red-500/30">
                  AGAIN (1D)
                </button>
                <button className="py-2 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                  HARD (3D)
                </button>
                <button className="py-2 bg-emerald-500 text-slate-950 rounded shadow-md">
                  GOOD (6D) ✓
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              SANDBOX MODE (HANDS-ON PLAYGROUND)
             ======================================================== */}
          {isSandboxMode && (
            <div className="w-full max-w-2xl bg-[#0e141f] border border-[#d4af37]/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              {/* Sandbox Tab Switcher */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                  onClick={() => setSandboxTab("kanban")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    sandboxTab === "kanban" ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Kanban Tasks</span>
                </button>
                <button
                  onClick={() => setSandboxTab("focus")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    sandboxTab === "focus" ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>Focus Room</span>
                </button>
                <button
                  onClick={() => setSandboxTab("calculator")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    sandboxTab === "calculator" ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Grade Calculator</span>
                </button>
                <button
                  onClick={() => setSandboxTab("flashcard")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    sandboxTab === "flashcard" ? "bg-[var(--primary)] text-white" : "bg-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>Flashcard Flip</span>
                </button>
              </div>

              {/* Sandbox Tab 1: Kanban */}
              {sandboxTab === "kanban" && (
                <div className="grid grid-cols-2 gap-3 text-xs animate-in fade-in">
                  <div className="p-3 bg-[#070b10] border border-white/10 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">TO DO (2)</span>
                    <div className="p-2.5 bg-[#141b24] rounded border border-white/10">
                      <div className="font-bold text-white">CS 350 OS Kernel Lab</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">Due in 24 hours</div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#070b10] border border-white/10 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono text-[var(--primary)] font-bold uppercase">IN PROGRESS (1)</span>
                    <div className="p-2.5 bg-[#141b24] rounded border border-[var(--primary)]">
                      <div className="font-bold text-white">Algorithms Dynamic Programming</div>
                      <div className="text-[10px] text-emerald-400 font-mono mt-1">● Active Study</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sandbox Tab 2: Focus Room */}
              {sandboxTab === "focus" && (
                <div className="p-4 bg-[#070b10] border border-white/10 rounded-xl flex items-center justify-between animate-in fade-in">
                  <div>
                    <div className="text-2xl font-bold font-mono text-white">{formatTime(sandboxTimerSecs)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Deep Work Session</div>
                  </div>
                  <button
                    onClick={() => setSandboxTimerRunning(!sandboxTimerRunning)}
                    className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    {sandboxTimerRunning ? "Pause" : "Start Focus Timer"}
                  </button>
                </div>
              )}

              {/* Sandbox Tab 3: Calculator */}
              {sandboxTab === "calculator" && (
                <div className="space-y-3 animate-in fade-in text-xs">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400">Current %</label>
                      <input 
                        type="number" 
                        value={sandboxCurrentGrade} 
                        onChange={(e) => setSandboxCurrentGrade(Number(e.target.value))}
                        className="w-full h-8 px-2 bg-[#070b10] border border-white/15 rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400">Target %</label>
                      <input 
                        type="number" 
                        value={sandboxTargetGrade} 
                        onChange={(e) => setSandboxTargetGrade(Number(e.target.value))}
                        className="w-full h-8 px-2 bg-[#070b10] border border-white/15 rounded text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400">Final Weight %</label>
                      <input 
                        type="number" 
                        value={sandboxExamWeight} 
                        onChange={(e) => setSandboxExamWeight(Number(e.target.value))}
                        className="w-full h-8 px-2 bg-[#070b10] border border-white/15 rounded text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-mono text-xs font-bold text-center">
                    Required on Final Exam: {Math.max(0, Math.round(((sandboxTargetGrade - (sandboxCurrentGrade * (1 - sandboxExamWeight / 100))) / (sandboxExamWeight / 100)) * 10) / 10)}%
                  </div>
                </div>
              )}

              {/* Sandbox Tab 4: Flashcards */}
              {sandboxTab === "flashcard" && (
                <div 
                  onClick={() => setSandboxCardFlipped(!sandboxCardFlipped)}
                  className="p-6 bg-[#070b10] border border-white/15 hover:border-[var(--primary)] rounded-xl text-center cursor-pointer space-y-2 animate-in fade-in"
                >
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">
                    {sandboxCardFlipped ? "ANSWER" : "QUESTION (CLICK TO FLIP)"}
                  </span>
                  <p className="text-sm font-bold text-white">
                    {sandboxCardFlipped ? "O(log N) - Logarithmic search using divide and conquer." : "What is the time complexity of Binary Search on a sorted array?"}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* 3. Bottom Video Scrubbing Bar & Controls */}
        <div className="p-4 sm:p-5 bg-[#070b10] border-t border-white/10 space-y-3">
          
          {/* Progress Bar with Chapter Markers */}
          <div className="space-y-1.5">
            <div 
              className="w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newRatio = clickX / rect.width;
                setCurrentTime(Math.round(newRatio * TOTAL_DURATION));
              }}
            >
              <div 
                className="h-full bg-gradient-to-r from-[#1d63ff] via-[#4285F4] to-[#d4af37] transition-all duration-100 rounded-full"
                style={{ width: `${(currentTime / TOTAL_DURATION) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="text-white font-bold">{formatTime(currentTime)} / {formatTime(TOTAL_DURATION)}</span>
              <div className="hidden sm:flex items-center gap-2">
                {CHAPTERS.map(chap => (
                  <button
                    key={chap.id}
                    onClick={() => handleJumpToChapter(chap.id)}
                    className={`text-[10px] px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      currentChapter.id === chap.id 
                        ? "bg-[#d4af37] text-slate-950 font-bold" 
                        : "hover:text-white"
                    }`}
                  >
                    Chap {chap.id}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white rounded-xl cursor-pointer transition-colors shadow-md"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleSpeed}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-mono font-bold rounded-lg cursor-pointer"
                title="Toggle playback speed"
              >
                {playbackSpeed}x
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { onClose(); onOpenAuth("signup"); }}
                className="px-5 py-2.5 bg-[#d4af37] hover:bg-[#b8952b] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <span>CREATE FREE ACCOUNT</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
