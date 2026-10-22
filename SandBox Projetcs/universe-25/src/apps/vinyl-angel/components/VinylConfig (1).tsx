// path: src/apps/vinyl-angel/components/VinylConfig.tsx

import React, { useState } from 'react';
import { useVinylStore } from '../store/useVinylStore';
import type { ScoreTier } from '../types';
import { ConfigSection } from '../../../components/shared';
import {
  Sliders,
  Palette,
  Play,
  RotateCw,
  Calculator,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const VinylConfig: React.FC = () => {
  const {
    settings,
    updateSettings,
    stats,
  } = useVinylStore();

  const [toast] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#171320] border border-[#d4af37] text-xs font-semibold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 text-[#ffd86b]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 rounded-2xl bg-[#120f18] border border-[#2b2238] flex items-center gap-4 shadow-lg">
        <div className="p-3 rounded-xl bg-[#1a1424] border border-[#3d304f] text-[#ffd86b]">
          <Sliders className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-cinzel text-xl font-bold text-[#ffd86b]">
            Destiny & Theme Settings
          </h2>
          <p className="text-xs text-[#8c7a9e]">
            Customize local aesthetic themes, player autoplay preferences, and review mathematical hazard formulas.
          </p>
        </div>
      </div>

      <ConfigSection
        title="Visual Theme Selector & Aesthetics"
        description="Select and preview visual skins and seasonal stylesheets dynamically compiled across the Universe 25 Web-OS."
        icon={<Palette className="w-5 h-5 text-[#ffd86b]" />}
        showThemeSelector={true}
      />

      {/* Gameplay Preferences */}
      <div className="p-6 rounded-2xl bg-[#120f18] border border-[#2b2238] space-y-4 shadow-md">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-[#ffd86b]" />
          <h3 className="font-cinzel text-sm font-bold text-white">Player & Rating Preferences</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Default Pass Score */}
          <div className="p-4 rounded-xl bg-[#171320] border border-[#2b2238] space-y-2">
            <span className="font-mono text-[11px] text-[#8c7a9e] uppercase block">Default Pass Score</span>
            <p className="text-[11px] text-[#cbd5e1]">Score applied when clicking Pass without selecting a rating:</p>
            <div className="flex gap-2 pt-1">
              {(['3+', '4+', '5+'] as ScoreTier[]).map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => updateSettings({ defaultPassScore: score })}
                  className={`px-4 py-2 min-h-[40px] rounded-xl font-mono font-bold transition cursor-pointer ${
                    settings.defaultPassScore === score
                      ? 'bg-[#d4af37] text-black shadow-gold-sm'
                      : 'bg-[#120f18] text-[#8c7a9e] border border-[#2b2238] hover:text-white'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Autoplay Toggle */}
          <div className="p-4 rounded-xl bg-[#171320] border border-[#2b2238] space-y-2 flex flex-col justify-between">
            <div>
              <span className="font-mono text-[11px] text-[#8c7a9e] uppercase block">Auto-Advance on End</span>
              <p className="text-[11px] text-[#cbd5e1]">Automatically log track with default score and pick next track when video ends:</p>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ autoplay: !settings.autoplay })}
              className={`w-full py-2.5 px-4 min-h-[42px] rounded-xl font-mono font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                settings.autoplay
                  ? 'bg-emerald-950/80 border border-emerald-600 text-emerald-300'
                  : 'bg-[#120f18] border border-[#2b2238] text-[#8c7a9e]'
              }`}
            >
              <RotateCw className="w-4 h-4" />
              {settings.autoplay ? 'Enabled (Auto Next)' : 'Disabled (Manual Only)'}
            </button>
          </div>
        </div>
      </div>

      {/* Mathematical Scoring Formulas Inspector */}
      <div className="p-6 rounded-2xl bg-[#120f18] border border-[#2b2238] space-y-4 shadow-md">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#ffd86b]" />
          <h3 className="font-cinzel text-sm font-bold text-white">Hazard Scoring Engine Formulas</h3>
        </div>

        <div className="p-4 rounded-xl bg-[#0f0d14] border border-[#2b2238] font-mono text-xs space-y-2 text-[#cbd5e1] leading-relaxed">
          <div className="text-[#ffd86b] font-bold">1. Raw Harmonic XP:</div>
          <div className="pl-3 bg-[#171320] p-2 rounded border border-[#261d33]">
            <code>Raw_XP = 10*s5 + 65*s6 + 200*s7 - 70*s3 - 3*s4</code>
          </div>

          <div className="text-[#ffd86b] font-bold pt-2">2. Logarithmic Scaling Factor:</div>
          <div className="pl-3 bg-[#171320] p-2 rounded border border-[#261d33]">
            <code>c = 5.0 / ln(51) ≈ 1.27173</code>
          </div>

          <div className="text-[#ffd86b] font-bold pt-2">3. Projected Hazard Level:</div>
          <div className="pl-3 bg-[#171320] p-2 rounded border border-[#261d33]">
            <code>Hazard = 3.0 + sgn(Raw_XP) * c * ln(1 + |Raw_XP| / 300)</code>
          </div>

          <div className="text-[#ffd86b] font-bold pt-2">4. Eligibility & Purge Thresholds:</div>
          <ul className="pl-3 list-disc list-inside text-[11px] space-y-1 text-[#9c93a8]">
            <li><strong className="text-emerald-400">Score &gt; 3.0</strong>: Vault Qualified (Displayed on Leaderboard).</li>
            <li><strong className="text-amber-400">Score = 3.0</strong>: Neutral Baseline.</li>
            <li><strong className="text-rose-400">Score &lt; 2.0</strong>: Purged to Bad KPI Archive and excluded from Static DB.</li>
          </ul>
        </div>
      </div>

      {/* Session Analytics Stats */}
      <div className="p-5 rounded-2xl bg-[#120f18] border border-[#2b2238] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#ffd86b]" />
          <div>
            <span className="font-cinzel font-bold text-white">Lifetime Session Activity</span>
            <p className="text-[#8c7a9e] text-[11px]">
              Total Ratings: <strong className="text-white">{stats.sessionRatingsCount}</strong> | Total Discs Generated: <strong className="text-[#ffd86b]">{stats.totalDiscsEarned} 💿</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VinylConfig;
