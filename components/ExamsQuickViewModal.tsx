"use client";

import React, { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import { 
  X, 
  ArrowRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  BookOpen, 
  ChevronRight,
  Flame,
  Check
} from "lucide-react";

interface ExamsQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (tab?: "signin" | "signup") => void;
}

export default function ExamsQuickViewModal({ 
  isOpen, 
  onClose, 
  onOpenAuth 
}: ExamsQuickViewModalProps) {
  // Live countdown clock state
  const [secondsRemaining, setSecondsRemaining] = useState(3 * 86400 + 14 * 3600 + 22 * 60 + 45);

  // Interactive syllabus checklist state
  const [masteredTopics, setMasteredTopics] = useState<Record<string, boolean>>({
    topic1: true,
    topic2: true,
    topic3: false,
    topic4: false,
  });

  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generatedMilestones, setGeneratedMilestones] = useState<string[] | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatCountdown = (totalSec: number) => {
    const d = Math.floor(totalSec / 86400);
    const h = Math.floor((totalSec % 86400) / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return { d, h, m, s };
  };

  const time = formatCountdown(secondsRemaining);

  const toggleTopic = (id: string) => {
    setMasteredTopics(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const masteredCount = Object.values(masteredTopics).filter(Boolean).length;
  const totalTopics = Object.keys(masteredTopics).length;
  const readinessPercent = Math.round((masteredCount / totalTopics) * 100);

  const handleGenerateAI = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setGeneratedMilestones([
        "Phase 1 (Today): Review Laplace Transforms & Impedance Models (2.5 hrs)",
        "Phase 2 (Tomorrow): Complete 15 SPICE Circuit Problem Sets (3 hrs)",
        "Phase 3 (Day 3): Timed Practice Midterm & Error Diagnosis (2 hrs)",
        "Phase 4 (Exam Day): High-Yield Formula Flashcards & Summary Review (45 mins)"
      ]);
      setIsAiGenerating(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      <div 
        className="bg-[#0e141c] border border-white/15 text-white w-full max-w-4xl p-6 sm:p-10 relative max-h-[92vh] overflow-y-auto shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 mb-8 pr-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#16202c] border border-[#d4af37]/40 text-[11px] font-mono tracking-[2px] uppercase text-[#d4af37]">
            <Logo size={16} variant="gold" />
            <span>EXAMS HORIZON & REVISION SUITE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif tracking-tight text-white">
            Chronological Exam Timelines & AI Milestones
          </h2>
          <p className="text-xs sm:text-sm font-light text-slate-300">
            Intelligent categorization into Urgent (&lt;7 Days) and Upcoming (&lt;30 Days) with automated syllabus breakdown.
          </p>
        </div>

        {/* 1. Live Countdown Card for Most Urgent Exam */}
        <div className="p-6 bg-[#131b26] border border-red-500/40 relative overflow-hidden mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  URGENT (&lt; 7 DAYS)
                </span>
                <span className="text-xs font-mono text-slate-400">EE 201 • WEIGHT 30%</span>
              </div>
              <h3 className="text-xl font-bold text-white">Circuit Theory Midterm Examination</h3>
            </div>

            {/* Live Ticking Countdown Badges */}
            <div className="flex items-center gap-2 font-mono text-center">
              <div className="bg-[#0b0f14] border border-white/10 px-2.5 py-1.5 min-w-[52px]">
                <div className="text-lg font-bold text-[#d4af37] leading-none">{time.d}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 uppercase">DAYS</div>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-[#0b0f14] border border-white/10 px-2.5 py-1.5 min-w-[52px]">
                <div className="text-lg font-bold text-white leading-none">{String(time.h).padStart(2, "0")}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 uppercase">HRS</div>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-[#0b0f14] border border-white/10 px-2.5 py-1.5 min-w-[52px]">
                <div className="text-lg font-bold text-white leading-none">{String(time.m).padStart(2, "0")}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 uppercase">MIN</div>
              </div>
              <span className="text-slate-600 font-bold">:</span>
              <div className="bg-[#0b0f14] border border-white/10 px-2.5 py-1.5 min-w-[52px]">
                <div className="text-lg font-bold text-red-400 leading-none">{String(time.s).padStart(2, "0")}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 uppercase">SEC</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div>📍 Location: <span className="text-white font-medium">Main Engineering Hall 2A</span></div>
            <div>📅 Date: <span className="text-white font-medium">Monday, 10:00 AM</span></div>
          </div>
        </div>

        {/* 2. Two Columns: Interactive Syllabus Mastery + AI Milestone Generator */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Left: Interactive Syllabus Mastery Checklist */}
          <div className="p-6 bg-[#131b26] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono tracking-[1.5px] uppercase text-[#d4af37] font-bold">
                SYLLABUS MASTERY
              </span>
              <span className="text-xs font-mono font-bold text-white">
                {readinessPercent}% READY
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-[#0b0f14] overflow-hidden border border-white/10">
              <div 
                className="h-full bg-gradient-to-r from-[#1c69d4] to-[#d4af37] transition-all duration-300"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div 
                onClick={() => toggleTopic("topic1")}
                className="flex items-center gap-3 p-2.5 bg-[#0b0f14] border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded-none border flex items-center justify-center ${masteredTopics.topic1 ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                  {masteredTopics.topic1 && <Check className="w-3 h-3" />}
                </div>
                <span className={masteredTopics.topic1 ? "line-through text-slate-400" : "text-white"}>
                  Chapter 1: AC Steady State & Phasors
                </span>
              </div>

              <div 
                onClick={() => toggleTopic("topic2")}
                className="flex items-center gap-3 p-2.5 bg-[#0b0f14] border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded-none border flex items-center justify-center ${masteredTopics.topic2 ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                  {masteredTopics.topic2 && <Check className="w-3 h-3" />}
                </div>
                <span className={masteredTopics.topic2 ? "line-through text-slate-400" : "text-white"}>
                  Chapter 2: RLC Frequency Resonance
                </span>
              </div>

              <div 
                onClick={() => toggleTopic("topic3")}
                className="flex items-center gap-3 p-2.5 bg-[#0b0f14] border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded-none border flex items-center justify-center ${masteredTopics.topic3 ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                  {masteredTopics.topic3 && <Check className="w-3 h-3" />}
                </div>
                <span className={masteredTopics.topic3 ? "line-through text-slate-400" : "text-white"}>
                  Chapter 3: Laplace Transform Circuit Analysis
                </span>
              </div>

              <div 
                onClick={() => toggleTopic("topic4")}
                className="flex items-center gap-3 p-2.5 bg-[#0b0f14] border border-white/5 hover:border-white/20 cursor-pointer transition-colors"
              >
                <div className={`w-4 h-4 rounded-none border flex items-center justify-center ${masteredTopics.topic4 ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                  {masteredTopics.topic4 && <Check className="w-3 h-3" />}
                </div>
                <span className={masteredTopics.topic4 ? "line-through text-slate-400" : "text-white"}>
                  Chapter 4: Two-Port Networks & Transfer Functions
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-light pt-1">
              Click chapters above to update your readiness score in real time.
            </p>
          </div>

          {/* Right: AI Milestone Generator Simulator */}
          <div className="p-6 bg-[#131b26] border border-white/10 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span className="text-[11px] font-mono tracking-[1.5px] uppercase text-[#d4af37] font-bold">
                  AI STUDY MILESTONES
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Automated 4-Phase Revision Breakdown
              </h4>
              <p className="text-xs text-slate-300 font-light leading-relaxed">
                Deconstruct this exam into phased daily study blocks with adaptive review schedules.
              </p>

              {generatedMilestones ? (
                <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                  {generatedMilestones.map((m, idx) => (
                    <div key={idx} className="p-2.5 bg-[#0b0f14] border border-[#d4af37]/30 text-xs text-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] flex-shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-[#0b0f14] border border-dashed border-white/15 text-center text-xs text-slate-400 space-y-2 my-2">
                  <Flame className="w-5 h-5 text-[#d4af37] mx-auto" />
                  <div>Generate an optimal study trajectory calibrated to the 3-day countdown.</div>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateAI}
              disabled={isAiGenerating}
              className="w-full py-3 bg-[#1a2533] hover:bg-[#202e40] border border-white/15 hover:border-[#d4af37] text-white text-xs font-bold uppercase tracking-[1px] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{isAiGenerating ? "CALCULATING STUDY PATH..." : generatedMilestones ? "RE-GENERATE STUDY MILESTONES" : "GENERATE AI STUDY MILESTONES"}</span>
            </button>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-white/15 text-white hover:bg-white/5 text-xs font-bold uppercase tracking-[1px] cursor-pointer w-full sm:w-auto"
          >
            CLOSE
          </button>

          <button
            onClick={() => {
              onClose();
              if (onOpenAuth) onOpenAuth("signin");
            }}
            className="px-8 py-3 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1.5px] cursor-pointer w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <span>SIGN IN TO SYNC EXAM CALENDAR</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

      </div>
    </div>
  );
}
