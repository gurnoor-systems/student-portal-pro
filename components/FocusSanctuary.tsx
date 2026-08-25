"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth, TaskItem } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { 
  soundscapeEngine, 
  SoundscapeType, 
  SOUNDSCAPE_OPTIONS 
} from "@/lib/soundscapes";
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
  Zap,
  Leaf,
  Sliders,
  Award,
  Minimize2,
  Maximize2
} from "lucide-react";

interface FocusSanctuaryProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted?: (taskId: string) => void;
}

const MUSIC_PRESETS = [
  { 
    id: "cafe_ambience", 
    name: "Parisian Cafe & Jazz Ambience", 
    url: "https://www.youtube-nocookie.com/embed/p8qaPV4oOaY?autoplay=1",
    subtitle: "Warm Acoustic Cafe & Piano"
  },
  { 
    id: "rain_ambient", 
    name: "Cozy Rain & Thunder", 
    url: "https://www.youtube-nocookie.com/embed/lP4wSXSH9nM?autoplay=1",
    subtitle: "Deep Natural Rain Ambience"
  },
  { 
    id: "jazz_live", 
    name: "Rainy Jazz Cafe (Live)", 
    url: "https://www.youtube-nocookie.com/embed/9oRTEsEpKNM?autoplay=1",
    subtitle: "24/7 Jazz Piano & Rain"
  },
  { 
    id: "deep_focus", 
    name: "Deep Focus Ambient", 
    url: "https://www.youtube-nocookie.com/embed/D715zYn7TzM?autoplay=1",
    subtitle: "Atmospheric Study Beats"
  },
  { 
    id: "lofigirl", 
    name: "Lofi Girl Live", 
    url: "https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1",
    subtitle: "24/7 Lo-Fi Beats"
  },
  { 
    id: "synth", 
    name: "Synthwave Beats", 
    url: "https://open.spotify.com/embed/playlist/37i9dQZF1DXdLEN7aqioXM",
    subtitle: "Cyberpunk Focus"
  }
];

function convertToEmbedUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  if (!url) return "";

  // Spotify links
  if (url.includes("open.spotify.com") && !url.includes("/embed/")) {
    return url.replace("open.spotify.com/", "open.spotify.com/embed/");
  }

  // YouTube /live/
  if (url.includes("youtube.com/live/")) {
    const v = url.split("youtube.com/live/")[1]?.split("?")[0]?.split("&")[0];
    if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1`;
  }

  // YouTube /watch?v=
  if (url.includes("youtube.com/watch")) {
    const match = url.match(/[?&]v=([^&#]+)/);
    if (match && match[1]) {
      return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1`;
    }
  }

  // YouTube youtu.be/
  if (url.includes("youtu.be/")) {
    const v = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0];
    if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1`;
  }

  // YouTube /embed/
  if (url.includes("youtube.com/embed/") || url.includes("youtube-nocookie.com/embed/")) {
    return url.includes("autoplay=1") ? url : `${url}${url.includes("?") ? "&" : "?"}autoplay=1`;
  }

  return url;
}

export default function FocusSanctuary({ isOpen, onClose, onTaskCompleted }: FocusSanctuaryProps) {
  const { user, userData } = useAuth();
  const [isPipMode, setIsPipMode] = useState<boolean>(false);

  // Timer modes: 'pomodoro' (25m), 'deep' (50m), 'flowtime' (stopwatch), 'custom' (slider)
  const [timerMode, setTimerMode] = useState<"pomodoro" | "deep" | "flowtime" | "custom">("pomodoro");
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [selectedDuration, setSelectedDuration] = useState<number>(25 * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [flowtimeSeconds, setFlowtimeSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Session timestamp tracking for 100% drift-free accuracy across background tabs
  const sessionEndTimeRef = React.useRef<number | null>(null);
  const sessionStartTimeRef = React.useRef<number | null>(null);

  // Attached Task
  const [attachedTaskId, setAttachedTaskId] = useState<string>(userData.tasks[0]?.id || "");

  // Audio system: 'none' | 'rain' | 'brown' | 'green' | 'gamma' | 'alpha' | 'cafe' | 'music_embed'
  const [audioType, setAudioType] = useState<SoundscapeType | "music_embed">("none");
  const [volume, setVolume] = useState<number>(0.5);
  const [selectedMusicPreset, setSelectedMusicPreset] = useState<string>("cafe_ambience");
  const [customEmbedUrl, setCustomEmbedUrl] = useState<string>("https://www.youtube-nocookie.com/embed/p8qaPV4oOaY?autoplay=1");
  const [isCustomUrlInputOpen, setIsCustomUrlInputOpen] = useState<boolean>(false);
  const [inputUrl, setInputUrl] = useState<string>("");

  // Completion state
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [loggedMinutes, setLoggedMinutes] = useState<number>(0);

  // Clean audio and timer state whenever modal closes
  useEffect(() => {
    if (!isOpen) {
      soundscapeEngine.stop();
      setIsRunning(false);
      setAudioType("none");
    }
  }, [isOpen]);

  // Set default attached task when userData loads
  useEffect(() => {
    if (userData.tasks.length > 0 && !attachedTaskId) {
      setAttachedTaskId(userData.tasks[0].id);
    }
  }, [userData.tasks, attachedTaskId]);

  // Handle timer duration changes
  useEffect(() => {
    if (!isRunning) {
      sessionStartTimeRef.current = null;
      sessionEndTimeRef.current = null;
      if (timerMode === "pomodoro") {
        setSelectedDuration(25 * 60);
        setTimeLeft(25 * 60);
      } else if (timerMode === "deep") {
        setSelectedDuration(50 * 60);
        setTimeLeft(50 * 60);
      } else if (timerMode === "custom") {
        setSelectedDuration(customMinutes * 60);
        setTimeLeft(customMinutes * 60);
      } else if (timerMode === "flowtime") {
        setFlowtimeSeconds(0);
      }
    }
  }, [timerMode, customMinutes, isRunning]);

  // Main countdown loop with drift-free timestamp deltas
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      if (!sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now() - (flowtimeSeconds * 1000);
      }
      if (!sessionEndTimeRef.current && timerMode !== "flowtime") {
        sessionEndTimeRef.current = Date.now() + (timeLeft * 1000);
      }

      interval = setInterval(() => {
        if (timerMode === "flowtime") {
          const elapsedSec = Math.floor((Date.now() - (sessionStartTimeRef.current || Date.now())) / 1000);
          setFlowtimeSeconds(elapsedSec);
        } else {
          const remainingSec = Math.max(0, Math.ceil(((sessionEndTimeRef.current || Date.now()) - Date.now()) / 1000));
          setTimeLeft(remainingSec);
          if (remainingSec <= 0) {
            handleSessionComplete();
          }
        }
      }, 500);
    } else {
      sessionStartTimeRef.current = null;
      sessionEndTimeRef.current = null;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerMode]);

  // Handle session completion & streak auto-log
  const handleSessionComplete = () => {
    setIsRunning(false);
    soundscapeEngine.stop();
    soundscapeEngine.playCompletionChime(); // Play soothing 528Hz crystal bell chime

    const elapsed = timerMode === "flowtime" 
      ? Math.max(1, Math.round(flowtimeSeconds / 60))
      : Math.round(selectedDuration / 60);

    setLoggedMinutes(elapsed);
    setIsCompleted(true);

    // Auto-log to analytics history
    if (user) {
      try {
        const storageKey = `student_portal_user_${user.id}_focus_history`;
        const raw = localStorage.getItem(storageKey);
        const history = raw ? JSON.parse(raw) : [];
        const newEntry = {
          id: `focus_${Date.now()}`,
          date: new Date().toISOString(),
          minutes: elapsed,
          taskId: attachedTaskId,
          taskTitle: currentTask?.title || "Deep Focus Block"
        };
        history.push(newEntry);
        localStorage.setItem(storageKey, JSON.stringify(history));
      } catch {
        // ignore
      }
    }
  };

  // Soundscape selector
  const handleSelectSoundscape = (type: SoundscapeType) => {
    if (type === audioType) {
      // Toggle off
      setAudioType("none");
      soundscapeEngine.stop();
    } else {
      setAudioType(type);
      if (type === "none") {
        soundscapeEngine.stop();
      } else {
        soundscapeEngine.play(type, volume);
      }
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundscapeEngine.setVolume(newVol);
  };

  const handleSelectPresetMusic = (presetId: string) => {
    const preset = MUSIC_PRESETS.find(p => p.id === presetId);
    if (preset) {
      soundscapeEngine.stop();
      setAudioType("music_embed");
      setSelectedMusicPreset(presetId);
      setCustomEmbedUrl(preset.url);
    }
  };

  const handleSaveCustomEmbed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    soundscapeEngine.stop();
    const url = convertToEmbedUrl(inputUrl);

    setCustomEmbedUrl(url);
    setAudioType("music_embed");
    setSelectedMusicPreset("custom");
    setIsCustomUrlInputOpen(false);
    setInputUrl("");
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration);
    setFlowtimeSeconds(0);
  };

  const handleExitSanctuary = () => {
    soundscapeEngine.stop();
    setIsRunning(false);
    setIsPipMode(false);
    onClose();
  };

  const handleMarkTaskDone = () => {
    if (attachedTaskId && onTaskCompleted) {
      onTaskCompleted(attachedTaskId);
    }
    setIsCompleted(false);
    handleReset();
  };

  const currentTask = userData.tasks.find(t => t.id === attachedTaskId);

  // SVG Circular Ring Calculations
  const radius = 135;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = timerMode === "flowtime" 
    ? 1 
    : Math.max(0, Math.min(1, timeLeft / selectedDuration));
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Time formatter
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  // Mini Floating PiP Mode Widget
  if (isPipMode) {
    return (
      <aside 
        aria-label="Floating Focus Timer"
        className="fixed bottom-6 right-6 z-50 bg-[#090d14]/95 border border-[#1d63ff]/60 text-white rounded-2xl shadow-2xl p-3.5 flex items-center gap-3.5 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? "bg-emerald-400 animate-ping" : "bg-[#1d63ff]"}`} />
          <div>
            <div className="text-sm font-mono font-bold tracking-wider text-white">
              {timerMode === "flowtime" ? formatTime(flowtimeSeconds) : formatTime(timeLeft)}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
              {currentTask?.title || "Deep Focus Session"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 bg-[#1d63ff] hover:bg-[#1652d9] text-white rounded-xl cursor-pointer transition-colors shadow-sm"
            title={isRunning ? "Pause Focus" : "Start Focus"}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
          </button>

          <button
            onClick={() => setIsPipMode(false)}
            className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
            title="Expand to Fullscreen Focus Room"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExitSanctuary}
            className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl cursor-pointer transition-colors"
            title="Exit Focus Room"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#080d14] text-white flex flex-col justify-between overflow-y-auto p-4 sm:p-8 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <header className="flex items-center justify-between max-w-7xl mx-auto w-full pb-4">
        <div className="flex items-center gap-3">
          <Logo size={26} variant="gold" />
          <div>
            <div className="text-[10px] font-mono tracking-[2px] uppercase text-[#d4af37] font-bold">
              FOCUS IMMERSION SANCTUARY
            </div>
            <h1 className="text-xs font-mono text-slate-400">
              Zero-Distraction Flow State & Scientific Audio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPipMode(true)}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Minimize into corner Floating Pill"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PiP Mode</span>
          </button>

          <button
            onClick={handleExitSanctuary}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Focus Room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Two-Column Focus Workspace */}
      <main className="max-w-7xl mx-auto w-full my-auto py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =========================================================
              LEFT COLUMN: BIG TIMER CARD WITH CIRCULAR PROGRESS RING
             ========================================================= */}
          <section className="lg:col-span-7 bg-[#0f1622] border border-white/10 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-between min-h-[520px] shadow-2xl relative">
            
            {/* Top Timer Mode Switcher Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 bg-[#090d14] p-1.5 rounded-2xl border border-white/10 w-full max-w-md">
              <button
                onClick={() => { setTimerMode("pomodoro"); setIsRunning(false); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer ${
                  timerMode === "pomodoro" 
                    ? "bg-[#1d63ff] text-white shadow-lg shadow-blue-500/25" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                25M POMODORO
              </button>

              <button
                onClick={() => { setTimerMode("deep"); setIsRunning(false); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer ${
                  timerMode === "deep" 
                    ? "bg-[#1d63ff] text-white shadow-lg shadow-blue-500/25" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                50M DEEP WORK
              </button>

              <button
                onClick={() => { setTimerMode("flowtime"); setIsRunning(false); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer ${
                  timerMode === "flowtime" 
                    ? "bg-[#1d63ff] text-white shadow-lg shadow-blue-500/25" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                FLOWTIME
              </button>

              <button
                onClick={() => { setTimerMode("custom"); setIsRunning(false); }}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer ${
                  timerMode === "custom" 
                    ? "bg-[#1d63ff] text-white shadow-lg shadow-blue-500/25" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                CUSTOM ({customMinutes}M)
              </button>
            </div>

            {/* Custom Minutes Slider (If Custom Selected) */}
            {timerMode === "custom" && (
              <div className="w-full max-w-xs space-y-1 text-center mt-3 animate-in fade-in">
                <input
                  type="range"
                  min={5}
                  max={120}
                  step={5}
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Number(e.target.value))}
                  className="w-full accent-[#1d63ff]"
                />
              </div>
            )}

            {/* Center Circular Progress Ring */}
            <div className="relative my-auto py-4 sm:py-6 flex items-center justify-center">
              <svg 
                viewBox="0 0 320 320" 
                className="w-[250px] h-[250px] sm:w-[320px] sm:h-[320px] transform -rotate-90"
              >
                {/* Background Ring Track */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  stroke="#172233"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Glowing Active Ring */}
                <circle
                  cx="160"
                  cy="160"
                  r={radius}
                  stroke="#1d63ff"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-linear drop-shadow-[0_0_12px_rgba(29,99,255,0.6)]"
                />
              </svg>

              {/* Inside Ring: Live Time & Status */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-6xl sm:text-7xl font-mono font-extrabold tracking-tight text-white tabular-nums drop-shadow-md">
                  {timerMode === "flowtime" ? formatTime(flowtimeSeconds) : formatTime(timeLeft)}
                </div>
                <div className="mt-2 text-xs font-mono tracking-[3px] uppercase text-slate-400 font-bold">
                  {isRunning ? "FOCUS INTERVAL" : "PAUSED"}
                </div>
              </div>
            </div>

            {/* Bottom Controls: Start/Pause Button + Reset */}
            <div className="flex items-center gap-3 w-full max-w-xs justify-center">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="flex-1 py-4 bg-[#1d63ff] hover:bg-[#1652d9] text-white text-xs font-bold font-mono uppercase tracking-[2px] rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>PAUSE FOCUS</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>START FOCUS</span>
                  </>
                )}
              </button>

              <button
                onClick={handleReset}
                className="p-4 bg-[#141e2e] hover:bg-[#1c2a3f] border border-white/10 text-slate-400 hover:text-white rounded-2xl cursor-pointer transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

          </section>

          {/* =========================================================
              RIGHT COLUMN: TARGET DELIVERABLE + AMBIENT SOUNDSCAPES
             ========================================================= */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* CARD 1: TARGET DELIVERABLE */}
            <section className="bg-[#0f1622] border border-white/10 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider uppercase text-[#1d63ff]">
                <Flame className="w-4 h-4 text-[#1d63ff]" />
                <span>TARGET DELIVERABLE</span>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5">
                  SELECT TASK FROM BACKLOG
                </label>
                <select
                  value={attachedTaskId}
                  onChange={(e) => setAttachedTaskId(e.target.value)}
                  className="w-full h-11 px-3.5 bg-[#090d14] border border-white/10 text-white font-medium text-xs rounded-xl outline-none focus:border-[#1d63ff] transition-colors cursor-pointer"
                >
                  {userData.tasks.length > 0 ? (
                    userData.tasks.map(task => (
                      <option key={task.id} value={task.id} className="bg-[#090d14] text-white">
                        {task.courseCode ? `[${task.courseCode}] ` : ""}{task.title}
                      </option>
                    ))
                  ) : (
                    <option value="" className="bg-[#090d14] text-slate-400">No active tasks in backlog</option>
                  )}
                  <option value="general" className="bg-[#090d14] text-white">
                    🎯 General Deep Study & Problem Solving
                  </option>
                </select>
              </div>
            </section>

            {/* CARD 2: AMBIENT SOUNDSCAPES */}
            <section className="bg-[#0f1622] border border-white/10 rounded-3xl p-6 space-y-5 shadow-xl">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-wider uppercase text-emerald-400">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>AMBIENT SOUNDSCAPES</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 uppercase tracking-widest">
                  ZERO NETWORK DELAY
                </span>
              </div>

              {/* Soundscape Preset Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                
                {/* 1. Silent */}
                <button
                  onClick={() => handleSelectSoundscape("none")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "none"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                >
                  <VolumeX className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Silent</span>
                </button>

                {/* 2. Natural Rain */}
                <button
                  onClick={() => handleSelectSoundscape("rain")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "rain"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="Multi-Layer Droplet Resonance (100% Offline)"
                >
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold">Rain</span>
                </button>

                {/* 3. White Noise */}
                <button
                  onClick={() => handleSelectSoundscape("white")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "white"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="Flat-Spectrum White Noise (Blocks Talking & Chatter)"
                >
                  <Radio className="w-4 h-4 text-slate-200" />
                  <span className="text-[10px] font-bold">White</span>
                </button>

                {/* 4. Deep Brown Noise */}
                <button
                  onClick={() => handleSelectSoundscape("brown")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "brown"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="320Hz Lowpass (ADHD & Deep Isolation)"
                >
                  <Radio className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-bold">Brown</span>
                </button>

                {/* 5. Pink Noise */}
                <button
                  onClick={() => handleSelectSoundscape("pink")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "pink"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="1/f Natural Waterfall Falloff"
                >
                  <Radio className="w-4 h-4 text-pink-400" />
                  <span className="text-[10px] font-bold">Pink</span>
                </button>

                {/* 6. Forest Green */}
                <button
                  onClick={() => handleSelectSoundscape("green")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "green"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="500Hz Centered Natural Canopy"
                >
                  <Leaf className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold">Green</span>
                </button>

                {/* 7. 40Hz Gamma */}
                <button
                  onClick={() => handleSelectSoundscape("gamma")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "gamma"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="40Hz Gamma Binaural Waves for Coding & Math"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold">40Hz</span>
                </button>

                {/* 8. 10Hz Alpha */}
                <button
                  onClick={() => handleSelectSoundscape("alpha")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "alpha"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="10Hz Alpha Binaural Waves for Calm Alertness"
                >
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-[10px] font-bold">Alpha</span>
                </button>

                {/* 9. Warm Cafe */}
                <button
                  onClick={() => handleSelectSoundscape("cafe")}
                  className={`p-2.5 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    audioType === "cafe"
                      ? "bg-[#1d63ff]/20 border-[#1d63ff] text-white"
                      : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                  }`}
                  title="Warm Coffeehouse & Library Whisper"
                >
                  <Coffee className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-bold">Cafe</span>
                </button>

              </div>

              {/* Volume Slider Bar */}
              {audioType !== "none" && audioType !== "music_embed" && (
                <div className="flex items-center gap-3 pt-1 animate-in fade-in">
                  <Volume2 className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-full accent-[#1d63ff]"
                  />
                  <span className="text-xs font-mono text-slate-400 w-8 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              )}

              {/* CURATED STUDY MUSIC SECTION */}
              <div className="pt-3 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold font-mono uppercase text-slate-300">
                    <Music className="w-3.5 h-3.5 text-[#1d63ff]" />
                    <span>CURATED STUDY MUSIC</span>
                  </div>
                  <button
                    onClick={() => setIsCustomUrlInputOpen(true)}
                    className="text-[10px] font-mono text-[#1d63ff] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Paste Custom URL</span>
                  </button>
                </div>

                {/* Music Presets Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {MUSIC_PRESETS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectPresetMusic(p.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer border truncate ${
                        audioType === "music_embed" && selectedMusicPreset === p.id
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500 font-bold"
                          : "bg-[#090d14] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      <Music className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>

                {/* Embedded Stream Player */}
                {audioType === "music_embed" && (
                  <div className="rounded-2xl overflow-hidden bg-black border border-white/10 shadow-inner h-28 animate-in fade-in duration-200">
                    <iframe
                      src={customEmbedUrl}
                      width="100%"
                      height="112"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      title="Music Player"
                      className="w-full h-full"
                    />
                  </div>
                )}

              </div>

            </section>

          </div>

        </div>
      </main>

      {/* Bottom Footer Status */}
      <footer className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 max-w-7xl mx-auto w-full pt-4 border-t border-white/10 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Campus: <strong className="text-white">{user?.university || "University"}</strong></span>
          <span>•</span>
          <span>Semester: <strong className="text-white">{user?.semester || "Active"}</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span>Active Audio: <strong className="text-[#1d63ff] uppercase font-bold">{audioType === "music_embed" ? "Music Stream" : audioType}</strong></span>
        </div>
      </footer>

      {/* Modal: Custom Stream Link Input */}
      {isCustomUrlInputOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form onSubmit={handleSaveCustomEmbed} className="bg-[#0f1622] border border-white/15 text-white max-w-md w-full p-6 rounded-2xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Music className="w-4 h-4 text-[#1d63ff]" />
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
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">
                SPOTIFY / YOUTUBE LINK
              </label>
              <input
                type="url"
                required
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://open.spotify.com/playlist/... or YouTube link"
                className="w-full h-11 px-3 text-xs bg-[#090d14] border border-white/15 text-white rounded-xl outline-none focus:border-[#1d63ff]"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCustomUrlInputOpen(false)}
                className="w-1/3 py-2.5 border border-white/15 text-xs font-bold uppercase rounded-xl cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 bg-[#1d63ff] hover:bg-[#1652d9] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
              >
                CONNECT STREAM
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Session Completion Celebration Dialog */}
      {isCompleted && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="bg-[#0f1622] border border-[#d4af37]/40 text-white max-w-md w-full p-8 text-center space-y-6 shadow-2xl rounded-2xl">
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
                  className="w-full py-3.5 bg-[#1d63ff] hover:bg-[#1652d9] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20"
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
