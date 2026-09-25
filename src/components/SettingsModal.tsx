import React from 'react';
import { EnvironmentTheme } from '../types/game';
import { X, Volume2, VolumeX, Sun, Moon, Sunset, Sliders, Activity, ArrowLeftRight, Palmtree, Compass } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface SettingsModalProps {
  currentTheme: EnvironmentTheme;
  onSelectTheme: (theme: EnvironmentTheme) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  showPerfOverlay: boolean;
  onTogglePerfOverlay: (enabled: boolean) => void;
  swapLeftRightControls: boolean;
  onToggleSwapControls: (swapped: boolean) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  currentTheme,
  onSelectTheme,
  isMuted,
  onToggleMute,
  volume,
  onChangeVolume,
  showPerfOverlay,
  onTogglePerfOverlay,
  swapLeftRightControls,
  onToggleSwapControls,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Sliders className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
                Settings
              </h2>
              <div className="text-xs text-slate-400">Audio, graphics and environment</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="py-4 space-y-5">
          {/* Environment Theme */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Subway Atmosphere & World Tour City
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => onSelectTheme('tokyo_day')}
                className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === 'tokyo_day'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-md ring-1 ring-sky-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Daylight</span>
              </button>

              <button
                onClick={() => onSelectTheme('neon_night')}
                className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === 'neon_night'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-cyan-400" />
                <span>Neon Cyber</span>
              </button>

              <button
                onClick={() => onSelectTheme('sunset_rails')}
                className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === 'sunset_rails'
                    ? 'bg-orange-500/20 border-orange-400 text-orange-300 shadow-md ring-1 ring-orange-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Sunset className="w-4 h-4 text-orange-400" />
                <span>Sunset Express</span>
              </button>

              <button
                onClick={() => onSelectTheme('rio_beach')}
                className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === 'rio_beach'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md ring-1 ring-emerald-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Palmtree className="w-4 h-4 text-emerald-400" />
                <span>Rio Carnival</span>
              </button>

              <button
                onClick={() => onSelectTheme('cairo_dunes')}
                className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  currentTheme === 'cairo_dunes'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/40'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Compass className="w-4 h-4 text-amber-400" />
                <span>Cairo Dunes</span>
              </button>
            </div>
          </div>

          {/* Sound Controls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Sound Effects & BGM
              </label>
              <button
                onClick={onToggleMute}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" /> Muted
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Active
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <Volume2 className="w-4 h-4 text-slate-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                disabled={isMuted}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onChangeVolume(val);
                }}
                className="w-full accent-amber-400 cursor-pointer disabled:opacity-40"
              />
              <span className="font-mono text-xs text-slate-400 w-8 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>

          {/* Developer Performance Overlay Toggle */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Performance Overlay
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Real-time FPS, latency & memory profiler
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={showPerfOverlay}
                id="toggle-perf-overlay-btn"
                onClick={() => onTogglePerfOverlay(!showPerfOverlay)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  showPerfOverlay ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showPerfOverlay ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-800/80">
              <span>Tracks JS heap memory, draw calls & triangles</span>
              <span className="font-mono text-cyan-300 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                Hotkey: F3
              </span>
            </div>
          </div>

          {/* Interchange Left & Right Command Toggle */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Interchange Left & Right Controls
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Swaps steering commands (&lt; moves Right, &gt; moves Left)
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={swapLeftRightControls}
                id="toggle-swap-controls-btn"
                onClick={() => onToggleSwapControls(!swapLeftRightControls)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  swapLeftRightControls ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    swapLeftRightControls ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-800/80">
              <span>
                {swapLeftRightControls
                  ? 'Active: Left (<) moves Left, Right (>) moves Right'
                  : 'Normal: Left (<) moves Left, Right (>) moves Right'}
              </span>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded border ${
                swapLeftRightControls
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}>
                {swapLeftRightControls ? 'SWAPPED' : 'STANDARD'}
              </span>
            </div>
          </div>

          {/* Controls instructions */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-1.5">
            <div className="font-bold text-slate-200 mb-1">How to Play:</div>
            <div>• <strong className="text-amber-400">Swipe Left / Right</strong> or <strong className="text-amber-400">A / D</strong> to dodge oncoming trains and barriers.</div>
            <div>• <strong className="text-emerald-400">Swipe Up</strong> or <strong className="text-emerald-400">W / Space</strong> to jump over low hurdles and onto train ramps.</div>
            <div>• <strong className="text-amber-400">Swipe Down</strong> or <strong className="text-amber-400">S</strong> to slide under high clearance bars.</div>
            <div>• <strong className="text-cyan-400">Double-tap or Space</strong> to deploy your hoverboard shield!</div>
          </div>
        </div>
      </div>
    </div>
  );
};

