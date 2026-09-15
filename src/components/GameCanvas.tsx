import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../game/engine';
import {
  CharacterSkin,
  HoverboardSkin,
  EnvironmentTheme,
  PlayerStats,
  ActivePowerUp,
  Mission,
  LevelCelebration
} from '../types/game';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<GameEngine | null>;
  characterSkin: CharacterSkin;
  hoverboardSkin: HoverboardSkin;
  theme: EnvironmentTheme;
  swapLeftRightControls: boolean;
  onStatsUpdate: (stats: PlayerStats) => void;
  onPowerUpsUpdate: (powerUps: ActivePowerUp[]) => void;
  onGameOver: (stats: PlayerStats) => void;
  onMissionProgress: (type: Mission['type'], count: number) => void;
  onLevelUp?: (celebration: LevelCelebration) => void;
  onStartGameDirectly?: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  characterSkin,
  hoverboardSkin,
  theme,
  swapLeftRightControls,
  onStatsUpdate,
  onPowerUpsUpdate,
  onGameOver,
  onMissionProgress,
  onLevelUp,
  onStartGameDirectly,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe & tap tracking
  const touchStartPos = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const lastTapTime = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate game engine
    const engine = new GameEngine(
      containerRef.current,
      characterSkin,
      hoverboardSkin,
      theme
    );

    engine.onStatsUpdate = onStatsUpdate;
    engine.onPowerUpsUpdate = onPowerUpsUpdate;
    engine.onGameOver = onGameOver;
    engine.onMissionProgress = onMissionProgress;
    engine.onLevelUp = onLevelUp;
    engine.swapLeftRightControls = swapLeftRightControls;

    engineRef.current = engine;

    // Keyboard handlers with comprehensive key mappings
    const handleKeyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      if (!eng) return;

      if (eng.status === 'idle') {
        if (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.key === 'Enter') {
          e.preventDefault();
          if (onStartGameDirectly) onStartGameDirectly();
        }
        return;
      }

      if (eng.status !== 'playing') return;

      // Check key & code to support all laptop keyboards (< and >, Arrow keys, A/D, Q/E, etc.)
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
      const isUp = e.key === 'ArrowUp' || e.code === 'KeyW' || e.key === 'w' || e.key === 'W' || e.code === 'KeyZ';
      const isDown = e.key === 'ArrowDown' || e.code === 'KeyS' || e.key === 's' || e.key === 'S';

      if (isLeft) {
        e.preventDefault();
        eng.executeLeftCommand();
      } else if (isRight) {
        e.preventDefault();
        eng.executeRightCommand();
      } else if (isUp) {
        e.preventDefault();
        eng.jump();
      } else if (isDown) {
        e.preventDefault();
        eng.slide();
      } else if (e.code === 'Space') {
        e.preventDefault();
        eng.activateHoverboard();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        eng.pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Sync control swap changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.swapLeftRightControls = swapLeftRightControls;
    }
  }, [swapLeftRightControls]);

  // Sync level up callback
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.onLevelUp = onLevelUp;
    }
  }, [onLevelUp]);

  // Sync theme changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.environment.setTheme(theme);
    }
  }, [theme]);

  // Sync skin changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.character.updateSkins(characterSkin, hoverboardSkin);
    }
  }, [characterSkin, hoverboardSkin]);

  // Pointer / Touch Swipe & Tap zones
  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine) return;

    if (engine.status === 'idle') {
      if (onStartGameDirectly) onStartGameDirectly();
      return;
    }

    if (engine.status !== 'playing') return;

    const deltaX = e.clientX - touchStartPos.current.x;
    const deltaY = e.clientY - touchStartPos.current.y;
    const distance = Math.hypot(deltaX, deltaY);
    const duration = performance.now() - touchStartPos.current.time;

    const now = performance.now();
    const isDoubleTap = now - lastTapTime.current < 280 && distance < 20;
    lastTapTime.current = now;

    if (isDoubleTap) {
      engine.activateHoverboard();
      return;
    }

    const SWIPE_THRESHOLD = 16; // sensitive swipe gesture threshold

    if (distance >= SWIPE_THRESHOLD && duration < 550) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          engine.executeRightCommand();
        } else {
          engine.executeLeftCommand();
        }
      } else {
        // Vertical swipe
        if (deltaY < 0) {
          engine.jump();
        } else {
          engine.slide();
        }
      }
    } else if (distance < SWIPE_THRESHOLD && duration < 400) {
      // Direct Tap Zones for Touch / Mobile Screens
      if (e.pointerType === 'touch') {
        const screenW = window.innerWidth;
        const clickX = e.clientX;

        if (clickX < screenW * 0.38) {
          // Left zone tapped
          engine.executeLeftCommand();
        } else if (clickX > screenW * 0.62) {
          // Right zone tapped
          engine.executeRightCommand();
        } else {
          // Center tapped -> Jump!
          engine.jump();
        }
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      className="w-full h-full absolute inset-0 overflow-hidden select-none touch-none cursor-pointer"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    />
  );
};
