import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Flame, Calendar, Award, User, Clock, ChevronRight } from 'lucide-react';
import { RunRecord, LeaderboardEntry } from '../types/game';

interface LeaderboardModalProps {
  playerHighScore: number;
  totalCoins: number;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  playerHighScore,
  totalCoins,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'league' | 'history'>('league');
  const [historyRuns, setHistoryRuns] = useState<RunRecord[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('subway_run_history');
      if (saved) {
        const parsed: RunRecord[] = JSON.parse(saved);
        setHistoryRuns(parsed);
      }
    } catch {
      setHistoryRuns([]);
    }
  }, []);

  // Subway Surfers style Top Run League (Diamond, Gold, Silver, Bronze)
  const baseLeagueRivals: Omit<LeaderboardEntry, 'rank' | 'isPlayer'>[] = [
    { name: 'Jake (World Champion)', score: 325400, badge: 'Diamond', character: 'Jake' },
    { name: 'Prince K (Monarch)', score: 284200, badge: 'Diamond', character: 'Prince K' },
    { name: 'Yutani (Cosmic Master)', score: 215800, badge: 'Diamond', character: 'Yutani' },
    { name: 'Fresh (Boombox Pro)', score: 172600, badge: 'Gold', character: 'Fresh' },
    { name: 'Ninja Shinobi', score: 128900, badge: 'Gold', character: 'Ninja' },
    { name: 'Tricky (Skate Legend)', score: 96400, badge: 'Gold', character: 'Tricky' },
    { name: 'Brody (Surfer Wave)', score: 68500, badge: 'Silver', character: 'Brody' },
    { name: 'Tagbot Retro', score: 45200, badge: 'Silver', character: 'Tagbot' },
    { name: 'Zoe Zombie', score: 29800, badge: 'Silver', character: 'Zoe' },
    { name: 'Subway Rookie', score: 12400, badge: 'Bronze', character: 'Jake' },
  ];

  // Insert player entry dynamically into league based on their high score
  const getLeagueEntries = (): LeaderboardEntry[] => {
    const playerTier: 'Diamond' | 'Gold' | 'Silver' | 'Bronze' =
      playerHighScore >= 200000
        ? 'Diamond'
        : playerHighScore >= 90000
        ? 'Gold'
        : playerHighScore >= 30000
        ? 'Silver'
        : 'Bronze';

    const list = [
      ...baseLeagueRivals,
      {
        name: 'YOU (Current Runner)',
        score: playerHighScore,
        badge: playerTier,
        character: 'Equipped',
        isPlayer: true,
      },
    ];

    list.sort((a, b) => b.score - a.score);

    return list.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  };

  const leagueEntries = getLeagueEntries();
  const playerRank = leagueEntries.find((e) => e.isPlayer)?.rank || 1;

  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'Diamond':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-[0_0_8px_rgba(6,182,212,0.4)]';
      case 'Gold':
        return 'bg-amber-500/20 text-yellow-300 border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
      case 'Silver':
        return 'bg-slate-300/20 text-slate-200 border-slate-400/50';
      default:
        return 'bg-amber-800/20 text-amber-500 border-amber-800/50';
    }
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="font-mono font-black text-xs text-slate-400">#{rank}</span>;
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-40 animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/90 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/30 to-yellow-400/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wide font-mono flex items-center gap-2">
                Leaderboards
              </h2>
              <div className="text-xs text-slate-400">
                Top Run League & Personal Records
              </div>
            </div>
          </div>

          <button
            id="close-leaderboard-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
          <button
            id="league-tab-btn"
            onClick={() => setActiveTab('league')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'league'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Medal className="w-3.5 h-3.5" />
            <span>TOP RUN LEAGUE</span>
          </button>

          <button
            id="history-tab-btn"
            onClick={() => setActiveTab('history')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>RUN HISTORY ({historyRuns.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-2">
          {activeTab === 'league' ? (
            <>
              {/* Player Status Card */}
              <div className="p-3 bg-gradient-to-r from-amber-500/15 via-slate-800/80 to-slate-900 border border-amber-500/40 rounded-xl flex items-center justify-between shadow-md mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 font-black font-mono flex items-center justify-center text-sm shadow">
                    #{playerRank}
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-300 uppercase tracking-wider">
                      Your Standing
                    </div>
                    <div className="text-lg font-black text-white font-mono">
                      {playerHighScore.toLocaleString()} <span className="text-xs text-slate-400 font-sans font-normal">pts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-yellow-300">
                  <span>★</span>
                  <span>{totalCoins.toLocaleString()}</span>
                </div>
              </div>

              {/* League Roster List */}
              {leagueEntries.map((entry) => (
                <div
                  key={`${entry.name}-${entry.rank}`}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    entry.isPlayer
                      ? 'bg-amber-500/10 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 flex items-center justify-center">
                      {getRankMedal(entry.rank)}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold ${
                            entry.isPlayer ? 'text-amber-300 font-black' : 'text-slate-200'
                          }`}
                        >
                          {entry.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono font-bold ${getBadgeStyle(
                            entry.badge
                          )}`}
                        >
                          {entry.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <User className="w-2.5 h-2.5" />
                        <span>{entry.character}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-sm text-white">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">pts</div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {historyRuns.length === 0 ? (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                  <Flame className="w-8 h-8 text-slate-600 mb-2" />
                  <div className="text-sm font-bold text-slate-300">No Runs Recorded Yet</div>
                  <div className="text-xs text-slate-500 mt-1 max-w-xs">
                    Finish your first run to record score, distance, and coin telemetry!
                  </div>
                </div>
              ) : (
                historyRuns.map((run, i) => (
                  <div
                    key={run.id || i}
                    className="p-3 bg-slate-950/60 border border-slate-800/90 rounded-xl flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 font-mono font-black text-xs text-slate-300 flex items-center justify-center">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-mono font-black text-amber-400">
                          {run.score.toLocaleString()} pts
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span className="text-sky-400">{run.distance}m</span>
                          <span>•</span>
                          <span className="text-yellow-400">★ {run.coins}</span>
                          <span>•</span>
                          <span className="text-slate-500">{run.date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-slate-300 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
                      {run.characterName || 'Runner'}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Back to Game
          </button>
        </div>
      </div>
    </div>
  );
};
