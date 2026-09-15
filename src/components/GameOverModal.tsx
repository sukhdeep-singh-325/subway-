import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { PlayerStats } from '../types/game';
import { RotateCcw, ShoppingBag, Award, Trophy, Key, HeartPulse } from 'lucide-react';

interface GameOverModalProps {
  stats: PlayerStats;
  onRetry: () => void;
  onRevive?: () => void;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onOpenLeaderboard: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onRevive,
  onOpenShop,
  onOpenMissions,
  onOpenLeaderboard,
}) => {
  const isNewHighScore = stats.score > 0 && stats.score >= stats.highScore;
  const keys = stats.keys || 0;
  const canReviveWithKey = keys >= 1;
  const canReviveWithCoins = stats.totalCoins >= 250;
  const [reviveTimer, setReviveTimer] = useState(6);

  useEffect(() => {
    if (reviveTimer <= 0) return;
    const interval = setInterval(() => {
      setReviveTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [reviveTimer]);

  useEffect(() => {
    if (isNewHighScore) {
      // Fire celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isNewHighScore]);

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-30 animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Banner */}
        <div className="mb-4">
          {isNewHighScore ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 animate-bounce">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> New Best Score!
            </div>
          ) : (
            <div className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">
              Run Complete
            </div>
          )}
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white uppercase font-mono">
            {isNewHighScore ? 'High Score!' : 'Game Over'}
          </h2>
        </div>

        {/* Big Score Card */}
        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 mb-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Total Score</div>
          <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight my-1">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400/80" /> All-Time Record:{' '}
            <span className="font-mono text-white font-bold">{stats.highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Stats Grid: Coins & Distance */}
        <div className="grid grid-cols-2 gap-3 w-full mb-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center">
            <div className="text-xs text-slate-400 font-medium">Coins Earned</div>
            <div className="text-2xl font-black text-yellow-300 font-mono flex items-center gap-1 mt-0.5">
              <span>★</span> +{stats.coins}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Bank: {stats.totalCoins}</div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex flex-col items-center">
            <div className="text-xs text-slate-400 font-medium">Distance Covered</div>
            <div className="text-2xl font-black text-sky-400 font-mono mt-0.5">
              {stats.distance}m
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Along the rails</div>
          </div>
        </div>

        {/* Save Me / Revive Option */}
        {onRevive && (canReviveWithKey || canReviveWithCoins) && (
          <button
            id="revive-btn"
            onClick={onRevive}
            className="w-full mb-3 py-3 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-sm rounded-xl shadow-lg shadow-pink-500/25 active:scale-98 transition-all flex items-center justify-between cursor-pointer border border-pink-400/40"
          >
            <div className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-pink-300 animate-pulse" />
              <span>SAVE ME! {reviveTimer > 0 ? `(${reviveTimer}s)` : ''}</span>
            </div>
            <div className="flex items-center gap-1 text-xs bg-black/40 px-2.5 py-1 rounded-full font-mono">
              {canReviveWithKey ? (
                <>
                  <Key className="w-3.5 h-3.5 text-cyan-300" /> 1 Key (Have: {keys})
                </>
              ) : (
                <>
                  <span className="text-yellow-400">★</span> 250 Coins
                </>
              )}
            </div>
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="play-again-btn"
            onClick={onRetry}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-base rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" /> PLAY AGAIN
          </button>

          <div className="grid grid-cols-2 gap-2.5 w-full">
            <button
              id="gameover-shop-btn"
              onClick={onOpenShop}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-sm border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" /> Skate Shop
            </button>
            <button
              id="gameover-missions-btn"
              onClick={onOpenMissions}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl font-bold text-sm border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Award className="w-4 h-4 text-sky-400" /> Missions
            </button>
          </div>

          <button
            id="gameover-leaderboard-btn"
            onClick={onOpenLeaderboard}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-xl font-bold text-sm border border-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" /> View Leaderboard & History
          </button>
        </div>
      </div>
    </div>
  );
};
