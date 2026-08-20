"use client";

import React, { useState } from "react";
import Logo from "@/components/Logo";
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Layers, 
  FolderOpen, 
  Video, 
  BarChart3, 
  Clock, 
  ShieldCheck,
  Zap,
  Play
} from "lucide-react";

interface WalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: (tab?: "signin" | "signup") => void;
}

export default function WalkthroughModal({ 
  isOpen, 
  onClose, 
  onOpenAuth 
}: WalkthroughModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      step: "01",
      tag: "INSTANT DELIVERABLE CAPTURE",
      title: "2-Click Task Engine with Global Ctrl+K",
      subtitle: "Capture assignments, homework, and syllabus deadlines in under 3 seconds from anywhere in the platform.",
      icon: Layers,
      accentColor: "#1c69d4",
      highlightPill: "SPEED-OPTIMIZED",
      features: [
        "Global keyboard shortcut Ctrl+K opens rapid capture modal from any view",
        "Automated priority scoring: High, Medium, Low with urgency color-coding",
        "Two-way synchronization with Google Calendar and local persistence cache",
        "Zero-latency Web Audio confirmation chimes on deliverable completion"
      ],
      visualBadge: "TASK ENGINE",
      mockCard: {
        title: "CS 350 Operating Systems Virtual Memory Lab",
        badge: "HIGH PRIORITY",
        badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
        due: "Due Tomorrow at 11:59 PM",
        tag: "CS 350 • Project"
      }
    },
    {
      step: "02",
      tag: "TASK VISUALIZATION & WORKFLOW",
      title: "Kanban Board & Eisenhower Priority Matrix",
      subtitle: "Switch between visual Kanban stages, sortable tabular data, and 4-quadrant urgency matrices.",
      icon: Sparkles,
      accentColor: "#d4af37",
      highlightPill: "MULTI-VIEW WORKSPACE",
      features: [
        "Interactive 3-column Kanban workflow: TO DO, IN PROGRESS, and COMPLETED",
        "4-Quadrant Eisenhower Matrix: Urgent/Important prioritization",
        "Real-time search filtering across course codes and category tags",
        "1-Click semester backup export to JSON for full data portability"
      ],
      visualBadge: "KANBAN & MATRIX",
      mockCard: {
        title: "Organic Chemistry II Synthesis Problem Set",
        badge: "IN PROGRESS",
        badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        due: "Due in 3 days",
        tag: "CHM 220 • Assignment"
      }
    },
    {
      step: "03",
      tag: "LECTURES & MATERIALS REPOSITORY",
      title: "1-Click Direct Video Launcher & Course Hub",
      subtitle: "Launch live Google Meet, Zoom, and Teams lectures directly from your schedule alongside subject folders.",
      icon: Video,
      accentColor: "#3b82f6",
      highlightPill: "DIRECT LAUNCHER",
      features: [
        "1-Click meeting launch button opens Google Meet, Zoom, or Teams sessions instantly",
        "Subject-specific document directories for lecture slides, notes, and lab manuals",
        "Drag-and-drop file staging with external Google Drive resource linking",
        "Zero-trust multi-tenant isolation ensures course files remain 100% private"
      ],
      visualBadge: "CLASSROOMS HUB",
      mockCard: {
        title: "Algorithms & Complexity Live Lecture",
        badge: "JOIN CLASS",
        badgeColor: "bg-[var(--primary)] text-white",
        due: "Google Meet • Mon/Wed 10:30 AM",
        tag: "CS 341 • Prof. Vance"
      }
    },
    {
      step: "04",
      tag: "AI MILESTONE ENGINE",
      title: "AI Study Planner & Spaced Repetition",
      subtitle: "Deconstruct multi-week exam prep and term projects into manageable daily review phases.",
      icon: Calendar,
      accentColor: "#d4af37",
      highlightPill: "DUAL AI ENGINE",
      features: [
        "Dual AI Architecture: High-speed heuristic algorithm + Google Gemini API",
        "Generates phased 4-stage study timelines calibrated to your exam countdown",
        "1-Click 'Add Milestones to Tasks' injects daily checkpoints into your schedule",
        "Dynamic schedule rebalancing if deadlines shift or topics require extra review"
      ],
      visualBadge: "AI STUDY PLANNER",
      mockCard: {
        title: "Physics 202 Midterm Exam (Weight: 30%)",
        badge: "4 PHASES GENERATED",
        badgeColor: "bg-amber-500/20 text-[#d4af37] border-amber-500/30",
        due: "Exam in 6 Days • Hall 1350",
        tag: "AI Roadmap Ready"
      }
    },
    {
      step: "05",
      tag: "ANALYTICS & CONSISTENCY",
      title: "Progress Dashboard, Velocity & GPA Modeler",
      subtitle: "Track weekly study velocity, 14-day consistency streaks, and simulate course target grades.",
      icon: BarChart3,
      accentColor: "#10b981",
      highlightPill: "METRICS ENGINE",
      features: [
        "Daily deliverable completion index ring and active study streak tracker",
        "Weekly study velocity bar charts showing completed deliverables per course",
        "14-Day interactive consistency checkmark grid for study habits",
        "Interactive GPA Target Modeler to calculate minimum required exam scores"
      ],
      visualBadge: "ANALYTICS HUB",
      mockCard: {
        title: "Current Semester Completion Index",
        badge: "85.7% ON TRACK",
        badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        due: "14-Day Study Streak Active",
        tag: "6 of 7 Deliverables Complete"
      }
    }
  ];

  const current = slides[currentSlide];
  const IconComponent = current.icon;

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      
      <div 
        className="bg-[#0e141c] border border-white/15 text-white w-full max-w-5xl p-6 sm:p-10 relative max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Top Header & Close */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Logo size={28} variant="gold" />
            <div>
              <div className="text-[10px] font-mono tracking-[2px] uppercase text-[#d4af37] font-bold">
                VISUAL CAPABILITIES WALKTHROUGH
              </div>
              <div className="text-sm font-bold text-white">
                Student Portal Pro Platform Tour
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Step Counter */}
            <div className="font-mono text-xs text-slate-400">
              <span className="text-white font-bold">{current.step}</span> / 0{slides.length}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close Walkthrough"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Selector Mini-Ribbon */}
        <div className="grid grid-cols-5 gap-2 my-6">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`py-2 px-2 text-left border transition-all cursor-pointer ${
                currentSlide === idx
                  ? "bg-[#16202c] border-[#d4af37] text-white"
                  : "bg-[#0b0f14] border-white/5 text-slate-500 hover:border-white/20 hover:text-slate-300"
              }`}
            >
              <div className="text-[9px] font-mono font-bold leading-none">{s.step}</div>
              <div className="text-[10px] font-semibold truncate mt-1 hidden sm:block">
                {s.visualBadge}
              </div>
            </button>
          ))}
        </div>

        {/* Active Visual Carousel Slide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-2 items-center">
          
          {/* Left Column: Descriptive Specification */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#16202c] border border-white/10 text-[10px] font-mono tracking-[1.5px] uppercase text-[#d4af37]">
              <span>{current.tag}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-serif tracking-tight text-white leading-tight">
              {current.title}
            </h2>

            <p className="text-xs sm:text-sm font-light text-slate-300 leading-relaxed">
              {current.subtitle}
            </p>

            {/* Feature Checklist */}
            <div className="space-y-2.5 pt-2">
              {current.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: High-Fidelity Visual Card Showcase */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="p-6 bg-[#131b26] border border-white/15 space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                <div className="flex items-center gap-2 font-mono text-[#d4af37] text-[11px] font-bold">
                  <IconComponent className="w-4 h-4" />
                  <span>{current.visualBadge}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0b0f14] border border-white/10 text-slate-400">
                  LIVE INTERFACE
                </span>
              </div>

              {/* Mock UI Component Card */}
              <div className="p-4 bg-[#0b0f14] border border-white/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono text-slate-400">{current.mockCard.tag}</span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border ${current.mockCard.badgeColor}`}>
                    {current.mockCard.badge}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {current.mockCard.title}
                </div>
                <div className="text-[11px] text-slate-400 font-light flex items-center gap-1.5 pt-1">
                  <Clock className="w-3 h-3 text-[#d4af37]" />
                  <span>{current.mockCard.due}</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>STATUS: CERTIFIED</span>
                <span className="text-[#d4af37] font-bold">STUDENT PORTAL PRO</span>
              </div>
            </div>
          </div>

        </div>

        {/* Carousel Navigation Controls & Bottom Action */}
        <div className="pt-8 mt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Previous / Next Arrow Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={prevSlide}
              className="p-3 bg-[#131b26] hover:bg-[#1a2533] border border-white/15 text-white text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">PREVIOUS</span>
            </button>

            <button
              onClick={nextSlide}
              className="p-3 bg-[#131b26] hover:bg-[#1a2533] border border-white/15 text-white text-xs font-bold uppercase transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">NEXT CAPABILITY</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Launch CTA */}
          <button
            onClick={() => {
              onClose();
              if (onOpenAuth) onOpenAuth("signup");
            }}
            className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1.5px] transition-all cursor-pointer shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <span>GET STARTED FREE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
