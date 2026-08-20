"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth, TaskItem } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { 
  soundscapeEngine, 
  SoundscapeTrackId, 
  SOUND_TRACK_DEFINITIONS,
  SoundTrackState
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
  Minimize2,
  Maximize2,
  Sliders,
  Zap,
  Leaf,
  Layers,
  Award
} from "lucide-react";

interface FocusSanctuaryProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCompleted?: (taskId: string) => void;
}

const SMART_PRESETS = [
  {
    id: "deep_code",
    name: "⚡ 40Hz Deep Code",
    desc: "40Hz Gamma + Brown Noise",
    tracks: { brown: 0.6, gamma40: 0.45, rain: 0, green: 0, alpha10: 0, theta6: 0, cafe: 0 } as Record<SoundscapeTrackId, number>
  },
  {
    id: "rainy_night",
    name: "🌧️ Rainy Midnight",
    desc: "Gentle Rain + 10Hz Alpha Waves",
    tracks: { rain: 0.7, alpha10: 0.35, brown: 0.2, green: 0, gamma40: 0, theta6: 0, cafe: 0 } as Record<SoundscapeTrackId, number>
  },
  {
    id: "zen_forest",
    name: "🌲 Zen Forest Library",
    desc: "Green Noise + 10Hz Alpha",
    tracks: { green: 0.65, alpha10: 0.4, rain: 0.15, brown: 0, gamma40: 0, theta6: 0, cafe: 0 } as Record<SoundscapeTrackId, number>
  },
  {
    id: "cafe_flow",
    name: "☕ Coffeehouse Flow",
    desc: "Warm Cafe + Light Rain",
    tracks: { cafe: 0.6, rain: 0.35, brown: 0, green: 0, gamma40: 0, alpha10: 0, theta6: 0 } as Record<SoundscapeTrackId, number>
  }
];

export default function FocusSanctuary({ isOpen, onClose, onTaskCompleted }: FocusSanctuaryProps) {
  const { user, getUserData } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userData = getUserData();

  // Floating PiP Mode
  const [isPipMode, setIsPipMode] = useState<boolean>(false);

  // Timer modes: 'pomodoro' (25m), 'deep' (50m), 'flowtime' (stopwatch), 'custom' (slider)
  const [timerMode, setTimerMode] = useState<"pomodoro" | "deep" | "flowtime" | "custom">("pomodoro");
  const [customMinutes, setCustomMinutes] = useState<number>(45);
  const [selectedDuration, setSelectedDuration] = useState<number>(25 * 60); // in seconds
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [flowtimeSeconds, setFlowtimeSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Attached Task
  const [attachedTaskId, setAttachedTaskId] = useState<string>(userData.tasks[0]?.id || "");

  // Multi-Track Audio System
  const [masterVolume, setMasterVolume] = useState<number>(0.6);
  const [trackStates, setTrackStates] = useState<Record<SoundscapeTrackId, { active: boolean; volume: number }>>({
    rain: { active: false, volume: 0.6 },
    brown: { active: false, volume: 0.5 },
    green: { active: false, volume: 0.5 },
    gamma40: { active: false, volume: 0.45 },
    alpha10: { active: false, volume: 0.4 },
    theta6: { active: false, volume: 0.35 },
    cafe: { active: false, volume: 0.4 }
  });

  // Completion / Auto-Log Feedback
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);

  // Set default task
  useEffect(() => {
    if (userData.tasks.length > 0 && !attachedTaskId) {
      setAttachedTaskId(userData.tasks[0].id);
    }
  }, [userData.tasks, attachedTaskId]);

  // Handle Timer Duration Changes
  useEffect(() => {
    if (!isRunning) {
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

  // Main Timer Countdown Loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        if (timerMode === "flowtime") {
          setFlowtimeSeconds(prev => prev + 1);
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleSessionComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timerMode]);

  // Auto-Log Completed Session to Analytics & Study Streak
  const handleSessionComplete = () => {
    setIsRunning(false);
    setIsCompleted(true);
    soundscapeEngine.stopAll();

    const elapsedMinutes = timerMode === "flowtime" 
      ? Math.max(1, Math.round(flowtimeSeconds / 60))
      : Math.round(selectedDuration / 60);

    logSessionToAnalytics(elapsedMinutes);
  };

  const logSessionToAnalytics = (minutes: number) => {
    if (!user) return;
    try {
      const storageKey = `student_portal_user_${user.id}_focus_history`;
      const raw = localStorage.getItem(storageKey);
      const history = raw ? JSON.parse(raw) : [];
      const newEntry = {
        id: `focus_${Date.now()}`,
        date: new Date().toISOString(),
        minutes,
        taskId: attachedTaskId,
        taskTitle: attachedTask?.title || "Deep Focus Session"
      };
      history.push(newEntry);
      localStorage.setItem(storageKey, JSON.stringify(history));

      setSessionFeedback(`Logged ${minutes}m focus session to study streak!`);
    } catch {
      // ignore
    }
  };

  // Sound Track Toggles & Volume
  const handleToggleTrack = (id: SoundscapeTrackId) => {
    const current = trackStates[id];
    const willBeActive = !current.active;

    if (willBeActive) {
      soundscapeEngine.startTrack(id, current.volume);
    } else {
      soundscapeEngine.stopTrack(id);
    }

    setTrackStates(prev => ({
      ...prev,
      [id]: { ...prev[id], active: willBeActive }
    }));
  };

  const handleTrackVolumeChange = (id: SoundscapeTrackId, newVol: number) => {
    soundscapeEngine.setTrackVolume(id, newVol);
    setTrackStates(prev => ({
      ...prev,
      [id]: { ...prev[id], volume: newVol }
    }));
  };

  const handleApplyPreset = (preset: typeof SMART_PRESETS[0]) => {
    soundscapeEngine.applyPreset(preset.tracks);

    const nextStates = { ...trackStates };
    (Object.keys(preset.tracks) as SoundscapeTrackId[]).forEach(id => {
      const vol = preset.tracks[id];
      nextStates[id] = {
        active: vol > 0,
        volume: vol > 0 ? vol : nextStates[id].volume
      };
    });
    setTrackStates(nextStates);
  };

  const handleMasterVolumeChange = (newVol: number) => {
    setMasterVolume(newVol);
    soundscapeEngine.setMasterVolume(newVol);
  };

  const handleStopAllAudio = () => {
    soundscapeEngine.stopAll();
    setTrackStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k as SoundscapeTrackId].active = false;
      });
      return next;
    });
  };

  const attachedTask = userData.tasks.find(t => t.id === attachedTaskId);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Cleanup audio on modal close
  const handleExitSanctuary = () => {
    soundscapeEngine.stopAll();
    setIsRunning(false);
    setIsPipMode(false);
    onClose();
  };

  if (!isOpen) return null;

  // =========================================================================
  // 1. MINI FLOATING PICTURE-IN-PICTURE (PiP) WIDGET
  // =========================================================================
  if (isPipMode) {
    return (
      <aside 
        aria-label="Floating Focus Timer"
        className="fixed bottom-6 right-6 z-50 bg-[#090d12]/95 border border-[var(--primary)]/60 text-white rounded-2xl shadow-2xl p-3.5 flex items-center gap-3.5 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <div>
            <div className="text-sm font-mono font-bold tracking-wider text-white">
              {timerMode === "flowtime" ? formatTime(flowtimeSeconds) : formatTime(timeLeft)}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
              {attachedTask?.title || "Deep Focus"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-2 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white rounded-lg cursor-pointer"
            title={isRunning ? "Pause Timer" : "Start Timer"}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsPipMode(false)}
            className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg cursor-pointer transition-colors"
            title="Expand to Fullscreen Focus Room"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleExitSanctuary}
            className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg cursor-pointer transition-colors"
            title="Close Focus Room"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  // =========================================================================
  // 2. FULLSCREEN FOCUS SANCTUARY ROOM
  // =========================================================================
  const progressPercent = timerMode === "flowtime" 
    ? 100 
    : Math.round(((selectedDuration - timeLeft) / selectedDuration) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#090d12] text-white flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200">
      
      {/* Top Header Bar */}
      <header className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={24} variant="gold" />
          <div>
            <div className="text-[10px] font-mono tracking-[2px] uppercase text-[#d4af37] font-bold">
              FOCUS ROOM PRO
            </div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              {attachedTask ? attachedTask.title : "Deep Work & Active Recall Sanctuary"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PiP Minimize Button */}
          <button
            onClick={() => setIsPipMode(true)}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Minimize into corner Floating Pill"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PiP Mode</span>
          </button>

          {/* Close Sanctuary */}
          <button
            onClick={handleExitSanctuary}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Exit Focus Room"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Focus Center */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full space-y-8">
        
        {/* Timer Mode Selectors */}
        <nav aria-label="Focus Modes" className="flex flex-wrap items-center justify-center gap-2 bg-[#121822] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => { setTimerMode("pomodoro"); setIsRunning(false); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              timerMode === "pomodoro" ? "bg-[var(--primary)] text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            POMODORO (25M)
          </button>

          <button
            onClick={() => { setTimerMode("deep"); setIsRunning(false); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              timerMode === "deep" ? "bg-[var(--primary)] text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            DEEP WORK (50M)
          </button>

          <button
            onClick={() => { setTimerMode("flowtime"); setIsRunning(false); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              timerMode === "flowtime" ? "bg-[var(--primary)] text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            FLOWTIME (STOPWATCH)
          </button>

          <button
            onClick={() => { setTimerMode("custom"); setIsRunning(false); }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
              timerMode === "custom" ? "bg-[var(--primary)] text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            CUSTOM
          </button>
        </nav>

        {/* Custom Minutes Slider */}
        {timerMode === "custom" && (
          <div className="w-full max-w-xs space-y-1 text-center animate-in fade-in">
            <div className="text-xs font-mono text-slate-400">Target Duration: <span className="text-[var(--primary)] font-bold">{customMinutes} Minutes</span></div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>
        )}

        {/* Main Countdown Visualizer */}
        <div className="relative flex flex-col items-center justify-center">
          <div className="text-6xl sm:text-8xl font-mono font-extrabold tracking-tighter text-white tabular-nums drop-shadow-lg">
            {timerMode === "flowtime" ? formatTime(flowtimeSeconds) : formatTime(timeLeft)}
          </div>
          
          <div className="mt-2 text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-ping" : "bg-slate-500"}`} />
            <span>{isRunning ? "FOCUS INTERVAL RUNNING" : "READY FOR IMMERSION"}</span>
          </div>

          {/* Attached Task Dropdown */}
          <div className="mt-4 flex items-center gap-2 bg-[#121822] border border-white/10 px-3 py-1.5 rounded-lg text-xs">
            <span className="text-slate-400 font-mono">ATTACHED TASK:</span>
            <select
              value={attachedTaskId}
              onChange={(e) => setAttachedTaskId(e.target.value)}
              className="bg-transparent text-[var(--primary)] font-bold outline-none cursor-pointer"
            >
              {userData.tasks.map(t => (
                <option key={t.id} value={t.id} className="bg-[#090d12] text-white">
                  {t.courseCode}: {t.title}
                </option>
              ))}
              <option value="general" className="bg-[#090d12] text-white">General Deep Reading / Problem Solving</option>
            </select>
          </div>
        </div>

        {/* Play / Pause / Reset Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-8 py-3.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-sm font-bold uppercase tracking-wider rounded-xl flex items-center gap-2.5 shadow-xl hover:scale-105 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>PAUSE SESSION</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>START IMMERSION</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(selectedDuration);
              setFlowtimeSeconds(0);
            }}
            className="p-3.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl cursor-pointer transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={handleSessionComplete}
            className="px-4 py-3.5 bg-[#121822] hover:bg-[#1c2636] border border-white/15 text-slate-300 hover:text-white text-xs font-bold uppercase rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
            title="End & Log Session to Study Streak"
          >
            <Award className="w-4 h-4 text-[#d4af37]" />
            <span>LOG SESSION</span>
          </button>
        </div>

        {sessionFeedback && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs rounded-xl animate-in fade-in">
            {sessionFeedback}
          </div>
        )}

      </main>

      {/* Bottom Multi-Track Soundscape Mixer Drawer */}
      <footer className="p-6 border-t border-white/10 bg-[#0c1118]/90 backdrop-blur-md space-y-4">
        
        {/* Presets & Master Volume Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-5xl mx-auto">
          
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-[#d4af37] font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>SCIENTIFIC PRESETS:</span>
            </span>

            {SMART_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset)}
                className="px-3 py-1.5 bg-[#16202c] hover:bg-[#1f2d3d] border border-white/10 text-xs font-bold text-slate-200 hover:text-white rounded-lg cursor-pointer transition-colors"
                title={preset.desc}
              >
                {preset.name}
              </button>
            ))}

            <button
              onClick={handleStopAllAudio}
              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg cursor-pointer transition-colors"
              title="Mute All Audio Tracks"
            >
              Mute All
            </button>
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={masterVolume}
              onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
              className="w-full accent-[var(--primary)]"
            />
            <span className="text-xs font-mono text-slate-400 w-8 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>

        </div>

        {/* Individual Sound Track Sliders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 max-w-5xl mx-auto text-xs">
          {(Object.keys(SOUND_TRACK_DEFINITIONS) as SoundscapeTrackId[]).map(id => {
            const def = SOUND_TRACK_DEFINITIONS[id];
            const state = trackStates[id];
            return (
              <div 
                key={id}
                className={`p-3 rounded-xl border transition-all ${
                  state.active 
                    ? "bg-[#141d2a] border-[var(--primary)] shadow-sm" 
                    : "bg-[#0f1520] border-white/10 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => handleToggleTrack(id)}
                    className={`text-xs font-bold text-left truncate cursor-pointer ${
                      state.active ? "text-[var(--primary)]" : "text-slate-300"
                    }`}
                  >
                    {def.name}
                  </button>
                  <input
                    type="checkbox"
                    checked={state.active}
                    onChange={() => handleToggleTrack(id)}
                    className="w-3.5 h-3.5 accent-[var(--primary)] rounded cursor-pointer"
                  />
                </div>

                {def.frequencyLabel && (
                  <div className="text-[9px] text-slate-400 font-mono truncate mb-2">
                    {def.frequencyLabel}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    disabled={!state.active}
                    value={state.volume}
                    onChange={(e) => handleTrackVolumeChange(id, Number(e.target.value))}
                    className="w-full accent-[var(--primary)] disabled:opacity-30"
                  />
                  <span className="text-[9px] font-mono text-slate-400 w-6 text-right">
                    {state.active ? Math.round(state.volume * 100) : "--"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </footer>

    </div>
  );
}
