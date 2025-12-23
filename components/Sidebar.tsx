
import React from 'react';
import { SpectralBand } from '../types';

interface SidebarProps {
  bands: SpectralBand[];
  onToggleBand: (id: string, active: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ bands, onToggleBand }) => {
  return (
    <div className="w-72 flex flex-col h-full overflow-hidden glass rounded-2xl border border-white/10 shadow-2xl">
      <div className="p-6 border-b border-white/5 bg-white/5">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase">Signal Deconstructor</h2>
        <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-wider">Frequency Isolation</p>
      </div>

      <div className="flex-grow p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {bands.map((band) => (
          <div
            key={band.id}
            className={`group p-3 rounded-xl border transition-all cursor-pointer ${band.active
                ? 'bg-white/5 border-white/10 hover:border-white/20 shadow-lg'
                : 'opacity-30 border-transparent bg-transparent grayscale scale-95'
              }`}
            onClick={() => onToggleBand(band.id, !band.active)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-1 h-8 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: band.color,
                    boxShadow: band.active ? `0 0 15px ${band.color}` : 'none',
                    height: band.active ? '32px' : '16px'
                  }}
                />
                <div>
                  <h3 className="text-[10px] font-bold tracking-widest text-white uppercase">{band.name}</h3>
                  <p className="text-[8px] text-gray-500 mono uppercase">{band.freq}Hz | {band.type}</p>
                </div>
              </div>
              <button
                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${band.active ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-white/5 text-gray-600'
                  }`}
              >
                <i className={`fa-solid ${band.active ? 'fa-check' : 'fa-plus'} text-[8px]`}></i>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-black/40 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-2 text-blue-500/50">
          <i className="fa-solid fa-microchip text-[8px]"></i>
          <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Neural DSP Engine</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
