import React from 'react';
import { Mission } from '../types/game';
import { X, Award, CheckCircle2, Gift } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface MissionsModalProps {
  missions: Mission[];
  onClaimReward: (missionId: string, coins: number) => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  onClaimReward,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-40 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center">
              <Award className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
                Active Missions
              </h2>
              <div className="text-xs text-slate-400">Complete tasks to earn bonus gold coins</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto pr-1 py-3 space-y-3">
          {missions.map((m) => {
            const isFinished = m.current >= m.target;
            const percent = Math.min(100, Math.round((m.current / m.target) * 100));

            return (
              <div
                key={m.id}
                className={`bg-slate-950/70 border rounded-xl p-4 flex flex-col gap-2.5 transition-all ${
                  m.claimed
                    ? 'border-slate-800/60 opacity-60'
                    : isFinished
                    ? 'border-emerald-500/60 bg-emerald-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                      {m.title}
                      {m.claimed && (
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-semibold">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{m.description}</div>
                  </div>

                  {/* Reward / Claim */}
                  <div className="text-right">
                    {m.claimed ? (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Claimed
                      </div>
                    ) : isFinished ? (
                      <button
                        onClick={() => {
                          onClaimReward(m.id, m.rewardCoins);
                          soundManager.playPowerup();
                        }}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 animate-pulse"
                      >
                        <Gift className="w-3.5 h-3.5" /> CLAIM ★{m.rewardCoins}
                      </button>
                    ) : (
                      <div className="text-xs font-mono font-bold text-yellow-400">
                        ★ {m.rewardCoins}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full">
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Progress</span>
                    <span>
                      {m.current} / {m.target} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFinished ? 'bg-emerald-400' : 'bg-sky-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
