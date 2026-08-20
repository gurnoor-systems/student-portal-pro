"use client";

// Pure Web Audio API Multi-Track Soundscape Synthesizer
// Zero external assets or network dependencies

export type SoundscapeTrackId = "rain" | "brown" | "green" | "gamma40" | "alpha10" | "theta6" | "cafe";

export interface SoundTrackState {
  id: SoundscapeTrackId;
  name: string;
  category: "Nature" | "Binaural" | "Noise" | "Atmosphere";
  frequencyLabel?: string;
  volume: number; // 0.0 to 1.0
  active: boolean;
}

export const SOUND_TRACK_DEFINITIONS: Record<SoundscapeTrackId, { name: string; category: SoundTrackState["category"]; frequencyLabel?: string; defaultVolume: number }> = {
  rain: { name: "Gentle Rain", category: "Nature", defaultVolume: 0.6 },
  brown: { name: "Deep Brown Noise", category: "Noise", frequencyLabel: "ADHD / Executive Focus", defaultVolume: 0.5 },
  green: { name: "Forest Green Noise", category: "Nature", frequencyLabel: "500Hz Centered Ambience", defaultVolume: 0.5 },
  gamma40: { name: "40 Hz Gamma Waves", category: "Binaural", frequencyLabel: "Hyper-Focus (Math & Coding)", defaultVolume: 0.4 },
  alpha10: { name: "10 Hz Alpha Waves", category: "Binaural", frequencyLabel: "Calm Flow State & Reading", defaultVolume: 0.4 },
  theta6: { name: "6 Hz Theta Waves", category: "Binaural", frequencyLabel: "Creative Problem Solving", defaultVolume: 0.3 },
  cafe: { name: "Warm Cafe", category: "Atmosphere", defaultVolume: 0.4 }
};

interface ActiveAudioTrack {
  gainNode: GainNode;
  nodes: (AudioNode | number)[];
}

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterVolume: number = 0.5;
  private activeTracks: Map<SoundscapeTrackId, ActiveAudioTrack> = new Map();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (!this.masterGain && this.ctx) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public isTrackPlaying(id: SoundscapeTrackId): boolean {
    return this.activeTracks.has(id);
  }

  public isAnyPlaying(): boolean {
    return this.activeTracks.size > 0;
  }

  public setTrackVolume(id: SoundscapeTrackId, volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    const track = this.activeTracks.get(id);
    if (track && this.ctx) {
      track.gainNode.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
  }

  public toggleTrack(id: SoundscapeTrackId, targetVolume: number = 0.5): boolean {
    if (this.activeTracks.has(id)) {
      this.stopTrack(id);
      return false;
    } else {
      this.startTrack(id, targetVolume);
      return true;
    }
  }

  public startTrack(id: SoundscapeTrackId, volume: number = 0.5) {
    if (this.activeTracks.has(id)) {
      this.setTrackVolume(id, volume);
      return;
    }

    const ctx = this.getContext();
    if (!this.masterGain) return;

    const trackGain = ctx.createGain();
    trackGain.gain.setValueAtTime(volume, ctx.currentTime);
    trackGain.connect(this.masterGain);

    const nodes: (AudioNode | number)[] = [];

    switch (id) {
      case "brown": {
        // High-density Brown Noise generator with low-pass roll-off
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5; // Gain compensation
        }
        const brownSource = ctx.createBufferSource();
        brownSource.buffer = noiseBuffer;
        brownSource.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(380, ctx.currentTime);

        brownSource.connect(filter);
        filter.connect(trackGain);
        brownSource.start();
        nodes.push(brownSource, filter);
        break;
      }

      case "green": {
        // Nature Green Noise centered around 500Hz
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.4;
        }
        const greenSource = ctx.createBufferSource();
        greenSource.buffer = noiseBuffer;
        greenSource.loop = true;

        const bandFilter = ctx.createBiquadFilter();
        bandFilter.type = "bandpass";
        bandFilter.frequency.setValueAtTime(500, ctx.currentTime);
        bandFilter.Q.setValueAtTime(0.7, ctx.currentTime);

        greenSource.connect(bandFilter);
        bandFilter.connect(trackGain);
        greenSource.start();
        nodes.push(greenSource, bandFilter);
        break;
      }

      case "rain": {
        // Multi-stage Rain Synthesis
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.35;
        }
        const rainSource = ctx.createBufferSource();
        rainSource.buffer = noiseBuffer;
        rainSource.loop = true;

        const bandFilter = ctx.createBiquadFilter();
        bandFilter.type = "bandpass";
        bandFilter.frequency.setValueAtTime(750, ctx.currentTime);
        bandFilter.Q.setValueAtTime(0.85, ctx.currentTime);

        rainSource.connect(bandFilter);
        bandFilter.connect(trackGain);
        rainSource.start();
        nodes.push(rainSource, bandFilter);
        break;
      }

      case "gamma40": {
        // 40 Hz Gamma Binaural Waves (200 Hz Left, 240 Hz Right)
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = "sine";
        oscL.frequency.setValueAtTime(200, ctx.currentTime);

        const oscR = ctx.createOscillator();
        oscR.type = "sine";
        oscR.frequency.setValueAtTime(240, ctx.currentTime);

        const gainL = ctx.createGain();
        gainL.gain.setValueAtTime(0.4, ctx.currentTime);
        const gainR = ctx.createGain();
        gainR.gain.setValueAtTime(0.4, ctx.currentTime);

        oscL.connect(gainL);
        gainL.connect(merger, 0, 0);

        oscR.connect(gainR);
        gainR.connect(merger, 0, 1);

        merger.connect(trackGain);
        oscL.start();
        oscR.start();
        nodes.push(oscL, oscR, gainL, gainR, merger);
        break;
      }

      case "alpha10": {
        // 10 Hz Alpha Binaural Waves (200 Hz Left, 210 Hz Right)
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = "sine";
        oscL.frequency.setValueAtTime(200, ctx.currentTime);

        const oscR = ctx.createOscillator();
        oscR.type = "sine";
        oscR.frequency.setValueAtTime(210, ctx.currentTime);

        const gainL = ctx.createGain();
        gainL.gain.setValueAtTime(0.4, ctx.currentTime);
        const gainR = ctx.createGain();
        gainR.gain.setValueAtTime(0.4, ctx.currentTime);

        oscL.connect(gainL);
        gainL.connect(merger, 0, 0);

        oscR.connect(gainR);
        gainR.connect(merger, 0, 1);

        merger.connect(trackGain);
        oscL.start();
        oscR.start();
        nodes.push(oscL, oscR, gainL, gainR, merger);
        break;
      }

      case "theta6": {
        // 6 Hz Theta Binaural Waves (180 Hz Left, 186 Hz Right)
        const merger = ctx.createChannelMerger(2);

        const oscL = ctx.createOscillator();
        oscL.type = "sine";
        oscL.frequency.setValueAtTime(180, ctx.currentTime);

        const oscR = ctx.createOscillator();
        oscR.type = "sine";
        oscR.frequency.setValueAtTime(186, ctx.currentTime);

        const gainL = ctx.createGain();
        gainL.gain.setValueAtTime(0.4, ctx.currentTime);
        const gainR = ctx.createGain();
        gainR.gain.setValueAtTime(0.4, ctx.currentTime);

        oscL.connect(gainL);
        gainL.connect(merger, 0, 0);

        oscR.connect(gainR);
        gainR.connect(merger, 0, 1);

        merger.connect(trackGain);
        oscL.start();
        oscR.start();
        nodes.push(oscL, oscR, gainL, gainR, merger);
        break;
      }

      case "cafe": {
        // Warm Coffeehouse Resonant Filter
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(110, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, ctx.currentTime);

        osc.connect(filter);
        filter.connect(trackGain);
        osc.start();
        nodes.push(osc, filter);
        break;
      }
    }

    this.activeTracks.set(id, { gainNode: trackGain, nodes });
  }

  public stopTrack(id: SoundscapeTrackId) {
    const track = this.activeTracks.get(id);
    if (!track) return;

    try {
      track.nodes.forEach(n => {
        if (typeof n === "number") {
          clearInterval(n);
        } else if (n && "stop" in n && typeof (n as any).stop === "function") {
          (n as any).stop();
        } else if (n && "disconnect" in n && typeof n.disconnect === "function") {
          n.disconnect();
        }
      });
      track.gainNode.disconnect();
    } catch {
      // ignore
    }

    this.activeTracks.delete(id);
  }

  public stopAll() {
    const trackIds = Array.from(this.activeTracks.keys());
    trackIds.forEach(id => this.stopTrack(id));
  }

  public applyPreset(preset: Record<SoundscapeTrackId, number>) {
    this.stopAll();
    Object.entries(preset).forEach(([id, vol]) => {
      if (vol > 0) {
        this.startTrack(id as SoundscapeTrackId, vol);
      }
    });
  }
}

export const soundscapeEngine = new SoundscapeEngine();
