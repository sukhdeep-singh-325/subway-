import React from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Settings, X } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onOpenSettings,
  isMuted,
  onToggleMute,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative">
        <button
          onClick={onResume}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-white uppercase tracking-wider font-mono mb-6">
          Game Paused
        </h2>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mb-6">
          <button
            id="resume-btn"
            onClick={onResume}
            className="w-full py-3 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" /> RESUME
          </button>

          <button
            id="restart-btn"
            onClick={onRestart}
            className="w-full py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> RESTART RUN
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onToggleMute}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-4 h-4 text-rose-400" /> Unmute
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-400" /> Mute Sound
                </>
              )}
            </button>

            <button
              onClick={onOpenSettings}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Settings className="w-4 h-4 text-sky-400" /> Settings
            </button>
          </div>
        </div>

        {/* Controls cheat sheet */}
        <div className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-left">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Controls Guide
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-300">
            <div><span className="text-cyan-400 font-mono font-bold">&lt; / &gt;</span> or <span className="text-amber-400 font-mono font-bold">A / D</span></div>
            <div className="text-right text-slate-400">Steer Left / Right</div>

            <div><span className="text-emerald-400 font-mono font-bold">↑ / W</span> or <span className="text-emerald-400 font-mono font-bold">Space</span></div>
            <div className="text-right text-slate-400">Jump</div>

            <div><span className="text-amber-400 font-mono font-bold">↓ / S</span></div>
            <div className="text-right text-slate-400">Slide / Fast Fall</div>

            <div><span className="text-cyan-400 font-mono font-bold">Double Tap / Space</span></div>
            <div className="text-right text-slate-400">Hoverboard</div>
          </div>
        </div>
      </div>
    </div>
  );
};
