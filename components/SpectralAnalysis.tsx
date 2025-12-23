
import React from 'react';
import { SonicInsight } from '../types';

interface SpectralAnalysisProps {
  insight: SonicInsight | null;
  loading: boolean;
}

const SpectralAnalysis: React.FC<SpectralAnalysisProps> = ({ insight, loading }) => {
  if (loading) {
    return (
      <div className="p-6 glass rounded-xl border border-blue-500/20 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5 rounded"></div>
          <div className="h-3 w-5/6 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="p-6 glass rounded-xl border border-white/10 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-[0.2em] text-blue-400 uppercase">Sonic Intelligence</h3>
        {/* Fix: Updated model badge to match gemini-3-flash-preview used in services/geminiService.ts */}
        <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-tighter">Gemini 3 Flash</span>
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">Estimated Mood</label>
        <p className="text-sm text-gray-200 font-medium">{insight.mood}</p>
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">Spectral Signature</label>
        <p className="text-[12px] leading-relaxed text-gray-400">{insight.spectralProfile}</p>
      </div>

      <div>
        <label className="text-[9px] uppercase tracking-widest text-gray-500 block mb-1">Engineering Guidance</label>
        <p className="text-[12px] leading-relaxed text-gray-400 italic">"{insight.engineeringAdvice}"</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {insight.tags.map(tag => (
          <span key={tag} className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-500 uppercase">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default SpectralAnalysis;
