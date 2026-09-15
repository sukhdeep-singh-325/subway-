import React from 'react';
import { Play, ShoppingBag, Award, Settings, Trophy, Shield } from 'lucide-react';
import { CharacterSkin, HoverboardSkin } from '../types/game';

interface StartScreenProps {
  highScore: number;
  totalCoins: number;
  character: CharacterSkin;
  hoverboard: HoverboardSkin;
  hoverboardsRemaining: number;
  onStart: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
  onOpenSettings: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  totalCoins,
  character,
  hoverboard,
  hoverboardsRemaining,
  onStart,
  onOpenShop,
  onOpenMissions,
  onOpenLeaderboard,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 select-none bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/80">
      {/* Top Bar: Bank & Options */}
      <div className="flex items-center justify-between w-full">
        {/* Total Coins */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/30">
            <span className="text-xs font-black text-amber-950">★</span>
          </div>
          <span className="text-lg sm:text-xl font-black text-yellow-300 font-mono">
            {totalCoins.toLocaleString()}
          </span>
        </div>

        {/* Top Right Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            id="menu-shop-btn"
            onClick={onOpenShop}
            className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Shop</span>
          </button>

          <button
            id="menu-missions-btn"
            onClick={onOpenMissions}
            className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Award className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Missions</span>
          </button>

          <button
            id="menu-leaderboard-btn"
            onClick={onOpenLeaderboard}
            className="h-10 px-3 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white rounded-xl border border-slate-700/80 shadow-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Rankings</span>
          </button>

          <button
            id="menu-settings-btn"
            onClick={onOpenSettings}
            className="w-10 h-10 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md text-white rounded-xl border border-slate-700/80 shadow-lg flex items-center justify-center transition-all cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Middle Center: Logo & Start Prompt */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 text-xs font-bold uppercase tracking-widest mb-3 backdrop-blur-sm shadow-md">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Best: {highScore.toLocaleString()} pts
        </div>

        {/* Dynamic Game Logo */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter uppercase font-mono drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-tight">
          SUBWAY<br />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 bg-clip-text text-transparent">
            SURFERS 3D
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-slate-300/90 font-medium max-w-sm mt-2 drop-shadow-md">
          Dodge trains, leap over hurdles, and surf the rails at supersonic speed!
        </p>

        {/* Big Start Button */}
        <button
          id="start-run-btn"
          onClick={onStart}
          className="mt-6 sm:mt-8 px-8 sm:px-12 py-4 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-lg sm:text-xl rounded-2xl shadow-[0_0_35px_rgba(52,211,153,0.4)] active:scale-95 transition-all flex items-center gap-3 cursor-pointer group animate-pulse"
        >
          <Play className="w-6 h-6 fill-current group-hover:translate-x-0.5 transition-transform" />
          <span>TAP TO RUN</span>
        </button>

        <div className="text-[11px] text-slate-400 font-mono mt-3">
          Press <span className="text-amber-300 font-bold">Space</span> or <span className="text-amber-300 font-bold">W</span> to Start
        </div>
      </div>

      {/* Bottom info: Equipped runner & Hoverboard details */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Runner:</span>
            <span className="font-bold text-white">{character.name}</span>
          </div>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Board:</span>
            <span className="font-bold text-cyan-400">{hoverboard.name}</span>
            <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
              x{hoverboardsRemaining}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 rounded-xl px-3.5 py-2">
          <span>Controls:</span>
          <span className="text-cyan-400 font-mono font-bold">&lt; / &gt;</span> or <span className="text-slate-200 font-mono font-bold">A / D</span> Steer •
          <span className="text-emerald-400 font-mono font-bold">W / ↑</span> Jump •
          <span className="text-amber-400 font-mono font-bold">S / ↓</span> Slide •
          <span className="text-purple-400 font-mono font-bold">Space</span> Hoverboard
        </div>
      </div>
    </div>
  );
};
