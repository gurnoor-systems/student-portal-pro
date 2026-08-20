"use client";

import React, { useState } from "react";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/Logo";
import { 
  Sun, 
  Moon, 
  Menu, 
  X,
  ChevronRight,
  User, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  Bell, 
  Search, 
  Calendar,
  GraduationCap,
  Timer
} from "lucide-react";

interface NavbarProps {
  onOpenWalkthrough: () => void;
  onOpenExams: () => void;
  onOpenAuth: (tab?: "signin" | "signup") => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount?: number;
}

export default function Navbar({ 
  onOpenWalkthrough, 
  onOpenExams, 
  onOpenAuth, 
  onOpenNotifications,
  unreadNotificationsCount = 2 
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[var(--nav-bg)] border-b border-[var(--hairline)] text-[var(--nav-ink)] transition-colors h-16">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-10 h-full flex items-center justify-between gap-4">
          
          {/* =========================================================
              AUTHENTICATED WORKSPACE NAVBAR (WHEN SIGNED IN)
             ========================================================= */}
          {user ? (
            <div className="flex items-center justify-between w-full">
              
              {/* Left: Brand Emblem + Live Workspace Search Bar */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <Logo size={28} variant="gold" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-xs sm:text-sm tracking-widest uppercase text-[var(--nav-ink)] font-display">
                      STUDENT PORTAL
                    </span>
                    <span className="text-[8px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
                      PRO WORKSPACE
                    </span>
                  </div>
                </div>

                {/* Spotlight Search & Command Bar */}
                <button
                  onClick={onOpenWalkthrough}
                  className="hidden md:flex items-center gap-2.5 px-3 py-1.5 bg-[var(--surface-soft)] border border-[var(--hairline)] hover:border-[var(--primary)] text-xs text-[var(--nav-ink-soft)] hover:text-[var(--nav-ink)] transition-all cursor-pointer rounded-lg w-64 lg:w-80 justify-between group"
                  title="Universal Spotlight Search (Ctrl+K)"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[var(--primary)] group-hover:scale-110 transition-transform" />
                    <span className="truncate">Search tasks, courses, notes...</span>
                  </div>
                  <span className="font-mono text-[10px] bg-[var(--surface-card)] border border-[var(--hairline)] px-1.5 py-0.5 rounded text-[var(--muted)]">
                    Ctrl+K
                  </span>
                </button>
              </div>

              {/* Center/Right: University Chip + Notifications + Theme + Profile Menu */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                
                {/* Active Campus / Term Tag */}
                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-lg text-xs font-mono">
                  <GraduationCap className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span className="text-[var(--ink)] font-semibold truncate max-w-[180px]">{user.university}</span>
                  <span className="text-[var(--muted)]">•</span>
                  <span className="text-[var(--primary)] font-bold">{user.semester}</span>
                </div>

                {/* Notification Bell */}
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 text-[var(--nav-ink-soft)] hover:text-[var(--nav-ink)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer rounded-lg"
                  aria-label="View Notifications"
                  title="Notifications & Academic Reminders"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--primary)] rounded-full ring-2 ring-[var(--nav-bg)] animate-pulse" />
                  )}
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-[var(--nav-ink-soft)] hover:text-[var(--nav-ink)] hover:bg-[var(--surface-soft)] transition-colors cursor-pointer rounded-lg"
                  aria-label="Toggle Theme"
                  title="Toggle Dark/Light Mode"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-[var(--nav-ink)]" />
                  )}
                </button>

                {/* User Profile Avatar Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="h-9 px-2.5 border border-[var(--hairline)] bg-[var(--surface-soft)] hover:border-[var(--primary)] flex items-center gap-2 transition-all cursor-pointer text-[var(--nav-ink)] rounded-lg"
                  >
                    <div className="w-6 h-6 bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                      {user.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold leading-none truncate max-w-[120px]">
                        {user.fullName}
                      </div>
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[var(--surface-card)] border border-[var(--hairline)] shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-[var(--ink)] rounded-xl">
                      <div className="pb-3 border-b border-[var(--hairline)] space-y-1">
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <span>{user.fullName}</span>
                          <span className="px-1.5 py-0.2 bg-emerald-500/15 text-emerald-500 text-[9px] font-mono font-bold rounded">VERIFIED</span>
                        </div>
                        <div className="text-[11px] text-[var(--muted)] truncate font-mono">{user.email}</div>
                        <div className="text-[10px] font-semibold text-[var(--primary)] mt-1">{user.university} ({user.semester})</div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <button
                          onClick={() => { setIsUserMenuOpen(false); signOut(); }}
                          className="w-full p-2 text-left hover:bg-red-500/10 text-red-500 font-bold flex items-center gap-2 cursor-pointer rounded-lg transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out of Portal</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Hamburger (when signed in) */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-2 text-[var(--nav-ink)] lg:hidden cursor-pointer rounded-lg hover:bg-[var(--surface-soft)]"
                  aria-label="Open Workspace Navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>

              </div>

            </div>
          ) : (
            /* =========================================================
                PUBLIC LANDING PAGE NAVBAR (WHEN SIGNED OUT)
               ========================================================= */
            <>
              {/* Left: Public Marketing Links */}
              <nav className="hidden lg:flex items-center gap-8 text-[12px] font-semibold tracking-[0.8px] uppercase text-[var(--nav-ink-soft)]">
                <a 
                  href="#overview" 
                  className="hover:text-[var(--nav-ink)] transition-colors"
                >
                  Overview
                </a>
                <button 
                  onClick={onOpenWalkthrough}
                  className="hover:text-[var(--nav-ink)] transition-colors uppercase tracking-[0.8px] cursor-pointer text-[12px]"
                >
                  Capabilities
                </button>
                <button 
                  onClick={onOpenExams}
                  className="hover:text-[var(--nav-ink)] transition-colors uppercase tracking-[0.8px] cursor-pointer text-[12px] flex items-center gap-1.5"
                >
                  <span>Exams & Milestones</span>
                </button>
                <button 
                  onClick={onOpenWalkthrough}
                  className="hover:text-[var(--nav-ink)] transition-colors uppercase tracking-[0.8px] cursor-pointer text-[12px]"
                >
                  Platform Tour
                </button>
                <a 
                  href="#security" 
                  className="hover:text-[var(--nav-ink)] transition-colors"
                >
                  Privacy
                </a>
              </nav>

              {/* Center Brand Emblem Logo */}
              <a 
                href="#" 
                className="flex items-center justify-center group flex-shrink-0 lg:absolute lg:left-1/2 lg:-translate-x-1/2"
                aria-label="Student Portal Pro Home"
              >
                <div className="flex items-center gap-2.5">
                  <Logo size={32} variant="gold" />
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-sm tracking-widest uppercase text-[var(--nav-ink)] font-display">
                      STUDENT PORTAL
                    </span>
                    <span className="text-[8.5px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
                      PRO ACADEMIC
                    </span>
                  </div>
                </div>
              </a>

              {/* Right Public Action Group */}
              <div className="flex items-center gap-3 text-[var(--nav-ink-soft)]">
                
                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-[var(--nav-ink-soft)] hover:text-[var(--nav-ink)] transition-colors cursor-pointer"
                  aria-label="Toggle Theme"
                  title="Toggle Dark/Light Mode"
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-[var(--nav-ink)]" />
                  )}
                </button>

                <button
                  onClick={() => onOpenAuth("signin")}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-[var(--surface-soft)] hover:bg-[var(--primary)] hover:text-white border border-[var(--hairline)] hover:border-[var(--primary)] text-[var(--nav-ink)] text-xs font-bold uppercase tracking-[0.8px] transition-all cursor-pointer rounded group"
                >
                  <User className="w-3.5 h-3.5 text-[var(--primary)] group-hover:text-white transition-colors" />
                  <span className="hidden sm:inline">STUDENT LOGIN</span>
                  <span className="sm:hidden">LOGIN</span>
                </button>

                {/* Mobile Menu Trigger */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-2 text-[var(--nav-ink)] lg:hidden cursor-pointer"
                  aria-label="Open Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>
            </>
          )}

        </div>
      </header>

      {/* Right Slide-Over Panel for Mobile */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[var(--surface-card)] border-l border-[var(--hairline)] p-8 flex flex-col justify-between shadow-2xl text-[var(--ink)]">
              
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[var(--hairline)]">
                  <div className="flex items-center gap-3">
                    <Logo size={28} variant="gold" />
                    <span className="font-bold text-base uppercase tracking-wider text-[var(--ink)]">
                      Student Portal Pro
                    </span>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {user && (
                  <div className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl space-y-1">
                    <div className="text-xs font-bold text-[var(--ink)]">{user.fullName}</div>
                    <div className="text-[11px] text-[var(--primary)] font-mono">{user.university} ({user.semester})</div>
                  </div>
                )}

                <div className="space-y-2 text-xs uppercase tracking-wider font-semibold">
                  {!user ? (
                    <>
                      <a
                        href="#overview"
                        onClick={() => setIsDrawerOpen(false)}
                        className="flex items-center justify-between p-3.5 border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--primary)] transition-colors rounded-xl"
                      >
                        <span>System Overview</span>
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      </a>

                      <button
                        onClick={() => { setIsDrawerOpen(false); onOpenWalkthrough(); }}
                        className="w-full flex items-center justify-between p-3.5 border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--primary)] transition-colors text-left cursor-pointer rounded-xl"
                      >
                        <span>Academic Capabilities</span>
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      </button>

                      <button
                        onClick={() => { setIsDrawerOpen(false); onOpenExams(); }}
                        className="w-full flex items-center justify-between p-3.5 border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--primary)] transition-colors text-left cursor-pointer rounded-xl"
                      >
                        <span>Exams & Milestones</span>
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setIsDrawerOpen(false); onOpenWalkthrough(); }}
                        className="w-full flex items-center justify-between p-3.5 border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--primary)] transition-colors text-left cursor-pointer rounded-xl"
                      >
                        <span>Universal Search (Ctrl+K)</span>
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      </button>

                      <button
                        onClick={() => { setIsDrawerOpen(false); onOpenNotifications(); }}
                        className="w-full flex items-center justify-between p-3.5 border border-[var(--hairline)] text-[var(--ink)] hover:border-[var(--primary)] transition-colors text-left cursor-pointer rounded-xl"
                      >
                        <span>Notification Center</span>
                        <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-[var(--hairline)]">
                {user ? (
                  <button
                    onClick={() => { setIsDrawerOpen(false); signOut(); }}
                    className="bmw-btn-secondary w-full"
                  >
                    SIGN OUT
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsDrawerOpen(false); onOpenAuth("signin"); }}
                    className="bmw-btn-primary w-full"
                  >
                    STUDENT SIGN IN
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
