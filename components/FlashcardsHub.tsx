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

import { Flashcard, TieredFlashcardsResult } from "@/lib/types";

export default function FlashcardsHub() {
  const { user, userData } = useAuth();

  const [cards, setCards] = useState<Flashcard[]>(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`student_portal_user_${user.id}_flashcards`);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Guarantee difficulty is set on all cards
        return parsed.map((c: any) => ({ ...c, difficulty: c.difficulty || "medium" }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [selectedCourse, setSelectedCourse] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"ALL" | "easy" | "medium" | "hard">("ALL");
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // New manual card creation modal
  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState<boolean>(false);
  const [newCourseCode, setNewCourseCode] = useState<string>(userData.courses[0]?.courseCode || "CS 101");
  const [newQuestion, setNewQuestion] = useState<string>("");
  const [newAnswer, setNewAnswer] = useState<string>("");
  const [newDifficulty, setNewDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // AI Document Deck Generator Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiSourceMode, setAiSourceMode] = useState<"document" | "text">("document");
  const [aiCourseCode, setAiCourseCode] = useState<string>(userData.courses[0]?.courseCode || "CS 101");
  const [aiSelectedDocTitle, setAiSelectedDocTitle] = useState<string>("");
  const [aiInputText, setAiInputText] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<TieredFlashcardsResult | null>(null);
  const [aiActiveTab, setAiActiveTab] = useState<"all" | "easy" | "medium" | "hard">("all");

  // Saved documents from repository
  const savedDocuments = useMemo(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`student_portal_user_${user.id}_documents`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [user]);

  const persistCards = (next: Flashcard[]) => {
    setCards(next);
    if (user) {
      localStorage.setItem(`student_portal_user_${user.id}_flashcards`, JSON.stringify(next));
    }
  };

  // Filter cards by course and difficulty
  const filteredCards = useMemo(() => {
    return cards.filter(c => {
      const courseMatch = selectedCourse === "ALL" || c.courseCode === selectedCourse;
      const diffMatch = selectedDifficulty === "ALL" || c.difficulty === selectedDifficulty;
      return courseMatch && diffMatch;
    });
  }, [cards, selectedCourse, selectedDifficulty]);

  const currentCard = filteredCards[currentCardIndex] || filteredCards[0];

  // Mastery & Difficulty stats
  const stats = useMemo(() => {
    const total = cards.length;
    const mastered = cards.filter(c => c.mastery === "mastered").length;
    const learning = cards.filter(c => c.mastery === "learning").length;
    const newCards = cards.filter(c => c.mastery === "new").length;
    const easyCount = cards.filter(c => c.difficulty === "easy").length;
    const mediumCount = cards.filter(c => c.difficulty === "medium").length;
    const hardCount = cards.filter(c => c.difficulty === "hard").length;
    const retentionRate = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, learning, newCards, easyCount, mediumCount, hardCount, retentionRate };
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
      difficulty: newDifficulty,
      mastery: "new"
    };

    const next = [newCard, ...cards];
    persistCards(next);
    setNewQuestion("");
    setNewAnswer("");
    setIsNewCardModalOpen(false);
  };

  const handleGenerateAiDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    let textToAnalyze = aiInputText.trim();

    if (aiSourceMode === "document") {
      const foundDoc = savedDocuments.find((d: any) => d.title === aiSelectedDocTitle || d.id === aiSelectedDocTitle);
      if (foundDoc) {
        textToAnalyze = Array.isArray(foundDoc.content) ? foundDoc.content.join("\n\n") : String(foundDoc.content || "");
      }
    }

    if (!textToAnalyze) return;

    setIsGeneratingAi(true);
    setAiGeneratedResult(null);

    try {
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToAnalyze,
          courseCode: aiCourseCode,
          documentTitle: aiSelectedDocTitle || "Lecture Notes"
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        setAiGeneratedResult(data.result);
      }
    } catch (err) {
      console.error("AI Generation error:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleImportAiCards = (tierFilter: "all" | "easy" | "medium" | "hard" = "all") => {
    if (!aiGeneratedResult) return;

    const newFlashcards: Flashcard[] = [];
    const timestamp = Date.now();

    if (tierFilter === "all" || tierFilter === "easy") {
      aiGeneratedResult.easy.forEach((card, idx) => {
        newFlashcards.push({
          id: `fc_ai_easy_${timestamp}_${idx}`,
          courseCode: aiGeneratedResult.courseCode,
          frontQuestion: card.question,
          backAnswer: card.answer,
          difficulty: "easy",
          mastery: "new",
          sourceDocument: aiGeneratedResult.documentTitle
        });
      });
    }

    if (tierFilter === "all" || tierFilter === "medium") {
      aiGeneratedResult.medium.forEach((card, idx) => {
        newFlashcards.push({
          id: `fc_ai_med_${timestamp}_${idx}`,
          courseCode: aiGeneratedResult.courseCode,
          frontQuestion: card.question,
          backAnswer: card.answer,
          difficulty: "medium",
          mastery: "new",
          sourceDocument: aiGeneratedResult.documentTitle
        });
      });
    }

    if (tierFilter === "all" || tierFilter === "hard") {
      aiGeneratedResult.hard.forEach((card, idx) => {
        newFlashcards.push({
          id: `fc_ai_hard_${timestamp}_${idx}`,
          courseCode: aiGeneratedResult.courseCode,
          frontQuestion: card.question,
          backAnswer: card.answer,
          difficulty: "hard",
          mastery: "new",
          sourceDocument: aiGeneratedResult.documentTitle
        });
      });
    }

    const next = [...newFlashcards, ...cards];
    persistCards(next);
    setIsAiModalOpen(false);
    setAiGeneratedResult(null);
    setAiInputText("");
    setSelectedCourse(aiGeneratedResult.courseCode);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
            STUDY TOOLS
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            Flashcards & Study Decks
          </h2>
          <p className="text-xs text-[var(--muted)] font-light mt-1">
            Active recall with 3-tier difficulty classification: 🟢 Easy (Definitions), 🟡 Medium (Concepts), 🔴 Hard (Synthesis).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-[var(--primary)] hover:from-purple-500 hover:to-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded transition-all cursor-pointer shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate AI Deck</span>
          </button>

          <button
            onClick={() => setIsNewCardModalOpen(true)}
            className="px-4 py-2 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] border border-[var(--hairline)] text-[var(--ink)] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Custom Card</span>
          </button>
        </div>
      </div>

      {/* Mastery & Tier Stats KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">RETENTION RATE</div>
          <div className="text-3xl font-bold text-emerald-500">{stats.retentionRate}%</div>
          <div className="text-xs text-[var(--muted)] font-light">{stats.mastered} of {stats.total} concepts mastered</div>
        </div>

        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">🟢 EASY (FACTS/DEFS)</div>
          <div className="text-3xl font-bold text-emerald-400">{stats.easyCount}</div>
          <div className="text-xs text-[var(--muted)] font-light">Foundational definitions</div>
        </div>

        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">🟡 MEDIUM (CONCEPTS)</div>
          <div className="text-3xl font-bold text-amber-400">{stats.mediumCount}</div>
          <div className="text-xs text-[var(--muted)] font-light">Mechanisms & relationships</div>
        </div>

        <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-1 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">🔴 HARD (SYNTHESIS)</div>
          <div className="text-3xl font-bold text-red-400">{stats.hardCount}</div>
          <div className="text-xs text-[var(--muted)] font-light">Deep analysis & trade-offs</div>
        </div>
      </div>

      {/* Filter Tabs: Course & Difficulty Tier */}
      <div className="space-y-3">
        {/* Course Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold pr-1">COURSE:</span>
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

        {/* Difficulty Tier Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold pr-1">TIER:</span>
          <button
            onClick={() => { setSelectedDifficulty("ALL"); setCurrentCardIndex(0); setIsFlipped(false); }}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
              selectedDifficulty === "ALL" 
                ? "bg-[var(--ink)] text-[var(--canvas)]" 
                : "bg-[var(--surface-soft)] text-[var(--muted)] border border-[var(--hairline)]"
            }`}
          >
            ALL TIERS
          </button>
          <button
            onClick={() => { setSelectedDifficulty("easy"); setCurrentCardIndex(0); setIsFlipped(false); }}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedDifficulty === "easy" 
                ? "bg-emerald-600 text-white font-bold" 
                : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
            }`}
          >
            <span>🟢 EASY ({stats.easyCount})</span>
          </button>
          <button
            onClick={() => { setSelectedDifficulty("medium"); setCurrentCardIndex(0); setIsFlipped(false); }}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedDifficulty === "medium" 
                ? "bg-amber-600 text-white font-bold" 
                : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
            }`}
          >
            <span>🟡 MEDIUM ({stats.mediumCount})</span>
          </button>
          <button
            onClick={() => { setSelectedDifficulty("hard"); setCurrentCardIndex(0); setIsFlipped(false); }}
            className={`px-2.5 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedDifficulty === "hard" 
                ? "bg-red-600 text-white font-bold" 
                : "bg-red-500/10 text-red-500 border border-red-500/30"
            }`}
          >
            <span>🔴 HARD ({stats.hardCount})</span>
          </button>
        </div>
      </div>

      {/* Interactive 3D Flip Card Deck */}
      {filteredCards.length > 0 && currentCard ? (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Card Meta & Counter */}
          <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--primary)]">COURSE: {currentCard.courseCode}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentCard.difficulty === "easy"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : currentCard.difficulty === "hard"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              }`}>
                {currentCard.difficulty === "easy" ? "🟢 EASY" : currentCard.difficulty === "hard" ? "🔴 HARD" : "🟡 MEDIUM"}
              </span>
            </div>
            
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
                {isFlipped ? "ANSWER / UNIVERSITY-LEVEL EXPLANATION" : "CONCEPT / QUESTION"}
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

            <div className="text-center text-[11px] font-mono text-[var(--muted)] flex items-center justify-between">
              <span>{currentCard.sourceDocument ? `📄 Source: ${currentCard.sourceDocument}` : "Custom Created"}</span>
              <span>{isFlipped ? "Rate recall difficulty below" : "Try answering mentally before flipping"}</span>
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
          <h3 className="text-base font-bold text-[var(--ink)]">No Flashcards in this Filter</h3>
          <p className="text-xs text-[var(--muted)] font-light">Generate an AI deck from your course documents or create a new card.</p>
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-[var(--primary)] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate from Document</span>
          </button>
        </div>
      )}

      {/* AI Document Deck Generator Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[var(--surface-card)] border border-[var(--hairline)] text-[var(--ink)] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <span>AI Professor 3-Tier Flashcard Generator</span>
              </div>
              <button type="button" onClick={() => { setIsAiModalOpen(false); setAiGeneratedResult(null); }} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!aiGeneratedResult ? (
              <form onSubmit={handleGenerateAiDeck} className="space-y-4">
                <div className="p-3.5 bg-purple-500/10 border border-purple-500/25 rounded-xl text-xs text-purple-200 leading-relaxed font-light">
                  <strong>Instructional AI Engine:</strong> Analyzes text strictly from your syllabus or lecture documents and structures questions into <strong>🟢 Easy</strong> (definitions), <strong>🟡 Medium</strong> (concepts), and <strong>🔴 Hard</strong> (synthesis & trade-offs).
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                      COURSE SUBJECT
                    </label>
                    <select
                      value={aiCourseCode}
                      onChange={(e) => setAiCourseCode(e.target.value)}
                      className="w-full h-10 px-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-bold rounded-xl outline-none"
                    >
                      {userData.courses.map(c => (
                        <option key={c.id} value={c.courseCode}>{c.courseCode} - {c.courseName}</option>
                      ))}
                      {userData.courses.length === 0 && (
                        <option value="GEN 101">GEN 101 - General Studies</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                      SOURCE INPUT TYPE
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setAiSourceMode("document")}
                        className={`h-10 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                          aiSourceMode === "document"
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--surface-soft)] text-[var(--muted)] border-[var(--hairline)]"
                        }`}
                      >
                        Saved Document
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiSourceMode("text")}
                        className={`h-10 text-xs font-bold rounded-xl border transition-colors cursor-pointer ${
                          aiSourceMode === "text"
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--surface-soft)] text-[var(--muted)] border-[var(--hairline)]"
                        }`}
                      >
                        Paste Notes
                      </button>
                    </div>
                  </div>
                </div>

                {aiSourceMode === "document" ? (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                      CHOOSE COURSE REPOSITORY DOCUMENT
                    </label>
                    {savedDocuments.length > 0 ? (
                      <select
                        value={aiSelectedDocTitle}
                        onChange={(e) => setAiSelectedDocTitle(e.target.value)}
                        className="w-full h-10 px-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-semibold rounded-xl outline-none"
                        required
                      >
                        <option value="">Select a document...</option>
                        {savedDocuments.map((doc: any) => (
                          <option key={doc.id} value={doc.title}>
                            {doc.courseCode} • {doc.title} ({doc.type || "Document"})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-4 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl text-xs text-[var(--muted)] text-center space-y-2">
                        <BookOpen className="w-5 h-5 mx-auto text-[var(--muted)]" />
                        <div>No saved documents in repository yet.</div>
                        <button
                          type="button"
                          onClick={() => setAiSourceMode("text")}
                          className="text-[var(--primary)] font-bold underline cursor-pointer"
                        >
                          Switch to Paste Study Notes instead
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                      PASTE LECTURE NOTES / SYLLABUS / CHAPTER TEXT
                    </label>
                    <textarea
                      required
                      rows={6}
                      value={aiInputText}
                      onChange={(e) => setAiInputText(e.target.value)}
                      placeholder="Paste your lecture notes, transcript, chapter summary, or textbook excerpts here..."
                      className="w-full p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs rounded-xl outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAiModalOpen(false)}
                    className="px-5 py-2.5 border border-[var(--hairline)] text-xs font-bold uppercase rounded-xl cursor-pointer"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={isGeneratingAi || (aiSourceMode === "document" && !aiSelectedDocTitle) || (aiSourceMode === "text" && !aiInputText.trim())}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-[var(--primary)] hover:from-purple-500 hover:to-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingAi ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>ANALYZING & GENERATING...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>GENERATE 3-TIER FLASHCARDS</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Generated Result Preview & Import */
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--hairline)]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">GENERATION COMPLETE</span>
                    <h4 className="text-base font-bold text-[var(--ink)]">
                      {aiGeneratedResult.totalCount} Flashcards Generated for {aiGeneratedResult.courseCode}
                    </h4>
                  </div>
                  <button
                    onClick={() => setAiGeneratedResult(null)}
                    className="text-xs text-[var(--primary)] hover:underline font-mono"
                  >
                    ← Re-generate
                  </button>
                </div>

                {/* Tier Filter Preview Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiActiveTab("all")}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                      aiActiveTab === "all" ? "bg-[var(--ink)] text-[var(--canvas)]" : "bg-[var(--surface-soft)] text-[var(--muted)]"
                    }`}
                  >
                    ALL ({aiGeneratedResult.totalCount})
                  </button>
                  <button
                    onClick={() => setAiActiveTab("easy")}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                      aiActiveTab === "easy" ? "bg-emerald-600 text-white" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    🟢 EASY ({aiGeneratedResult.easy.length})
                  </button>
                  <button
                    onClick={() => setAiActiveTab("medium")}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                      aiActiveTab === "medium" ? "bg-amber-600 text-white" : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                  >
                    🟡 MEDIUM ({aiGeneratedResult.medium.length})
                  </button>
                  <button
                    onClick={() => setAiActiveTab("hard")}
                    className={`px-3 py-1 text-xs font-mono font-bold rounded-lg border transition-colors ${
                      aiActiveTab === "hard" ? "bg-red-600 text-white" : "bg-red-500/10 text-red-400 border-red-500/30"
                    }`}
                  >
                    🔴 HARD ({aiGeneratedResult.hard.length})
                  </button>
                </div>

                {/* Cards List Preview */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {(aiActiveTab === "all" || aiActiveTab === "easy") && aiGeneratedResult.easy.map((c, i) => (
                    <div key={`easy-${i}`} className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">🟢 EASY (DEFINITION / FACT)</div>
                      <div className="text-xs font-bold text-[var(--ink)]">Q: {c.question}</div>
                      <div className="text-xs text-[var(--muted)] font-light">A: {c.answer}</div>
                    </div>
                  ))}

                  {(aiActiveTab === "all" || aiActiveTab === "medium") && aiGeneratedResult.medium.map((c, i) => (
                    <div key={`med-${i}`} className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">🟡 MEDIUM (CONCEPT / RELATIONSHIP)</div>
                      <div className="text-xs font-bold text-[var(--ink)]">Q: {c.question}</div>
                      <div className="text-xs text-[var(--muted)] font-light">A: {c.answer}</div>
                    </div>
                  ))}

                  {(aiActiveTab === "all" || aiActiveTab === "hard") && aiGeneratedResult.hard.map((c, i) => (
                    <div key={`hard-${i}`} className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl space-y-1">
                      <div className="text-[10px] font-mono uppercase text-red-400 font-bold">🔴 HARD (SYNTHESIS / ANALYSIS)</div>
                      <div className="text-xs font-bold text-[var(--ink)]">Q: {c.question}</div>
                      <div className="text-xs text-[var(--muted)] font-light">A: {c.answer}</div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--hairline)]">
                  <button
                    type="button"
                    onClick={() => { setIsAiModalOpen(false); setAiGeneratedResult(null); }}
                    className="px-4 py-2 border border-[var(--hairline)] text-xs font-bold uppercase rounded-xl cursor-pointer"
                  >
                    DISCARD
                  </button>

                  <button
                    type="button"
                    onClick={() => handleImportAiCards(aiActiveTab)}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-[var(--primary)] hover:from-emerald-500 hover:to-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>IMPORT {aiActiveTab.toUpperCase()} TO STUDY DECK</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual New Flashcard Modal */}
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

            <div className="grid grid-cols-2 gap-3">
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
                  {userData.courses.length === 0 && (
                    <option value="GEN 101">GEN 101 - General Studies</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[var(--muted)] mb-1">
                  DIFFICULTY TIER
                </label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value as any)}
                  className="w-full h-10 px-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-bold rounded-xl outline-none"
                >
                  <option value="easy">🟢 Easy (Definition)</option>
                  <option value="medium">🟡 Medium (Concept)</option>
                  <option value="hard">🔴 Hard (Analysis)</option>
                </select>
              </div>
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
