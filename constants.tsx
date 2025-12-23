
import { BandType, SpectralBand } from './types';

export const BANDS_CONFIG: Omit<SpectralBand, 'id' | 'active'>[] = [
  { name: "SUB", freq: 60, type: BandType.LOWPASS, color: "#FF3131", visualGain: 1.2 },       
  { name: "BASS", freq: 150, type: BandType.BANDPASS, color: "#FF914D", visualGain: 1.5, Q: 1.0 }, 
  { name: "LOW MIDS", freq: 400, type: BandType.BANDPASS, color: "#FFDE59", visualGain: 2.0, Q: 1.2 }, 
  { name: "MIDS", freq: 1000, type: BandType.BANDPASS, color: "#00BF63", visualGain: 2.5, Q: 1.5 },    
  { name: "HIGH MIDS", freq: 2400, type: BandType.BANDPASS, color: "#00D2FF", visualGain: 3.5, Q: 2.0 },  
  { name: "PRESENCE", freq: 6000, type: BandType.BANDPASS, color: "#5271FF", visualGain: 4.5, Q: 2.5 },   
  { name: "BRILLIANCE", freq: 12000, type: BandType.BANDPASS, color: "#8C52FF", visualGain: 6.0, Q: 3.0 }, 
  { name: "AIR", freq: 16000, type: BandType.HIGHPASS, color: "#FF66C4", visualGain: 8.0 }           
];

export const INITIAL_AUDIO_STATE = {
  isPlaying: false,
  isLoaded: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  trackName: "No Track Loaded"
};
