import { useState, useRef, useEffect, useCallback } from 'react';
import { GameEngine } from './game/engine';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { ShopModal } from './components/ShopModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { PerformanceOverlay } from './components/PerformanceOverlay';
import {
  GameStatus,
  PlayerStats,
  ActivePowerUp,
  EnvironmentTheme,
  Mission,
  LevelCelebration,
  CharacterSkin,
  HoverboardSkin
} from './types/game';
import {
  DEFAULT_CHARACTERS,
  DEFAULT_HOVERBOARDS,
  INITIAL_MISSIONS
} from './game/defaultData';
import { soundManager } from './audio/soundManager';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);

  // Core Game State
  const [status, setStatus] = useState<GameStatus>('idle');
  const [activeModal, setActiveModal] = useState<'shop' | 'missions' | 'settings' | 'leaderboard' | null>(null);

  // Player Stats
  const [stats, setStats] = useState<PlayerStats>({
    score: 0,
    highScore: parseInt(localStorage.getItem('subway_high_score') || '0', 10),
    coins: 0,
    totalCoins: parseInt(localStorage.getItem('subway_total_coins') || '150', 10), // seed with 150 for fun initial skate shopping!
    multiplier: 1,
    distance: 0,
    hoverboardsRemaining: parseInt(localStorage.getItem('subway_hoverboards') || '3', 10),
    isHoverboardActive: false,
    hoverboardTimeLeft: 0,
    level: 1,
    levelTitle: 'Subway Rookie',
    levelProgress: 0,
    levelTargetDistance: 250,
  });

  const [powerUps, setPowerUps] = useState<ActivePowerUp[]>([]);
  const [levelCelebration, setLevelCelebration] = useState<LevelCelebration | null>(null);

  // Control Swap State
  const [swapLeftRightControls, setSwapLeftRightControls] = useState<boolean>(() => {
    return localStorage.getItem('subway_swap_controls') === 'true';
  });

  const handleToggleSwapControls = useCallback((swapped: boolean) => {
    setSwapLeftRightControls(swapped);
    localStorage.setItem('subway_swap_controls', String(swapped));
    if (engineRef.current) {
      engineRef.current.swapLeftRightControls = swapped;
    }
  }, []);

  const handleLevelUp = useCallback((celebration: LevelCelebration) => {
    setLevelCelebration(celebration);
    setTimeout(() => {
      setLevelCelebration(null);
    }, 3500);
  }, []);

  // Themes & Customization
  const [theme, setTheme] = useState<EnvironmentTheme>(
    (localStorage.getItem('subway_theme') as EnvironmentTheme) || 'tokyo_day'
  );

  const [characters, setCharacters] = useState<CharacterSkin[]>(() => {
    try {
      const saved = localStorage.getItem('subway_characters');
      if (saved) {
        const parsed: CharacterSkin[] = JSON.parse(saved);
        const map = new Map<string, CharacterSkin>();
        DEFAULT_CHARACTERS.forEach((c) => map.set(c.id, { ...c }));
        parsed.forEach((c) => {
          const defaultChar = map.get(c.id);
          if (defaultChar) {
            map.set(c.id, { ...defaultChar, unlocked: c.unlocked });
          }
        });
        return Array.from(map.values());
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CHARACTERS;
  });
  const [selectedCharacterId, setSelectedCharacterId] = useState(
    () => localStorage.getItem('subway_selected_char') || 'jake_classic'
  );

  const [hoverboards, setHoverboards] = useState(() => {
    try {
      const saved = localStorage.getItem('subway_hoverboards_list');
      if (saved) {
        const parsed: HoverboardSkin[] = JSON.parse(saved);
        const map = new Map<string, HoverboardSkin>();
        DEFAULT_HOVERBOARDS.forEach((b) => map.set(b.id, { ...b }));
        parsed.forEach((b) => {
          const defaultBoard = map.get(b.id);
          if (defaultBoard) {
            map.set(b.id, { ...defaultBoard, unlocked: b.unlocked });
          }
        });
        return Array.from(map.values());
      }
    } catch {
      // Fallback
    }
    return DEFAULT_HOVERBOARDS;
  });
  const [selectedHoverboardId, setSelectedHoverboardId] = useState(
    () => localStorage.getItem('subway_selected_board') || 'classic_deck'
  );

  // Missions
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('subway_missions');
    return saved ? JSON.parse(saved) : INITIAL_MISSIONS;
  });

  // Sound settings
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [volume, setVolume] = useState<number>(0.5);

  // Developer Performance Overlay
  const [showPerfOverlay, setShowPerfOverlay] = useState<boolean>(() => {
    return localStorage.getItem('subway_perf_overlay') === 'true';
  });

  const handleTogglePerfOverlay = useCallback((enabled: boolean) => {
    setShowPerfOverlay(enabled);
    localStorage.setItem('subway_perf_overlay', String(enabled));
  }, []);

  // Hotkey listener (F3 or Shift+P) for developer quick toggling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3' || (e.shiftKey && (e.key === 'P' || e.key === 'p'))) {
        e.preventDefault();
        setShowPerfOverlay((prev) => {
          const next = !prev;
          localStorage.setItem('subway_perf_overlay', String(next));
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentCharacter = characters.find((c: any) => c.id === selectedCharacterId) || DEFAULT_CHARACTERS[0];
  const currentHoverboard = hoverboards.find((b: any) => b.id === selectedHoverboardId) || DEFAULT_HOVERBOARDS[0];

  // Actions
  const handleStartGame = () => {
    setActiveModal(null);
    setStatus('playing');
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  const handlePauseGame = () => {
    if (engineRef.current && status === 'playing') {
      engineRef.current.pauseGame();
      setStatus('paused');
    }
  };

  const handleResumeGame = () => {
    if (engineRef.current && status === 'paused') {
      engineRef.current.resumeGame();
      setStatus('playing');
    }
  };

  const handleRestartGame = () => {
    setActiveModal(null);
    setStatus('playing');
    if (engineRef.current) {
      engineRef.current.resetGame();
    }
  };

  const handleReviveGame = () => {
    if (engineRef.current && status === 'gameover') {
      const currentKeys = stats.keys || 0;
      if (currentKeys >= 1) {
        const newKeys = currentKeys - 1;
        localStorage.setItem('subway_keys', String(newKeys));
        setStats((prev) => ({ ...prev, keys: newKeys }));
      } else if (stats.totalCoins >= 250) {
        const newCoins = stats.totalCoins - 250;
        localStorage.setItem('subway_total_coins', String(newCoins));
        setStats((prev) => ({ ...prev, totalCoins: newCoins }));
      }
      const revived = engineRef.current.reviveGame();
      if (revived) {
        setStatus('playing');
        setActiveModal(null);
      }
    }
  };

  const handleGameOver = (finalStats: PlayerStats) => {
    setStatus('gameover');
    setStats({ ...finalStats });
  };

  const handleMissionProgress = useCallback((type: Mission['type'], count: number) => {
    setMissions((prevMissions) => {
      let changed = false;
      const updated = prevMissions.map((m) => {
        if (m.type === type && !m.completed) {
          const newCurrent = type === 'score' || type === 'distance' ? Math.max(m.current, count) : m.current + count;
          const completed = newCurrent >= m.target;
          if (newCurrent !== m.current || completed !== m.completed) {
            changed = true;
            return { ...m, current: newCurrent, completed };
          }
        }
        return m;
      });
      if (changed) {
        localStorage.setItem('subway_missions', JSON.stringify(updated));
      }
      return changed ? updated : prevMissions;
    });
  }, []);

  const handleClaimMissionReward = (missionId: string, coins: number) => {
    setMissions((prev) => {
      const updated = prev.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
      localStorage.setItem('subway_missions', JSON.stringify(updated));
      return updated;
    });

    setStats((prev) => {
      const newTotal = prev.totalCoins + coins;
      localStorage.setItem('subway_total_coins', newTotal.toString());
      return { ...prev, totalCoins: newTotal };
    });
  };

  // Shop actions
  const handleUnlockCharacter = (id: string, cost: number) => {
    if (stats.totalCoins < cost) return;

    const newCoins = stats.totalCoins - cost;
    localStorage.setItem('subway_total_coins', newCoins.toString());

    const updated = characters.map((c: any) => (c.id === id ? { ...c, unlocked: true } : c));
    setCharacters(updated);
    setSelectedCharacterId(id);
    localStorage.setItem('subway_characters', JSON.stringify(updated));
    localStorage.setItem('subway_selected_char', id);

    setStats((prev) => ({ ...prev, totalCoins: newCoins }));
  };

  const handleUnlockHoverboard = (id: string, cost: number) => {
    if (stats.totalCoins < cost) return;

    const newCoins = stats.totalCoins - cost;
    localStorage.setItem('subway_total_coins', newCoins.toString());

    const updated = hoverboards.map((b: any) => (b.id === id ? { ...b, unlocked: true } : b));
    setHoverboards(updated);
    setSelectedHoverboardId(id);
    localStorage.setItem('subway_hoverboards_list', JSON.stringify(updated));
    localStorage.setItem('subway_selected_board', id);

    setStats((prev) => ({ ...prev, totalCoins: newCoins }));
  };

  const handleBuyHoverboardItem = (count: number, cost: number) => {
    if (stats.totalCoins < cost) return;

    const newCoins = stats.totalCoins - cost;
    const newCount = stats.hoverboardsRemaining + count;

    localStorage.setItem('subway_total_coins', newCoins.toString());
    localStorage.setItem('subway_hoverboards', newCount.toString());

    setStats((prev) => ({
      ...prev,
      totalCoins: newCoins,
      hoverboardsRemaining: newCount,
    }));
    soundManager.playPowerup();
  };

  const handleSelectCharacter = (id: string) => {
    setSelectedCharacterId(id);
    localStorage.setItem('subway_selected_char', id);
  };

  const handleSelectHoverboard = (id: string) => {
    setSelectedHoverboardId(id);
    localStorage.setItem('subway_selected_board', id);
  };

  const handleSelectTheme = (newTheme: EnvironmentTheme) => {
    setTheme(newTheme);
    localStorage.setItem('subway_theme', newTheme);
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  const handleChangeVolume = (vol: number) => {
    setVolume(vol);
    soundManager.setVolume(vol);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans antialiased">
      {/* 3D WebGL Canvas Layer */}
      <GameCanvas
        engineRef={engineRef}
        characterSkin={currentCharacter}
        hoverboardSkin={currentHoverboard}
        theme={theme}
        swapLeftRightControls={swapLeftRightControls}
        onStatsUpdate={setStats}
        onPowerUpsUpdate={setPowerUps}
        onGameOver={handleGameOver}
        onMissionProgress={handleMissionProgress}
        onLevelUp={handleLevelUp}
        onStartGameDirectly={handleStartGame}
      />

      {/* Active In-Game HUD */}
      {status === 'playing' && (
        <HUD
          stats={stats}
          powerUps={powerUps}
          swapLeftRightControls={swapLeftRightControls}
          levelCelebration={levelCelebration}
          onPause={handlePauseGame}
          onActivateHoverboard={() => engineRef.current?.activateHoverboard()}
          onLeft={() => engineRef.current?.executeLeftCommand()}
          onRight={() => engineRef.current?.executeRightCommand()}
          onJump={() => engineRef.current?.jump()}
          onSlide={() => engineRef.current?.slide()}
        />
      )}

      {/* Start / Menu Lobby */}
      {status === 'idle' && (
        <StartScreen
          highScore={stats.highScore}
          totalCoins={stats.totalCoins}
          character={currentCharacter}
          hoverboard={currentHoverboard}
          hoverboardsRemaining={stats.hoverboardsRemaining}
          onStart={handleStartGame}
          onOpenShop={() => setActiveModal('shop')}
          onOpenMissions={() => setActiveModal('missions')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
          onOpenSettings={() => setActiveModal('settings')}
        />
      )}

      {/* Paused Menu */}
      {status === 'paused' && (
        <PauseModal
          onResume={handleResumeGame}
          onRestart={handleRestartGame}
          onOpenSettings={() => setActiveModal('settings')}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Game Over Screen */}
      {status === 'gameover' && (
        <GameOverModal
          stats={stats}
          onRetry={handleRestartGame}
          onOpenShop={() => setActiveModal('shop')}
          onOpenMissions={() => setActiveModal('missions')}
          onOpenLeaderboard={() => setActiveModal('leaderboard')}
        />
      )}

      {/* Shop Modal */}
      {activeModal === 'shop' && (
        <ShopModal
          totalCoins={stats.totalCoins}
          hoverboardsRemaining={stats.hoverboardsRemaining}
          characters={characters}
          hoverboards={hoverboards}
          selectedCharacterId={selectedCharacterId}
          selectedHoverboardId={selectedHoverboardId}
          onSelectCharacter={handleSelectCharacter}
          onSelectHoverboard={handleSelectHoverboard}
          onUnlockCharacter={handleUnlockCharacter}
          onUnlockHoverboard={handleUnlockHoverboard}
          onBuyHoverboardItem={handleBuyHoverboardItem}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Missions Modal */}
      {activeModal === 'missions' && (
        <MissionsModal
          missions={missions}
          onClaimReward={handleClaimMissionReward}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Settings Modal */}
      {activeModal === 'settings' && (
        <SettingsModal
          currentTheme={theme}
          onSelectTheme={handleSelectTheme}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          volume={volume}
          onChangeVolume={handleChangeVolume}
          showPerfOverlay={showPerfOverlay}
          onTogglePerfOverlay={handleTogglePerfOverlay}
          swapLeftRightControls={swapLeftRightControls}
          onToggleSwapControls={handleToggleSwapControls}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Leaderboard & Run History Modal */}
      {activeModal === 'leaderboard' && (
        <LeaderboardModal
          playerHighScore={stats.highScore}
          totalCoins={stats.totalCoins}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Developer Performance Overlay */}
      {showPerfOverlay && (
        <PerformanceOverlay
          engine={engineRef.current}
          onClose={() => handleTogglePerfOverlay(false)}
        />
      )}
    </div>
  );
}
