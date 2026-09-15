import React from 'react';
import { PlayerStats, ActivePowerUp, PowerUpType, LevelCelebration } from '../types/game';
import {
  Pause,
  Zap,
  Magnet,
  Flame,
  ArrowUp,
  ArrowDown,
  Shield,
  Sparkles,
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  powerUps: ActivePowerUp[];
  swapLeftRightControls: boolean;
  levelCelebration?: LevelCelebration | null;
  onPause: () => void;
  onActivateHoverboard: () => void;
  onLeft: () => void;
  onRight: () => void;
  onJump: () => void;
  onSlide: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  powerUps,
  swapLeftRightControls,
  levelCelebration,
  onPause,
  onActivateHoverboard,
  onLeft,
  onRight,
  onJump,
  onSlide,
}) => {
  const [leftPressed, setLeftPressed] = React.useState(false);
  const [rightPressed, setRightPressed] = React.useState(false);

  // Synchronize visual feedback with laptop keyboard presses
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isLeft =
        e.key === '<' ||
        e.key === ',' ||
        e.code === 'Comma' ||
        e.code === 'IntlBackslash' ||
        e.key === 'ArrowLeft' ||
        e.code === 'ArrowLeft' ||
        e.code === 'KeyA' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.code === 'KeyQ' ||
        e.key === 'q';

      const isRight =
        e.key === '>' ||
        e.key === '.' ||
        e.code === 'Period' ||
        e.key === 'ArrowRight' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyD' ||
        e.key === 'd' ||
        e.key === 'D' ||
        e.code === 'KeyE' ||
        e.key === 'e';

      if (isLeft) setLeftPressed(true);
      if (isRight) setRightPressed(true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const isLeft =
        e.key === '<' ||
        e.key === ',' ||
        e.code === 'Comma' ||
        e.code === 'IntlBackslash' ||
        e.key === 'ArrowLeft' ||
        e.code === 'ArrowLeft' ||
        e.code === 'KeyA' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.code === 'KeyQ' ||
        e.key === 'q';

      const isRight =
        e.key === '>' ||
        e.key === '.' ||
        e.code === 'Period' ||
        e.key === 'ArrowRight' ||
        e.code === 'ArrowRight' ||
        e.code === 'KeyD' ||
        e.key === 'd' ||
        e.key === 'D' ||
        e.code === 'KeyE' ||
        e.key === 'e';

      if (isLeft) setLeftPressed(false);
      if (isRight) setRightPressed(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const getPowerUpIcon = (type: PowerUpType) => {
    switch (type) {
      case 'magnet':
        return <Magnet className="w-5 h-5 text-rose-400" />;
      case 'jetpack':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'sneakers':
        return <Zap className="w-5 h-5 text-emerald-400" />;
      case 'multiplier':
        return <span className="font-black text-purple-400 text-sm">2X</span>;
      case 'shield':
        return <Shield className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-300" />;
    }
  };

  const getPowerUpName = (type: PowerUpType) => {
    switch (type) {
      case 'magnet':
        return 'MAGNET';
      case 'jetpack':
        return 'JETPACK';
      case 'sneakers':
        return 'SNEAKERS';
      case 'multiplier':
        return '2X SCORE';
      case 'shield':
        return 'SHIELD';
      default:
        return 'POWER-UP';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none z-10">
      {/* Top Bar: Score, Multiplier, Coins & Pause */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Current Run Score & High Score */}
        <div className="flex flex-col gap-1 pointer-events-auto">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl md:text-5xl font-black text-white font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tabular-nums">
              {stats.score.toLocaleString()}
            </span>
            {stats.multiplier > 1 && (
              <span className="bg-amber-500 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full animate-pulse">
                {stats.multiplier}X
              </span>
            )}
          </div>

          <div className="text-xs font-medium text-slate-300/80 bg-slate-900/60 backdrop-blur-sm rounded-lg px-3 py-1 border border-slate-800 w-fit">
            Best: <span className="font-mono text-amber-400 font-bold">{stats.highScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Center: Dynamic Level, Word Hunt & Distance Progression Bar */}
        <div className="flex flex-col items-center pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-2xl px-3.5 py-1.5 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono shadow-sm">
              LVL {stats.level}
            </span>
            <span className="text-xs sm:text-sm font-black text-white tracking-wide font-mono">
              {stats.levelTitle}
            </span>
            {stats.speedTier && (
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                stats.speedTier === 'EXTREME'
                  ? 'bg-rose-950 text-rose-300 border border-rose-600 animate-pulse'
                  : stats.speedTier === 'VERY FAST'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600'
                  : 'bg-slate-900 text-slate-300 border border-slate-700'
              }`}>
                {stats.currentSpeed || 20} m/s
              </span>
            )}
          </div>

          <div className="w-28 sm:w-44 h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1 border border-slate-700/80">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 transition-all duration-200"
              style={{ width: `${Math.min(100, Math.max(4, stats.levelProgress * 100))}%` }}
            />
          </div>

          <div className="flex justify-between w-full text-[9px] sm:text-[10px] font-mono text-slate-400 mt-0.5 gap-2">
            <span>{stats.distance}m</span>
            <span>Next: {stats.levelTargetDistance}m</span>
          </div>

          {/* Subway Surfers Word Hunt (SURF) */}
          {stats.wordHuntLetters && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[8px] font-mono text-amber-400/80 font-bold uppercase tracking-wider mr-0.5">HUNT:</span>
              {stats.wordHuntLetters.map((l, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center font-mono font-black text-[10px] sm:text-xs transition-all ${
                    l.collected
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-105'
                      : 'bg-slate-900/80 text-slate-600 border border-slate-800'
                  }`}
                >
                  {l.letter}
                </div>
              ))}
            </div>
          )}

          {swapLeftRightControls && (
            <div className="mt-1 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 rounded-full px-2 py-0.2 tracking-tight">
              Swapped: &lt; ➔ Right | &gt; ➔ Left
            </div>
          )}
        </div>

        {/* Right: Coins, Mystery Boxes & Pause button */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Mystery Boxes & Keys */}
          {(stats.mysteryBoxesCollected > 0 || (stats.keys && stats.keys > 0)) && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-purple-500/40 rounded-xl px-2.5 py-2 shadow-lg">
              {stats.mysteryBoxesCollected > 0 && (
                <div className="flex items-center gap-1 font-mono text-purple-300 font-black text-xs">
                  <span>🎁</span>
                  <span>{stats.mysteryBoxesCollected}</span>
                </div>
              )}
              {stats.keys && stats.keys > 0 && (
                <div className="flex items-center gap-1 font-mono text-cyan-300 font-black text-xs">
                  <span>🔑</span>
                  <span>{stats.keys}</span>
                </div>
              )}
            </div>
          )}

          {/* Coins */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-500/40 rounded-xl px-3.5 py-2 shadow-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-md shadow-amber-500/30 border border-yellow-200">
              <span className="text-xs font-black text-amber-950">★</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-yellow-300 font-mono tabular-nums">
              {stats.coins}
            </span>
          </div>

          {/* Pause button */}
          <button
            id="pause-btn"
            onClick={onPause}
            className="w-11 h-11 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center border border-slate-700/70 shadow-lg active:scale-95 transition-all cursor-pointer"
            aria-label="Pause Game"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Grumpy Inspector & Dog Pursuit Warning Banner */}
      {stats.isInspectorAlerted && (
        <div className="self-center pointer-events-none animate-pulse bg-rose-950/90 border-2 border-rose-500 text-rose-200 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.8)] z-30 mt-1">
          <span className="text-base">👮‍♂️🐕</span>
          <span className="text-xs sm:text-sm font-black tracking-wider uppercase font-mono text-white">
            INSPECTOR IN PURSUIT! DOG ON YOUR HEELS!
          </span>
        </div>
      )}

      {/* Middle: Active Power-Ups Stack */}
      <div className="flex flex-col gap-2 max-w-xs self-start pointer-events-auto my-auto">
        {/* Hoverboard Active Shield Bar */}
        {stats.isHoverboardActive && (
          <div className="bg-cyan-950/85 backdrop-blur-md border border-cyan-500/50 rounded-lg p-2 shadow-lg flex items-center gap-2.5 min-w-[170px] animate-fade-in">
            <Shield className="w-5 h-5 text-cyan-400 animate-pulse" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-bold text-cyan-300">
                <span>HOVER SHIELD</span>
                <span className="font-mono">{Math.ceil(stats.hoverboardTimeLeft)}s</span>
              </div>
              <div className="w-full h-1.5 bg-cyan-950 rounded-full overflow-hidden mt-1 border border-cyan-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
                  style={{ width: `${(stats.hoverboardTimeLeft / 25) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Other active powerups */}
        {powerUps.map((pw) => (
          <div
            key={pw.type}
            className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2 shadow-lg flex items-center gap-2.5 min-w-[170px]"
          >
            {getPowerUpIcon(pw.type)}
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-200">
                <span>{getPowerUpName(pw.type)}</span>
                <span className="font-mono text-amber-400">{Math.ceil(pw.timeLeft)}s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-1 border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-100"
                  style={{ width: `${(pw.timeLeft / pw.duration) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Direct Screen Side Steer Buttons (Prominent < and > Icons on Laptop & Touch) */}
      <div className="absolute inset-y-0 left-2 sm:left-4 flex items-center pointer-events-auto">
        <button
          id="steer-left-zone-btn"
          onClick={onLeft}
          className={`w-16 h-28 sm:w-22 sm:h-32 rounded-2xl flex flex-col items-center justify-center gap-1 border backdrop-blur-md shadow-2xl transition-all cursor-pointer group ${
            leftPressed
              ? 'bg-cyan-500/40 border-cyan-300 ring-4 ring-cyan-400/50 scale-95 shadow-[0_0_30px_rgba(6,182,212,0.8)]'
              : 'bg-slate-950/70 hover:bg-slate-900/90 active:bg-cyan-500/30 text-white border-slate-700/80 hover:border-cyan-400/80'
          }`}
          aria-label={swapLeftRightControls ? "Steer (<) Moves Right" : "Steer Left (<)"}
        >
          <div className="flex items-center justify-center relative">
            <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tighter transition-all select-none ${
              leftPressed ? 'text-white scale-110' : 'text-cyan-400 group-hover:scale-110'
            }`}>
              &lt;
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono font-black text-cyan-300 tracking-wider">
              {swapLeftRightControls ? '➔ RIGHT' : 'LEFT'}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-slate-900/90 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/70">
              [ &lt; ] / [ A ]
            </span>
          </div>
        </button>
      </div>

      <div className="absolute inset-y-0 right-2 sm:right-4 flex items-center pointer-events-auto">
        <button
          id="steer-right-zone-btn"
          onClick={onRight}
          className={`w-16 h-28 sm:w-22 sm:h-32 rounded-2xl flex flex-col items-center justify-center gap-1 border backdrop-blur-md shadow-2xl transition-all cursor-pointer group ${
            rightPressed
              ? 'bg-cyan-500/40 border-cyan-300 ring-4 ring-cyan-400/50 scale-95 shadow-[0_0_30px_rgba(6,182,212,0.8)]'
              : 'bg-slate-950/70 hover:bg-slate-900/90 active:bg-cyan-500/30 text-white border-slate-700/80 hover:border-cyan-400/80'
          }`}
          aria-label={swapLeftRightControls ? "Steer (>) Moves Left" : "Steer Right (>)"}
        >
          <div className="flex items-center justify-center relative">
            <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tighter transition-all select-none ${
              rightPressed ? 'text-white scale-110' : 'text-cyan-400 group-hover:scale-110'
            }`}>
              &gt;
            </span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-mono font-black text-cyan-300 tracking-wider">
              {swapLeftRightControls ? 'LEFT ➔' : 'RIGHT'}
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono font-bold bg-slate-900/90 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700/70">
              [ &gt; ] / [ D ]
            </span>
          </div>
        </button>
      </div>

      {/* Bottom Controls: Hoverboard & Jump/Slide Buttons */}
      <div className="flex items-end justify-between w-full pointer-events-auto z-20">
        {/* Hoverboard Summon Action Button */}
        <button
          id="hoverboard-btn"
          onClick={onActivateHoverboard}
          disabled={stats.hoverboardsRemaining <= 0 || stats.isHoverboardActive}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold text-sm shadow-xl transition-all active:scale-95 cursor-pointer ${
            stats.isHoverboardActive
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/40'
              : stats.hoverboardsRemaining > 0
              ? 'bg-slate-900/90 hover:bg-slate-800 border-cyan-500/60 text-cyan-400 hover:border-cyan-400'
              : 'bg-slate-900/40 border-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <div className="relative">
            <span className="text-xl">🛹</span>
            {stats.hoverboardsRemaining > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {stats.hoverboardsRemaining}
              </span>
            )}
          </div>
          <span className="hidden sm:inline">
            {stats.isHoverboardActive ? 'ACTIVE' : 'HOVERBOARD (SPACE)'}
          </span>
        </button>

        {/* Laptop Controls Navigation Ribbon with prominent < and > click controls */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-2xl px-3.5 py-1.5 shadow-xl">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Steer:
          </span>
          <button
            id="bottom-dock-steer-left"
            onClick={onLeft}
            className={`px-3 py-1 rounded-lg border font-mono font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
              leftPressed
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.9)]'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-cyan-500/50 hover:border-cyan-400'
            }`}
          >
            <span className="text-sm font-black">&lt;</span>
            <span className="text-[10px] font-mono">
              {swapLeftRightControls ? '➔ RIGHT' : 'LEFT'}
            </span>
          </button>
          <button
            id="bottom-dock-steer-right"
            onClick={onRight}
            className={`px-3 py-1 rounded-lg border font-mono font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
              rightPressed
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.9)]'
                : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 border-cyan-500/50 hover:border-cyan-400'
            }`}
          >
            <span className="text-[10px] font-mono">
              {swapLeftRightControls ? 'LEFT ➔' : 'RIGHT'}
            </span>
            <span className="text-sm font-black">&gt;</span>
          </button>
          <span className="text-slate-600 mx-1">•</span>
          <span className="text-[11px] text-slate-300">
            Jump: <strong className="text-emerald-400 font-mono">W / ▲</strong>
          </span>
          <span className="text-slate-600 mx-0.5">•</span>
          <span className="text-[11px] text-slate-300">
            Slide: <strong className="text-amber-400 font-mono">S / ▼</strong>
          </span>
        </div>

        {/* Jump & Slide Touch Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="control-jump-btn"
            onClick={onJump}
            className="w-13 h-13 sm:w-14 sm:h-14 bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-400 text-white rounded-2xl flex flex-col items-center justify-center border border-emerald-400/50 shadow-xl active:scale-90 transition-transform cursor-pointer"
            aria-label="Jump"
          >
            <ArrowUp className="w-6 h-6" />
            <span className="text-[9px] font-bold font-mono">JUMP</span>
          </button>

          <button
            id="control-slide-btn"
            onClick={onSlide}
            className="w-13 h-13 sm:w-14 sm:h-14 bg-amber-600/90 hover:bg-amber-500 active:bg-amber-400 text-white rounded-2xl flex flex-col items-center justify-center border border-amber-400/50 shadow-xl active:scale-90 transition-transform cursor-pointer"
            aria-label="Slide"
          >
            <ArrowDown className="w-6 h-6" />
            <span className="text-[9px] font-bold font-mono">SLIDE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
