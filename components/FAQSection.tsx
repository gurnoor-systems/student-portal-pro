"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles, BookOpen, ShieldCheck, Smartphone, Calendar, Key } from "lucide-react";

export interface FAQItem {
  id: string;
  category: "general" | "sync" | "features" | "security";
  question: string;
  answer: string;
  icon: any;
}

export const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",
    category: "general",
    icon: BookOpen,
    question: "Is Student Portal Pro completely free to use?",
    answer: "Yes, 100% free for all students. There are no paywalls, subscriptions, or hidden charges. You get full access to task tracking, syllabus parsing, exam timelines, and multi-device cloud sync."
  },
  {
    id: "faq-2",
    category: "sync",
    icon: Smartphone,
    question: "How does multi-device synchronization work?",
    answer: "You can stay logged into your account simultaneously across your Phone, Laptop, Tablet, and Desktop. Whenever you add a task or upload course material on one device, it instantly syncs across all your active devices in real time."
  },
  {
    id: "faq-3",
    category: "features",
    icon: Sparkles,
    question: "How does the Syllabus Deadline Extractor work?",
    answer: "Paste your syllabus text or upload your course PDF in the Syllabus Parser. The system automatically identifies assignment deadlines, midterm dates, final exam dates, and grading weights, allowing you to add them to your schedule in one click."
  },
  {
    id: "faq-4",
    category: "features",
    icon: Calendar,
    question: "Can I sync or export my deadlines to Google Calendar?",
    answer: "Yes! You can connect your Google Calendar for automatic 2-way synchronization or download an universal .ics calendar file to import into Apple Calendar, Outlook, or Notion."
  },
  {
    id: "faq-5",
    category: "security",
    icon: ShieldCheck,
    question: "Is my student data and coursework private?",
    answer: "Absolutely. All user data is strictly partitioned and isolated per student. Only you can view, create, or modify your subjects, grades, and task matrices."
  },
  {
    id: "faq-6",
    category: "security",
    icon: Key,
    question: "How do I reset my password if I forget it?",
    answer: "Click 'Forgot Password' on the login screen or in your Profile Security tab. A secure 6-digit recovery code will be dispatched to your registered email address to verify your identity and set a new password."
  },
  {
    id: "faq-7",
    category: "general",
    icon: BookOpen,
    question: "How do I add or manage my enrolled subjects?",
    answer: "Open your Profile Settings (click your avatar in the top corner and select 'Manage Subjects'). You can add new course codes, lecture links (Google Meet / Zoom), professor details, and class schedules anytime."
  }
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>("faq-1");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const filteredFAQs = FAQ_DATA.filter(item => 
    activeCategory === "all" || item.category === activeCategory
  );

  const toggleFAQ = (id: string) => {
    setOpenId(prev => prev === id ? null : id);
  };

  return (
    <section id="faq" className="bg-[var(--canvas)] py-20 lg:py-24 border-b border-[var(--hairline)]">
      <div className="max-w-[1024px] mx-auto px-6 lg:px-12 space-y-12">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold rounded">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)]">
            Everything you need to know
          </h2>
          <p className="text-sm text-[var(--muted)] font-light leading-relaxed">
            Quick answers about study spaces, multi-device sync, syllabus parsing, and account security.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { id: "all", label: "All Questions" },
            { id: "general", label: "General & Courses" },
            { id: "sync", label: "Multi-Device Sync" },
            { id: "features", label: "Features & Calendar" },
            { id: "security", label: "Privacy & Security" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                activeCategory === cat.id
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow-sm"
                  : "bg-[var(--surface-soft)] border-[var(--hairline)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Accordion FAQ Items */}
        <div className="space-y-3">
          {filteredFAQs.map((faq) => {
            const isOpen = openId === faq.id;
            const Icon = faq.icon;

            return (
              <div
                key={faq.id}
                className={`border rounded-xl transition-all overflow-hidden ${
                  isOpen 
                    ? "bg-[var(--surface-soft)] border-[var(--primary)] shadow-sm" 
                    : "bg-[var(--card-bg)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isOpen ? "bg-[var(--primary)] text-white" : "bg-[var(--surface-strong)] text-[var(--primary)]"
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm sm:text-base font-bold text-[var(--ink)]">
                      {faq.question}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--muted)] flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-[var(--primary)]" : ""
                  }`} />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--body)] font-light leading-relaxed border-t border-[var(--hairline)] animate-in fade-in duration-150">
                    <p className="pl-11">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
