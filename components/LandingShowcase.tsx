"use client";

import React from "react";
import Logo from "@/components/Logo";
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  Flame, 
  GraduationCap,
  Quote
} from "lucide-react";

interface LandingShowcaseProps {
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

export default function LandingShowcase({ onOpenAuth }: LandingShowcaseProps) {
  const valueItems = [
    {
      metric: "2-CLICK",
      label: "RAPID TASK CAPTURE",
      desc: "Instant priority tagging with zero friction."
    },
    {
      metric: "100%",
      label: "GOOGLE 2-WAY SYNC",
      desc: "Live synchronization with Google Classroom & Calendar."
    },
    {
      metric: "AI-POWERED",
      label: "STUDY PLAN ENGINE",
      desc: "Structural milestone breakdown for assignments & exams."
    },
    {
      metric: "ZERO-TRUST",
      label: "DATA ISOLATION",
      desc: "Strict multi-tenant cryptographic partition per student."
    }
  ];

  const testimonials = [
    {
      quote: "The live exam countdown and AI milestones completely eliminated my exam week panic. I always know exactly what chapters to cover today.",
      author: "Alex Rivera",
      role: "Software Engineering • University of Waterloo",
      rating: "5.0 / 5.0"
    },
    {
      quote: "Having my Google Meet classes, lab manuals, and assignments together in a clean dark workspace saves me at least 45 minutes every day.",
      author: "Priya Sharma",
      role: "Computer Science • IIT Delhi",
      rating: "5.0 / 5.0"
    },
    {
      quote: "The 14-day study streak and GPA target calculator give me that extra motivation to stay ahead of my problem sets.",
      author: "Marcus Chen",
      role: "Electrical Engineering • Stanford",
      rating: "5.0 / 5.0"
    }
  ];

  return (
    <>
      {/* 1. Value Metric Ribbon */}
      <section className="bg-[var(--surface-soft)] py-12 border-b border-[var(--hairline)]">
        <div className="max-w-[1536px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueItems.map((item, idx) => (
              <div 
                key={idx}
                className="space-y-1.5 border-l-2 border-[var(--primary)] pl-5"
              >
                <div className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
                  {item.metric}
                </div>
                <div className="text-[11px] font-mono font-bold tracking-[1.5px] uppercase text-[var(--muted)]">
                  {item.label}
                </div>
                <div className="text-xs text-[var(--body)] font-light leading-relaxed">
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Security & Zero-Trust Privacy Guarantee */}
      <section id="security" className="bg-[var(--canvas)] py-20 border-b border-[var(--hairline)]">
        <div className="max-w-[1536px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold rounded">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DATA INTEGRITY MANDATE</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
                Strict Multi-Tenant Isolation & Privacy.
              </h2>

              <p className="text-sm font-light text-[var(--body)] leading-relaxed">
                Your coursework, study habits, and notes belong solely to you. Student Portal Pro enforces cryptographic client partitioning, zero-trust account boundaries, and complete session purge on sign out.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs text-[var(--ink)] font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Isolated user storage keys (`user_userId_data`) prevent cross-account leakage</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--ink)] font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Instant 1-Click JSON export gives you 100% data ownership and portability</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--ink)] font-medium">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Zero third-party tracking, ad pixels, or behavioral marketing telemetry</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-8 bg-[var(--surface-card)] border border-[var(--hairline)] rounded shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[var(--primary)]" />
                    <span className="font-mono text-xs font-bold text-[var(--ink)]">CRYPTOGRAPHIC BOUNDARY</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-[9px] font-mono font-bold rounded">
                    ENFORCED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded">
                    <div className="text-[10px] text-[var(--muted)]">AUTH ENGINE</div>
                    <div className="font-bold text-[var(--ink)] mt-1">PBKDF2 & Google OAuth</div>
                  </div>
                  <div className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded">
                    <div className="text-[10px] text-[var(--muted)]">PERSISTENCE</div>
                    <div className="font-bold text-[var(--ink)] mt-1">Sandboxed Per-User</div>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--muted)] font-light leading-relaxed">
                  Signing out destroys all active in-memory tokens and secure cache handles immediately.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Student Community Stories */}
      <section className="bg-[var(--surface-soft)] py-20 border-b border-[var(--hairline)]">
        <div className="max-w-[1536px] mx-auto px-6 lg:px-12 space-y-12">
          
          <div className="max-w-2xl space-y-2">
            <div className="text-[11px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
              STUDENT TESTIMONIALS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
              Trusted by Top Scholars Worldwide.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <Quote className="w-5 h-5 text-[var(--primary)] opacity-60" />
                  <p className="text-xs sm:text-sm text-[var(--body)] font-light leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--hairline)] flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[var(--ink)]">{t.author}</div>
                    <div className="text-[10px] text-[var(--muted)] font-mono">{t.role}</div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#d4af37]">
                    ★ 5.0
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Final Call To Action */}
      <section className="bg-[var(--canvas)] py-20 lg:py-28 text-center border-b border-[var(--hairline)]">
        <div className="max-w-3xl mx-auto px-6 space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold rounded mx-auto">
            <Logo size={14} variant="gold" />
            <span>INSTANT ACADEMIC ELEVATION</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] leading-tight">
            Take command of your semester today.
          </h2>

          <p className="text-sm sm:text-base font-light text-[var(--muted)] leading-relaxed max-w-xl mx-auto">
            Free forever. No credit card required. Connect your classes and exams in under 20 seconds.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onOpenAuth("signup")}
              className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1.2px] transition-all cursor-pointer shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 rounded w-full sm:w-auto"
            >
              <span>GET STARTED FREE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
