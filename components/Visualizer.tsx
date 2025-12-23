
import React, { useRef, useEffect } from 'react';
import { SpectralBand } from '../types';
import { audioEngine } from '../services/audioEngine';

interface VisualizerProps {
  bands: SpectralBand[];
  isPlaying: boolean;
  currentTime: number;
  isStacked: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ bands, isPlaying, currentTime, isStacked }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Added undefined as initial value to satisfy TypeScript requirement for useRef
  const requestRef = useRef<number | undefined>(undefined);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const draw = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    const step = 60;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }

    if (!isStacked) {
      for (let y = 0; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }
      // Baseline
      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // We draw even if not playing; the analyser will return 128 (center/silence)
    // resulting in professional-looking flat baselines.
    if (bands.length > 0) {
      ctx.globalCompositeOperation = 'screen';
      const aperture = Math.floor(1024 * 0.35); // View focus

      // Re-allocate buffer only if needed
      if (!dataArrayRef.current || dataArrayRef.current.length !== bands[0].analyser?.frequencyBinCount) {
        if (bands[0].analyser) {
          dataArrayRef.current = new Uint8Array(bands[0].analyser.frequencyBinCount);
        }
      }

      const dataArray = dataArrayRef.current;
      if (!dataArray) return;

      const bandHeight = isStacked ? height / bands.length : height;

      bands.forEach((band, idx) => {
        if (!band.analyser || !band.active) return;

        if (isPlaying) {
          band.analyser.getByteTimeDomainData(dataArray);
        } else {
          audioEngine.getWaveformData(currentTime, dataArray.length, dataArray);
        }

        const verticalCenter = isStacked ? (idx * bandHeight) + (bandHeight / 2) : height / 2;

        if (isStacked) {
          // Horizontal band grid
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.setLineDash([2, 5]);
          ctx.beginPath(); ctx.moveTo(0, idx * bandHeight); ctx.lineTo(width, idx * bandHeight); ctx.stroke();
          ctx.setLineDash([]);

          // Band Label
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.font = "bold 9px 'JetBrains Mono'";
          ctx.fillText(band.name, 10, idx * bandHeight + 15);
        }

        ctx.lineWidth = isStacked ? 1.5 : 2.5;
        ctx.strokeStyle = band.color;
        ctx.shadowBlur = isStacked ? 5 : 10;
        ctx.shadowColor = band.color;

        // Sync trigger for stable waveform (effective for both live and static)
        let trigger = 0;
        const searchRange = Math.floor(dataArray.length / 2);
        for (let i = 0; i < searchRange; i++) {
          if (dataArray[i] < 128 && dataArray[i + 1] >= 128) {
            trigger = i;
            break;
          }
        }

        ctx.beginPath();
        const sliceWidth = width / aperture;

        for (let i = 0; i < aperture; i++) {
          const sampleIdx = (trigger + i) % dataArray.length;
          const v = (dataArray[sampleIdx] - 128) / 128.0;
          const x = i * sliceWidth;
          const scale = isStacked ? bandHeight / 3 : height / 2.5;
          const y = verticalCenter + (v * band.visualGain * scale);

          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevIdx = (trigger + i - 1) % dataArray.length;
            const pv = ((dataArray[prevIdx] - 128) / 128.0) * band.visualGain;
            const px = (i - 1) * sliceWidth;
            const py = verticalCenter + (pv * scale);
            const cx = (px + x) / 2;
            ctx.quadraticCurveTo(px, py, cx, (py + y) / 2);
          }
        }
        ctx.stroke();

        // Faint bloom
        ctx.globalAlpha = 0.02;
        ctx.lineTo(width, verticalCenter);
        ctx.lineTo(0, verticalCenter);
        ctx.fillStyle = band.color;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });
      ctx.globalCompositeOperation = 'source-over';
    }

    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = canvasRef.current.parentElement?.clientWidth || 800;
        canvasRef.current.height = canvasRef.current.parentElement?.clientHeight || 600;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    requestRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, bands, currentTime, isStacked]);

  return <canvas ref={canvasRef} className="w-full h-full block" />;
};

export default Visualizer;
