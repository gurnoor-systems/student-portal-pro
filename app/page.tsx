"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import LandingShowcase from "@/components/LandingShowcase";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import InteractiveDemoPlayer from "@/components/InteractiveDemoPlayer";
import ExamsQuickViewModal from "@/components/ExamsQuickViewModal";
import AuthModal from "@/components/AuthModal";
import DashboardView from "@/components/DashboardView";
import QuickAddTaskModal from "@/components/QuickAddTaskModal";
import NotificationCenter from "@/components/NotificationCenter";
import { useAuth } from "@/lib/auth-context";
import { Plus } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  
  // Distinct Modal States
  const [isDemoPlayerOpen, setIsDemoPlayerOpen] = useState(false);
  const [isExamsModalOpen, setIsExamsModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [authModalState, setAuthModalState] = useState<{ isOpen: boolean; tab: "signin" | "signup" }>({
    isOpen: false,
    tab: "signin"
  });

  // Global keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsQuickAddOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenAuth = (tab: "signin" | "signup" = "signin") => {
    setAuthModalState({ isOpen: true, tab });
  };

  return (
    <main className="min-h-screen flex flex-col relative z-0 bg-[var(--canvas)] text-[var(--ink)]">
      {/* 1. Header Navigation Bar */}
      <Navbar 
        onOpenWalkthrough={() => setIsDemoPlayerOpen(true)}
        onOpenExams={() => setIsExamsModalOpen(true)}
        onOpenAuth={handleOpenAuth}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      {/* Main View Display: Direct Workspace Focus when signed in */}
      {user ? (
        <DashboardView 
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenWalkthrough={() => setIsDemoPlayerOpen(true)}
        />
      ) : (
        /* Public Hero & Showcase Landing View */
        <>
          <HeroSection 
            onOpenWalkthrough={() => setIsDemoPlayerOpen(true)} 
            onOpenAuth={handleOpenAuth}
          />
          <FeaturesSection onOpenWalkthrough={() => setIsDemoPlayerOpen(true)} />
          <LandingShowcase onOpenAuth={handleOpenAuth} />
          <FAQSection />
          <Footer />
        </>
      )}

      {/* Floating Action Button for 2-Click Task Capture (only if not in dashboard) */}
      {!user && (
        <button
          onClick={() => handleOpenAuth("signin")}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[var(--primary)] text-white flex items-center justify-center shadow-2xl hover:bg-[var(--primary-active)] transition-all cursor-pointer z-40 rounded-full"
          aria-label="Quick Add Task (Ctrl+K)"
          title="Quick Add Task (Ctrl+K)"
        >
          <Plus className="w-5 h-5" />
        </button>
      )}

      {/* 1. 30-Second AI Interactive Demo Simulation Player */}
      <InteractiveDemoPlayer 
        isOpen={isDemoPlayerOpen} 
        onClose={() => setIsDemoPlayerOpen(false)} 
        onOpenAuth={handleOpenAuth}
      />

      {/* 2. Dedicated Exams & Milestones Quick-View Modal */}
      <ExamsQuickViewModal
        isOpen={isExamsModalOpen}
        onClose={() => setIsExamsModalOpen(false)}
        onOpenAuth={handleOpenAuth}
      />

      {/* 3. Authentication Modal */}
      <AuthModal 
        isOpen={authModalState.isOpen}
        initialTab={authModalState.tab}
        onClose={() => setAuthModalState(prev => ({ ...prev, isOpen: false }))}
      />

      {/* 4. 2-Click Quick-Add Task Modal (Ctrl+K) */}
      <QuickAddTaskModal 
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* 5. Proactive In-App Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </main>
  );
}
