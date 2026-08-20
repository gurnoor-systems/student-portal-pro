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
  Check
} from "lucide-react";

interface GradeCategory {
  id: string;
  name: string;
  weight: number; // percentage (e.g. 30)
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
  const [finalExamWeight, setFinalExamWeight] = useState<number>(35); // 35%
  const [categories, setCategories] = useState<GradeCategory[]>([
    { id: "1", name: "Problem Sets & Homework", weight: 25, currentScore: 92 },
    { id: "2", name: "Midterm Examination", weight: 25, currentScore: 82 },
    { id: "3", name: "Lab & Programming Projects", weight: 15, currentScore: 88 },
  ]);

  // Velocity data for Monday through Sunday
  const weeklyVelocity = [
    { day: "MON", hours: 4.5, tasksCompleted: 3, percentage: 75 },
    { day: "TUE", hours: 6.0, tasksCompleted: 4, percentage: 100 },
    { day: "WED", hours: 5.2, tasksCompleted: 3, percentage: 85 },
    { day: "THU", hours: 7.5, tasksCompleted: 5, percentage: 100 },
    { day: "FRI", hours: 4.0, tasksCompleted: 2, percentage: 65 },
    { day: "SAT", hours: 3.5, tasksCompleted: 2, percentage: 55 },
    { day: "SUN", hours: 5.8, tasksCompleted: 4, percentage: 90 },
  ];

  const totalWeeklyHours = weeklyVelocity.reduce((acc, curr) => acc + curr.hours, 0);
  const totalTasks = userData.tasks.length;
  const completedTasks = userData.tasks.filter(t => t.status === "completed").length;
  const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

    let difficulty: "Comfortable" | "Demanding" | "High Stakes" = "Comfortable";
    let colorClass = "text-emerald-500";
    if (requiredFinalScore > 90) {
      difficulty = "High Stakes";
      colorClass = "text-red-500";
    } else if (requiredFinalScore > 78) {
      difficulty = "Demanding";
      colorClass = "text-amber-500";
    }

    return {
      currentPointsEarned: Math.round(currentPointsEarned * 10) / 10,
      currentWeightTotal,
      remainingWeight,
      requiredFinalScore,
      difficulty,
      colorClass
    };
  }, [categories, targetGradePercent]);

  const handleUpdateCategoryScore = (id: string, score: number) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, currentScore: score } : c));
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
          <div className="px-4 py-2 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 fill-current" />
            <span className="text-xs font-mono font-bold text-[var(--ink)]">14 DAY STREAK</span>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-2 shadow-sm">
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

        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-2 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">OVERALL COMPLETION</div>
          <div className="text-3xl font-bold text-emerald-500">{overallRate}%</div>
          <div className="text-xs text-[var(--muted)] font-light">{completedTasks} of {totalTasks} deliverables finished</div>
        </div>

        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-2 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">SEMESTER GPA TARGET</div>
          <div className="text-3xl font-bold text-[var(--primary)]">{targetGpa.toFixed(2)}</div>
          <div className="text-xs text-[var(--muted)] font-light">Honors Standing (Top 5%)</div>
        </div>

        <div className="p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-2 shadow-sm">
          <div className="text-[10px] font-mono uppercase text-[var(--muted)] font-bold">ACTIVE COURSES</div>
          <div className="text-3xl font-bold text-[var(--ink)]">{userData.courses.length}</div>
          <div className="text-xs text-[var(--muted)] font-light">{user?.semester || "Fall 2026"} Term</div>
        </div>

      </div>

      {/* SMART GPA & FINAL EXAM SCORE PREDICTOR MODULE */}
      <div className="p-6 sm:p-8 bg-[var(--surface-card)] border border-[var(--hairline)] rounded shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--hairline)] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
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
              className="px-3 py-1.5 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs font-bold text-[var(--ink)] rounded outline-none cursor-pointer"
            >
              {userData.courses.map(c => (
                <option key={c.id} value={c.courseCode}>{c.courseCode} - {c.courseName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Grade Breakdown Sliders */}
          <div className="lg:col-span-7 space-y-4">
            <div className="text-xs font-bold text-[var(--ink)] uppercase font-mono tracking-wider">
              Current Coursework Grades
            </div>

            <div className="space-y-3.5">
              {categories.map(cat => (
                <div key={cat.id} className="p-3.5 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--ink)]">{cat.name}</span>
                    <div className="font-mono text-xs flex items-center gap-2">
                      <span className="text-[var(--muted)]">Weight: {cat.weight}%</span>
                      <span className="font-bold text-[var(--primary)]">{cat.currentScore}%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={cat.currentScore}
                    onChange={(e) => handleUpdateCategoryScore(cat.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                  />
                </div>
              ))}
            </div>

            {/* Target Grade Selector */}
            <div className="pt-2">
              <label className="block text-xs font-mono text-[var(--muted)] uppercase mb-2">
                TARGET LETTER GRADE
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "A+ (90%)", val: 90 },
                  { label: "A (85%)", val: 85 },
                  { label: "A- (80%)", val: 80 },
                  { label: "B+ (77%)", val: 77 },
                ].map(grade => (
                  <button
                    key={grade.val}
                    type="button"
                    onClick={() => setTargetGradePercent(grade.val)}
                    className={`py-2 rounded text-xs font-bold transition-all cursor-pointer border ${
                      targetGradePercent === grade.val
                        ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow"
                        : "bg-[var(--surface-soft)] text-[var(--muted)] border-[var(--hairline)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {grade.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Required Score Result Card */}
          <div className="lg:col-span-5 p-6 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded space-y-5 text-center shadow-inner">
            
            <div className="space-y-1">
              <div className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--muted)] font-bold">
                FINAL EXAM REQUIRED SCORE
              </div>
              <div className={`text-5xl font-bold font-mono tracking-tight ${finalScoreCalculation.colorClass}`}>
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

            <div className="p-3 bg-[var(--surface-card)] border border-[var(--hairline)] rounded text-xs space-y-1.5 text-left font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Points Secured So Far:</span>
                <span className="font-bold text-[var(--ink)]">{finalScoreCalculation.currentPointsEarned} / {finalScoreCalculation.currentWeightTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Target Total:</span>
                <span className="font-bold text-[var(--primary)]">{targetGradePercent}.0%</span>
              </div>
              <div className="flex justify-between border-t border-[var(--hairline)] pt-1.5">
                <span className="text-[var(--muted)]">Difficulty Rating:</span>
                <span className={`font-bold ${finalScoreCalculation.colorClass}`}>
                  {finalScoreCalculation.difficulty}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[var(--muted)] font-light leading-relaxed">
              {finalScoreCalculation.requiredFinalScore <= 100 
                ? `You are in great shape to achieve your target grade with focused preparation.` 
                : `Target requires extra credit or perfection across all remaining deliverables.`}
            </p>

          </div>

        </div>

      </div>

      {/* Velocity Chart and Course Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Study Velocity Bar Chart */}
        <div className="lg:col-span-7 p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
            <h3 className="text-base font-bold text-[var(--ink)]">Daily Study Velocity</h3>
            <span className="text-xs font-mono text-[var(--muted)]">Past 7 Days</span>
          </div>

          <div className="grid grid-cols-7 gap-2 items-end h-48 pt-6">
            {weeklyVelocity.map(day => (
              <div key={day.day} className="flex flex-col items-center gap-2 h-full justify-end">
                <div className="text-[10px] font-mono text-[var(--muted)]">{day.hours}h</div>
                <div className="w-full max-w-[32px] bg-[var(--surface-soft)] rounded-t overflow-hidden flex flex-col justify-end h-32">
                  <div 
                    className="w-full bg-[var(--primary)] transition-all duration-500 rounded-t"
                    style={{ height: `${day.percentage}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono font-bold text-[var(--ink)]">{day.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Course Workload Breakdown */}
        <div className="lg:col-span-5 p-6 bg-[var(--surface-card)] border border-[var(--hairline)] rounded space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--hairline)] pb-4">
            <h3 className="text-base font-bold text-[var(--ink)]">Course Workload Velocity</h3>
            <span className="text-xs font-mono text-[var(--muted)]">{courseAnalytics.length} Enrolled</span>
          </div>

          <div className="space-y-3">
            {courseAnalytics.map(c => (
              <div key={c.code} className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] rounded space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--ink)]">{c.code}</span>
                  <span className="text-xs font-mono text-[var(--primary)] font-bold">{c.rate}%</span>
                </div>
                <div className="w-full h-1 bg-[var(--surface-card)] rounded-full overflow-hidden">
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
