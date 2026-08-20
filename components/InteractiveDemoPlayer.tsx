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
  Volume2,
  VolumeX,
  Flame,
  ShieldCheck,
  MousePointer
} from "lucide-react";

interface InteractiveDemoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

const DEMO_STEPS = [
  {
    id: 1,
    title: "Smart Campus Onboarding",
    timeRange: [0, 6],
    badge: "00:00 - 00:06",
    desc: "Personalizes your campus, semester & 2-way Google Calendar sync in 20 seconds."
  },
  {
    id: 2,
    title: "2-Click Task Capture (Ctrl+K)",
    timeRange: [6, 12],
    badge: "00:06 - 00:12",
    desc: "Instant priority tagging with zero friction, auto-synced to your Kanban matrix."
  },
  {
    id: 3,
    title: "1-Click Live Lecture Launcher",
    timeRange: [12, 18],
    badge: "00:12 - 00:18",
    desc: "One central hub for all Google Meet, Zoom, and Teams lectures."
  },
  {
    id: 4,
    title: "Zen Focus Sanctuary",
    timeRange: [18, 24],
    badge: "00:18 - 00:24",
    desc: "Distraction-free deep work mode with 10Hz Binaural Alpha Waves and Pomodoro clock."
  },
  {
    id: 5,
    title: "Smart Final Exam Grade Predictor",
    timeRange: [24, 30],
    badge: "00:24 - 00:30",
    desc: "Calculates the exact final exam score needed to lock in an A."
  }
];

export default function InteractiveDemoPlayer({ isOpen, onClose, onOpenAuth }: InteractiveDemoPlayerProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play timer for 30-second loop
  useEffect(() => {
    if (isOpen && isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 30) {
            return 0; // loop back
          }
          return Math.round((prev + 0.1) * 10) / 10;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isPlaying]);

  if (!isOpen) return null;

  // Compute current active chapter
  const currentStep = DEMO_STEPS.find(s => currentTime >= s.timeRange[0] && currentTime < s.timeRange[1]) || DEMO_STEPS[0];
  const progressPercent = (currentTime / 30) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      
      <div 
        className="bg-[#0b1017] border border-white/15 text-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col relative"
        role="dialog"
        aria-modal="true"
      >
        {/* 1. Player Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070b10]">
          <div className="flex items-center gap-3">
            <Logo size={24} variant="gold" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono tracking-[1.5px] uppercase text-[#d4af37]">
                  30-SECOND AI PLATFORM TOUR
                </span>
                <span className="px-2 py-0.2 bg-emerald-500/15 text-emerald-400 text-[9px] font-mono font-bold rounded">
                  LIVE INTERACTIVE DEMO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                {currentStep.title} ({currentStep.badge})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Simulated Dynamic Screen Stage */}
        <div className="relative aspect-[16/9] w-full bg-[#05080c] flex items-center justify-center overflow-hidden border-b border-white/10 p-6 sm:p-8">
          
          {/* Subtle Ambient Background Cyber Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(62,106,225,0.15)_0%,transparent_70%)] pointer-events-none" />

          {/* ========================================================
              SCENE 1: SMART CAMPUS ONBOARDING (0s - 6s)
             ======================================================== */}
          {currentTime < 6 && (
            <div className="w-full max-w-md bg-[#0f1520] border border-white/15 rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>STEP 2: CAMPUS & SEMESTER SETUP</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">AUTOMATED</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 bg-[#070b10] border border-blue-500/40 rounded flex items-center justify-between">
                  <span className="text-slate-400">Campus:</span>
                  <span className="text-white font-bold">University of Waterloo</span>
                </div>
                <div className="p-2.5 bg-[#070b10] border border-amber-500/40 rounded flex items-center justify-between">
                  <span className="text-slate-400">Semester:</span>
                  <span className="text-[#d4af37] font-bold">Fall 2026</span>
                </div>
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center justify-between text-emerald-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Google Calendar Sync:</span>
                  </span>
                  <span>ACTIVE (2-WAY)</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SCENE 2: 2-CLICK TASK CAPTURE (6s - 12s)
             ======================================================== */}
          {currentTime >= 6 && currentTime < 12 && (
            <div className="w-full max-w-md bg-[#0f1520] border border-white/15 rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[10px]">Ctrl+K</span>
                  <span>QUICK ADD TASK</span>
                </span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">PRIORITY: HIGH</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-[#070b10] border border-white/15 rounded font-bold text-white">
                  OS161 Kernel Virtual Memory Paging
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Course: <strong className="text-[var(--primary)]">CS 350</strong></span>
                  <span>Due: <strong className="text-white">Friday, 11:59 PM</strong></span>
                </div>
              </div>

              <div className="w-full py-2.5 bg-[var(--primary)] text-white text-xs font-bold rounded flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TASK LOGGED TO KANBAN</span>
              </div>
            </div>
          )}

          {/* ========================================================
              SCENE 3: LIVE LECTURE LAUNCHER (12s - 18s)
             ======================================================== */}
          {currentTime >= 12 && currentTime < 18 && (
            <div className="w-full max-w-lg bg-[#0f1520] border border-white/15 rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Video className="w-4 h-4 text-emerald-400" />
                  <span>TODAY&apos;S LIVE CLASSROOMS</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">READY TO JOIN</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#070b10] border border-white/10 rounded space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-[var(--primary)] font-bold">CS 341</span>
                    <span>10:30 AM</span>
                  </div>
                  <div className="font-bold text-white truncate">Algorithms & Complexity</div>
                  <div className="w-full py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded text-center">
                    JOIN MEET
                  </div>
                </div>

                <div className="p-3.5 bg-[#070b10] border border-white/10 rounded space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span className="text-[var(--primary)] font-bold">CS 350</span>
                    <span>01:00 PM</span>
                  </div>
                  <div className="font-bold text-white truncate">Operating Systems</div>
                  <div className="w-full py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded text-center">
                    JOIN MEET
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              SCENE 4: ZEN FOCUS SANCTUARY (18s - 24s)
             ======================================================== */}
          {currentTime >= 18 && currentTime < 24 && (
            <div className="w-full max-w-md bg-[#0f1520] border border-white/15 rounded-xl p-6 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-[#d4af37]/40 rounded text-[10px] font-mono text-[#d4af37] font-bold uppercase">
                <Brain className="w-3.5 h-3.5" />
                <span>10HZ BINAURAL ALPHA WAVES ACTIVE</span>
              </div>

              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping pointer-events-none" />
                <div className="text-4xl font-bold font-mono text-white">
                  24:59
                </div>
              </div>

              <div className="text-xs text-slate-300 font-mono">
                Task: <strong className="text-white">OS161 Kernel Virtual Memory</strong>
              </div>
            </div>
          )}

          {/* ========================================================
              SCENE 5: SMART GPA & GRADE PREDICTOR (24s - 30s)
             ======================================================== */}
          {currentTime >= 24 && (
            <div className="w-full max-w-md bg-[#0f1520] border border-white/15 rounded-xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[var(--primary)]" />
                  <span>FINAL EXAM SCORE PREDICTOR</span>
                </div>
                <span className="text-[10px] font-mono text-[#d4af37] font-bold">TARGET: A (85%)</span>
              </div>

              <div className="p-4 bg-[#070b10] border border-emerald-500/30 rounded text-center space-y-1">
                <div className="text-[10px] font-mono text-slate-400 uppercase">REQUIRED SCORE ON FINAL</div>
                <div className="text-4xl font-bold font-mono text-emerald-400">83.4%</div>
                <div className="text-[11px] text-slate-400 font-mono">Difficulty: <strong className="text-emerald-400">Comfortable</strong></div>
              </div>

              <div className="text-[11px] text-center text-slate-300 font-light">
                Honors standing locked in for Fall 2026.
              </div>
            </div>
          )}

        </div>

        {/* 3. Player Timeline Scrubber & Step Markers */}
        <div className="px-6 py-4 bg-[#070b10] space-y-3">
          
          {/* Scrubber Bar */}
          <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
            <div 
              className="h-full bg-gradient-to-r from-[#1c69d4] via-[#d4af37] to-emerald-500 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 5 Interactive Phase Buttons */}
          <div className="grid grid-cols-5 gap-1 text-center font-mono text-[10px]">
            {DEMO_STEPS.map(step => {
              const isActive = currentTime >= step.timeRange[0] && currentTime < step.timeRange[1];
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentTime(step.timeRange[0])}
                  className={`p-1.5 rounded transition-all cursor-pointer truncate ${
                    isActive 
                      ? "bg-[var(--primary)] text-white font-bold shadow" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={step.title}
                >
                  <span className="truncate">{step.id}. {step.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Controls Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setCurrentTime(0)}
                className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Restart Demo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono text-slate-400">
                00:{String(Math.floor(currentTime)).padStart(2, "0")} / 00:30
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAuth("signup");
              }}
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
            >
              <span>LAUNCH YOUR PORTAL NOW</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
