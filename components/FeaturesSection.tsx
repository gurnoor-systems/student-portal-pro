"use client";

import React from "react";
import { 
  Layers, 
  Calendar, 
  Sparkles, 
  FolderOpen, 
  CheckCircle2, 
  Clock, 
  Video, 
  ArrowRight,
  Kanban,
  FileText,
  Flame,
  Check
} from "lucide-react";

interface FeaturesSectionProps {
  onOpenWalkthrough: () => void;
}

export default function FeaturesSection({ onOpenWalkthrough }: FeaturesSectionProps) {
  return (
    <section id="features" className="bg-[var(--canvas)] py-20 lg:py-28 border-b border-[var(--hairline)]">
      <div className="max-w-[1536px] mx-auto px-6 lg:px-12">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14 space-y-3">
          <div className="text-[11px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
            PLATFORM CAPABILITIES
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)]">
            Engineered for Academic Focus.
          </h2>
          <p className="text-sm sm:text-base font-light text-[var(--body)] leading-relaxed">
            Everything you need to manage assignments, exams, and classes without clutter or distraction.
          </p>
        </div>

        {/* 4 Feature Visual Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* CARD 1: Task Management & Priority Matrix */}
          <div className="bmw-card flex flex-col justify-between group hover:border-[var(--primary)] transition-all">
            <div className="space-y-4">
              
              {/* Rich Visual Illustration 1: Kanban & Priority Capture */}
              <div className="h-44 bg-[#090d12] border border-white/10 p-3.5 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-[var(--primary)] font-bold">
                    <Kanban className="w-3.5 h-3.5" />
                    <span>TASK MATRIX</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Ctrl+K
                  </span>
                </div>

                <div className="space-y-2 py-1">
                  {/* Task Pill 1 */}
                  <div className="p-2 bg-[#121922] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-red-500/20 border border-red-500 text-red-400 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-[11px] font-medium text-white truncate max-w-[130px]">CS 350 VM Lab</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 bg-red-500/20 text-red-400">HIGH</span>
                  </div>

                  {/* Task Pill 2 */}
                  <div className="p-2 bg-[#121922] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border border-slate-600 flex items-center justify-center" />
                      <span className="text-[11px] font-medium text-slate-300 truncate max-w-[130px]">MATH 201 Proofs</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 bg-blue-500/20 text-blue-400">MED</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1 border-t border-white/5">
                  <span>3 ACTIVE TASKS</span>
                  <span className="text-[#d4af37]">AUTO-SYNCED</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-[var(--primary)] font-bold tracking-wider uppercase">
                  TASK MANAGEMENT
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                  2-Click Task Capture & Matrix
                </h3>
                <p className="text-xs font-light text-[var(--body)] leading-relaxed">
                  Capture assignments in under 3 seconds using <span className="font-mono bg-[var(--surface-soft)] px-1 py-0.5 border border-[var(--hairline)]">Ctrl+K</span> with color-coded urgency tiers.
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-[var(--hairline)] mt-6">
              <button
                onClick={onOpenWalkthrough}
                className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
              >
                <span>EXPLORE TASK ENGINE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 2: Exams & Horizon Schedule */}
          <div className="bmw-card flex flex-col justify-between group hover:border-[var(--primary)] transition-all">
            <div className="space-y-4">
              
              {/* Rich Visual Illustration 2: Exam Countdown & Readiness */}
              <div className="h-44 bg-[#090d12] border border-white/10 p-3.5 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-[#d4af37] font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>EXAM COUNTDOWN</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30">
                    &lt; 7 DAYS
                  </span>
                </div>

                <div className="p-2.5 bg-[#121922] border border-[#d4af37]/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white">Circuit Theory Midterm</span>
                    <span className="text-[10px] font-mono text-[#d4af37] font-bold">WEIGHT 30%</span>
                  </div>
                  
                  {/* Countdown Badges */}
                  <div className="grid grid-cols-4 gap-1 text-center font-mono text-[9px]">
                    <div className="bg-[#090d12] border border-white/10 py-1">
                      <div className="text-xs font-bold text-white">03</div>
                      <div className="text-[8px] text-slate-400">DAYS</div>
                    </div>
                    <div className="bg-[#090d12] border border-white/10 py-1">
                      <div className="text-xs font-bold text-white">14</div>
                      <div className="text-[8px] text-slate-400">HRS</div>
                    </div>
                    <div className="bg-[#090d12] border border-white/10 py-1">
                      <div className="text-xs font-bold text-white">22</div>
                      <div className="text-[8px] text-slate-400">MIN</div>
                    </div>
                    <div className="bg-[#090d12] border border-white/10 py-1">
                      <div className="text-xs font-bold text-red-400">45</div>
                      <div className="text-[8px] text-slate-400">SEC</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span>SYLLABUS READINESS</span>
                  <span className="text-white font-bold">75% COMPLETE</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-[var(--primary)] font-bold tracking-wider uppercase">
                  EXAM SCHEDULE
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                  Live Countdown & Syllabus Hub
                </h3>
                <p className="text-xs font-light text-[var(--body)] leading-relaxed">
                  Automatic countdown clocks with syllabus chapter checklists and grade weight calculators.
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-[var(--hairline)] mt-6">
              <button
                onClick={onOpenWalkthrough}
                className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
              >
                <span>VIEW EXAM TIMELINES</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 3: AI Study Plan & Intelligence */}
          <div className="bmw-card flex flex-col justify-between group hover:border-[var(--primary)] transition-all">
            <div className="space-y-4">
              
              {/* Rich Visual Illustration 3: AI Milestone Phases */}
              <div className="h-44 bg-[#090d12] border border-white/10 p-3.5 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-[#d4af37] font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>AI ROADMAP</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-[#d4af37] border border-amber-500/30">
                    GEMINI + HEURISTICS
                  </span>
                </div>

                <div className="space-y-1.5 py-1">
                  <div className="p-1.5 bg-[#121922] border border-[#d4af37]/30 flex items-center gap-2 text-[10px]">
                    <div className="w-4 h-4 bg-[#d4af37] text-slate-900 font-bold flex items-center justify-center text-[9px] font-mono">1</div>
                    <span className="text-white truncate">Review Core Theory & Formulas</span>
                  </div>
                  <div className="p-1.5 bg-[#121922] border border-white/10 flex items-center gap-2 text-[10px]">
                    <div className="w-4 h-4 bg-slate-700 text-white font-bold flex items-center justify-center text-[9px] font-mono">2</div>
                    <span className="text-slate-300 truncate">Solve 15 Problem Sets</span>
                  </div>
                  <div className="p-1.5 bg-[#121922] border border-white/10 flex items-center gap-2 text-[10px]">
                    <div className="w-4 h-4 bg-slate-700 text-white font-bold flex items-center justify-center text-[9px] font-mono">3</div>
                    <span className="text-slate-300 truncate">Timed Mock Examination</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span>1-CLICK INJECTION</span>
                  <span className="text-[#d4af37]">READY</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-[var(--primary)] font-bold tracking-wider uppercase">
                  INTELLIGENCE
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                  AI Study Plan Generator
                </h3>
                <p className="text-xs font-light text-[var(--body)] leading-relaxed">
                  Deconstruct complex exam preps into phased daily study blocks with adaptive review schedules.
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-[var(--hairline)] mt-6">
              <button
                onClick={onOpenWalkthrough}
                className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
              >
                <span>LEARN ABOUT AI PLANS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CARD 4: Course Materials & Direct Uploads */}
          <div className="bmw-card flex flex-col justify-between group hover:border-[var(--primary)] transition-all">
            <div className="space-y-4">
              
              {/* Rich Visual Illustration 4: Course Directory & Video Launcher */}
              <div className="h-44 bg-[#090d12] border border-white/10 p-3.5 relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>COURSE HUB</span>
                  </div>
                  <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LIVE MEET
                  </span>
                </div>

                <div className="space-y-1.5 py-1">
                  {/* Meeting Launcher Card */}
                  <div className="p-2 bg-[#121922] border border-[var(--primary)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-[var(--primary)] text-white flex items-center justify-center">
                        <Video className="w-3 h-3" />
                      </div>
                      <span className="text-[10px] font-bold text-white">Algorithms Lecture</span>
                    </div>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold">JOIN</span>
                  </div>

                  {/* Folder Items */}
                  <div className="flex gap-1.5">
                    <div className="flex-1 p-1.5 bg-[#090d12] border border-white/10 flex items-center gap-1 text-[9px] text-slate-300">
                      <FileText className="w-3 h-3 text-[var(--primary)]" />
                      <span className="truncate">Lecture Slides</span>
                    </div>
                    <div className="flex-1 p-1.5 bg-[#090d12] border border-white/10 flex items-center gap-1 text-[9px] text-slate-300">
                      <FileText className="w-3 h-3 text-[#d4af37]" />
                      <span className="truncate">Lab Manual</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span>ZERO-TRUST ISOLATION</span>
                  <span className="text-emerald-400">100% PRIVATE</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono text-[var(--primary)] font-bold tracking-wider uppercase">
                  COURSE REPOSITORY
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                  Course Hub & Meeting Launcher
                </h3>
                <p className="text-xs font-light text-[var(--body)] leading-relaxed">
                  Store lecture slides and lab notes with a 1-click meeting launcher for Google Meet, Zoom, and Teams.
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-[var(--hairline)] mt-6">
              <button
                onClick={onOpenWalkthrough}
                className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-1 hover:gap-2 transition-all cursor-pointer"
              >
                <span>DISCOVER COURSE FOLDERS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
