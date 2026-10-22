import React, { useState } from 'react';
import {
  Wrench,
  RotateCcw,
  Zap,
  CheckCircle2,
  AlertCircle,
  ToggleRight,
  ToggleLeft,
  Database,
  FastForward,
  Bot,
} from 'lucide-react';

interface SettingsTabProps {
  userProgress: any;
  myResources: any;
  isFreeBuyCheat?: boolean;
  isRapidMode?: boolean;
  isAutoGachaBuy?: boolean;
  autoRollsRemaining?: number;
  onUpdateProgress: (prog: any) => void;
  onResetCollection?: () => void;
  onUpdateResources: (res: any) => void;
  onToggleFreeBuyCheat?: (enabled: boolean) => void;
  onToggleRapidMode?: (enabled: boolean) => void;
  onToggleAutoGachaBuy?: (enabled: boolean) => void;
}

/**
 * Worker: SettingsTab
 * Minimalistic administrative laboratory — clear administrative controls.
 */
export const SettingsTab: React.FC<SettingsTabProps> = ({
  isFreeBuyCheat = false,
  isRapidMode = false,
  isAutoGachaBuy = false,
  autoRollsRemaining = 10,
  onUpdateProgress,
  onResetCollection,
  onToggleFreeBuyCheat,
  onToggleRapidMode,
  onToggleAutoGachaBuy,
}) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleCheat = () => {
    const next = !isFreeBuyCheat;
    if (onToggleFreeBuyCheat) onToggleFreeBuyCheat(next);
    showToast(
      next ? '🔓 God Mode: All dino buys cost 0.' : '🔒 God Mode disabled. Standard economic rules active.'
    );
  };

  const handleToggleRapid = () => {
    const next = !isRapidMode;
    if (onToggleRapidMode) onToggleRapidMode(next);
    showToast(
      next
        ? '⚡ Rapid Mode enabled: 50 Ferocity steps, 5s modal auto-continue, 5s Gacha return.'
        : '⏳ Rapid Mode disabled. Standard 30 Ferocity cadence & manual progression active.'
    );
  };

  const handleToggleAutoGachaBuy = () => {
    const next = !isAutoGachaBuy;
    if (onToggleAutoGachaBuy) onToggleAutoGachaBuy(next);
    showToast(
      next
        ? '🤖 Auto Gacha & Auto Buy enabled: Autonomous roll & purchase cycle active.'
        : '🛑 Auto Gacha & Auto Buy disabled. Manual summon & confirmation active.'
    );
  };

  const handleResetCollection = () => {
    if (
      window.confirm('Authoritative purge: Reset the SQLite-backed dinosaur collection to the unowned baseline?')
    ) {
      if (onResetCollection) {
        onResetCollection();
      } else {
        onUpdateProgress({ owned_dinos: {} });
      }
      showToast('ARC Jurassic SQLite dinosaur collection reset executed.');
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto text-[#f5f0e8] space-y-4 px-2 py-2">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#171320] border border-[#d4af37] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 text-[#ffd86b]">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="p-5 rounded-2xl bg-[#120f18] border border-[#2b2238] shadow-md shadow-black/35">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#291e07] to-[#120f18] border border-[#524124] flex items-center justify-center shadow-sm shadow-amber-900/30">
            <Wrench className="w-5 h-5 text-[#ffd86b]" />
          </div>
          <h2 className="font-cinzel text-lg font-bold text-[#ffd86b] tracking-wide">
            ARC Jurassic Control Lab
          </h2>
        </div>
        <p className="text-[12px] text-[#8c7a9e] leading-relaxed pl-12">
          Minimal command center. Administrative toggles and authoritative collection controls.
        </p>
      </div>

      <div className="space-y-3">
        {/* Card 1: Rapid Simulation Mode */}
        <div
          onClick={handleToggleRapid}
          className={`group p-5 rounded-2xl bg-[#120f18] border transition-all duration-200 cursor-pointer shadow-md select-none ${
            isRapidMode
              ? 'border-cyan-400 shadow-cyan-400/15 hover:shadow-cyan-400/30'
              : 'border-[#2b2238] hover:border-cyan-400/40'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner transition-colors ${
                isRapidMode
                  ? 'bg-cyan-950/60 border-cyan-300 text-cyan-300'
                  : 'bg-[#171320] border-[#2e2638] text-cyan-400/70'
              }`}
            >
              <FastForward className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2.5">
                <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                  Rapid Mode
                </h3>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm transition-all ${
                    isRapidMode
                      ? 'bg-cyan-400 text-black shadow-cyan-400/30'
                      : 'bg-[#171320] text-[#8c7a9e] border border-white/10'
                  }`}
                >
                  {isRapidMode ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-[#8c7a9e] leading-relaxed">
                {isRapidMode
                  ? 'Rapid Mode active. Rank climb step is 50 Ferocity, evolution milestone modals auto-continue after 5s, and the camera returns to the Gacha tab 5s after transformation finishes.'
                  : 'Standard cadence active. Rank climb step is 30 Ferocity, milestone modals require manual click dismissal, and focus remains in the catalog.'}
              </p>
            </div>

            <div className="text-3xl shrink-0 transition-transform duration-150 group-hover:scale-110 group-hover:-rotate-6">
              {isRapidMode ? (
                <ToggleRight className="w-9 h-9 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-[#685c78]" />
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Free Purchase (God Mode) */}
        <div
          onClick={handleToggleCheat}
          className={`group p-5 rounded-2xl bg-[#120f18] border transition-all duration-200 cursor-pointer shadow-md select-none ${
            isFreeBuyCheat
              ? 'border-amber-400 shadow-amber-400/15 hover:shadow-amber-400/30'
              : 'border-[#2b2238] hover:border-[#ffd86b]/40'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner transition-colors ${
                isFreeBuyCheat
                  ? 'bg-amber-900/40 border-amber-300 text-amber-300'
                  : 'bg-[#171320] border-[#2e2638] text-[#ffd86b]'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2.5">
                <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                  Free Purchase (God Mode)
                </h3>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm transition-all ${
                    isFreeBuyCheat
                      ? 'bg-amber-400 text-black shadow-amber-400/30'
                      : 'bg-[#171320] text-[#8c7a9e] border border-white/10'
                  }`}
                >
                  {isFreeBuyCheat ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-[#8c7a9e] leading-relaxed">
                {isFreeBuyCheat
                  ? 'God Mode is active. Buying any dinosaur requires 0 Jurassic Time, 0 DNA, and 0 Red Orbs.'
                  : 'Standard purchasing rules apply. All rolled dinosaurs consume Jurassic Time and DNA / Red Orbs as per the Genesis economic formula.'}
              </p>
            </div>

            <div className="text-3xl shrink-0 transition-transform duration-150 group-hover:scale-110 group-hover:-rotate-6">
              {isFreeBuyCheat ? (
                <ToggleRight className="w-9 h-9 text-amber-400 drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-[#685c78]" />
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Auto Gacha & Auto Buy */}
        <div
          onClick={handleToggleAutoGachaBuy}
          className={`group p-5 rounded-2xl bg-[#120f18] border transition-all duration-200 cursor-pointer shadow-md select-none ${
            isAutoGachaBuy
              ? 'border-emerald-400 shadow-emerald-400/15 hover:shadow-emerald-400/30'
              : 'border-[#2b2238] hover:border-emerald-400/40'
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-inner transition-colors ${
                isAutoGachaBuy
                  ? 'bg-emerald-950/60 border-emerald-300 text-emerald-300'
                  : 'bg-[#171320] border-[#2e2638] text-emerald-400/70'
              }`}
            >
              <Bot className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2.5">
                <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                  Auto Gacha & Auto Buy
                </h3>
                <span
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm transition-all ${
                    isAutoGachaBuy
                      ? 'bg-emerald-400 text-black shadow-emerald-400/30'
                      : 'bg-[#171320] text-[#8c7a9e] border border-white/10'
                  }`}
                >
                  {isAutoGachaBuy ? `ACTIVE (${autoRollsRemaining} ROLLS LEFT)` : 'OFF'}
                </span>
              </div>
              <p className="text-[11px] text-[#8c7a9e] leading-relaxed">
                {isAutoGachaBuy
                  ? `Auto Gacha & Auto Buy active (10-roll safety cap). Nexus autonomously summons and purchases affordable specimens (${autoRollsRemaining} rolls remaining), then automatically shuts off.`
                  : 'Manual summon & purchase mode. Player initiates rolls and confirms dinosaur purchases explicitly.'}
              </p>
            </div>

            <div className="text-3xl shrink-0 transition-transform duration-150 group-hover:scale-110 group-hover:-rotate-6">
              {isAutoGachaBuy ? (
                <ToggleRight className="w-9 h-9 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              ) : (
                <ToggleLeft className="w-9 h-9 text-[#685c78]" />
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#ffd86b]/30 to-transparent" />

        {/* Card 3: Reset Collection */}
        <div className="p-5 rounded-2xl bg-[#120f18] border border-[#2b2238] shadow-md shadow-black/30 space-y-2">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-950/50 to-[#120f18] border border-rose-800/60 flex items-center justify-center shrink-0 shadow-inner shadow-rose-900/20">
              <RotateCcw className="w-5 h-5 text-rose-400" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-cinzel text-sm font-bold text-rose-300 uppercase tracking-wider">
                Factory Purge — Dino Collection
              </h3>
              <div className="flex items-start gap-2 text-[11px] text-[#8c7a9e] leading-relaxed">
                <Database className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>
                  Authoritative SQLite database purge (`arc_progress.db`). Clears all unlocked specimen counts and evolutionary ranks back to the unowned baseline permanently.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetCollection}
                className="mt-1 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-950/50 to-rose-900/40 hover:from-rose-900 hover:to-rose-800 text-rose-300 border border-rose-800 hover:border-rose-600 font-bold transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 text-xs font-mono select-none shadow-md shadow-rose-950/20 hover:shadow-rose-900/30"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Dino Collection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
