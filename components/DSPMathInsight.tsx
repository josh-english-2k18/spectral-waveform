import React, { useState, useEffect } from 'react';
import { SpectralBand } from '../types';
import { audioEngine } from '../services/audioEngine';

interface DSPMathInsightProps {
    bands: SpectralBand[];
    isPlaying: boolean;
}

const DSPMathInsight: React.FC<DSPMathInsightProps> = ({ bands, isPlaying }) => {
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
        const update = () => {
            const newData = bands.map(band => {
                const coeffs = audioEngine.getBiquadCoefficients(band.id);
                const x_n = audioEngine.getLatestSample(band.id);

                // Calculate a rough "y[n]" based on standard Direct Form I biquad logic
                // For visual purposes, we'll just show the instantaneous calculation result
                let result = 0;
                if (coeffs) {
                    result = (parseFloat(coeffs.b0) * x_n);
                }

                return {
                    id: band.id,
                    name: band.name,
                    color: band.color,
                    freq: band.freq,
                    coeffs,
                    x_n: x_n.toFixed(4),
                    y_n: result.toFixed(4)
                };
            });
            setData(newData);
        };

        update();
        const interval = setInterval(update, 100);
        return () => clearInterval(interval);
    }, [bands]);

    return (
        <div className="flex-grow glass rounded-xl border border-white/5 flex flex-col font-mono overflow-hidden relative">
            <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-calculator text-blue-500 text-[10px]"></i>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Parallel Biquad Array</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[7px] text-gray-600 uppercase mono">Fs: {audioEngine.context?.sampleRate || 44100}Hz</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-700'}`} />
                </div>
            </div>

            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2">
                {data.map((item, idx) => (
                    <div key={item.id} className="bg-black/40 rounded-lg border border-white/5 p-2 transition-all hover:border-white/10 group">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[9px] font-bold text-white uppercase">{item.name}</span>
                            </div>
                            <span className="text-[8px] text-gray-600 mono">{item.freq}Hz</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <div className="flex justify-between text-[7px] text-blue-500/70 mono">
                                    <span>b0</span>
                                    <span className="text-gray-400">{item.coeffs?.b0}</span>
                                </div>
                                <div className="flex justify-between text-[7px] text-blue-500/70 mono">
                                    <span>x[n]</span>
                                    <span className={`transition-colors duration-75 ${isPlaying ? 'text-white' : 'text-gray-600'}`}>{item.x_n}</span>
                                </div>
                                <div className="flex justify-between text-[7px] text-gray-500 mono border-t border-white/5 pt-1">
                                    <span>y[n]</span>
                                    <span className="text-blue-400 font-bold">{item.y_n}</span>
                                </div>
                            </div>
                            <div className="border-l border-white/5 pl-2 space-y-1">
                                <div className="flex justify-between text-[7px] text-red-500/50 mono">
                                    <span>a1</span>
                                    <span className="text-gray-400">{item.coeffs?.a1}</span>
                                </div>
                                <div className="flex justify-between text-[7px] text-red-500/50 mono">
                                    <span>a2</span>
                                    <span className="text-gray-400">{item.coeffs?.a2}</span>
                                </div>
                                <div className="flex justify-between text-[7px] text-gray-800 mono">
                                    <span>z⁻²</span>
                                    <span className="text-blue-500/20">SYNC</span>
                                </div>
                            </div>
                        </div>

                        {/* Live Formula Detail */}
                        <div className="mt-2 pt-1 border-t border-white/5 opacity-50 group-hover:opacity-100 transition-opacity">
                            <p className="text-[6px] text-gray-500 truncate leading-tight">
                                COMPUTE: {item.coeffs?.b0}({item.x_n}) + Σ(HIST)
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-2 bg-black/40 border-t border-white/5 text-[7px] text-gray-600 flex justify-between uppercase tracking-widest">
                <span>Cycle: 100ms</span>
                <span className="text-blue-500/40">Direct Form II</span>
            </div>
        </div>
    );
};

export default DSPMathInsight;
