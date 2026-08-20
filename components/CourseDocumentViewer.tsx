"use client";

import React, { useState } from "react";
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
  Highlighter
} from "lucide-react";

interface DocumentItem {
  id: string;
  courseCode: string;
  title: string;
  type: "Syllabus" | "Lecture Slides" | "Past Exam" | "Lab Manual";
  pageCount: number;
  content: string[];
}

const SAMPLE_DOCS: DocumentItem[] = [
  {
    id: "doc1",
    courseCode: "CS 350",
    title: "CS 350 - Operating Systems Syllabus & Grading Policies",
    type: "Syllabus",
    pageCount: 3,
    content: [
      "Page 1: Course Overview & Learning Objectives\n- Instructor: Dr. Chen (Office Hours: Tue/Thu 3-5 PM)\n- Topics: Thread concurrency, virtual memory paging, file systems, deadlock prevention.\n- Prerequisites: CS 246, CS 251.",
      "Page 2: Grading Scheme & Deliverables Breakdown\n- Programming Assignments (OS161 Kernel): 25%\n- Midterm Exam: 25%\n- Lab Quizzes: 15%\n- Comprehensive Final Exam: 35%\n- Note: Must achieve >= 50% weighted average on exams to pass the course.",
      "Page 3: Academic Integrity & Collaboration Rules\n- All kernel code submissions are evaluated via automated plagiarism detection (MOSS).\n- Pair programming is permitted on designated milestones with signed declarations."
    ]
  },
  {
    id: "doc2",
    courseCode: "CS 341",
    title: "CS 341 - Lecture 08: Dynamic Programming & Matrix Chain Multiplication",
    type: "Lecture Slides",
    pageCount: 3,
    content: [
      "Page 1: Introduction to Dynamic Programming\n- Key Properties: Optimal Substructure & Overlapping Subproblems.\n- Memoization (Top-Down with recursion cache) vs. Tabulation (Bottom-Up iterative table).",
      "Page 2: Matrix Chain Multiplication Formulation\n- Given a sequence of matrices A1, A2, ..., An, find the optimal parenthesization to minimize scalar multiplications.\n- Recurrence: m[i, j] = min_{i <= k < j} { m[i, k] + m[k+1, j] + p_{i-1} * p_k * p_j }.",
      "Page 3: Algorithm Analysis & Complexity\n- Time Complexity: O(n^3) due to n^2 subproblems each requiring O(n) split evaluation.\n- Space Complexity: O(n^2) auxiliary matrix table."
    ]
  },
  {
    id: "doc3",
    courseCode: "MATH 201",
    title: "MATH 201 - Midterm Formula Sheet & Key Theorems",
    type: "Past Exam",
    pageCount: 2,
    content: [
      "Page 1: Linear Transformations & Matrix Algebra\n- Rank-Nullity Theorem: dim(V) = rank(T) + nullity(T).\n- Determinant properties: det(AB) = det(A)det(B); det(A^-1) = 1/det(A).\n- Invertible Matrix Theorem: det(A) != 0 <=> cols of A are linearly independent.",
      "Page 2: Eigenvalues, Diagonalization & Spectral Theorem\n- Characteristic polynomial: det(A - lambda*I) = 0.\n- Diagonalization: A = P * D * P^-1 exists iff A has n linearly independent eigenvectors.\n- Symmetric matrices have real eigenvalues and orthogonal eigenvectors."
    ]
  }
];

export default function CourseDocumentViewer() {
  const { user, getUserData } = useAuth();
  const userData = getUserData();

  const [selectedDocId, setSelectedDocId] = useState<string>(SAMPLE_DOCS[0].id);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const activeDoc = SAMPLE_DOCS.find(d => d.id === selectedDocId) || SAMPLE_DOCS[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
            ACADEMIC REPOSITORY
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            Course Document & Slide Reader
          </h2>
          <p className="text-xs text-[var(--muted)] font-light mt-1">
            Preview syllabi, lecture slides, and past exams directly in your workspace.
          </p>
        </div>
      </div>

      {/* Main Two-Column Reader Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Document File List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold font-mono text-[var(--muted)] uppercase tracking-wider px-1">
            ENROLLED COURSE MATERIALS
          </div>

          <div className="space-y-2.5">
            {SAMPLE_DOCS.map(doc => {
              const isSelected = doc.id === selectedDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => { setSelectedDocId(doc.id); setCurrentPage(0); }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? "bg-[var(--surface-card)] border-[var(--primary)] shadow-md"
                      : "bg-[var(--surface-soft)] border-[var(--hairline)] hover:border-[var(--primary)]/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">
                      {doc.courseCode}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      {doc.pageCount} Pages • {doc.type}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[var(--ink)] leading-snug">
                    {doc.title}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: In-Browser PDF Document Canvas (8 Cols) */}
        <div className="lg:col-span-8 p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl shadow-xl space-y-5 flex flex-col justify-between min-h-[500px]">
          
          {/* Reader Top Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-[var(--ink)]">{activeDoc.title}</div>
              <div className="text-[10px] text-[var(--muted)] font-mono">
                Page {currentPage + 1} of {activeDoc.pageCount}
              </div>
            </div>

            {/* Zoom Controls & Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.max(80, prev - 10))}
                className="p-1.5 rounded bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs text-[var(--ink)] hover:text-[var(--primary)] cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-[var(--muted)] w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(140, prev + 10))}
                className="p-1.5 rounded bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs text-[var(--ink)] hover:text-[var(--primary)] cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Document Content Page Sheet */}
          <div className="p-8 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl my-auto font-mono text-xs text-[var(--ink)] leading-relaxed whitespace-pre-line shadow-inner overflow-y-auto max-h-[360px]" style={{ fontSize: `${(zoomLevel / 100) * 12}px` }}>
            {activeDoc.content[currentPage] || "End of Document."}
          </div>

          {/* Reader Page Navigation Footer */}
          <div className="flex items-center justify-between border-t border-[var(--hairline)] pt-4">
            <button
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>PREVIOUS PAGE</span>
            </button>

            <span className="text-xs font-mono text-[var(--muted)]">
              PAGE {currentPage + 1} / {activeDoc.pageCount}
            </span>

            <button
              disabled={currentPage === activeDoc.pageCount - 1}
              onClick={() => setCurrentPage(prev => Math.min(activeDoc.pageCount - 1, prev + 1))}
              className="px-3.5 py-2 rounded-lg bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-bold text-[var(--ink)] flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
            >
              <span>NEXT PAGE</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
