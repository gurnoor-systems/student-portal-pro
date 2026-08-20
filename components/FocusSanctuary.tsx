"use client";

import React, { useState, useEffect } from "react";
import { useAuth, TaskItem } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { soundscapeEngine } from "@/lib/soundscapes";
import Logo from "@/components/Logo";
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  CloudRain, 
  Radio, 
  Brain, 
  Coffee, 
  Music,
  Check,
  ChevronDown,
  Sun,
  Moon,
  ExternalLink,
  Link as LinkIcon,
  Calendar,
  Layers,
  BookOpen,
  Maximize2
} from "lucide-react";

interface FocusSanctuaryProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted?: (taskId: string) => void;
}

const MUSIC_PRESETS = [
  { id: "lofi", name: "Lofi Study Beats", url: "https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM" },
  { id: "jazz", name: "Rainy Jazz Cafe", url: "https://open.spotify.com/embed/playlist/37i9dQZF1DXbITWG1ZJKYt" },
  { id: "synth", name: "Synthwave Focus", url: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM" },
  { id: "lofigirl", name: "Lofi Girl Live", url: "https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1" }
];

export default function FocusSanctuary({ isOpen, onClose, onTaskCompleted }: FocusSanctuaryProps) {
  const { user, getUserData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userData = getUserData();

  // Timer modes: 'pomodoro' (25m), 'deep' (50m), 'flowtime' (stopwatch), 'custom' (slider)
  const [timerMode, setTimerMode] = useState<"pomodoro" | "deep" | "flowtime" | "custom">("pomodoro");
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [selectedDuration, setSelectedDuration] = useState<number>(25 * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [flowtimeSeconds, setFlowtimeSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Attached Task
  const [attachedTaskId, setAttachedTaskId] = useState<string>(userData.tasks[0]?.id || "");

  // Audio system: 'none' | 'rain' | 'noise' | 'alpha' | 'cafe' | 'music_embed'
  const [audioType, setAudioType] = useState<"none" | "rain" | "noise" | "alpha" | "cafe" | "music_embed">("none");
  const [volume, setVolume] = useState<number>(0.4);
  const [selectedMusicPreset, setSelectedMusicPreset] = useState<string>("lofi");
  const [customEmbedUrl, setCustomEmbedUrl] = useState<string>("https://open.spotify.com/embed/playlist/0vvXsWCC9xrXsKd4FyS8kM");
  const [isCustomUrlInputOpen, setIsCustomUrlInputOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>("");

  // Completion state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loggedMinutes, setLoggedMinutes] = useState<number>(0);

  // Set default attached task when userData loads
  useEffect(() => {
    if (userData.tasks.length > 0 && !attachedTaskId) {
      setAttachedTaskId(userData.tasks[0].id);
    }
  }, [userData, attachedTaskId]);

  // Countdown / Stopwatch timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      if (timerMode === "flowtime") {
        interval = setInterval(() => {
          setFlowtimeSeconds(prev => prev + 1);
        }, 1000);
      } else if (timeLeft > 0) {
        interval = setInterval(() => {
          setTimeLeft(prev => prev - 1);
        }, 1000);
      } else if (timeLeft === 0) {
        setIsRunning(false);
        handleSessionComplete();
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  // Soundscape switcher
  const handleSelectAudio = (type: "none" | "rain" | "noise" | "alpha" | "cafe" | "music_embed") => {
    setAudioType(type);
    if (type === "none" || type === "music_embed") {
      soundscapeEngine.stop();
    } else {
      soundscapeEngine.play(type, volume);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundscapeEngine.setVolume(newVol);
  };

  const handleSetTimerMode = (mode: "pomodoro" | "deep" | "flowtime" | "custom") => {
    setTimerMode(mode);
    setIsRunning(false);
    let dur = 25 * 60;
    if (mode === "deep") dur = 50 * 60;
    if (mode === "flowtime") {
      setFlowtimeSeconds(0);
      dur = 0;
    }
    if (mode === "custom") dur = customMinutes * 60;
    setSelectedDuration(dur);
    setTimeLeft(dur);
  };

  const handleCustomSliderChange = (mins: number) => {
    setCustomMinutes(mins);
    if (timerMode === "custom") {
      const dur = mins * 60;
      setSelectedDuration(dur);
      setTimeLeft(dur);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (timerMode === "flowtime") {
      setFlowtimeSeconds(0);
    } else {
      setTimeLeft(selectedDuration);
    }
    setIsCompleted(false);
  };

  const handleSessionComplete = () => {
    soundscapeEngine.stop();
    soundscapeEngine.playCompletionBowl();
    const minutesStudied = timerMode === "flowtime" 
      ? Math.max(1, Math.round(flowtimeSeconds / 60))
      : Math.round(selectedDuration / 60);
    setLoggedMinutes(minutesStudied);
    setIsCompleted(true);
  };

  const handleMarkTaskDone = () => {
    if (attachedTaskId && onTaskCompleted) {
      onTaskCompleted(attachedTaskId);
    }
  };

  const handleSelectPresetMusic = (presetId: string) => {
    const p = MUSIC_PRESETS.find(item => item.id === presetId);
    if (p) {
      setSelectedMusicPreset(presetId);
      setCustomEmbedUrl(p.url);
      setAudioType("music_embed");
      soundscapeEngine.stop();
    }
  };

  const handleSaveCustomEmbed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    let formatted = inputUrl.trim();
    if (formatted.includes("open.spotify.com") && !formatted.includes("/embed/")) {
      formatted = formatted.replace("open.spotify.com/", "open.spotify.com/embed/");
    }
    if (formatted.includes("youtube.com/watch?v=")) {
      const vId = formatted.split("v=")[1]?.split("&")[0];
      if (vId) formatted = `https://www.youtube-nocookie.com/embed/${vId}?autoplay=1`;
    }

    setCustomEmbedUrl(formatted);
    setSelectedMusicPreset("custom");
    setAudioType("music_embed");
    soundscapeEngine.stop();
    setIsCustomUrlInputOpen(false);
    setInputUrl("");
  };

  if (!isOpen) return null;

  const displayMinutes = timerMode === "flowtime" ? Math.floor(flowtimeSeconds / 60) : Math.floor(timeLeft / 60);
  const displaySeconds = timerMode === "flowtime" ? flowtimeSeconds % 60 : timeLeft % 60;
  const progressPercent = timerMode === "flowtime" 
    ? 100 
    : ((selectedDuration - timeLeft) / selectedDuration) * 100;
  
  const currentTask = userData.tasks.find(t => t.id === attachedTaskId) || userData.tasks[0];

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-between p-6 lg:p-10 animate-in fade-in duration-300 select-none overflow-y-auto ${
      theme === "dark" 
        ? "bg-[#090d14] text-white" 
        : "bg-[#ffffff] text-[#171a20]"
    }`}>
      
      {/* 1. TOP HEADER BAR */}
      <header className={`flex items-center justify-between pb-5 border-b ${
        theme === "dark" ? "border-white/10" : "border-slate-200"
      }`}>
        
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Logo size={28} variant="gold" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono tracking-[2px] uppercase text-[#d4af37] font-bold">
                FOCUS SANCTUARY
              </span>
              <span className="px-2 py-0.5 bg-blue-500/15 text-[var(--primary)] text-[9px] font-mono font-bold rounded">
                ZEN WORKSPACE
              </span>
            </div>
            <div className={`text-xs font-light mt-0.5 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
              Distraction-Free Deep Study Environment
            </div>
          </div>
        </div>

        {/* Right: Quick Controls (Soundwave indicator, Streak, Theme, Close) */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Animated Soundwave Equalizer (Visible when audio or music stream is active) */}
          {audioType !== "none" && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono ${
              theme === "dark" ? "bg-[#111722] border-white/10 text-emerald-400" : "bg-[#f4f4f6] border-slate-200 text-emerald-600 font-bold"
            }`}>
              <div className="flex items-end gap-0.5 h-3">
                <span className="w-1 bg-emerald-500 animate-pulse h-3 rounded-full" />
                <span className="w-1 bg-emerald-500 animate-pulse h-2 rounded-full delay-75" />
                <span className="w-1 bg-emerald-500 animate-pulse h-3.5 rounded-full delay-150" />
              </div>
              <span className="capitalize">{audioType === "music_embed" ? "Music Playing" : audioType}</span>
            </div>
          )}

          {/* Active Consistency Streak */}
          <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-mono ${
            theme === "dark" ? "bg-[#111722] border-white/10 text-amber-400" : "bg-[#f4f4f6] border-slate-200 text-amber-600 font-bold"
          }`}>
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>14 DAY STREAK</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded border transition-all cursor-pointer ${
              theme === "dark" 
                ? "bg-[#111722] border-white/10 text-slate-300 hover:text-white" 
                : "bg-[#f4f4f6] border-slate-200 text-slate-700 hover:text-black"
            }`}
            title="Toggle Dark/Light Zen Mode"
          >
            {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Close Sanctuary */}
          <button
            onClick={() => {
              soundscapeEngine.stop();
              onClose();
            }}
            className={`p-2 rounded border transition-all cursor-pointer ${
              theme === "dark" 
                ? "bg-[#111722] border-white/10 text-slate-400 hover:text-white" 
                : "bg-[#f4f4f6] border-slate-200 text-slate-500 hover:text-black"
            }`}
            aria-label="Exit Focus Sanctuary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* 2. MAIN DUAL-DECK WORKSPACE */}
      <main className="max-w-[1360px] mx-auto w-full my-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* ========================================================
              LEFT DECK: GLOWING AURORA CLOCK & TIMER CONTROLS (7 Cols)
             ======================================================== */}
          <section className={`lg:col-span-7 p-6 sm:p-10 rounded-2xl border flex flex-col items-center justify-center text-center space-y-6 shadow-xl relative overflow-hidden ${
            theme === "dark" 
              ? "bg-[#0d121c] border-white/10" 
              : "bg-[#fcfdfe] border-slate-200 shadow-slate-200/50"
          }`}>
            
            {/* Ambient Background Aura Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(62,106,225,0.12)_0%,transparent_70%)] pointer-events-none" />

            {/* Timer Preset Selector Ribbon */}
            <div className={`flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-xl border font-mono text-xs z-10 ${
              theme === "dark" ? "bg-[#131a26] border-white/10" : "bg-[#f4f4f6] border-slate-200"
            }`}>
              <button
                onClick={() => handleSetTimerMode("pomodoro")}
                className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  timerMode === "pomodoro" 
                    ? "bg-[var(--primary)] text-white shadow-md shadow-blue-500/20" 
                    : theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
                }`}
              >
                25M POMODORO
              </button>

              <button
                onClick={() => handleSetTimerMode("deep")}
                className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  timerMode === "deep" 
                    ? "bg-[var(--primary)] text-white shadow-md shadow-blue-500/20" 
                    : theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
                }`}
              >
                50M DEEP WORK
              </button>

              <button
                onClick={() => handleSetTimerMode("flowtime")}
                className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  timerMode === "flowtime" 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
                }`}
              >
                FLOWTIME
              </button>

              <button
                onClick={() => handleSetTimerMode("custom")}
                className={`px-4 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                  timerMode === "custom" 
                    ? "bg-[#d4af37] text-slate-900 shadow-md shadow-amber-500/20" 
                    : theme === "dark" ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-black"
                }`}
              >
                CUSTOM ({customMinutes}M)
              </button>
            </div>

            {/* Custom Minutes Slider (When Custom active) */}
            {timerMode === "custom" && (
              <div className="w-full max-w-xs space-y-1.5 z-10 animate-in fade-in duration-150">
                <div className="flex justify-between text-xs font-mono">
                  <span className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>DURATION</span>
                  <span className="text-[var(--primary)] font-bold">{customMinutes} MINUTES</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={180}
                  value={customMinutes}
                  onChange={(e) => handleCustomSliderChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                />
              </div>
            )}

            {/* Concentric SVG Aurora Progress Ring & Minimalist Clock */}
            <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80 z-10">
              
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={theme === "dark" ? "text-white/5" : "text-slate-200"}
                  strokeWidth="2.5"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className={`${timerMode === "flowtime" ? "text-emerald-500" : "text-[var(--primary)]"} transition-all duration-1000`}
                  strokeWidth="3.2"
                  strokeDasharray={276.4}
                  strokeDashoffset={timerMode === "flowtime" ? 0 : 276.4 - (276.4 * progressPercent) / 100}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center space-y-1">
                <div className={`text-6xl sm:text-7xl font-bold font-mono tracking-tight ${
                  theme === "dark" ? "text-white" : "text-[#171a20]"
                }`}>
                  {String(displayMinutes).padStart(2, "0")}:{String(displaySeconds).padStart(2, "0")}
                </div>
                <div className={`text-xs font-mono uppercase tracking-[2.5px] font-bold ${
                  isRunning 
                    ? timerMode === "flowtime" ? "text-emerald-500" : "text-[var(--primary)]" 
                    : theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}>
                  {isRunning ? (timerMode === "flowtime" ? "FLOWING" : "FOCUS ACTIVE") : "PAUSED"}
                </div>
              </div>
            </div>

            {/* Primary Control Buttons */}
            <div className="flex items-center gap-3 z-10 pt-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-[1.5px] transition-all cursor-pointer flex items-center gap-2.5 shadow-xl ${
                  isRunning 
                    ? "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-amber-500/20" 
                    : "bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white shadow-blue-500/30"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>PAUSE SESSION</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>START FOCUS</span>
                  </>
                )}
              </button>

              {timerMode === "flowtime" && isRunning && (
                <button
                  onClick={handleSessionComplete}
                  className="px-5 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  COMPLETE FLOW
                </button>
              )}

              <button
                onClick={handleReset}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  theme === "dark" 
                    ? "bg-[#131a26] hover:bg-[#1b2536] border-white/10 text-slate-300 hover:text-white" 
                    : "bg-[#f4f4f6] hover:bg-[#e8e8ea] border-slate-200 text-slate-700 hover:text-black"
                }`}
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </section>

          {/* ========================================================
              RIGHT DECK: ACTIVE TASK & AUDIO AMBIENCE HUB (5 Cols)
             ======================================================== */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* 1. ACTIVE TASK CARD */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              theme === "dark" ? "bg-[#0d121c] border-white/10" : "bg-[#fcfdfe] border-slate-200"
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-inherit">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                    TARGET DELIVERABLE
                  </span>
                </div>
                {currentTask && (
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    currentTask.priority === "high" 
                      ? "bg-red-500/15 text-red-500 border border-red-500/20" 
                      : "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                  }`}>
                    {currentTask.priority.toUpperCase()} PRIORITY
                  </span>
                )}
              </div>

              {/* Task Selector Dropdown */}
              <div className="space-y-1.5">
                <label className={`block text-[10px] font-mono uppercase ${
                  theme === "dark" ? "text-slate-400" : "text-slate-500"
                }`}>
                  SELECT TASK FROM BACKLOG
                </label>
                <select
                  value={attachedTaskId}
                  onChange={(e) => setAttachedTaskId(e.target.value)}
                  className={`w-full text-xs font-semibold py-2.5 px-3 rounded-lg border outline-none cursor-pointer transition-colors ${
                    theme === "dark" 
                      ? "bg-[#131a26] border-white/15 text-white focus:border-[var(--primary)]" 
                      : "bg-white border-slate-300 text-slate-900 focus:border-[var(--primary)]"
                  }`}
                >
                  {userData.tasks.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.courseCode}] {t.title} ({t.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Task Detail Snippet */}
              {currentTask && (
                <div className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                  theme === "dark" ? "bg-[#131a26] border-white/10" : "bg-[#f4f4f6] border-slate-200"
                }`}>
                  <div className="font-bold text-sm leading-snug">
                    {currentTask.title}
                  </div>
                  <div className={`flex items-center justify-between text-[11px] font-mono ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    <span>Course: <strong className="text-[var(--primary)]">{currentTask.courseCode}</strong></span>
                    <span>Category: <strong>{currentTask.category}</strong></span>
                    <span>Due: <strong>{new Date(currentTask.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong></span>
                  </div>

                  <button
                    onClick={handleMarkTaskDone}
                    className={`w-full py-2 mt-1 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentTask.status === "completed"
                        ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                        : "bg-[var(--surface-strong)] hover:bg-[var(--primary)] hover:text-white border border-[var(--hairline)]"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{currentTask.status === "completed" ? "COMPLETED" : "MARK AS COMPLETED"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. CURATED SOUNDSCAPES & MUSIC DECK */}
            <div className={`p-6 rounded-2xl border space-y-4 shadow-sm ${
              theme === "dark" ? "bg-[#0d121c] border-white/10" : "bg-[#fcfdfe] border-slate-200"
            }`}>
              <div className="flex items-center justify-between border-b pb-3 border-inherit">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                    AMBIENT SOUNDSCAPES
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-500 font-bold">
                  ZERO NETWORK DELAY
                </span>
              </div>

              {/* Soundscape Buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                <button
                  onClick={() => handleSelectAudio("none")}
                  className={`py-2 rounded-lg text-[11px] font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    audioType === "none" 
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow" 
                      : theme === "dark" ? "bg-[#131a26] border-white/10 text-slate-400 hover:text-white" : "bg-[#f4f4f6] border-slate-200 text-slate-600 hover:text-black"
                  }`}
                  title="Mute Audio"
                >
                  <VolumeX className="w-4 h-4" />
                  <span>Silent</span>
                </button>

                <button
                  onClick={() => handleSelectAudio("rain")}
                  className={`py-2 rounded-lg text-[11px] font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    audioType === "rain" 
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow" 
                      : theme === "dark" ? "bg-[#131a26] border-white/10 text-slate-400 hover:text-white" : "bg-[#f4f4f6] border-slate-200 text-slate-600 hover:text-black"
                  }`}
                  title="Gentle Rain"
                >
                  <CloudRain className="w-4 h-4" />
                  <span>Rain</span>
                </button>

                <button
                  onClick={() => handleSelectAudio("noise")}
                  className={`py-2 rounded-lg text-[11px] font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    audioType === "noise" 
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow" 
                      : theme === "dark" ? "bg-[#131a26] border-white/10 text-slate-400 hover:text-white" : "bg-[#f4f4f6] border-slate-200 text-slate-600 hover:text-black"
                  }`}
                  title="White Noise"
                >
                  <Radio className="w-4 h-4" />
                  <span>Noise</span>
                </button>

                <button
                  onClick={() => handleSelectAudio("alpha")}
                  className={`py-2 rounded-lg text-[11px] font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    audioType === "alpha" 
                      ? "bg-[#d4af37] text-slate-900 border-[#d4af37] font-bold shadow" 
                      : theme === "dark" ? "bg-[#131a26] border-white/10 text-slate-400 hover:text-white" : "bg-[#f4f4f6] border-slate-200 text-slate-600 hover:text-black"
                  }`}
                  title="10Hz Binaural Flow Waves"
                >
                  <Brain className="w-4 h-4" />
                  <span>Alpha</span>
                </button>

                <button
                  onClick={() => handleSelectAudio("cafe")}
                  className={`py-2 rounded-lg text-[11px] font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                    audioType === "cafe" 
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] font-bold shadow" 
                      : theme === "dark" ? "bg-[#131a26] border-white/10 text-slate-400 hover:text-white" : "bg-[#f4f4f6] border-slate-200 text-slate-600 hover:text-black"
                  }`}
                  title="Warm Cafe"
                >
                  <Coffee className="w-4 h-4" />
                  <span>Cafe</span>
                </button>
              </div>

              {/* Volume Slider (When soundscape is active) */}
              {audioType !== "none" && audioType !== "music_embed" && (
                <div className="space-y-1 pt-1 animate-in fade-in duration-150">
                  <div className={`flex justify-between text-[11px] font-mono ${
                    theme === "dark" ? "text-slate-400" : "text-slate-500"
                  }`}>
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      <span>SOUNDSCAPE VOLUME</span>
                    </span>
                    <span className="font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-300 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                  />
                </div>
              )}

              {/* Spotify / YouTube Stream Connector */}
              <div className="pt-2 border-t border-inherit space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-500">
                    <Music className="w-3.5 h-3.5" />
                    <span>CURATED STUDY MUSIC</span>
                  </span>
                  <button
                    onClick={() => setIsCustomUrlInputOpen(true)}
                    className="text-[10px] text-[var(--primary)] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Paste Custom URL</span>
                  </button>
                </div>

                {/* Quick Stream Preset Badges */}
                <div className="grid grid-cols-2 gap-1.5">
                  {MUSIC_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPresetMusic(p.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center gap-1.5 transition-all cursor-pointer border truncate ${
                        audioType === "music_embed" && selectedMusicPreset === p.id
                          ? "bg-emerald-500 text-white border-emerald-500 font-bold"
                          : theme === "dark" ? "bg-[#131a26] border-white/10 text-slate-400 hover:text-white" : "bg-[#f4f4f6] border-slate-200 text-slate-600 hover:text-black"
                      }`}
                    >
                      <Music className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>

                {/* Responsive Embedded Player (When music stream active) */}
                {audioType === "music_embed" && (
                  <div className="rounded-xl overflow-hidden bg-black border border-white/10 shadow-inner h-28 animate-in fade-in duration-200">
                    <iframe
                      src={customEmbedUrl}
                      width="100%"
                      height="112"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title="Music Player"
                    />
                  </div>
                )}
              </div>

            </div>

          </section>

        </div>
      </main>

      {/* 3. BOTTOM FOOTER STATUS */}
      <footer className={`flex flex-col sm:flex-row items-center justify-between text-xs font-mono pt-4 border-t gap-2 ${
        theme === "dark" ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"
      }`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Campus: <strong className={theme === "dark" ? "text-white" : "text-black"}>{user?.university || "University"}</strong></span>
          <span>•</span>
          <span>Semester: <strong className={theme === "dark" ? "text-white" : "text-black"}>{user?.semester || "Active"}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span>Active Audio: <strong className="text-[var(--primary)] capitalize">{audioType === "music_embed" ? "Music Stream" : audioType}</strong></span>
        </div>
      </footer>

      {/* MODAL: Custom Spotify / YouTube URL Input */}
      {isCustomUrlInputOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleSaveCustomEmbed} className={`max-w-md w-full p-6 rounded-2xl border space-y-4 shadow-2xl ${
            theme === "dark" ? "bg-[#0f141c] border-white/15 text-white" : "bg-white border-slate-200 text-[#171a20]"
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-inherit">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Music className="w-4 h-4 text-emerald-500" />
                <span>Connect Custom Music Stream</span>
              </div>
              <button type="button" onClick={() => setIsCustomUrlInputOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-light leading-relaxed">
              Paste any public Spotify playlist URL or YouTube Music/Video link to stream directly inside your focus session.
            </p>

            <div>
              <label className="block text-[11px] font-mono uppercase mb-1">
                SPOTIFY / YOUTUBE LINK
              </label>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/... or YouTube link"
                className={`w-full h-11 px-3 text-xs rounded-xl border outline-none ${
                  theme === "dark" 
                    ? "bg-[#070a0e] border-white/15 text-white focus:border-[var(--primary)]" 
                    : "bg-slate-50 border-slate-300 text-black focus:border-[var(--primary)]"
                }`}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomUrlInputOpen(false)}
                className="w-1/3 py-3 border border-slate-700 text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
              >
                CONNECT STREAM
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Session Completion Celebration Dialog */}
      {isCompleted && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="bg-[#0e141c] border border-[#d4af37]/40 text-white max-w-md w-full p-8 text-center space-y-6 shadow-2xl rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#d4af37]/20 border border-[#d4af37] text-[#d4af37] flex items-center justify-center mx-auto animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono text-[#d4af37] tracking-[2px] uppercase font-bold">
                SESSION COMPLETED
              </div>
              <h3 className="text-2xl font-bold text-white">
                Deep Work Session Logged!
              </h3>
              <p className="text-xs text-slate-300 font-light">
                You maintained pure flow state for <strong className="text-white">{loggedMinutes} minutes</strong>. Your streak and velocity analytics have been updated.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {currentTask && currentTask.status !== "completed" && (
                <button
                  onClick={handleMarkTaskDone}
                  className="w-full py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
                >
                  <Check className="w-4 h-4" />
                  <span>MARK &ldquo;{currentTask.title.slice(0, 24)}...&rdquo; AS DONE</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsCompleted(false);
                  handleReset();
                }}
                className="w-full py-3 border border-white/15 text-slate-300 hover:text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                START NEXT FOCUS BLOCK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
