"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  Brain, 
  Sparkles, 
  RotateCw, 
  Check, 
  X, 
  Plus, 
  BookOpen, 
  Award, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  Flame, 
  BarChart3,
  Search,
  CheckCircle2
} from "lucide-react";

interface Flashcard {
  id: string;
  courseCode: string;
  frontQuestion: string;
  backAnswer: string;
  mastery: "new" | "learning" | "mastered";
  lastReviewed?: string;
}

export default function FlashcardsHub() {
  const { user, userData } = useAuth();

  const [cards, setCards] = useState<Flashcard[]>(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`student_portal_user_${user.id}_flashcards`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);

  // New card creation modal / input
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState<boolean>(false);
  const [newCourseCode, setNewCourseCode] = useState<string>(userData.courses[0]?.courseCode || "CS 101");
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [newAnswer, setNewAnswer] = useState<string>("");

  const persistCards = (next: Flashcard[]) => {
    setCards(next);
    if (user) {
      localStorage.setItem(`student_portal_user_${user.id}_flashcards`, JSON.stringify(next));
    }
  };

  // Filter cards by course
  const filteredCards = useMemo(() => {
    if (selectedCourse === "ALL") return cards;
    return cards.filter(c => c.courseCode === selectedCourse);
  }, [cards, selectedCourse]);

  const currentCard = filteredCards[currentCardIndex] || filteredCards[0];

  // Mastery stats
  const stats = useMemo(() => {
    const total = cards.length;
    const mastered = cards.filter(c => c.mastery === "mastered").length;
    const learning = cards.filter(c => c.mastery === "learning").length;
    const newCards = cards.filter(c => c.mastery === "new").length;
    const retentionRate = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, learning, newCards, retentionRate };
  }, [cards]);

  const handleNextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex(prev => (prev + 1) % filteredCards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleRateCard = (masteryLevel: "new" | "learning" | "mastered") => {
    if (!currentCard) return;
    const next = cards.map(c => c.id === currentCard.id ? { ...c, mastery: masteryLevel, lastReviewed: new Date().toISOString() } : c);
    persistCards(next);
    handleNextCard();
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newCard: Flashcard = {
      id: `fc_${Date.now()}`,
      courseCode: newCourseCode,
      frontQuestion: newQuestion.trim(),
      backAnswer: newAnswer.trim(),
      mastery: "new"
    };

    const next = [newCard, ...cards];
    persistCards(next);
    setNewQuestion("");
    setNewAnswer("");
    setIsNewCardModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
            ACTIVE RECALL ENGINE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            AI Flashcards & Spaced Repetition
          </h2>
          <p className="text-xs text-[var(--muted)] font-light mt-1">
            Test your knowledge retention with scientifically proven active recall and spaced intervals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewCardModalOpen(true)}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Flashcard</span>
          </button>
        </div>
      </div>

      {/* Mastery KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">RETENTION RATE</div>
          <div className="text-3xl font-bold text-emerald-500">{stats.retentionRate}%</div>
          <div className="text-xs text-[var(--muted)] font-light">{stats.mastered} of {stats.total} concepts mastered</div>
        </div>

        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">LEARNING PHASE</div>
          <div className="text-3xl font-bold text-amber-500">{stats.learning}</div>
          <div className="text-xs text-[var(--muted)] font-light">Needs review in 1-3 days</div>
        </div>

        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">NEW CONCEPTS</div>
          <div className="text-3xl font-bold text-[var(--primary)]">{stats.newCards}</div>
          <div className="text-xs text-[var(--muted)] font-light">Unreviewed lecture notes</div>
        </div>

        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">TOTAL DECK SIZE</div>
          <div className="text-3xl font-bold text-[var(--ink)]">{stats.total}</div>
          <div className="text-xs text-[var(--muted)] font-light">Across {userData.courses.length} enrolled courses</div>
        </div>
      </div>

      {/* Course Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => { setSelectedCourse("ALL"); setCurrentCardIndex(0); setIsFlipped(false); }}
          className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
            selectedCourse === "ALL" 
              ? "bg-[var(--primary)] text-white" 
              : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--hairline)]"
          }`}
        >
          ALL COURSES ({cards.length})
        </button>

        {userData.courses.map(c => {
          const count = cards.filter(card => card.courseCode === c.courseCode).length;
          return (
            <button
              key={c.id}
              onClick={() => { setSelectedCourse(c.courseCode); setCurrentCardIndex(0); setIsFlipped(false); }}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                selectedCourse === c.courseCode 
                  ? "bg-[var(--primary)] text-white" 
                  : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--hairline)]"
              }`}
            >
              {c.courseCode} ({count})
            </button>
          );
        })}
      </div>

      {/* Interactive 3D Flip Card Deck */}
      {filteredCards.length > 0 && currentCard ? (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Card Meta & Counter */}
          <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <span className="font-bold text-[var(--primary)]">COURSE: {currentCard.courseCode}</span>
            <span>CARD {currentCardIndex + 1} OF {filteredCards.length}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              currentCard.mastery === "mastered" 
                ? "bg-emerald-500/15 text-emerald-500" 
                : currentCard.mastery === "learning" 
                  ? "bg-amber-500/15 text-amber-500" 
                  : "bg-blue-500/15 text-blue-500"
            }`}>
              {currentCard.mastery.toUpperCase()}
            </span>
          </div>

          {/* Flip Card Container */}
          <div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full min-h-[280px] p-8 sm:p-12 bg-[var(--surface-card)] border-2 border-[var(--hairline)] hover:border-[var(--primary)] rounded-2xl shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 relative group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono tracking-[2px] uppercase text-[var(--muted)] font-bold">
                {isFlipped ? "ANSWER / KEY EXPLANATION" : "CONCEPT / QUESTION"}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--muted)] group-hover:text-[var(--primary)]">
                <RotateCw className="w-3.5 h-3.5" />
                <span>CLICK TO FLIP</span>
              </div>
            </div>

            <div className="my-auto py-6 text-center">
              <p className={`font-medium leading-relaxed ${
                isFlipped 
                  ? "text-base sm:text-lg text-emerald-600 dark:text-emerald-400 font-light" 
                  : "text-lg sm:text-2xl text-[var(--ink)] font-bold"
              }`}>
                {isFlipped ? currentCard.backAnswer : currentCard.frontQuestion}
              </p>
            </div>

            <div className="text-center text-[11px] font-mono text-[var(--muted)]">
              {isFlipped ? "Rate your recall difficulty below to schedule next review" : "Try answering mentally before flipping"}
            </div>
          </div>

          {/* Recall Rating Buttons (When flipped) */}
          {isFlipped ? (
            <div className="grid grid-cols-3 gap-3 animate-in fade-in duration-150">
              <button
                onClick={() => handleRateCard("new")}
                className="py-3 bg-red-500/15 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-500 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                AGAIN (1 Day)
              </button>
              <button
                onClick={() => handleRateCard("learning")}
                className="py-3 bg-amber-500/15 hover:bg-amber-500 hover:text-slate-900 border border-amber-500/30 text-amber-500 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                GOOD (3 Days)
              </button>
              <button
                onClick={() => handleRateCard("mastered")}
                className="py-3 bg-emerald-500/15 hover:bg-emerald-500 hover:text-white border border-emerald-500/30 text-emerald-500 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                EASY (7 Days)
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevCard}
                className="px-4 py-2.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>PREVIOUS</span>
              </button>

              <button
                onClick={handleNextCard}
                className="px-4 py-2.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer"
              >
                <span>NEXT</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="p-12 text-center bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-3">
          <Brain className="w-10 h-10 text-[var(--muted)] mx-auto" />
          <h3 className="text-base font-bold text-[var(--ink)]">No Flashcards in this Course Deck</h3>
          <p className="text-xs text-[var(--muted)] font-light">Create a new card to start active recall training.</p>
        </div>
      )}

      {/* New Flashcard Modal */}
      {isNewCardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleCreateCard} className="bg-[var(--surface-card)] border border-[var(--hairline)] text-[var(--ink)] max-w-lg w-full p-6 sm:p-8 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Brain className="w-4 h-4 text-[var(--primary)]" />
                <span>Create Concept Flashcard</span>
              </div>
              <button type="button" onClick={() => setIsNewCardModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                COURSE
              </label>
              <select
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value)}
                className="w-full h-10 px-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-bold rounded-xl outline-none"
              >
                {userData.courses.map(c => (
                  <option key={c.id} value={c.courseCode}>{c.courseCode} - {c.courseName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                FRONT (QUESTION / PROMPT)
              </label>
              <textarea
                required
                rows={3}
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. What is the difference between mutexes and semaphores?"
                className="w-full p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs rounded-xl outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                BACK (KEY EXPLANATION / DEFINITION)
              </label>
              <textarea
                required
                rows={3}
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="e.g. A mutex is a locking mechanism for a single thread, while a semaphore is a signaling mechanism for multiple resources."
                className="w-full p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs rounded-xl outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewCardModalOpen(false)}
                className="w-1/3 py-2.5 border border-[var(--hairline)] text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md"
              >
                SAVE FLASHCARD
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
