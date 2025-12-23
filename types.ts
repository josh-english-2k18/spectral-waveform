
export enum BandType {
  LOWPASS = 'lowpass',
  BANDPASS = 'bandpass',
  HIGHPASS = 'highpass'
}

export interface SpectralBand {
  id: string;
  name: string;
  freq: number;
  type: BandType;
  color: string;
  visualGain: number;
  Q?: number;
  active: boolean;
  gainNode?: GainNode;
  analyser?: AnalyserNode;
  filter?: BiquadFilterNode;
}

export interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  trackName: string;
}

export interface SonicInsight {
  mood: string;
  spectralProfile: string;
  engineeringAdvice: string;
  tags: string[];
}
