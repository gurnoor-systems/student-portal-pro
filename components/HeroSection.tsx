"use client";

import React, { useState } from "react";
import Logo from "@/components/Logo";
import { 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Video, 
  ShieldCheck,
  Zap,
  Layers,
  X,
  Clock,
  ArrowUpRight
} from "lucide-react";

interface HeroSectionProps {
  onOpenWalkthrough: () => void;
  onOpenAuth?: (tab?: "signin" | "signup") => void;
}

export default function HeroSection({ onOpenWalkthrough, onOpenAuth }: HeroSectionProps) {
  const [isHelpBadgeVisible, setIsHelpBadgeVisible] = useState(true);

  return (
    <section id="overview" className="relative bg-[var(--hero-bg)] text-[var(--hero-ink)] min-h-[80vh] flex items-center border-b border-[var(--hairline)] overflow-hidden transition-colors">
      
      {/* Subtle Studio Vignette & Geometric Grid (Adapts to Dark / Light) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_35%,rgba(62,106,225,0.08)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.04)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-[1536px] mx-auto px-6 lg:px-12 py-18 lg:py-24 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Minimalist & Punchy Headline */}
        <div className="lg:col-span-7 space-y-6 z-10">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold rounded">
            <Logo size={13} variant="gold" />
            <span>PRECISION ACADEMIC SYSTEM</span>
          </div>

          {/* Punchy Minimalist Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--hero-ink)] leading-[1.05]">
            Your study space. <br />
            <span className="text-[var(--muted)] font-normal">Fast. Organized. Simple.</span>
          </h1>

          <p className="text-sm sm:text-base font-light text-[var(--body)] max-w-lg leading-relaxed">
            All your coursework, exam countdowns, and class links in one unified command center. Zero distractions.
          </p>

          {/* Action CTAs (Tesla Blue + Clean Secondary Button) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              onClick={() => onOpenAuth ? onOpenAuth("signup") : null}
              className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1.2px] transition-all cursor-pointer shadow-lg shadow-blue-500/15 flex items-center justify-center gap-2 rounded"
            >
              <span>GET STARTED FREE</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenWalkthrough}
              className="px-7 py-3.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] hover:border-[var(--hero-ink)] text-[var(--hero-ink)] text-xs font-bold uppercase tracking-[1.2px] transition-all cursor-pointer flex items-center justify-center gap-2 rounded"
            >
              <span>SEE HOW IT WORKS</span>
              <Play className="w-3 h-3 fill-current" />
            </button>
          </div>

          {/* Clean Proof Badges */}
          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-[var(--muted)] font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Private & isolated data</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>100% Free access</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--primary)]" />
              <span>Instant Ctrl+K capture</span>
            </div>
          </div>

        </div>

        {/* Right Column: Sleek Floating Preview Card */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          
          <div className="w-full max-w-md bg-[var(--hero-card-bg)] border border-[var(--hero-card-border)] p-6 sm:p-7 shadow-2xl space-y-5 relative rounded">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3.5">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--hero-ink)]">
                <Logo size={18} variant="gold" />
                <span className="font-bold">STUDENT PORTAL PRO</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[var(--primary)] font-bold rounded">
                LIVE SYSTEM
              </span>
            </div>

            {/* Quick Live Preview Cards */}
            <div className="space-y-2.5">
              <div className="p-3 bg-[var(--hero-card-inner)] border border-[var(--hairline)] flex items-center justify-between rounded">
                <div>
                  <div className="text-xs font-bold text-[var(--hero-ink)]">Algorithms & Complexity Lab</div>
                  <div className="text-[10px] text-[var(--muted)] font-mono mt-0.5">Due Tomorrow • High Priority</div>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-red-500/15 text-red-600 border border-red-500/25 rounded">
                  URGENT
                </span>
              </div>

              <div className="p-3 bg-[var(--hero-card-inner)] border border-[var(--primary)]/30 flex items-center justify-between rounded">
                <div>
                  <div className="text-xs font-bold text-[var(--hero-ink)]">Circuit Theory Midterm Exam</div>
                  <div className="text-[10px] text-[var(--primary)] font-mono mt-0.5 font-bold">Countdown: 3 Days Remaining</div>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-blue-500/15 text-[var(--primary)] border border-blue-500/25 rounded">
                  EXAM
                </span>
              </div>

              <div className="p-3 bg-[var(--hero-card-inner)] border border-[var(--hairline)] flex items-center justify-between rounded">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 bg-[var(--primary)] text-white flex items-center justify-center text-[10px] rounded">
                    <Video className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--hero-ink)]">Operating Systems Lecture</div>
                    <div className="text-[10px] text-[var(--muted)] font-mono">Google Meet • 10:30 AM</div>
                  </div>
                </div>
                <button 
                  onClick={() => onOpenAuth ? onOpenAuth("signin") : null}
                  className="text-[10px] font-bold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  JOIN
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--hairline)] flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
              <span>ACTIVE SEMESTER</span>
              <span className="text-[var(--primary)] font-bold">100% ORGANIZED</span>
            </div>
          </div>

        </div>

      </div>

      {/* Floating Bottom-Right Support & Tour Badge */}
      {isHelpBadgeVisible && (
        <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-[var(--surface-card)] text-[var(--ink)] px-4 py-2.5 shadow-2xl border border-[var(--hairline)] rounded">
            
            <button
              onClick={() => setIsHelpBadgeVisible(false)}
              className="text-[var(--muted)] hover:text-[var(--ink)] p-1 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <div 
              onClick={onOpenWalkthrough}
              className="cursor-pointer text-left pr-2"
            >
              <div className="text-xs font-bold text-[var(--ink)] leading-tight">
                Platform Tour
              </div>
              <div className="text-[10px] text-[var(--muted)] font-medium">
                Click to inspect live tools
              </div>
            </div>

            <div 
              onClick={onOpenWalkthrough}
              className="w-7 h-7 rounded bg-[var(--surface-soft)] border border-[var(--hairline)] flex items-center justify-center text-[var(--ink)] flex-shrink-0 cursor-pointer hover:bg-[var(--primary)] hover:text-white transition-colors"
            >
              <Logo size={16} variant="gold" />
            </div>

          </div>
        </div>
      )}

    </section>
  );
}
