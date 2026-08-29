"use client";

import { useState, useEffect, useCallback } from "react";
import { soundscapeEngine, SoundscapeType, SOUNDSCAPE_OPTIONS } from "@/lib/soundscapes";

export function useSoundscape() {
  const [activeSoundscape, setActiveSoundscape] = useState<SoundscapeType>("parisian_cafe");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Play a specific soundscape preset
  const playSoundscape = useCallback((type: SoundscapeType) => {
    setActiveSoundscape(type);
    soundscapeEngine.play(type, isMuted ? 0 : volume);
    setIsPlaying(true);
  }, [isMuted, volume]);

  // Stop playback
  const stopSoundscape = useCallback(() => {
    soundscapeEngine.stop();
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopSoundscape();
    } else {
      playSoundscape(activeSoundscape);
    }
  }, [isPlaying, activeSoundscape, playSoundscape, stopSoundscape]);

  // Set volume level
  const updateVolume = useCallback((newVol: number) => {
    setVolume(newVol);
    if (!isMuted && isPlaying) {
      soundscapeEngine.setVolume(newVol);
    }
  }, [isMuted, isPlaying]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundscapeEngine.setVolume(nextMuted ? 0 : volume);
  }, [isMuted, volume]);

  // Play crystal bell chime
  const playCompletionChime = useCallback(() => {
    soundscapeEngine.playCompletionChime();
  }, []);

  return {
    activeSoundscape,
    isPlaying,
    volume,
    isMuted,
    options: SOUNDSCAPE_OPTIONS,
    playSoundscape,
    stopSoundscape,
    togglePlay,
    updateVolume,
    toggleMute,
    playCompletionChime
  };
}
