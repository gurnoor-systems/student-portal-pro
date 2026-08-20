"use client";

// Pure Web Audio API Soundscape Generator (Zero external assets or network dependencies)
class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentType: "none" | "rain" | "noise" | "alpha" | "cafe" = "none";
  private gainNode: GainNode | null = null;
  private nodes: (AudioNode | number)[] = [];
  private volume: number = 0.4;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): "none" | "rain" | "noise" | "alpha" | "cafe" {
    return this.currentType;
  }

  public isPlaying(): boolean {
    return this.currentType !== "none";
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public stop() {
    try {
      this.nodes.forEach(n => {
        if (typeof n === "number") {
          clearInterval(n);
        } else if (n && "stop" in n && typeof (n as any).stop === "function") {
          (n as any).stop();
        } else if (n && "disconnect" in n && typeof n.disconnect === "function") {
          n.disconnect();
        }
      });
    } catch {
      // ignore
    }
    this.nodes = [];
    this.currentType = "none";
  }

  public play(type: "rain" | "noise" | "alpha" | "cafe", volume: number = 0.4) {
    this.stop();
    this.volume = volume;
    const ctx = this.getContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    this.gainNode.connect(ctx.destination);
    this.currentType = type;

    if (type === "noise") {
      // Calming Pink / Brown Noise Buffer
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(this.gainNode);
      whiteNoise.start();
      this.nodes.push(whiteNoise, filter);
    } else if (type === "alpha") {
      // 10 Hz Binaural Flow State Alpha Waves (200 Hz Left, 210 Hz Right)
      const merger = ctx.createChannelMerger(2);

      const oscL = ctx.createOscillator();
      oscL.type = "sine";
      oscL.frequency.setValueAtTime(200, ctx.currentTime);

      const oscR = ctx.createOscillator();
      oscR.type = "sine";
      oscR.frequency.setValueAtTime(210, ctx.currentTime);

      const gainL = ctx.createGain();
      gainL.gain.setValueAtTime(0.5, ctx.currentTime);
      const gainR = ctx.createGain();
      gainR.gain.setValueAtTime(0.5, ctx.currentTime);

      oscL.connect(gainL);
      gainL.connect(merger, 0, 0);

      oscR.connect(gainR);
      gainR.connect(merger, 0, 1);

      merger.connect(this.gainNode);

      oscL.start();
      oscR.start();
      this.nodes.push(oscL, oscR, gainL, gainR, merger);
    } else if (type === "rain") {
      // Synthesized Gentle Rain (Lowpassed brown noise + randomized droplet filter)
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.3;
      }

      const rainNoise = ctx.createBufferSource();
      rainNoise.buffer = noiseBuffer;
      rainNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(0.8, ctx.currentTime);

      rainNoise.connect(filter);
      filter.connect(this.gainNode);
      rainNoise.start();
      this.nodes.push(rainNoise, filter);
    } else if (type === "cafe") {
      // Warm Cafe Ambience (Layered warm bandpass tones)
      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(140, ctx.currentTime);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(280, ctx.currentTime);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(this.gainNode);

      osc1.start();
      osc2.start();
      this.nodes.push(osc1, osc2, filter);
    }
  }

  // Tibetan Singing Bowl Completion Gong
  public playCompletionBowl() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const freqs = [432, 864, 1296];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2 / (i + 1), now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.5);
    });
  }
}

export const soundscapeEngine = new SoundscapeEngine();
