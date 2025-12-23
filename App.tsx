
import React, { useState, useRef, useEffect } from 'react';
import { audioEngine } from './services/audioEngine';
import { analyzeSpectralProfile } from './services/geminiService';
import { AudioState, SonicInsight, SpectralBand } from './types';
import { INITIAL_AUDIO_STATE } from './constants';
import Sidebar from './components/Sidebar';
import Visualizer from './components/Visualizer';
import SpectralAnalysis from './components/SpectralAnalysis';
import DSPMathInsight from './components/DSPMathInsight';

const App: React.FC = () => {
  const [audioState, setAudioState] = useState<AudioState>(INITIAL_AUDIO_STATE);
  const [bands, setBands] = useState<SpectralBand[]>([]);
  const [insight, setInsight] = useState<SonicInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStacked, setIsStacked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  // Fix: Added undefined as initial value to satisfy TypeScript requirement for useRef
  const timerRef = useRef<number | undefined>(undefined);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioState(prev => ({ ...prev, trackName: file.name, isLoaded: false }));
    setIsAnalyzing(true);

    try {
      await audioEngine.loadTrack(file);
      audioEngine.setupGraph(audioState.volume, (t) => setCurrentTime(t));

      setBands([...audioEngine.getBands()]);
      setAudioState(prev => ({
        ...prev,
        isLoaded: true,
        duration: audioEngine.getDuration(),
        currentTime: 0
      }));
      setCurrentTime(0);

      // Trigger AI Analysis
      const sonicInsight = await analyzeSpectralProfile(file.name);
      setInsight(sonicInsight);
    } catch (err) {
      console.error("Load failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const togglePlay = () => {
    if (!audioState.isLoaded) return;
    if (audioState.isPlaying) {
      const p = audioEngine.pause();
      setCurrentTime(p);
      setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: p }));
    } else {
      audioEngine.play(currentTime);
      setAudioState(prev => ({ ...prev, isPlaying: true }));
    }
  };

  useEffect(() => {
    let animationFrameId: number;

    const updateProgress = () => {
      if (audioState.isPlaying) {
        setCurrentTime(audioEngine.getCurrentTime());
        animationFrameId = requestAnimationFrame(updateProgress);
      }
    };

    if (audioState.isPlaying) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [audioState.isPlaying]);

  const handleToggleBand = (id: string, active: boolean) => {
    audioEngine.toggleBand(id, active);
    setBands(prev => prev.map(b => b.id === id ? { ...b, active } : b));
  };

  const fmtTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#050505] overflow-hidden text-gray-200">
      {/* Header - Now Global and Full-Width */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <i className="fa-solid fa-wave-square text-blue-500 text-xl"></i>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">Spectral<span className="text-blue-500">Deconstructor</span></h1>
            <p className="text-[10px] tracking-[0.3em] text-gray-500 uppercase font-medium">Pro-Grade Signal Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsStacked(!isStacked)}
            className={`flex items-center gap-3 px-6 py-2.5 border rounded-full transition-all ${isStacked
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'
              }`}
          >
            <i className={`fa-solid ${isStacked ? 'fa-layer-group' : 'fa-list-ul'} text-sm`}></i>
            <span className="text-xs font-bold tracking-widest uppercase">{isStacked ? 'Overlay View' : 'Split View'}</span>
          </button>

          <label className="cursor-pointer group flex items-center gap-3 px-6 py-2.5 bg-white/5 border border-white/10 hover:border-blue-500/50 rounded-full transition-all hover:bg-white/10">
            <i className="fa-solid fa-cloud-arrow-up text-gray-400 group-hover:text-blue-400 text-sm"></i>
            <span className="text-xs font-bold tracking-widest text-gray-300 group-hover:text-white uppercase">Import Track</span>
            <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden px-6 pb-6 gap-6">
        {/* Sidebar Controls - Now a Card */}
        <Sidebar bands={bands} onToggleBand={handleToggleBand} />

        {/* Main Content Area */}
        <div className="flex-grow flex flex-col relative overflow-hidden">
          {/* Visualizer and Insights Panel */}
          <main className="flex-grow relative flex gap-6 overflow-hidden py-6">
            <div className="flex-grow relative glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
              {!audioState.isLoaded ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-black/40 backdrop-blur-sm z-20">
                  <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center bg-white/5 audio-pulse">
                    <i className="fa-solid fa-compact-disc text-3xl text-gray-600 animate-spin-slow"></i>
                  </div>
                  <h2 className="text-gray-400 text-sm font-medium tracking-widest uppercase">Awaiting Source Data</h2>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest">Select an audio file to begin spectral analysis</p>
                </div>
              ) : null}
              <Visualizer
                bands={bands}
                isPlaying={audioState.isPlaying}
                currentTime={currentTime}
                isStacked={isStacked}
              />
            </div>

            <div className="w-80 flex flex-col gap-6">
              <SpectralAnalysis insight={insight} loading={isAnalyzing} />

              <DSPMathInsight bands={bands} isPlaying={audioState.isPlaying} />
            </div>
          </main>

          {/* Player Controls Bar */}
          <footer className={`h-24 border-t border-white/5 bg-[#0a0a0a] px-8 flex items-center justify-between transition-transform duration-500 shrink-0 ${audioState.isLoaded ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="flex items-center gap-5 w-1/3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <i className={`fa-solid fa-music text-blue-500 ${audioState.isPlaying ? 'animate-bounce' : ''}`}></i>
              </div>
              <div className="overflow-hidden">
                <h3 className="text-[11px] font-bold text-white truncate uppercase tracking-tight">{audioState.trackName}</h3>
                <p className="text-[9px] text-gray-500 mt-0.5 mono tracking-widest uppercase">
                  Ready for Analysis
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 w-1/3">
              <div className="flex items-center gap-10">
                <button className="text-gray-500 hover:text-white transition-colors">
                  <i className="fa-solid fa-backward-step"></i>
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-xl shadow-blue-500/20 scale-100 active:scale-90"
                >
                  <i className={`fa-solid ${audioState.isPlaying ? 'fa-pause' : 'fa-play ml-0.5'} text-lg`}></i>
                </button>
                <button className="text-gray-500 hover:text-white transition-colors">
                  <i className="fa-solid fa-forward-step"></i>
                </button>
              </div>

              <div className="w-full flex items-center gap-3">
                <span className="text-[9px] text-gray-500 mono w-8 text-right">{fmtTime(currentTime)}</span>
                <div className="flex-grow h-1 bg-white/5 rounded-full relative group cursor-pointer overflow-hidden">
                  <input
                    type="range"
                    min="0"
                    max={audioState.duration || 100}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTime(val);
                      if (audioState.isPlaying) {
                        audioEngine.play(val);
                      } else {
                        audioEngine.pauseTime = val;
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-500 group-hover:bg-blue-400 transition-colors"
                    style={{ width: `${(currentTime / (audioState.duration || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-[9px] text-gray-500 mono w-8">{fmtTime(audioState.duration)}</span>
              </div>
            </div>

            <div className="w-1/3 flex items-center justify-end gap-4">
              <i className="fa-solid fa-volume-low text-gray-600 text-[10px]"></i>
              <div className="w-32 h-1.5 bg-white/10 rounded-full relative overflow-hidden group">
                <input
                  type="range"
                  min="0" max="1" step="0.01"
                  value={audioState.volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setAudioState(p => ({ ...p, volume: v }));
                    audioEngine.setVolume(v);
                  }}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="h-full bg-blue-500 group-hover:bg-blue-400 transition-colors"
                  style={{ width: `${audioState.volume * 100}%` }}
                />
              </div>
              <i className="fa-solid fa-volume-high text-gray-600 text-[10px]"></i>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default App;
