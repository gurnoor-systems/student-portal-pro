"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { 
  BarChart3, 
  Flame, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  Sparkles, 
  ArrowUpRight,
  Calculator,
  Percent,
  Target,
  Sliders,
  Check,
  Plus,
  Trash2,
  Edit2,
  Bot,
  AlertTriangle,
  Zap,
  HelpCircle
} from "lucide-react";

interface GradeCategory {
  id: string;
  name: string;
  weight: number; // percentage (e.g. 25)
  currentScore: number; // percentage (e.g. 88)
}

export default function AnalyticsHub() {
  const { user, getUserData } = useAuth();
  const userData = getUserData();

  const [targetGpa, setTargetGpa] = useState(3.9);
  const [studyHoursGoal, setStudyHoursGoal] = useState(30);

  // Smart Grade Predictor state
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(userData.courses[0]?.courseCode || "CS 350");
  const [targetGradePercent, setTargetGradePercent] = useState<number>(85); // 85% for an A
  const [isCustomTarget, setIsCustomTarget] = useState<boolean>(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>("");
  const [newCatWeight, setNewCatWeight] = useState<number>(10);
  const [newCatScore, setNewCatScore] = useState<number>(90);

  const [categories, setCategories] = useState<GradeCategory[]>([
    { id: "1", name: "Problem Sets & Homework", weight: 25, currentScore: 100 },
    { id: "2", name: "Midterm Examination", weight: 25, currentScore: 82 },
    { id: "3", name: "Lab & Programming Projects", weight: 15, currentScore: 88 },
  ]);

  // Dynamic Focus Room Study History & Streak
  const focusHistory: Array<{ id: string; date: string; minutes: number; taskTitle: string }> = useMemo(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`student_portal_user_${user.id}_focus_history`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }, [user]);

  const loggedFocusMinutesTotal = useMemo(() => {
    return focusHistory.reduce((sum, item) => sum + (item.minutes || 0), 0);
  }, [focusHistory]);

  const loggedFocusHours = Math.round((loggedFocusMinutesTotal / 60) * 10) / 10;

  // Velocity data for Monday through Sunday
  const weeklyVelocity = [
    { day: "MON", hours: 4.5 + (loggedFocusHours > 0 ? 0.5 : 0), tasksCompleted: 3, percentage: 75 },
    { day: "TUE", hours: 6.0, tasksCompleted: 4, percentage: 100 },
    { day: "WED", hours: 5.2, tasksCompleted: 3, percentage: 85 },
    { day: "THU", hours: 7.5, tasksCompleted: 5, percentage: 100 },
    { day: "FRI", hours: 4.0, tasksCompleted: 2, percentage: 65 },
    { day: "SAT", hours: 3.5, tasksCompleted: 2, percentage: 55 },
    { day: "SUN", hours: 5.8 + loggedFocusHours, tasksCompleted: 4, percentage: 90 },
  ];

  const totalWeeklyHours = weeklyVelocity.reduce((acc, curr) => acc + curr.hours, 0);
  const totalTasks = userData.tasks.length;
  const completedTasks = userData.tasks.filter(t => t.status === "completed").length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const studyStreak = 14 + (focusHistory.length > 0 ? Math.min(10, focusHistory.length) : 0);

  // Compute per-course statistics
  const courseAnalytics = userData.courses.map(c => {
    const courseTasks = userData.tasks.filter(t => t.courseCode === c.courseCode);
    const courseCompleted = courseTasks.filter(t => t.status === "completed").length;
    const courseExams = userData.exams.filter(e => e.courseCode === c.courseCode);
    const rate = courseTasks.length > 0 ? Math.round((courseCompleted / courseTasks.length) * 100) : 100;
    
    return {
      code: c.courseCode,
      name: c.courseName,
      total: courseTasks.length,
      completed: courseCompleted,
      rate,
      examsCount: courseExams.length
    };
  });

  // Calculate required final exam score
  const finalScoreCalculation = useMemo(() => {
    const currentWeightTotal = categories.reduce((sum, cat) => sum + cat.weight, 0);
    const currentPointsEarned = categories.reduce((sum, cat) => sum + (cat.currentScore * (cat.weight / 100)), 0);
    
    // Remaining weight is final exam
    const remainingWeight = Math.max(1, 100 - currentWeightTotal);
    const pointsNeeded = targetGradePercent - currentPointsEarned;
    const requiredFinalScore = Math.round((pointsNeeded / (remainingWeight / 100)) * 10) / 10;

    let difficulty: "Comfortable" | "Focused Prep" | "Demanding" | "High Stakes" | "Extra Credit Needed" = "Comfortable";
    let colorClass = "text-emerald-400";
    let badgeClass = "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";

    if (requiredFinalScore > 100) {
      difficulty = "Extra Credit Needed";
      colorClass = "text-purple-400";
      badgeClass = "bg-purple-500/15 text-purple-400 border border-purple-500/30";
    } else if (requiredFinalScore >= 90) {
      difficulty = "High Stakes";
      colorClass = "text-red-400";
      badgeClass = "bg-red-500/15 text-red-400 border border-red-500/30";
    } else if (requiredFinalScore >= 80) {
      difficulty = "Demanding";
      colorClass = "text-amber-400";
      badgeClass = "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    } else if (requiredFinalScore >= 65) {
      difficulty = "Focused Prep";
      colorClass = "text-blue-400";
      badgeClass = "bg-blue-500/15 text-blue-400 border border-blue-500/30";
    }

    return {
      currentPointsEarned: Math.round(currentPointsEarned * 10) / 10,
      currentWeightTotal,
      remainingWeight,
      requiredFinalScore,
      difficulty,
      colorClass,
      badgeClass
    };
  }, [categories, targetGradePercent]);

  // Handlers for dynamic categories
  const handleUpdateCategoryScore = (id: string, score: number) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, currentScore: score } : c));
  };

  const handleUpdateCategoryWeight = (id: string, weight: number) => {
    const safeWeight = Math.min(90, Math.max(1, weight));
    setCategories(prev => prev.map(c => c.id === id ? { ...c, weight: safeWeight } : c));
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.length <= 1) return;
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const currentTotal = categories.reduce((sum, c) => sum + c.weight, 0);
    const availableWeight = Math.max(5, 95 - currentTotal);
    const weightToUse = Math.min(availableWeight, newCatWeight);

    const newCategory: GradeCategory = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      weight: weightToUse,
      currentScore: Math.min(100, Math.max(0, newCatScore))
    };

    setCategories(prev => [...prev, newCategory]);
    setNewCatName("");
    setIsAddCategoryOpen(false);
  };

  // Launch AI Copilot Study Plan Generator
  const handleGenerateAIPlan = () => {
    const selectedCourse = userData.courses.find(c => c.courseCode === selectedCourseCode)?.courseName || selectedCourseCode;
    const query = `Create a prioritized study and revision roadmap for my ${selectedCourseCode} (${selectedCourse}) Final Exam. I need at least ${finalScoreCalculation.requiredFinalScore}% on the ${finalScoreCalculation.remainingWeight}% weight final exam to secure an overall ${targetGradePercent}% grade.`;

    // Dispatches custom event to trigger AI Copilot drawer
    const event = new CustomEvent("open-ai-agent-with-prompt", { detail: query });
    window.dispatchEvent(event);

    // Fallback: Also dispatch standard shortcut
    const openEvent = new CustomEvent("open-ai-agent");
    window.dispatchEvent(openEvent);
  };

  return (
    <div className="space-y-10">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--hairline)]">
        <div>
          <div className="text-[10px] font-mono tracking-[2px] uppercase text-[var(--primary)] font-bold">
            ACADEMIC INTELLIGENCE
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            Performance & Grade Predictor
          </h2>
          <p className="text-xs text-[var(--muted)] font-light mt-1">
            Track study consistency, deliverable velocity, and forecast final exam scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl flex items-center gap-2 shadow-sm">
            <Flame className="w-4 h-4 text-amber-500 fill-current" />
            <span className="text-xs font-mono font-bold text-[var(--ink)]">{studyStreak} DAY STREAK</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-2 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">WEEKLY STUDY HOURS</div>
          <div className="text-3xl font-bold text-[var(--ink)] flex items-baseline gap-2">
            <span>{totalWeeklyHours.toFixed(1)}h</span>
            <span className="text-xs text-[var(--muted)] font-normal">/ {studyHoursGoal}h</span>
          </div>
          <div className="w-full h-1.5 bg-[var(--surface-soft)] rounded-full overflow-hidden mt-2">
            <div 
              className="h-full bg-[var(--primary)]"
              style={{ width: `${Math.min(100, Math.round((totalWeeklyHours / studyHoursGoal) * 100))}%` }}
            />
          </div>
        </div>

        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-2 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">OVERALL COMPLETION</div>
          <div className="text-3xl font-bold text-emerald-500">{overallRate}%</div>
          <div className="text-xs text-[var(--muted)] font-light">{completedTasks} of {totalTasks} deliverables finished</div>
        </div>

        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-2 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">SEMESTER GPA TARGET</div>
          <div className="text-3xl font-bold text-[var(--primary)]">{targetGpa.toFixed(2)}</div>
          <div className="text-xs text-[var(--muted)] font-light">Honors Standing (Top 5%)</div>
        </div>

        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-2 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">ACTIVE COURSES</div>
          <div className="text-3xl font-bold text-[var(--ink)]">{userData.courses.length}</div>
          <div className="text-xs text-[var(--muted)] font-light">{user?.semester || "Fall 2026"} Term</div>
        </div>

      </div>

      {/* SMART GPA & FINAL EXAM SCORE PREDICTOR MODULE */}
      <div className="p-6 sm:p-8 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shadow-sm">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                Smart Final Exam Grade Predictor
              </h3>
              <p className="text-xs text-[var(--muted)] font-light">
                Calculate the exact score needed on your final exam to secure your target letter grade.
              </p>
            </div>
          </div>

          {/* Course Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[var(--muted)]">Course:</span>
            <select
              value={selectedCourseCode}
              onChange={(e) => setSelectedCourseCode(e.target.value)}
              className="px-3 py-1.5 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-bold text-[var(--ink)] rounded-xl outline-none cursor-pointer hover:border-[var(--primary)] transition-colors"
            >
              {userData.courses.map(c => (
                <option key={c.id} value={c.courseCode}>{c.courseCode} - {c.courseName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Grade Breakdown Sliders + Dynamic Weight Editor */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[var(--ink)] uppercase font-mono tracking-wider flex items-center gap-2">
                <span>Current Coursework Grades</span>
                <span className="text-[10px] text-[var(--muted)] font-normal">
                  ({finalScoreCalculation.currentWeightTotal}% Coursework + {finalScoreCalculation.remainingWeight}% Final)
                </span>
              </div>

              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-2.5 py-1 bg-[var(--surface-soft)] hover:bg-[var(--primary)] text-[var(--muted)] hover:text-white border border-[var(--hairline)] hover:border-[var(--primary)] text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Component</span>
              </button>
            </div>

            {/* Category Cards */}
            <div className="space-y-3.5">
              {categories.map(cat => (
                <div key={cat.id} className="p-4 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl space-y-2.5 shadow-sm group">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--ink)]">{cat.name}</span>
                    
                    <div className="flex items-center gap-3">
                      {/* Editable Weight */}
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[var(--muted)] bg-[var(--canvas)] px-2 py-0.5 rounded border border-[var(--hairline)]">
                        <span>Weight:</span>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={cat.weight}
                          onChange={(e) => handleUpdateCategoryWeight(cat.id, parseInt(e.target.value, 10) || 1)}
                          className="w-8 bg-transparent text-center font-bold text-[var(--ink)] focus:outline-none"
                        />
                        <span>%</span>
                      </div>

                      {/* Current Score Tag */}
                      <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded">
                        {cat.currentScore}%
                      </span>

                      {/* Delete button (if more than 1 category) */}
                      {categories.length > 1 && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-[var(--muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Remove Component"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Dual Tone Slider */}
                  <div className="relative flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={cat.currentScore}
                      onChange={(e) => handleUpdateCategoryScore(cat.id, Number(e.target.value))}
                      className="w-full h-2 bg-slate-300 dark:bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Target Grade Selector (Full Expanded University Scale + Custom Input) */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-[var(--muted)] uppercase font-bold tracking-wider">
                  TARGET LETTER GRADE & PERCENTAGE
                </label>

                {/* Toggle Custom Target */}
                <button
                  type="button"
                  onClick={() => setIsCustomTarget(!isCustomTarget)}
                  className="text-[11px] font-mono text-[var(--primary)] hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{isCustomTarget ? "Use Letter Presets" : "Enter Custom Target %"}</span>
                </button>
              </div>

              {/* Custom Input Box if toggled */}
              {isCustomTarget ? (
                <div className="p-3.5 bg-[var(--surface-soft)] border border-[var(--primary)]/40 rounded-xl flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)] font-bold">Custom Target:</span>
                  <input
                    type="number"
                    min={30}
                    max={100}
                    step={0.5}
                    value={targetGradePercent}
                    onChange={(e) => setTargetGradePercent(parseFloat(e.target.value) || 50)}
                    className="w-24 px-3 py-1 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-sm font-bold text-[var(--primary)] text-center focus:outline-none focus:border-[var(--primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--primary)]">%</span>
                  
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={targetGradePercent}
                    onChange={(e) => setTargetGradePercent(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--primary)] ml-2"
                  />
                </div>
              ) : (
                /* Preset Letter Grade Grid (8 Grades) */
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[
                    { label: "A+", val: 90 },
                    { label: "A", val: 85 },
                    { label: "A-", val: 80 },
                    { label: "B+", val: 77 },
                    { label: "B", val: 73 },
                    { label: "B-", val: 70 },
                    { label: "C+", val: 67 },
                    { label: "Pass", val: 50 },
                  ].map(grade => (
                    <button
                      key={grade.val}
                      type="button"
                      onClick={() => setTargetGradePercent(grade.val)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex flex-col items-center justify-center ${
                        targetGradePercent === grade.val
                          ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-md shadow-blue-500/20 scale-[1.03]"
                          : "bg-[var(--surface-soft)] text-[var(--muted)] border-[var(--hairline)] hover:text-[var(--ink)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <span>{grade.label}</span>
                      <span className="text-[9px] font-mono opacity-80">{grade.val}%</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Required Score Result Card + 1-Click AI Study Plan Button */}
          <div className="lg:col-span-5 p-6 sm:p-7 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-2xl space-y-5 text-center shadow-md relative overflow-hidden">
            
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--muted)] font-bold">
                FINAL EXAM REQUIRED SCORE
              </div>
              <div className={`text-5xl sm:text-6xl font-extrabold font-mono tracking-tight ${finalScoreCalculation.colorClass} drop-shadow-sm`}>
                {finalScoreCalculation.requiredFinalScore > 100 
                  ? `${finalScoreCalculation.requiredFinalScore}%` 
                  : finalScoreCalculation.requiredFinalScore < 0 
                    ? "0%" 
                    : `${finalScoreCalculation.requiredFinalScore}%`}
              </div>
              <div className="text-xs text-[var(--muted)] font-light mt-1">
                on the <strong className="text-[var(--ink)]">{finalScoreCalculation.remainingWeight}% weight</strong> Final Exam
              </div>
            </div>

            {/* Score Breakdown Metrics */}
            <div className="p-3.5 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-xl text-xs space-y-2 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Points Secured So Far:</span>
                <span className="font-bold text-[var(--ink)]">{finalScoreCalculation.currentPointsEarned} / {finalScoreCalculation.currentWeightTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Target Total:</span>
                <span className="font-bold text-[var(--primary)]">{targetGradePercent}.0%</span>
              </div>
              <div className="flex justify-between border-t border-[var(--hairline)] pt-2 items-center">
                <span className="text-[var(--muted)]">Difficulty Rating:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${finalScoreCalculation.badgeClass}`}>
                  {finalScoreCalculation.difficulty}
                </span>
              </div>
            </div>

            {/* Predictive Guidance Note */}
            <p className="text-[11px] text-[var(--muted)] font-light leading-relaxed">
              {finalScoreCalculation.requiredFinalScore <= 75
                ? `You are in great shape to achieve your target grade with steady preparation.`
                : finalScoreCalculation.requiredFinalScore <= 90
                ? `Achievable with consistent practice on past exams and problem sets.`
                : finalScoreCalculation.requiredFinalScore <= 100
                ? `Requires high-intensity focus and near-perfect execution on core exam concepts.`
                : `Target exceeds 100% — extra credit or perfection across remaining work required.`}
            </p>

            {/* 1-Click AI Study Plan Generator Button */}
            <button
              onClick={handleGenerateAIPlan}
              className="w-full py-3 bg-gradient-to-r from-[var(--primary)] via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer group"
            >
              <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Generate AI Exam Roadmap</span>
            </button>

          </div>

        </div>

      </div>

      {/* Add Custom Component Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--surface)] border border-[var(--hairline)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--hairline)]">
              <h3 className="text-base font-bold text-[var(--ink)] flex items-center gap-2">
                <Plus className="w-4 h-4 text-[var(--primary)]" />
                Add Coursework Component
              </h3>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                  Component Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quizzes, Class Participation, Term Paper"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                    Weight (%)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={60}
                    value={newCatWeight}
                    onChange={e => setNewCatWeight(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block mb-1.5">
                    Current Score (%)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={newCatScore}
                    onChange={e => setNewCatScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="px-4 py-2 text-xs font-bold uppercase text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--primary)] text-white text-xs font-bold uppercase rounded-xl hover:bg-[var(--primary-active)] transition-all cursor-pointer shadow-md"
                >
                  Add Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Velocity Chart and Course Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Study Velocity Bar Chart */}
        <div className="lg:col-span-7 p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
            <h3 className="text-base font-bold text-[var(--ink)]">Daily Study Velocity</h3>
            <span className="text-xs font-mono text-[var(--muted)]">Past 7 Days</span>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-48 pt-6">
            {weeklyVelocity.map(day => (
              <div key={day.day} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-[10px] font-mono text-[var(--muted)]">{day.hours}h</div>
                <div className="w-full max-w-[32px] bg-[var(--surface-soft)] rounded-t-lg overflow-hidden flex flex-col justify-end h-32">
                  <div 
                    className="w-full bg-[var(--primary)] transition-all duration-500 rounded-t-lg"
                    style={{ height: `${day.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono font-bold text-[var(--ink)]">{day.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Course Workload Breakdown */}
        <div className="lg:col-span-5 p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
            <h3 className="text-base font-bold text-[var(--ink)]">Course Workload Velocity</h3>
            <span className="text-xs font-mono text-[var(--muted)]">{courseAnalytics.length} Enrolled</span>
          </div>

          <div className="space-y-3">
            {courseAnalytics.map(c => (
              <div key={c.code} className="p-3.5 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--ink)]">{c.code}</span>
                  <span className="text-xs font-mono text-[var(--primary)] font-bold">{c.rate}%</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--surface-card)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--primary)]" style={{ width: `${c.rate}%` }} />
                </div>
                <div className="text-[10px] text-[var(--muted)] font-mono flex justify-between">
                  <span>{c.name}</span>
                  <span>{c.completed}/{c.total} Done</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
