"use client";

import React from "react";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-[var(--surface-soft)] text-[var(--body)] py-16 border-t border-[var(--hairline)]">
      <div className="max-w-[1536px] mx-auto px-6 lg:px-12">
        
        {/* 4 Column Directory */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo size={32} variant="blue" />
              <div className="flex flex-col">
                <span className="font-bold text-base text-[var(--ink)] tracking-wider">
                  STUDENT PORTAL
                </span>
                <span className="text-[9px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
                  PRO ACADEMIC SUITE
                </span>
              </div>
            </div>
            <p className="text-xs font-light text-[var(--muted)] leading-relaxed">
              Workspace for managing your coursework and schedule.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--ink)]">
              MODULES
            </div>
            <ul className="space-y-2 font-light">
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Task Prioritization (Ctrl+K)</a></li>
              <li><a href="#exams" className="hover:text-[var(--primary)] transition-colors">Exams & Revision Timeline</a></li>
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">AI Study Planner</a></li>
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Course Materials Repository</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--ink)]">
              INTEGRATIONS
            </div>
            <ul className="space-y-2 font-light">
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Google Classroom Integration</a></li>
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Google Calendar 2-Way Sync</a></li>
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Direct Google Meet / Zoom Launcher</a></li>
              <li><a href="#features" className="hover:text-[var(--primary)] transition-colors">Supabase PostgreSQL RLS</a></li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--ink)]">
              SECURITY & PRIVACY
            </div>
            <ul className="space-y-2 font-light">
              <li><a href="#security" className="hover:text-[var(--primary)] transition-colors">Private Account Data</a></li>
              <li><a href="#security" className="hover:text-[var(--primary)] transition-colors">Secure Session Management</a></li>
              <li><a href="#security" className="hover:text-[var(--primary)] transition-colors">Real-time Cloud Sync</a></li>
              <li><a href="#security" className="hover:text-[var(--primary)] transition-colors">Free for Students</a></li>
            </ul>
          </div>

        </div>

        {/* Sub-Footer */}
        <div className="mt-14 pt-6 border-t border-[var(--hairline)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-light text-[var(--muted)]">
          <p>© 2026 Student Portal Pro. All rights reserved.</p>
          <p className="font-mono text-[11px]">Built for student productivity.</p>
        </div>

      </div>
    </footer>
  );
}
