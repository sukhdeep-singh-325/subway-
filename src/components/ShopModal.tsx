import React, { useState } from 'react';
import { CharacterSkin, HoverboardSkin } from '../types/game';
import { X, Check, Lock, ShoppingBag, Shield } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

interface ShopModalProps {
  totalCoins: number;
  hoverboardsRemaining: number;
  characters: CharacterSkin[];
  hoverboards: HoverboardSkin[];
  selectedCharacterId: string;
  selectedHoverboardId: string;
  onSelectCharacter: (id: string) => void;
  onSelectHoverboard: (id: string) => void;
  onUnlockCharacter: (id: string, cost: number) => void;
  onUnlockHoverboard: (id: string, cost: number) => void;
  onBuyHoverboardItem: (count: number, cost: number) => void;
  onClose: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  totalCoins,
  hoverboardsRemaining,
  characters,
  hoverboards,
  selectedCharacterId,
  selectedHoverboardId,
  onSelectCharacter,
  onSelectHoverboard,
  onUnlockCharacter,
  onUnlockHoverboard,
  onBuyHoverboardItem,
  onClose,
}) => {
  const [tab, setTab] = useState<'runners' | 'boards' | 'supplies'>('runners');

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-40 animate-fade-in">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/90 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider font-mono">
                Skate Shop
              </h2>
              <div className="text-xs text-slate-400">Upgrade your gear and runners</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Coin balance badge */}
            <div className="bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-inner">
              <span className="text-yellow-400 font-black">★</span>
              <span className="font-mono font-bold text-yellow-300 text-sm sm:text-base">
                {totalCoins.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 my-4 border-b border-slate-800 pb-3">
          <button
            onClick={() => setTab('runners')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              tab === 'runners'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            Runners
          </button>
          <button
            onClick={() => setTab('boards')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              tab === 'boards'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            Hoverboards
          </button>
          <button
            onClick={() => setTab('supplies')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              tab === 'supplies'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-750'
            }`}
          >
            Consumables
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {/* RUNNERS TAB */}
          {tab === 'runners' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {characters.map((char) => {
                const isEquipped = char.id === selectedCharacterId;
                const canAfford = totalCoins >= char.cost;

                return (
                  <div
                    key={char.id}
                    className={`bg-slate-950/60 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'border-amber-500/80 ring-1 ring-amber-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Color Palette Swatch */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div
                          className="w-4 h-4 rounded-full border border-slate-700"
                          style={{ backgroundColor: `#${char.colorScheme.hoodie.toString(16).padStart(6, '0')}` }}
                          title="Hoodie Color"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-slate-700"
                          style={{ backgroundColor: `#${char.colorScheme.cap.toString(16).padStart(6, '0')}` }}
                          title="Cap Color"
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-slate-700"
                          style={{ backgroundColor: `#${char.colorScheme.accent.toString(16).padStart(6, '0')}` }}
                          title="Accent Color"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-base">{char.name}</div>
                        {char.characterModel && (
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                            {char.characterModel.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {char.description || 'Stylized City Runner'}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {char.unlocked ? (
                        isEquipped ? (
                          <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectCharacter(char.id);
                              soundManager.playLaneSwitch();
                            }}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            EQUIP
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              onUnlockCharacter(char.id, char.cost);
                              soundManager.playPowerup();
                            }
                          }}
                          disabled={!canAfford}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" /> ★ {char.cost.toLocaleString()}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* HOVERBOARDS TAB */}
          {tab === 'boards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hoverboards.map((board) => {
                const isEquipped = board.id === selectedHoverboardId;
                const canAfford = totalCoins >= board.cost;

                return (
                  <div
                    key={board.id}
                    className={`bg-slate-950/60 border rounded-xl p-3.5 flex flex-col justify-between transition-all ${
                      isEquipped
                        ? 'border-cyan-500/80 ring-1 ring-cyan-500/30'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Deck preview strip */}
                      <div
                        className="w-full h-3 rounded-full mb-2.5 shadow-sm"
                        style={{
                          backgroundColor: `#${board.color.toString(16).padStart(6, '0')}`,
                          border: `1px solid ${board.trailColor}`,
                        }}
                      />

                      <div className="font-bold text-white text-base">{board.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: board.trailColor }} />
                        <span>Neon Trail • {board.speedBoostPercent > 0 ? `+${board.speedBoostPercent}% Speed` : 'Classic Shield'}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      {board.unlocked ? (
                        isEquipped ? (
                          <div className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> EQUIPPED
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              onSelectHoverboard(board.id);
                              soundManager.playLaneSwitch();
                            }}
                            className="text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            EQUIP
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              onUnlockHoverboard(board.id, board.cost);
                              soundManager.playPowerup();
                            }
                          }}
                          disabled={!canAfford}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <Lock className="w-3 h-3" /> ★ {board.cost}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CONSUMABLES TAB */}
          {tab === 'supplies' && (
            <div className="space-y-3">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl">
                    🛹
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">Hoverboard Reserve (Single)</div>
                    <div className="text-xs text-slate-400">Protects from 1 crash during any run</div>
                    <div className="text-xs text-cyan-400 mt-0.5">In Inventory: {hoverboardsRemaining}</div>
                  </div>
                </div>

                <button
                  onClick={() => onBuyHoverboardItem(1, 40)}
                  disabled={totalCoins < 40}
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                    totalCoins >= 40
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ★ 40 Coins
                </button>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl">
                    📦
                  </div>
                  <div>
                    <div className="font-bold text-white text-base">Hoverboard Bundle (3 Pack)</div>
                    <div className="text-xs text-slate-400">Save 20 coins with a 3-pack bundle</div>
                  </div>
                </div>

                <button
                  onClick={() => onBuyHoverboardItem(3, 100)}
                  disabled={totalCoins < 100}
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                    totalCoins >= 100
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  ★ 100 Coins
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
