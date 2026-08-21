"use client";

import React, { useState } from "react";
import { useAuth, ExamItem } from "@/lib/auth-context";
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Plus, 
  BookOpen, 
  Check, 
  BrainCircuit, 
  ArrowRight, 
  Layers, 
  Flame, 
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface StudyMilestone {
  day: string;
  focus: string;
  deliverables: string[];
}

export default function ExamsHub() {
  const { user, userData, addExam, deleteExam, addTask } = useAuth();

  // Modals & State
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);
  const [selectedExamForAI, setSelectedExamForAI] = useState<ExamItem | null>(userData.exams[0] || null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiEngine, setAiEngine] = useState<"smart" | "gemini">("smart");
  const [generatedPlan, setGeneratedPlan] = useState<StudyMilestone[] | null>(null);
  const [planSuccessMessage, setPlanSuccessMessage] = useState<string | null>(null);

  // New Exam Form
  const [newExamTitle, setNewExamTitle] = useState("");
  const [newCourseCode, setNewCourseCode] = useState(userData.courses[0]?.courseCode || "CS 341");
  const [newExamDate, setNewExamDate] = useState("");
  const [newWeight, setNewWeight] = useState(30);
  const [newLocation, setNewLocation] = useState("");
  const [newTopics, setNewTopics] = useState("");

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamTitle || !newExamDate) return;

    addExam({
      title: newExamTitle.trim(),
      courseCode: newCourseCode,
      examDate: new Date(newExamDate).toISOString(),
      weightPercent: Number(newWeight),
      location: newLocation.trim() || "Main Examination Hall",
      topics: newTopics ? newTopics.split(",").map(t => t.trim()) : ["Core Course Modules"]
    });

    setNewExamTitle("");
    setNewExamDate("");
    setNewLocation("");
    setNewTopics("");
    setIsAddExamModalOpen(false);
  };

  // Generate AI Plan for Selected Exam
  const handleGeneratePlan = (exam: ExamItem) => {
    setSelectedExamForAI(exam);
    setIsGeneratingAI(true);
    setGeneratedPlan(null);
    setPlanSuccessMessage(null);

    setTimeout(() => {
      // Generate realistic tailored milestone schedule
      const milestones: StudyMilestone[] = [
        {
          day: "Day 1 (Foundation & Theory)",
          focus: "Comprehensive syllabus audit & concept mapping",
          deliverables: [
            `Audit ${exam.courseCode} lecture notes for ${exam.topics.slice(0, 2).join(" & ")}`,
            "Compile 1-page formula sheet and core definitions"
          ]
        },
        {
          day: "Day 2 (Problem Sets & Application)",
          focus: "High-yield problem solving and algorithmic exercises",
          deliverables: [
            `Solve 5 past midterm problems on ${exam.topics[0] || "Module 1"}`,
            "Review tricky homework edge cases and error patterns"
          ]
        },
        {
          day: "Day 3 (Timed Mock Exam)",
          focus: "Full-length simulation under test conditions",
          deliverables: [
            `Complete 90-minute timed mock exam for ${exam.courseCode}`,
            "Grade mock exam, identify weak topics, and revise weak spots"
          ]
        },
        {
          day: "Day 4 (Final Synthesis & Readiness)",
          focus: "Rapid review and memory reinforcement",
          deliverables: [
            "Active recall on master summary sheet",
            `Verify test room location (${exam.location}) and required materials`
          ]
        }
      ];

      setGeneratedPlan(milestones);
      setIsGeneratingAI(false);
    }, 700);
  };

  // 1-Click Inject Milestones into Tasks
  const handleInjectMilestonesToTasks = () => {
    if (!generatedPlan || !selectedExamForAI) return;

    generatedPlan.forEach((m, idx) => {
      m.deliverables.forEach(d => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + idx + 1);
        addTask({
          title: `[${selectedExamForAI.courseCode} Revision] ${d}`,
          courseCode: selectedExamForAI.courseCode,
          dueDate: dueDate.toISOString(),
          priority: idx === 0 ? "high" : "medium",
          status: "todo",
          category: "Exam Prep"
        });
      });
    });

    setPlanSuccessMessage("All 4 daily study milestones were added to your active Task Tracker!");
  };

  // Sort exams chronologically
  const sortedExams = [...userData.exams].sort((a, b) => 
    new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
  );

  return (
    <div className="space-y-10">
      
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
            ASSESSMENTS & FINALS
          </div>
          <h2 className="text-2xl font-bold text-[var(--ink)]">
            Upcoming Exams & Schedule
          </h2>
          <p className="text-xs font-light text-[var(--muted)] mt-0.5">
            Automated date categorization and 1-click step-by-step milestone generation.
          </p>
        </div>

        <button
          onClick={() => setIsAddExamModalOpen(true)}
          className="bmw-btn-primary !h-10 !text-xs !py-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1" />
          <span>ADD UPCOMING EXAM</span>
        </button>
      </div>

      {/* 2. Main Split Grid: Chronological Schedule on Left, AI Planner on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (6 cols): Chronological Exams Schedule */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] flex items-center justify-between">
              <span>SCHEDULED ASSESSMENTS ({sortedExams.length})</span>
              <span className="font-mono text-red-600 dark:text-red-400">CHRONOLOGICAL ORDER</span>
            </div>

            {sortedExams.map((exam) => {
              const daysLeft = Math.ceil((new Date(exam.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isUrgent = daysLeft <= 7;

              return (
                <div 
                  key={exam.id}
                  className={`bmw-card space-y-4 transition-colors ${
                    isUrgent ? "border-l-4 border-l-red-600" : "border-l-4 border-l-[var(--primary)]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[var(--primary)]">#{exam.courseCode}</span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                          isUrgent ? "bg-red-500/15 text-red-600 dark:text-red-400" : "bg-[var(--surface-soft)] text-[var(--muted)]"
                        }`}>
                          {daysLeft > 0 ? `${daysLeft} DAYS REMAINING` : "TODAY"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[var(--ink)]">{exam.title}</h3>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-base font-bold text-red-600 dark:text-red-400">
                        {new Date(exam.examDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      <div className="text-[11px] text-[var(--muted)]">{exam.weightPercent}% OF GRADE</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs text-[var(--ink)] font-light space-y-1">
                    <div>Location: <strong className="font-semibold text-[var(--ink)]">{exam.location}</strong></div>
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {exam.topics.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-[var(--canvas)] border border-[var(--hairline)] text-[10px] font-semibold text-[var(--primary)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Generate AI Plan Action */}
                  <div className="pt-2 flex justify-between items-center">
                    <button
                      onClick={() => handleGeneratePlan(exam)}
                      className="bmw-btn-primary !h-9 !text-xs !py-1.5 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>GENERATE AI STUDY PLAN</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {sortedExams.length === 0 && (
              <div className="bmw-card p-8 text-center text-xs text-[var(--muted)] font-light">
                No upcoming exams scheduled. Click "Add Upcoming Exam" to configure your midterm dates.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (6 cols): AI Study Plan Generator Output */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bmw-card space-y-6">
            
            <div className="flex justify-between items-center pb-4 border-b border-[var(--hairline)]">
              <div>
                <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI REVISION BLUEPRINT</span>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)]">
                  {selectedExamForAI ? `${selectedExamForAI.courseCode} Revision Plan` : "Select an Exam"}
                </h3>
              </div>

              {/* Dual Engine Switcher */}
              <div className="flex items-center text-xs border border-[var(--hairline)]">
                <button
                  onClick={() => setAiEngine("smart")}
                  className={`px-2.5 py-1 font-bold uppercase transition-colors cursor-pointer ${
                    aiEngine === "smart" ? "bg-[var(--primary)] text-white" : "bg-[var(--canvas)] text-[var(--muted)]"
                  }`}
                  title="Smart Algorithmic Engine (Instant & Offline)"
                >
                  SMART
                </button>
                <button
                  onClick={() => setAiEngine("gemini")}
                  className={`px-2.5 py-1 font-bold uppercase transition-colors cursor-pointer border-l border-[var(--hairline)] ${
                    aiEngine === "gemini" ? "bg-[var(--primary)] text-white" : "bg-[var(--canvas)] text-[var(--muted)]"
                  }`}
                  title="Google Gemini AI Engine"
                >
                  GEMINI
                </button>
              </div>
            </div>

            {isGeneratingAI && (
              <div className="p-12 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-sm font-bold text-[var(--ink)]">Generating Structured Revision Milestones...</div>
                <div className="text-xs text-[var(--muted)] font-light">Analyzing syllabus topics and optimal study spacing.</div>
              </div>
            )}

            {!isGeneratingAI && generatedPlan && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {planSuccessMessage && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{planSuccessMessage}</span>
                  </div>
                )}

                <div className="space-y-3">
                  {generatedPlan.map((m, idx) => (
                    <div key={idx} className="p-4 bg-[var(--surface-soft)] border border-[var(--hairline)] space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--primary)]">{m.day}</span>
                        <span className="font-semibold text-[var(--ink)]">{m.focus}</span>
                      </div>
                      <ul className="space-y-1 text-xs text-[var(--body)] font-light list-disc list-inside">
                        {m.deliverables.map((d, dIdx) => (
                          <li key={dIdx}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-[var(--hairline)] flex justify-end">
                  <button
                    onClick={handleInjectMilestonesToTasks}
                    className="bmw-btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ADD ALL MILESTONES TO MY TASK TRACKER</span>
                  </button>
                </div>
              </div>
            )}

            {!isGeneratingAI && !generatedPlan && (
              <div className="p-12 text-center text-xs text-[var(--muted)] font-light space-y-3 border border-dashed border-[var(--hairline)]">
                <BrainCircuit className="w-8 h-8 text-[var(--primary)] mx-auto opacity-70" />
                <p>Click <strong>"Generate AI Study Plan"</strong> on any exam card on the left to create a customized step-by-step revision breakdown.</p>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 3. Modal: Add Upcoming Exam */}
      {isAddExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-[var(--canvas)] border border-[var(--hairline-strong)] w-full max-w-md p-8 relative">
            <button
              onClick={() => setIsAddExamModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6 pr-10">
              <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
                ASSESSMENT SCHEDULE
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)]">Add Upcoming Exam</h3>
              <p className="text-xs text-[var(--muted)] font-light">Categorized chronologically by date.</p>
            </div>

            <form onSubmit={handleAddExam} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">EXAM TITLE</label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder="e.g. Operating Systems Final Exam"
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">COURSE</label>
                  <select
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-bold outline-none"
                  >
                    {userData.courses.map(c => (
                      <option key={c.id} value={c.courseCode}>#{c.courseCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">WEIGHT (% OF GRADE)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newWeight}
                    onChange={(e) => setNewWeight(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">EXAM DATE & TIME</label>
                <input
                  type="datetime-local"
                  required
                  value={newExamDate}
                  onChange={(e) => setNewExamDate(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">LOCATION / HALL</label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Davis Centre Hall 1350"
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">TOPICS COVERED (COMMA SEPARATED)</label>
                <input
                  type="text"
                  value={newTopics}
                  onChange={(e) => setNewTopics(e.target.value)}
                  placeholder="e.g. Virtual Memory, Deadlocks, Paging"
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setIsAddExamModalOpen(false)}
                  className="bmw-btn-secondary !h-10 !text-xs !py-2"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bmw-btn-primary !h-10 !text-xs !py-2"
                >
                  SAVE EXAM
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
