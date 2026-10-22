// path: src/apps/dino-pomodoro/components/tabs/settings/PomodoroSettingsTab.tsx
// Tab 3 Setting: with only one button that is to reset the dinos

import React, { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useDinoPomodoroStore } from '../../../store/useDinoPomodoroStore';

interface PomodoroSettingsTabProps {
  dinoLibrary: any[];
}

export const PomodoroSettingsTab: React.FC<PomodoroSettingsTabProps> = ({ dinoLibrary }) => {
  const { userProgress, resetAllDinos } = useDinoPomodoroStore();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const ownedSpeciesCount = Object.keys(userProgress.owned_dinos || {}).length;

  const handleReset = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsProcessing(true);
    await resetAllDinos(dinoLibrary);
    setIsProcessing(false);
    setIsConfirming(false);
    setIsResetDone(true);
    setTimeout(() => setIsResetDone(false), 2500);
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-8">
      <div className="bg-[#120d1c] border border-[#2b203c] rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto shadow-md">
          <RotateCcw className="w-8 h-8" />
        </div>

        <div>
          <h2 className="font-cinzel-dec text-2xl font-bold text-white tracking-wider uppercase">
            Incubation Reset Console
          </h2>
          <p className="text-xs font-cinzel text-[#8c7a9e] mt-1">
            Current Unlocked Species: <strong className="text-white">{ownedSpeciesCount}</strong>
          </p>
        </div>

        {isConfirming && (
          <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 flex items-center gap-3 text-rose-200 text-xs font-cinzel text-left">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase">Confirm Dinosaur Collection Wipe?</span>
              <p className="text-rose-300 font-mono text-[11px] mt-0.5">
                This will delete all owned dinosaur ranks and roll a fresh Pomodoro specimen.
              </p>
            </div>
          </div>
        )}

        {isResetDone && (
          <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3 text-emerald-200 text-xs font-cinzel text-left">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>All dinosaur progress has been reset. A fresh specimen has been rolled!</span>
          </div>
        )}

        {/* The single primary button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            disabled={isProcessing}
            className={`w-full py-4 px-8 rounded-2xl font-cinzel font-black text-xs tracking-widest uppercase transition-all shadow-lg cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
              isConfirming
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_25px_rgba(225,29,72,0.4)] animate-pulse'
                : 'bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 hover:brightness-125 text-rose-200 border border-rose-600/50 shadow-[0_0_15px_rgba(225,29,72,0.2)]'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>
              {isProcessing
                ? 'Resetting Dinosaurs...'
                : isConfirming
                ? 'Yes, Wipe All Dinosaurs'
                : 'Reset Dinosaurs'}
            </span>
          </button>

          {isConfirming && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-[#1b1428] hover:bg-[#281c3c] border border-[#3b2b52] text-[#8c7a9e] hover:text-white font-cinzel font-bold text-xs tracking-wider uppercase transition cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
