
import { SpectralBand, BandType } from "../types";
import { BANDS_CONFIG } from "../constants";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private bands: SpectralBand[] = [];
  private buffer: AudioBuffer | null = null;
  private startTime = 0;
  public pauseTime = 0;
  private onTimeUpdate: (time: number) => void = () => { };

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  get context() { return this.ctx; }

  async loadTrack(file: File): Promise<AudioBuffer> {
    this.init();
    const arrayBuffer = await file.arrayBuffer();
    this.buffer = await this.ctx!.decodeAudioData(arrayBuffer);
    return this.buffer;
  }

  cleanup() {
    if (this.source) {
      try { this.source.stop(); } catch (e) { }
      this.source.disconnect();
      this.source = null;
    }
    this.bands.forEach(band => {
      band.filter?.disconnect();
      band.gainNode?.disconnect();
      band.analyser?.disconnect();
    });
    this.bands = [];
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
  }

  setupGraph(volume: number, onUpdate: (time: number) => void) {
    if (!this.ctx || !this.buffer) return;
    this.cleanup();
    this.onTimeUpdate = onUpdate;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = volume;
    this.masterGain.connect(this.ctx.destination);

    this.bands = BANDS_CONFIG.map((config, idx) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = config.type as BiquadFilterType;
      filter.frequency.value = config.freq;
      if (config.Q) filter.Q.value = config.Q;

      const gainNode = this.ctx!.createGain();
      const analyser = this.ctx!.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.5;

      filter.connect(gainNode);
      gainNode.connect(analyser);
      gainNode.connect(this.masterGain!);

      return {
        ...config,
        id: `band-${idx}`,
        active: true,
        filter,
        gainNode,
        analyser
      };
    });
  }

  play(offset: number = 0) {
    if (!this.ctx || !this.buffer || !this.masterGain) return;

    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Ensure previous source is stopped/disconnected before starting new one
    if (this.source) {
      try { this.source.stop(); } catch (e) { }
      this.source.disconnect();
    }

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;

    this.bands.forEach(band => {
      this.source!.connect(band.filter!);
    });

    this.source.start(0, offset);
    this.startTime = this.ctx.currentTime - offset;
    this.pauseTime = offset;

    this.source.onended = () => {
      // Logic for track finishing could go here
    };
  }

  getCurrentTime(): number {
    if (!this.ctx || !this.buffer) return 0;
    if (this.source) {
      const time = this.ctx.currentTime - this.startTime;
      return Math.min(time, this.buffer.duration);
    }
    return this.pauseTime;
  }

  pause(): number {
    if (this.source) {
      this.pauseTime = this.getCurrentTime();
      try { this.source.stop(); } catch (e) { }
      this.source.disconnect();
      this.source = null;
    }
    return this.pauseTime;
  }

  stop() {
    this.pause();
    this.pauseTime = 0;
  }

  setVolume(val: number) {
    if (this.masterGain) this.masterGain.gain.value = val;
  }

  toggleBand(id: string, active: boolean) {
    const band = this.bands.find(b => b.id === id);
    if (band && band.gainNode) {
      band.gainNode.gain.setTargetAtTime(active ? 1 : 0, this.ctx!.currentTime, 0.05);
      band.active = active;
    }
  }

  getBands() {
    return this.bands;
  }

  getDuration() {
    return this.buffer?.duration || 0;
  }

  getWaveformData(offsetTime: number, length: number, targetArray: Uint8Array) {
    if (!this.buffer) return;

    const sampleRate = this.buffer.sampleRate;
    // Look back slightly to ensure we have a zero-crossing available for the sync trigger
    const startSample = Math.floor(offsetTime * sampleRate) - Math.floor(length / 4);
    const channelData = this.buffer.getChannelData(0); // Use first channel for visualization

    for (let i = 0; i < length; i++) {
      const sampleIdx = startSample + i;
      if (sampleIdx >= 0 && sampleIdx < channelData.length) {
        // Map float -1..1 to 0..255
        const val = channelData[sampleIdx];
        targetArray[i] = Math.floor((val + 1) * 127.5);
      } else {
        targetArray[i] = 128; // Silence
      }
    }
  }

  getLatestSample(bandId: string): number {
    const band = this.bands.find(b => b.id === bandId);
    if (!band || !band.analyser) return 0;

    // We only need one sample for the math display, using a small buffer
    const tempArray = new Uint8Array(1);
    band.analyser.getByteTimeDomainData(tempArray);
    // Convert 0-255 back to -1..1 float
    return (tempArray[0] - 128) / 128.0;
  }

  getBiquadCoefficients(bandId: string) {
    const band = this.bands.find(b => b.id === bandId);
    if (!band || !band.filter) return null;

    const f = band.filter.frequency.value;
    const Q = band.filter.Q.value;
    const fs = this.ctx?.sampleRate || 44100;

    const w0 = 2 * Math.PI * f / fs;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosW0 = Math.cos(w0);

    let b0, b1, b2, a0, a1, a2;

    if (band.type === 'bandpass') {
      b0 = alpha;
      b1 = 0;
      b2 = -alpha;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
    } else if (band.type === 'lowpass') {
      b0 = (1 - cosW0) / 2;
      b1 = 1 - cosW0;
      b2 = (1 - cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
    } else if (band.type === 'highpass') {
      b0 = (1 + cosW0) / 2;
      b1 = -(1 + cosW0);
      b2 = (1 + cosW0) / 2;
      a0 = 1 + alpha;
      a1 = -2 * cosW0;
      a2 = 1 - alpha;
    } else {
      // Peaking or fallback
      const A = 1; // 0dB
      b0 = 1 + alpha * A;
      b1 = -2 * cosW0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosW0;
      a2 = 1 - alpha / A;
    }

    return {
      b0: (b0 / a0).toFixed(4),
      b1: (b1 / a0).toFixed(4),
      b2: (b2 / a0).toFixed(4),
      a1: (a1 / a0).toFixed(4),
      a2: (a2 / a0).toFixed(4)
    };
  }
}

export const audioEngine = new AudioEngine();
