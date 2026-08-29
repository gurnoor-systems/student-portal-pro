"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { ParsedSyllabusResult, ParsedDeliverable, ParsedExam } from "@/lib/types";
import { parseDocumentFile } from "@/lib/document-parser";
import { 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Search, 
  Bookmark, 
  BookOpen, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight, 
  FolderOpen, 
  Sparkles, 
  Plus, 
  Trash2, 
  Upload, 
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  AlertCircle,
  Edit3,
  Layers,
  CheckSquare,
  Square,
  FileSpreadsheet,
  ArrowRight,
  RotateCcw,
  Brain
} from "lucide-react";

export interface DocumentItem {
  id: string;
  courseCode: string;
  title: string;
  type: "Syllabus" | "Lecture Slides" | "Past Exam" | "Lab Manual" | "Notes";
  pageCount: number;
  content: string[];
}

const SAMPLE_SYLLABUS_TEXT = `CS 350: Operating Systems - Fall Semester 2026
Instructor: Dr. Vance (Office Hours: Mon/Wed 2:00 PM)

COURSE GRADING BREAKDOWN:
- Assignment 1: Threads and Synchronization - Due: October 12, 2026 (Weight: 10%)
- Assignment 2: OS161 Virtual Memory Paging - Due: November 06, 2026 (Weight: 15%)
- Assignment 3: File System & Inode Implementation - Due: November 27, 2026 (Weight: 15%)
- Lab Milestone 1: Kernel Trap Handling - Due: October 20, 2026 (Weight: 5%)
- Midterm Examination: October 28, 2026 (Weight: 25%)
- Final Comprehensive Examination: December 16, 2026 (Weight: 30%)

COURSE POLICIES:
All programming assignments must be submitted via Git before 11:59 PM on the due date.`;

export default function CourseDocumentViewer() {
  const { user, userData, addTask, addExam, addCourse } = useAuth();
  
  // Top-level tab switcher
  const [activeTab, setActiveTab] = useState<"reader" | "parser">("reader");

  // Document Reader states
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`student_portal_user_${user.id}_documents`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Document Modal Form
  const [newTitle, setNewTitle] = useState("");
  const [newCourseCode, setNewCourseCode] = useState(userData.courses[0]?.courseCode || "CS 101");
  const [newDocType, setNewDocType] = useState<DocumentItem["type"]>("Lecture Slides");
  const [newPageContent, setNewPageContent] = useState("");

  // =========================================================================
  // SYLLABUS AUTO-PARSER STATES
  // =========================================================================
  const [syllabusInputText, setSyllabusInputText] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedResult, setParsedResult] = useState<ParsedSyllabusResult | null>(null);
  const [saveToDocsChecked, setSaveToDocsChecked] = useState(true);
  const [importSuccessMessage, setImportSuccessMessage] = useState("");
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [flashcardsSuccessMessage, setFlashcardsSuccessMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateDocFlashcards = async (doc: DocumentItem) => {
    if (!doc || !user) return;
    setIsGeneratingFlashcards(true);
    setFlashcardsSuccessMessage("");

    try {
      const fullText = doc.content.join("\n\n");
      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullText,
          courseCode: doc.courseCode,
          documentTitle: doc.title
        })
      });

      const data = await res.json();
      if (data.success && data.result) {
        const timestamp = Date.now();
        const created: any[] = [];
        
        data.result.easy.forEach((c: any, i: number) => {
          created.push({
            id: `fc_doc_easy_${timestamp}_${i}`,
            courseCode: doc.courseCode,
            frontQuestion: c.question,
            backAnswer: c.answer,
            difficulty: "easy",
            mastery: "new",
            sourceDocument: doc.title
          });
        });

        data.result.medium.forEach((c: any, i: number) => {
          created.push({
            id: `fc_doc_med_${timestamp}_${i}`,
            courseCode: doc.courseCode,
            frontQuestion: c.question,
            backAnswer: c.answer,
            difficulty: "medium",
            mastery: "new",
            sourceDocument: doc.title
          });
        });

        data.result.hard.forEach((c: any, i: number) => {
          created.push({
            id: `fc_doc_hard_${timestamp}_${i}`,
            courseCode: doc.courseCode,
            frontQuestion: c.question,
            backAnswer: c.answer,
            difficulty: "hard",
            mastery: "new",
            sourceDocument: doc.title
          });
        });

        const rawExisting = localStorage.getItem(`student_portal_user_${user.id}_flashcards`);
        const existing = rawExisting ? JSON.parse(rawExisting) : [];
        const next = [...created, ...existing];
        localStorage.setItem(`student_portal_user_${user.id}_flashcards`, JSON.stringify(next));

        setFlashcardsSuccessMessage(`✅ Generated ${created.length} 3-tier flashcards (🟢 ${data.result.easy.length} Easy, 🟡 ${data.result.medium.length} Medium, 🔴 ${data.result.hard.length} Hard) from "${doc.title}"!`);
      }
    } catch (err) {
      console.error("Flashcard generator error:", err);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  // Persist user documents
  const persistDocs = (nextDocs: DocumentItem[]) => {
    setDocuments(nextDocs);
    if (user) {
      localStorage.setItem(`student_portal_user_${user.id}_documents`, JSON.stringify(nextDocs));
    }
  };

  useEffect(() => {
    if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id);
    }
  }, [documents, selectedDocId]);

  const activeDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const pages = newPageContent.trim() 
      ? newPageContent.split("\n\n---\n\n")
      : [`Page 1: ${newTitle.trim()}\n\nUploaded notes and course reading materials.`];

    const newDoc: DocumentItem = {
      id: `doc_${Date.now()}`,
      courseCode: newCourseCode.trim().toUpperCase(),
      title: newTitle.trim(),
      type: newDocType,
      pageCount: pages.length,
      content: pages
    };

    const next = [newDoc, ...documents];
    persistDocs(next);
    setSelectedDocId(newDoc.id);
    setCurrentPage(0);
    setNewTitle("");
    setNewPageContent("");
    setIsAddModalOpen(false);
  };

  const handleDeleteDocument = (docId: string) => {
    const next = documents.filter(d => d.id !== docId);
    persistDocs(next);
    if (selectedDocId === docId) {
      setSelectedDocId(next[0]?.id || "");
      setCurrentPage(0);
    }
  };

  // =========================================================================
  // SYLLABUS PARSING HANDLERS
  // =========================================================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setParseError("");

    try {
      const parsed = await parseDocumentFile(file);
      if (parsed.text.trim()) {
        setSyllabusInputText(parsed.text);
      } else {
        setParseError("Could not extract text from document. Please paste syllabus text directly.");
      }
    } catch {
      setParseError("Could not read uploaded document file. Please paste text directly.");
    }
  };

  const handleLoadSample = () => {
    setSyllabusInputText(SAMPLE_SYLLABUS_TEXT);
    setSelectedFileName("CS350_Operating_Systems_Syllabus.txt");
    setParseError("");
    setParsedResult(null);
  };

  const handleRunParser = async () => {
    if (!syllabusInputText.trim()) {
      setParseError("Please upload a syllabus file or paste its text content.");
      return;
    }

    setIsParsing(true);
    setParseError("");
    setImportSuccessMessage("");

    try {
      const res = await fetch("/api/syllabus/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: syllabusInputText,
          courseHint: userData.courses[0]?.courseCode
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to extract syllabus data.");
      }

      setParsedResult(data.result);
    } catch (err: any) {
      setParseError(err.message || "Extraction failed. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  // Toggle deliverable checkbox
  const handleToggleDeliverable = (id: string) => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      deliverables: parsedResult.deliverables.map(d => d.id === id ? { ...d, selected: !d.selected } : d)
    });
  };

  // Toggle exam checkbox
  const handleToggleExam = (id: string) => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      exams: parsedResult.exams.map(e => e.id === id ? { ...e, selected: !e.selected } : e)
    });
  };

  // Update deliverable field inline
  const handleUpdateDeliverable = (id: string, updates: Partial<ParsedDeliverable>) => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      deliverables: parsedResult.deliverables.map(d => d.id === id ? { ...d, ...updates } : d)
    });
  };

  // Update exam field inline
  const handleUpdateExam = (id: string, updates: Partial<ParsedExam>) => {
    if (!parsedResult) return;
    setParsedResult({
      ...parsedResult,
      exams: parsedResult.exams.map(e => e.id === id ? { ...e, ...updates } : e)
    });
  };

  // 1-Click Import Execution
  const handleImportToPlatform = () => {
    if (!parsedResult) return;

    let tasksCount = 0;
    let examsCount = 0;
    let courseEnrolled = false;

    // 0. Auto-enroll Course into Enrolled Subjects if not yet present
    const cCode = parsedResult.courseCode || "CS 101";
    const existingCourse = userData.courses.find(c => c.courseCode.toLowerCase() === cCode.toLowerCase());
    if (!existingCourse) {
      addCourse({
        courseCode: cCode,
        courseName: parsedResult.courseTitle || `${cCode} Course`,
        instructor: parsedResult.instructor || "Faculty Professor"
      });
      courseEnrolled = true;
    }

    // 1. Dispatch Deliverables to Kanban/Tasks
    parsedResult.deliverables.forEach(d => {
      if (d.selected) {
        addTask({
          title: d.title,
          courseCode: d.courseCode || cCode,
          dueDate: d.dueDate || new Date().toISOString().split("T")[0],
          dueTime: d.dueTime || "23:59",
          priority: d.priority || "medium",
          status: "todo",
          category: "Assignment"
        });
        tasksCount++;
      }
    });

    // 2. Dispatch Exams to Grade Predictor / Exams Store
    parsedResult.exams.forEach(e => {
      if (e.selected) {
        addExam({
          title: e.name,
          courseCode: e.courseCode || cCode,
          examDate: e.date || new Date().toISOString().split("T")[0],
          weightPercent: e.weightPercent || 25,
          location: "To Be Announced",
          topics: [`Comprehensive review for ${e.name}`]
        });
        examsCount++;
      }
    });

    // 3. Optionally save syllabus to Course Documents
    if (saveToDocsChecked) {
      const docPages = syllabusInputText.split("\n\n---\n\n");
      const newDoc: DocumentItem = {
        id: `doc_syllabus_${Date.now()}`,
        courseCode: cCode,
        title: `${cCode} - Official Course Syllabus`,
        type: "Syllabus",
        pageCount: docPages.length,
        content: docPages.length > 0 ? docPages : [syllabusInputText]
      };
      const next = [newDoc, ...documents];
      persistDocs(next);
      setSelectedDocId(newDoc.id);
    }

    setImportSuccessMessage(
      `✨ Successfully imported ${tasksCount} assignments, ${examsCount} exams${courseEnrolled ? ` and enrolled ${cCode}` : ""} into your semester dashboard!`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header section & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
            ACADEMIC REPOSITORY & AI PARSER
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Course Documents & Syllabus Hub
          </h2>
          <p className="text-xs text-[var(--muted)] font-light mt-0.5">
            Read lecture slides, manage notes, or auto-extract deadlines from course syllabi in seconds.
          </p>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="flex items-center gap-2 bg-[var(--surface-soft)] p-1 rounded-xl border border-[var(--hairline)]">
          <button
            onClick={() => setActiveTab("reader")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "reader"
                ? "bg-[var(--surface-card)] text-[var(--ink)] shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Document Reader</span>
          </button>

          <button
            onClick={() => setActiveTab("parser")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "parser"
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "text-[var(--muted)] hover:text-[var(--ink)]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>⚡ Syllabus Auto-Parser</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: DEDICATED SYLLABUS AUTO-PARSER & DEADLINE EXTRACTOR
         ========================================================================= */}
      {activeTab === "parser" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Parser Hero / Ingestion Card */}
          <div className="bmw-card bg-gradient-to-br from-[var(--surface-card)] to-[var(--surface-soft)] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[var(--primary)]/15 text-[var(--primary)] text-[10px] font-mono font-bold rounded">
                    SEMESTER ACCELERATOR
                  </span>
                  <span className="text-xs font-mono text-[var(--muted)]">Zero Manual Data Entry</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] mt-1">
                  1-Click Course Syllabus Deadline Extractor
                </h3>
                <p className="text-xs text-[var(--muted)] max-w-2xl mt-0.5">
                  Upload any syllabus (.pdf, .txt, .docx) or paste text. Our dual-tier engine extracts all assignments directly into your Kanban board and exam dates into the Grade Predictor.
                </p>
              </div>

              <button
                onClick={handleLoadSample}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-card)] hover:bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-mono text-[var(--ink)] rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>⚡ Load Sample CS 350 Syllabus</span>
              </button>
            </div>

            {/* Dropzone & Input Strip */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* File Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="lg:col-span-4 border-2 border-dashed border-[var(--hairline-strong)] hover:border-[var(--primary)] bg-[var(--surface-card)]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[var(--surface-soft)]"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.docx,.md"
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[var(--ink)]">
                  {selectedFileName ? selectedFileName : "Drop Syllabus File Here"}
                </div>
                <div className="text-[10px] text-[var(--muted)] font-mono mt-1">
                  Supports PDF, DOCX, TXT, MD
                </div>
                <button
                  type="button"
                  className="mt-3 px-3 py-1 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-lg text-[10px] font-bold text-[var(--ink)]"
                >
                  Browse Files
                </button>
              </div>

              {/* Text Paste Fallback Area */}
              <div className="lg:col-span-8 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--muted)]">
                  <span>OR PASTE SYLLABUS CONTENT DIRECTLY:</span>
                  {syllabusInputText && (
                    <button 
                      onClick={() => { setSyllabusInputText(""); setSelectedFileName(""); setParsedResult(null); }}
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={5}
                  value={syllabusInputText}
                  onChange={(e) => setSyllabusInputText(e.target.value)}
                  placeholder="Paste syllabus text containing grading policy, assignment dates, homework schedules, and midterm/final exam deadlines..."
                  className="w-full p-3 bg-[var(--surface-card)] border border-[var(--hairline)] text-[var(--ink)] rounded-xl outline-none focus:border-[var(--primary)] text-xs font-mono resize-none leading-relaxed"
                />
              </div>

            </div>

            {/* Error banner */}
            {parseError && (
              <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-mono rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)]">
              <button
                onClick={handleLoadSample}
                className="sm:hidden text-xs text-[var(--primary)] font-mono font-bold cursor-pointer"
              >
                ⚡ Load Sample
              </button>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={handleRunParser}
                  disabled={isParsing || !syllabusInputText.trim()}
                  className="px-6 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] disabled:opacity-50 text-white text-xs font-bold uppercase rounded-full cursor-pointer transition-all flex items-center gap-2 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isParsing ? "Scanning & Extracting..." : "Scan & Extract Deadlines"}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Extraction Success Banner */}
          {importSuccessMessage && (
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-xs rounded-2xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{importSuccessMessage}</span>
              </div>
              <button
                onClick={() => setActiveTab("reader")}
                className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-[10px] uppercase cursor-pointer"
              >
                Open Documents
              </button>
            </div>
          )}

          {/* =====================================================================
              PARSED RESULTS MATRIX & VERIFICATION TABLE
             ===================================================================== */}
          {parsedResult && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
              
              {/* Course Meta Banner */}
              <div className="p-4 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-[10px] font-mono text-[var(--muted)] uppercase font-bold">DETECTED COURSE</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 bg-[var(--primary)] text-white text-xs font-bold rounded font-mono">
                      {parsedResult.courseCode}
                    </span>
                    <span className="font-bold text-sm text-[var(--ink)]">
                      {parsedResult.courseTitle}
                    </span>
                    {parsedResult.instructor && (
                      <span className="text-xs text-[var(--muted)] font-light">
                        • {parsedResult.instructor}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="px-3 py-1 bg-[var(--surface-soft)] rounded-lg text-[var(--ink)]">
                    <strong>{parsedResult.deliverables.length}</strong> Deliverables
                  </div>
                  <div className="px-3 py-1 bg-[var(--surface-soft)] rounded-lg text-[var(--ink)]">
                    <strong>{parsedResult.exams.length}</strong> Exams
                  </div>
                </div>
              </div>

              {/* 1. Deliverables (Assignments & Labs Table) */}
              <div className="bmw-card space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                    <h4 className="text-sm font-bold text-[var(--ink)]">
                      Extracted Deliverables & Assignments ({parsedResult.deliverables.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">Maps to Tasks & Kanban</span>
                </div>

                <div className="space-y-2">
                  {parsedResult.deliverables.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        item.selected 
                          ? "bg-[var(--surface-card)] border-[var(--hairline-strong)] shadow-sm" 
                          : "bg-[var(--surface-soft)]/50 border-[var(--hairline)] opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleDeliverable(item.id)}
                          className="text-[var(--primary)] cursor-pointer"
                        >
                          {item.selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                        
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => handleUpdateDeliverable(item.id, { title: e.target.value })}
                            className="w-full bg-transparent border-none outline-none font-bold text-xs text-[var(--ink)] focus:underline"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Due Date Picker */}
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--muted)]">
                          <Calendar className="w-3.5 h-3.5" />
                          <input
                            type="date"
                            value={item.dueDate}
                            onChange={(e) => handleUpdateDeliverable(item.id, { dueDate: e.target.value })}
                            className="bg-[var(--surface-soft)] border border-[var(--hairline)] px-2 py-1 rounded text-xs text-[var(--ink)] outline-none font-mono"
                          />
                        </div>

                        {/* Priority Selector */}
                        <select
                          value={item.priority}
                          onChange={(e) => handleUpdateDeliverable(item.id, { priority: e.target.value as any })}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded border outline-none cursor-pointer ${
                            item.priority === "high" ? "bg-red-500/15 text-red-500 border-red-500/30" :
                            item.priority === "medium" ? "bg-amber-500/15 text-amber-500 border-amber-500/30" :
                            "bg-blue-500/15 text-blue-500 border-blue-500/30"
                          }`}
                        >
                          <option value="high">HIGH</option>
                          <option value="medium">MEDIUM</option>
                          <option value="low">LOW</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Exams & Weight Breakdown Table */}
              <div className="bmw-card space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#d4af37]" />
                    <h4 className="text-sm font-bold text-[var(--ink)]">
                      Extracted Midterms & Final Exams ({parsedResult.exams.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--muted)]">Maps to Grade Predictor</span>
                </div>

                <div className="space-y-2">
                  {parsedResult.exams.map((exam) => (
                    <div 
                      key={exam.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        exam.selected 
                          ? "bg-[var(--surface-card)] border-[var(--hairline-strong)] shadow-sm" 
                          : "bg-[var(--surface-soft)]/50 border-[var(--hairline)] opacity-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleExam(exam.id)}
                          className="text-[var(--primary)] cursor-pointer"
                        >
                          {exam.selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                        </button>
                        
                        <div className="flex-1">
                          <input
                            type="text"
                            value={exam.name}
                            onChange={(e) => handleUpdateExam(exam.id, { name: e.target.value })}
                            className="w-full bg-transparent border-none outline-none font-bold text-xs text-[var(--ink)] focus:underline"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Exam Date Picker */}
                        <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--muted)]">
                          <Calendar className="w-3.5 h-3.5" />
                          <input
                            type="date"
                            value={exam.date}
                            onChange={(e) => handleUpdateExam(exam.id, { date: e.target.value })}
                            className="bg-[var(--surface-soft)] border border-[var(--hairline)] px-2 py-1 rounded text-xs text-[var(--ink)] outline-none font-mono"
                          />
                        </div>

                        {/* Weight Input */}
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span className="text-[var(--muted)]">Weight:</span>
                          <input
                            type="number"
                            value={exam.weightPercent}
                            onChange={(e) => handleUpdateExam(exam.id, { weightPercent: Number(e.target.value) })}
                            className="w-14 bg-[var(--surface-soft)] border border-[var(--hairline)] px-2 py-1 rounded text-xs text-[var(--ink)] font-bold text-center outline-none"
                          />
                          <span className="text-[var(--muted)]">%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Final Commit & Auto-Save Actions Strip */}
              <div className="p-5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                
                <label className="flex items-center gap-2.5 text-xs text-[var(--ink)] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToDocsChecked}
                    onChange={(e) => setSaveToDocsChecked(e.target.checked)}
                    className="rounded border-[var(--hairline)] text-[var(--primary)] focus:ring-0 cursor-pointer"
                  />
                  <span>Also save this syllabus document into my Course Documents repository</span>
                </label>

                <button
                  onClick={handleImportToPlatform}
                  className="px-8 py-3 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase rounded-full cursor-pointer shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1-Click Import to Tasks & Exams</span>
                </button>

              </div>

            </div>
          )}

        </div>
      )}

      {/* =========================================================================
          TAB 2: REGULAR COURSE DOCUMENT & SLIDE READER
         ========================================================================= */}
      {activeTab === "reader" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Sidebar: Document List */}
          <div className="lg:col-span-4 space-y-4">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--muted)] uppercase font-mono">
                STORED DOCUMENTS ({documents.length})
              </span>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Doc</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-8 border border-dashed border-[var(--hairline-strong)] rounded-2xl text-center space-y-3 bg-[var(--surface-card)]">
                <FolderOpen className="w-8 h-8 text-[var(--muted)] mx-auto opacity-50" />
                <div className="text-xs font-bold text-[var(--ink)]">No documents uploaded yet</div>
                <p className="text-[11px] text-[var(--muted)] font-light max-w-xs mx-auto">
                  Upload your lecture slides or run the Syllabus Auto-Parser to store course files.
                </p>
                <button
                  onClick={() => setActiveTab("parser")}
                  className="px-3 py-1.5 bg-[var(--surface-soft)] border border-[var(--hairline)] hover:border-[var(--primary)] text-[var(--primary)] text-xs font-bold rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>Open Syllabus Auto-Parser</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setCurrentPage(0); }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                      activeDoc?.id === doc.id
                        ? "bg-[var(--surface-card)] border-[var(--primary)] shadow-sm"
                        : "bg-[var(--surface-card)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                    }`}
                  >
                    <div className="space-y-1 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[var(--primary)] text-[9px] font-mono font-bold rounded">
                          {doc.courseCode}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--muted)]">
                          {doc.type} • {doc.pageCount} Pages
                        </span>
                      </div>
                      <div className="text-xs font-bold text-[var(--ink)] truncate">
                        {doc.title}
                      </div>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded transition-all cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Right Area: Document Content & Reader Stage */}
          <div className="lg:col-span-8 space-y-4">
            
            {activeDoc ? (
              <div className="bmw-card space-y-4">
                
                {/* Document Stage Header */}
                <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[var(--primary)] text-white text-[10px] font-mono font-bold rounded">
                        {activeDoc.courseCode}
                      </span>
                      <span className="text-xs font-mono text-[var(--muted)]">{activeDoc.type}</span>
                    </div>
                    <h3 className="text-base font-bold text-[var(--ink)] mt-1">
                      {activeDoc.title}
                    </h3>
                  </div>

                  {/* Action Toolbar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateDocFlashcards(activeDoc)}
                      disabled={isGeneratingFlashcards}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-[var(--primary)] hover:from-purple-500 hover:to-[var(--primary-active)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
                      title="Generate 3-Tier AI Flashcards from this document"
                    >
                      {isGeneratingFlashcards ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Brain className="w-3.5 h-3.5" />
                          <span>AI Flashcards</span>
                        </>
                      )}
                    </button>

                    {/* Zoom controls */}
                    <div className="flex items-center gap-1 bg-[var(--surface-soft)] p-1 rounded-lg border border-[var(--hairline)]">
                      <button
                        onClick={() => setZoomLevel(prev => Math.max(70, prev - 10))}
                        className="p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-mono text-[var(--ink)] px-1.5 font-bold">{zoomLevel}%</span>
                      <button
                        onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))}
                        className="p-1 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Flashcards Generation Success Banner */}
                {flashcardsSuccessMessage && (
                  <div className="p-3 bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono text-xs rounded-xl flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span>{flashcardsSuccessMessage}</span>
                    </div>
                    <button
                      onClick={() => setFlashcardsSuccessMessage("")}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Page Viewer Stage */}
                <div 
                  className="bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl p-6 sm:p-8 min-h-[360px] font-mono text-xs leading-relaxed text-[var(--ink)] overflow-auto select-text shadow-inner"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top left" }}
                >
                  <pre className="whitespace-pre-wrap font-sans">
                    {activeDoc.content[currentPage] || "No content available on this page."}
                  </pre>
                </div>

                {/* Bottom Page Navigation Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)] text-xs font-mono">
                  <div className="text-[var(--muted)]">
                    Page <strong>{currentPage + 1}</strong> of <strong>{activeDoc.pageCount}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      className="px-3 py-1.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-card)] disabled:opacity-30 border border-[var(--hairline)] text-[var(--ink)] rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev Page</span>
                    </button>

                    <button
                      disabled={currentPage >= activeDoc.pageCount - 1}
                      onClick={() => setCurrentPage(prev => Math.min(activeDoc.pageCount - 1, prev + 1))}
                      className="px-3 py-1.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-card)] disabled:opacity-30 border border-[var(--hairline)] text-[var(--ink)] rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <span>Next Page</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bmw-card p-12 text-center text-[var(--muted)]">
                Select a document from the left or upload a new one to view.
              </div>
            )}

          </div>

        </div>
      )}

      {/* =========================================================================
          ADD NEW DOCUMENT MODAL
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0b1017] border border-white/15 text-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <Upload className="w-4 h-4 text-[var(--primary)]" />
                <span>UPLOAD COURSE DOCUMENT</span>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">DOCUMENT TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CS 350 - OS161 Virtual Memory Architecture Notes"
                  className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white outline-none rounded-xl focus:border-[var(--primary)] font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">COURSE CODE</label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. CS 350"
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white outline-none rounded-xl focus:border-[var(--primary)] font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">DOCUMENT TYPE</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as any)}
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white outline-none rounded-xl"
                  >
                    <option value="Lecture Slides">Lecture Slides</option>
                    <option value="Syllabus">Syllabus</option>
                    <option value="Past Exam">Past Exam</option>
                    <option value="Lab Manual">Lab Manual</option>
                    <option value="Notes">Personal Notes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">CONTENT / TEXT (OPTIONAL)</label>
                <textarea
                  rows={4}
                  value={newPageContent}
                  onChange={(e) => setNewPageContent(e.target.value)}
                  placeholder="Paste lecture text or reading highlights here. Use '---' on a new line to create page breaks."
                  className="w-full p-3 bg-[#090d12] border border-white/15 text-white outline-none rounded-xl focus:border-[var(--primary)] font-mono text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-1/3 py-2.5 border border-white/15 text-slate-300 hover:text-white rounded-xl uppercase font-bold text-xs cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white rounded-xl uppercase font-bold text-xs cursor-pointer shadow-sm"
                >
                  SAVE & VIEW DOCUMENT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
