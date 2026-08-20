"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
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
  Highlighter,
  Plus,
  Trash2,
  Upload,
  CheckCircle2
} from "lucide-react";

export interface DocumentItem {
  id: string;
  courseCode: string;
  title: string;
  type: "Syllabus" | "Lecture Slides" | "Past Exam" | "Lab Manual" | "Notes";
  pageCount: number;
  content: string[];
}

export default function CourseDocumentViewer() {
  const { user, userData } = useAuth();
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

  // New Document Form
  const [newTitle, setNewTitle] = useState("");
  const [newCourseCode, setNewCourseCode] = useState(userData.courses[0]?.courseCode || "CS 101");
  const [newDocType, setNewDocType] = useState<DocumentItem["type"]>("Lecture Slides");
  const [newPageContent, setNewPageContent] = useState("");

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
            ACADEMIC REPOSITORY
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Course Document & Slide Reader
          </h2>
          <p className="text-xs text-[var(--muted)] font-light mt-0.5">
            Preview syllabi, lecture slides, and personal notes directly inside your portal.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {documents.length === 0 ? (
        /* Clean Slate Empty State */
        <div className="py-16 text-center space-y-4 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl p-8">
          <BookOpen className="w-10 h-10 text-[var(--primary)] mx-auto opacity-70" />
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[var(--ink)]">No Course Documents Uploaded</h3>
            <p className="text-xs text-[var(--muted)] font-light leading-relaxed">
              Your document repository is clear. Upload course syllabi, lecture slide notes, or past exam formula sheets to read and annotate them directly here.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase rounded-lg cursor-pointer transition-all shadow-sm"
          >
            + Upload First Document
          </button>
        </div>
      ) : (
        /* Main Two-Column Reader Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Document File List (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="text-xs font-bold font-mono text-[var(--muted)] uppercase tracking-wider px-1">
              MY COURSE MATERIALS ({documents.length})
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {documents.map(doc => {
                const isSelected = doc.id === selectedDocId;
                return (
                  <div
                    key={doc.id}
                    onClick={() => { setSelectedDocId(doc.id); setCurrentPage(0); }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-[var(--surface-card)] border-[var(--primary)] shadow-sm ring-1 ring-[var(--primary)]"
                        : "bg-[var(--surface-soft)] border-[var(--hairline)] hover:border-[var(--primary)]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                        {doc.courseCode}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--muted)] font-mono">
                          {doc.pageCount} {doc.pageCount === 1 ? "Page" : "Pages"} • {doc.type}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                          className="text-[var(--muted)] hover:text-red-500 p-1 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-[var(--ink)] leading-snug line-clamp-2">
                      {doc.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interactive Document Canvas (8 Cols) */}
          <div className="lg:col-span-8 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
            
            {/* Toolbar */}
            {activeDoc && (
              <div className="p-3.5 bg-[var(--surface-soft)] border-b border-[var(--hairline)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--ink)] truncate max-w-[280px]">
                    {activeDoc.title}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    Page {currentPage + 1} of {activeDoc.pageCount}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(75, prev - 15))}
                    className="p-1.5 hover:bg-[var(--surface-strong)] text-[var(--ink)] rounded border border-[var(--hairline)] cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-[var(--muted)] w-10 text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(prev => Math.min(150, prev + 15))}
                    className="p-1.5 hover:bg-[var(--surface-strong)] text-[var(--ink)] rounded border border-[var(--hairline)] cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Document Content Page */}
            {activeDoc && (
              <div className="p-6 md:p-8 min-h-[380px] bg-[var(--canvas)] flex flex-col justify-between">
                <div 
                  className="prose dark:prose-invert max-w-none font-mono text-xs leading-relaxed text-[var(--ink)] whitespace-pre-wrap transition-all"
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top left" }}
                >
                  {activeDoc.content[currentPage] || activeDoc.content[0] || "No content on this page."}
                </div>

                {/* Page Navigation Footer */}
                <div className="flex items-center justify-between pt-6 border-t border-[var(--hairline)] mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] disabled:opacity-40 text-xs font-bold font-mono text-[var(--ink)] rounded border border-[var(--hairline)] flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>PREVIOUS PAGE</span>
                  </button>

                  <span className="text-xs font-mono text-[var(--muted)]">
                    PAGE {currentPage + 1} / {activeDoc.pageCount}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(activeDoc.pageCount - 1, prev + 1))}
                    disabled={currentPage === activeDoc.pageCount - 1}
                    className="px-3 py-1.5 bg-[var(--surface-soft)] hover:bg-[var(--surface-strong)] disabled:opacity-40 text-xs font-bold font-mono text-[var(--ink)] rounded border border-[var(--hairline)] flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>NEXT PAGE</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Upload Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f141c] border border-white/15 text-white w-full max-w-lg p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--primary)]" />
                <span>Upload Course Document</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">DOCUMENT TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. CS 350 - OS161 Virtual Memory Architecture Notes"
                  className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white outline-none rounded-xl focus:border-[var(--primary)]"
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
