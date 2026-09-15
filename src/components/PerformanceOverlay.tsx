import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../game/engine';
import {
  Activity,
  Cpu,
  Layers,
  RotateCcw,
  Minimize2,
  Maximize2,
  X,
  Zap,
  HardDrive,
  Move
} from 'lucide-react';

interface PerformanceOverlayProps {
  engine: GameEngine | null;
  onClose: () => void;
}

interface FrameStats {
  fps: number;
  minFps: number;
  maxFps: number;
  avgFps: number;
  frameTime: number;
  frameTimesHistory: number[];
}

interface MemoryStats {
  usedJSHeapMB: number | null;
  totalJSHeapMB: number | null;
  jsHeapLimitMB: number | null;
  heapPercent: number | null;
}

interface RenderStats {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  activeObstacles: number;
  activeCoins: number;
  activePowerUps: number;
}

export const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({
  engine,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 72 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [frameStats, setFrameStats] = useState<FrameStats>({
    fps: 60,
    minFps: 60,
    maxFps: 60,
    avgFps: 60,
    frameTime: 16.6,
    frameTimesHistory: new Array(40).fill(16.6),
  });

  const [memoryStats, setMemoryStats] = useState<MemoryStats>({
    usedJSHeapMB: null,
    totalJSHeapMB: null,
    jsHeapLimitMB: null,
    heapPercent: null,
  });

  const [renderStats, setRenderStats] = useState<RenderStats>({
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    activeObstacles: 0,
    activeCoins: 0,
    activePowerUps: 0,
  });

  // Profiler measurement references
  const frameCount = useRef<number>(0);
  const totalFrames = useRef<number>(0);
  const accumulatedFps = useRef<number>(0);
  const minFpsRef = useRef<number>(Infinity);
  const maxFpsRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const frameTimesBuffer = useRef<number[]>(new Array(40).fill(16.6));
  const animFrameRef = useRef<number | null>(null);

  // Reset Min / Max Metrics
  const handleResetMetrics = useCallback(() => {
    minFpsRef.current = Infinity;
    maxFpsRef.current = 0;
    totalFrames.current = 0;
    accumulatedFps.current = 0;
    frameTimesBuffer.current = new Array(40).fill(16.6);
  }, []);

  // Performance loop for high precision FPS & Memory sampling
  useEffect(() => {
    let lastSampleTime = performance.now();

    const updateLoop = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0) {
        const instantFps = Math.min(240, 1000 / delta);
        frameCount.current++;
        totalFrames.current++;
        accumulatedFps.current += instantFps;

        // Track Min & Max after initial warmup (first 10 frames ignored for warmup)
        if (totalFrames.current > 10) {
          if (instantFps < minFpsRef.current && instantFps > 5) {
            minFpsRef.current = instantFps;
          }
          if (instantFps > maxFpsRef.current) {
            maxFpsRef.current = instantFps;
          }
        }

        frameTimesBuffer.current.push(delta);
        if (frameTimesBuffer.current.length > 40) {
          frameTimesBuffer.current.shift();
        }

        // Throttle UI React state updates to ~120ms (approx 8 updates/sec) to avoid overhead
        if (now - lastSampleTime >= 120) {
          lastSampleTime = now;

          const recentSlices = frameTimesBuffer.current.slice(-10);
          const avgDelta = recentSlices.reduce((a, b) => a + b, 0) / recentSlices.length;
          const currentFps = Math.min(240, Math.round(1000 / avgDelta));
          const overallAvg = totalFrames.current > 0
            ? Math.round(accumulatedFps.current / totalFrames.current)
            : currentFps;

          setFrameStats({
            fps: currentFps,
            minFps: minFpsRef.current === Infinity ? currentFps : Math.round(minFpsRef.current),
            maxFps: maxFpsRef.current === 0 ? currentFps : Math.round(maxFpsRef.current),
            avgFps: overallAvg,
            frameTime: parseFloat(delta.toFixed(1)),
            frameTimesHistory: [...frameTimesBuffer.current],
          });

          // Memory sampling (if browser exposes performance.memory, standard in Chromium)
          const perf = window.performance as unknown as {
            memory?: {
              usedJSHeapSize: number;
              totalJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          };

          if (perf?.memory) {
            const used = perf.memory.usedJSHeapSize / (1024 * 1024);
            const total = perf.memory.totalJSHeapSize / (1024 * 1024);
            const limit = perf.memory.jsHeapSizeLimit / (1024 * 1024);
            setMemoryStats({
              usedJSHeapMB: parseFloat(used.toFixed(1)),
              totalJSHeapMB: parseFloat(total.toFixed(1)),
              jsHeapLimitMB: parseFloat(limit.toFixed(0)),
              heapPercent: Math.min(100, Math.round((used / total) * 100)),
            });
          }

          // Engine 3D WebGL metrics
          if (engine) {
            const metrics = engine.getPerformanceMetrics();
            if (metrics) {
              setRenderStats({
                drawCalls: metrics.drawCalls,
                triangles: metrics.triangles,
                geometries: metrics.geometries,
                textures: metrics.textures,
                programs: metrics.programs,
                activeObstacles: metrics.activeObstacles,
                activeCoins: metrics.activeCoins,
                activePowerUps: metrics.activePowerUps,
              });
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [engine]);

  // Dragging handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header/handle
    setIsDragging(true);
    dragStartOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(8, Math.min(window.innerWidth - 300, e.clientX - dragStartOffset.current.x));
      const newY = Math.max(8, Math.min(window.innerHeight - 80, e.clientY - dragStartOffset.current.y));
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // FPS Color logic
  const getFpsColor = (val: number) => {
    if (val >= 55) return 'text-emerald-400';
    if (val >= 30) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getFpsBadge = (val: number) => {
    if (val >= 55) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
    if (val >= 30) return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
    return 'bg-rose-500/20 border-rose-500/40 text-rose-300';
  };

  // Sparkline calculation
  const maxHistory = Math.max(...frameStats.frameTimesHistory, 33.3);
  const minHistory = 0;

  return (
    <aside
      id="dev-perf-overlay"
      aria-label="Developer Performance Overlay"
      className="fixed z-50 select-none font-mono text-xs shadow-2xl transition-shadow"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {isMinimized ? (
        // Compact pill display
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/90 border border-slate-700/90 backdrop-blur-md text-white shadow-xl">
          <div
            onMouseDown={handleMouseDown}
            className="cursor-move text-slate-500 hover:text-slate-300 flex items-center"
            title="Drag overlay"
          >
            <Move className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className={getFpsColor(frameStats.fps)}>{frameStats.fps} FPS</span>
          </div>

          <span className="text-slate-600">|</span>
          <span className="text-slate-300">{frameStats.frameTime}ms</span>

          {memoryStats.usedJSHeapMB !== null && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-300">{memoryStats.usedJSHeapMB}MB</span>
            </>
          )}

          <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Expand Details"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Performance Overlay"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        // Full comprehensive developer dashboard
        <div className="w-76 sm:w-84 rounded-2xl bg-slate-950/95 border border-slate-700/80 backdrop-blur-xl text-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden">
          {/* Header & Drag Handle */}
          <div
            onMouseDown={handleMouseDown}
            className="cursor-move flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs tracking-wider text-slate-100 uppercase">
                Dev Profiler
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetMetrics}
                className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset Min / Max counters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimize to Pill"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Profiler (Toggle in Settings)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3.5 space-y-3">
            {/* FPS & Latency Card */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Frame Rate
                </div>
                <div className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getFpsBadge(frameStats.fps)}`}>
                  {frameStats.fps >= 58 ? 'Target: 60 FPS' : frameStats.fps >= 30 ? 'Moderate' : 'Throttled'}
                </div>
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-black ${getFpsColor(frameStats.fps)}`}>
                    {frameStats.fps}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">FPS</span>
                </div>

                <div className="text-right">
                  <div className="text-slate-200 font-bold text-xs">{frameStats.frameTime} ms</div>
                  <div className="text-[10px] text-slate-500">Frame Budget (16.6ms)</div>
                </div>
              </div>

              {/* Min / Avg / Max stats */}
              <div className="grid grid-cols-3 gap-1 py-1 px-2 bg-slate-950/70 rounded-lg text-center text-[10px] border border-slate-800/80 mb-2">
                <div>
                  <span className="text-slate-500 block">MIN</span>
                  <span className="font-bold text-rose-400">{frameStats.minFps}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">AVG</span>
                  <span className="font-bold text-sky-300">{frameStats.avgFps}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">MAX</span>
                  <span className="font-bold text-emerald-400">{frameStats.maxFps}</span>
                </div>
              </div>

              {/* Real-time Frame Latency Sparkline Graph */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[9px] text-slate-500">
                  <span>Frame Timeline (Last 40 Frames)</span>
                  <span>16.6ms Target</span>
                </div>
                <div className="h-9 w-full bg-slate-950/80 rounded-lg p-1 flex items-end gap-[2px] border border-slate-800/60 overflow-hidden relative">
                  {/* 16.6ms target guide line */}
                  <div
                    className="absolute w-full border-t border-emerald-500/40 pointer-events-none left-0"
                    style={{ bottom: `${Math.min(90, (16.6 / maxHistory) * 100)}%` }}
                  />
                  {frameStats.frameTimesHistory.map((ft, idx) => {
                    const heightPercent = Math.min(100, Math.max(10, (ft / maxHistory) * 100));
                    const barColor =
                      ft <= 18 ? 'bg-emerald-400' : ft <= 34 ? 'bg-amber-400' : 'bg-rose-400';
                    return (
                      <div
                        key={idx}
                        className={`flex-1 rounded-xs transition-all duration-75 ${barColor}`}
                        style={{ height: `${heightPercent}%` }}
                        title={`${ft.toFixed(1)}ms`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Memory Usage Card */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                  Memory Usage
                </div>
                {memoryStats.usedJSHeapMB !== null && (
                  <span className="text-[10px] text-cyan-300 font-bold">
                    {memoryStats.usedJSHeapMB} MB
                  </span>
                )}
              </div>

              {memoryStats.usedJSHeapMB !== null ? (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="bg-cyan-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${memoryStats.heapPercent || 20}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Heap Used: <strong className="text-slate-200">{memoryStats.usedJSHeapMB} MB</strong></span>
                    <span>Total: <strong className="text-slate-200">{memoryStats.totalJSHeapMB} MB</strong></span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Heap Limit:</span>
                    <span>{memoryStats.jsHeapLimitMB} MB</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded-lg border border-slate-800/60">
                  <span className="text-amber-400 font-bold block mb-0.5">JS Heap Sandboxed</span>
                  Browser restricts `performance.memory` API. WebGL GPU buffers tracked below.
                </div>
              )}
            </div>

            {/* WebGL Rendering & Draw Calls */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase">
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  WebGL GPU Render Stats
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/70">
                  <span className="text-slate-500 block">Draw Calls</span>
                  <span className="text-slate-200 font-bold text-xs">{renderStats.drawCalls}</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/70">
                  <span className="text-slate-500 block">Triangles</span>
                  <span className="text-slate-200 font-bold text-xs">{renderStats.triangles.toLocaleString()}</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/70">
                  <span className="text-slate-500 block">Geometries</span>
                  <span className="text-slate-200 font-bold text-xs">{renderStats.geometries}</span>
                </div>
                <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800/70">
                  <span className="text-slate-500 block">Textures</span>
                  <span className="text-slate-200 font-bold text-xs">{renderStats.textures}</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span>Active 3D Entities:</span>
                <span className="text-slate-200 font-bold">
                  {renderStats.activeObstacles} Obstacles • {renderStats.activeCoins} Coins
                </span>
              </div>
            </div>

            {/* Shortcut hint */}
            <div className="text-[9px] text-slate-500 flex items-center justify-between px-1">
              <span>Toggle: Settings or <strong className="text-cyan-400 font-mono">F3</strong></span>
              <span>Drag handle to reposition</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
