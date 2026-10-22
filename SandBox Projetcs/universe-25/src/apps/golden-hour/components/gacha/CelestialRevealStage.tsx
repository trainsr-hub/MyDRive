// path: src/apps/golden-hour/components/gacha/CelestialRevealStage.tsx

import React, { useState, useEffect, useMemo } from 'react';
import type { PullItem } from '../../types';
import { resolveItemMetaFromPacks } from '../../packs';
import { RARITY_TABLE } from '../../store/useGoldenHourStore';
import { HazardBadge } from '../../../../components/HazardBadge';
import {
  Sparkles,
  Shield,
  Clock,
  Dna,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Feather,
  X,
  FastForward,
} from 'lucide-react';
import './celestialReveal.css';

interface CelestialRevealStageProps {
  items: PullItem[];
  dict?: Record<string, number>;
  onClose: () => void;
  packTitle?: string;
}

export const CelestialRevealStage: React.FC<CelestialRevealStageProps> = ({
  items,
  onClose,
  packTitle = 'Celestial Revelation',
}) => {
  // Track which cards are flipped (index -> boolean)
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [inspectingItem, setInspectingItem] = useState<PullItem | null>(null);
  const [allRevealed, setAllRevealed] = useState<boolean>(false);

  // Auto staggered reveal timer
  useEffect(() => {
    const total = items.length;

    // Flip cards sequentially with 120ms intervals
    items.forEach((_, idx) => {
      setTimeout(() => {
        setFlippedCards((prev) => ({ ...prev, [idx]: true }));
        if (idx === total - 1) {
          setAllRevealed(true);
        }
      }, 200 + idx * 140);
    });
  }, [items]);

  // Flip all immediately
  const handleRevealAll = () => {
    const full: Record<number, boolean> = {};
    items.forEach((_, i) => {
      full[i] = true;
    });
    setFlippedCards(full);
    setAllRevealed(true);
  };

  // Toggle single card flip
  const handleCardClick = (idx: number, item: PullItem) => {
    if (!flippedCards[idx]) {
      setFlippedCards((prev) => ({ ...prev, [idx]: true }));
    } else {
      setInspectingItem(item);
    }
  };

  // Calculate Conduit Totals for the Transmutation Telemetry Bar
  const conduitsSummary = useMemo(() => {
    let totalDna = 0;
    let totalRedOrbs = 0;
    let totalTimeDays = 0;
    let totalStems = 0;
    let totalRelics = 0;

    items.forEach((item) => {
      if (item.dnaReward) totalDna += item.dnaReward;
      if (item.redOrbsReward) totalRedOrbs += item.redOrbsReward;
      if (item.timeRewardSeconds) totalTimeDays += item.timeRewardSeconds / 86400;
      if (item.stemCount) totalStems += item.stemCount;
      if (item.category === 'relic') totalRelics += 1;
    });

    return {
      totalDna,
      totalRedOrbs,
      totalTimeDays: Math.round(totalTimeDays * 10) / 10,
      totalStems,
      totalRelics,
    };
  }, [items]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 md:p-8 overflow-y-auto cursor-pointer select-none"
      style={{
        background: 'radial-gradient(circle at center, #1b1226 0%, #0c0814 60%, #030206 100%)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* 🔮 Background Sacred Geometry Leylines Rings */}
      <svg className="celestial-sacred-rings" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48" fill="none" stroke="#d4af37" strokeWidth="0.3" strokeDasharray="1,2" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="#38bdf8" strokeWidth="0.2" strokeDasharray="2,3" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="#ffd86b" strokeWidth="0.4" />
        <polygon points="50,15 80,75 20,75" fill="none" stroke="#d4af37" strokeWidth="0.2" />
        <polygon points="50,85 80,25 20,25" fill="none" stroke="#c084fc" strokeWidth="0.2" />
      </svg>

      {/* ===================================================================== */}
      {/* TOP HUD: Altar Header & Transmutation Conduits Bar                     */}
      {/* ===================================================================== */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-6xl flex flex-col items-center justify-center gap-3 text-center pt-2"
      >
        <div className="flex items-center justify-center gap-2.5 text-[#ffd86b] font-cinzel text-xl md:text-3xl font-black">
          <Sparkles className="w-7 h-7 text-[#ffd86b] animate-pulse" />
          <span>{packTitle} — Revelation Altar</span>
        </div>

        {/* Transmutation Conduits Bar (Cross-App Telemetry) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
          {conduitsSummary.totalDna > 0 && (
            <div className="transmute-pill text-purple-300 border-purple-500/40">
              <Dna className="w-4 h-4 text-purple-400" />
              <span>
                <strong>+{conduitsSummary.totalDna.toLocaleString()}</strong> Purple DNA
              </span>
            </div>
          )}

          {conduitsSummary.totalRedOrbs > 0 && (
            <div className="transmute-pill text-rose-300 border-rose-500/40">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>
                <strong>+{conduitsSummary.totalRedOrbs}</strong> Red Orb{conduitsSummary.totalRedOrbs > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {conduitsSummary.totalTimeDays > 0 && (
            <div className="transmute-pill text-amber-300 border-amber-500/40">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                <strong>+{conduitsSummary.totalTimeDays}</strong> Days Time
              </span>
            </div>
          )}

          {conduitsSummary.totalStems > 0 && (
            <div className="transmute-pill text-[#ffd86b] border-[#ffd86b]/50">
              <Feather className="w-4 h-4 text-[#ffd86b]" />
              <span>
                <strong>+{conduitsSummary.totalStems}</strong> Koi no Koe Stem{conduitsSummary.totalStems > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {conduitsSummary.totalRelics > 0 && (
            <div className="transmute-pill text-emerald-300 border-emerald-500/40">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>
                <strong>+{conduitsSummary.totalRelics}</strong> Relic Armament{conduitsSummary.totalRelics > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* CENTER: 3D Holographic Cascade Card Showcase Grid                     */}
      {/* ===================================================================== */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-6xl my-auto py-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 justify-items-center">
          {items.map((item, idx) => {
            const isFlipped = flippedCards[idx];
            const baseKey = item.name.replace(/\s+\d+u$/, '').trim();
            const meta = resolveItemMetaFromPacks(baseKey);
            const rarityMeta = RARITY_TABLE[item.rarity] || RARITY_TABLE.common;
            const glowClass =
              item.rarity === 'legendary'
                ? 'rarity-glow-legendary'
                : item.rarity === 'epic'
                ? 'rarity-glow-epic'
                : item.rarity === 'rare'
                ? 'rarity-glow-rare'
                : '';

            return (
              <div
                key={item.id || idx}
                className="card-perspective-container w-full max-w-[190px] h-[260px] md:h-[280px]"
                onClick={() => handleCardClick(idx, item)}
              >
                <div className={`revelation-card-inner ${isFlipped ? 'flipped' : ''}`}>
                  {/* --- CARD BACK (Sacred Rune Surface) --- */}
                  <div className="card-face card-face-back">
                    <div className="text-3xl text-[#ffd86b] animate-pulse">✦</div>
                    <div className="font-cinzel text-xs font-bold text-[#d4af37] mt-3 tracking-widest uppercase">
                      Babylon
                    </div>
                    <div className="text-[10px] font-mono text-[#8c7a9e] mt-1">Click to Unveil</div>
                  </div>

                  {/* --- CARD FRONT (Revealed 3D Hologram) --- */}
                  <div
                    className={`card-face card-face-front border-2 shadow-2xl relative ${glowClass}`}
                    style={{
                      borderColor: rarityMeta.borderColor,
                      background: meta?.bg_gradient || 'linear-gradient(135deg, #1e132b 0%, #100a18 100%)',
                    }}
                  >
                    <div className="holo-sheen" />

                    {/* Top Tier & Rank */}
                    <div className="flex items-center justify-between w-full text-[10px] font-mono z-10">
                      <span
                        className="px-2 py-0.5 rounded font-bold uppercase"
                        style={{
                          backgroundColor: rarityMeta.bgColor,
                          color: rarityMeta.color,
                          border: `1px solid ${rarityMeta.borderColor}`,
                        }}
                      >
                        {rarityMeta.label}
                      </span>
                      <HazardBadge score={item.score} rank={item.rank} size="sm" />
                    </div>

                    {/* Center Icon/Cover */}
                    <div className="my-auto flex flex-col items-center justify-center z-10">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/20 shadow-xl bg-black/50 flex items-center justify-center relative group">
                        {meta?.icon_url ? (
                          <img
                            src={meta.icon_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-3xl">{item.iconEmoji}</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Info & Stats */}
                    <div className="w-full text-center z-10 space-y-1">
                      <div className="font-cinzel text-xs font-bold text-white leading-tight truncate" title={item.name}>
                        {item.name}
                      </div>

                      {/* Specialized Resource Pill */}
                      {item.dnaReward && (
                        <div className="text-[10px] font-mono font-bold text-purple-300 bg-purple-950/60 border border-purple-500/30 rounded py-0.5">
                          +{item.dnaReward.toLocaleString()} DNA
                        </div>
                      )}
                      {item.redOrbsReward && (
                        <div className="text-[10px] font-mono font-bold text-rose-300 bg-rose-950/60 border border-rose-500/30 rounded py-0.5">
                          +{item.redOrbsReward} Red Orb{item.redOrbsReward > 1 ? 's' : ''}
                        </div>
                      )}
                      {item.timeRewardSeconds && (
                        <div className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 rounded py-0.5">
                          +{(item.timeRewardSeconds / 86400).toFixed(1)} Day Time
                        </div>
                      )}
                      {item.stemCount && (
                        <div className="text-[10px] font-mono font-bold text-[#ffd86b] bg-amber-950/60 border border-[#ffd86b]/40 rounded py-0.5">
                          🪽 Master Stem
                        </div>
                      )}
                      {item.category === 'relic' && item.stats && (
                        <div className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 rounded py-0.5">
                          ATK +{item.stats.find((s) => s.name === 'ATK')?.value || 0} • DEF +{item.stats.find((s) => s.name === 'DEF')?.value || 0}
                        </div>
                      )}
                      {item.category === 'energy-core' && item.energyCores && (
                        <div className="text-[10px] font-mono text-sky-300 bg-sky-950/60 border border-sky-500/30 rounded py-0.5">
                          +{item.energyCores[0]?.amount}u {item.energyCores[0]?.attribute.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BOTTOM CONTROLS: Action Buttons & Dismissal                           */}
      {/* ===================================================================== */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-xl flex flex-col items-center justify-center gap-3 text-center pb-2"
      >
        <div className="flex items-center justify-center gap-4">
          {!allRevealed && (
            <button
              onClick={handleRevealAll}
              className="px-5 py-2.5 rounded-xl font-mono text-xs font-bold text-[#ffd86b] bg-[#1c1424] hover:bg-[#2b1f38] border border-[#d4af37]/40 shadow-lg flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <FastForward className="w-4 h-4" />
              <span>Reveal All Cards</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-8 py-3.5 rounded-2xl font-cinzel font-black text-sm text-black bg-gradient-to-r from-[#ffd86b] via-[#fce6a2] to-[#ffd86b] shadow-2xl hover:brightness-110 flex items-center gap-2.5 cursor-pointer transition-all active:scale-95 shadow-gold-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Channel & Store in Vault</span>
          </button>
        </div>

        <div
          onClick={onClose}
          className="text-[11px] font-mono text-[#8c7a9e] hover:text-[#ffd86b] transition-colors cursor-pointer select-none"
        >
          Click anywhere outside to conclude
        </div>
      </div>

      {/* ===================================================================== */}
      {/* HOLOGRAPHIC CARD INSPECTION MODAL (Deep Inspection)                  */}
      {/* ===================================================================== */}
      {inspectingItem && (
        <div
          onClick={() => setInspectingItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg p-6 rounded-3xl bg-[#120f18] border-2 border-[#d4af37] shadow-2xl space-y-4 text-left relative animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setInspectingItem(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <span className="text-3xl">{inspectingItem.iconEmoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold bg-[#ffd86b]/20 text-[#ffd86b] border border-[#ffd86b]/40">
                    {inspectingItem.rarity.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-mono text-[#8c7a9e] uppercase">
                    {inspectingItem.category}
                  </span>
                </div>
                <h3 className="font-cinzel text-lg font-bold text-white mt-1">
                  {inspectingItem.name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              {inspectingItem.description}
            </p>

            {/* Relic Combat Stats */}
            {inspectingItem.category === 'relic' && inspectingItem.stats && (
              <div className="grid grid-cols-2 gap-2 text-xs font-mono p-3 rounded-xl bg-black/40 border border-white/10">
                {inspectingItem.stats.map((s) => (
                  <div key={s.name} className="flex justify-between">
                    <span className="text-[#8c7a9e]">{s.name}:</span>
                    <strong className={s.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {s.value >= 0 ? `+${s.value}` : s.value}
                    </strong>
                  </div>
                ))}
              </div>
            )}

            {/* Tactical Buffs */}
            {inspectingItem.buffs && inspectingItem.buffs.length > 0 && (
              <div className="p-3 rounded-xl bg-[#082015] border border-emerald-500/30 text-xs font-mono space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tactical Resonance Buff
                </span>
                {inspectingItem.buffs.map((b) => (
                  <div key={b.name}>
                    <strong className="text-emerald-300">{b.name}</strong>
                    <p className="text-[11px] text-[#cbd5e1]">{b.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Downsides */}
            {inspectingItem.downsides && inspectingItem.downsides.length > 0 && (
              <div className="p-3 rounded-xl bg-[#3b080f]/40 border border-rose-500/30 text-xs font-mono space-y-1">
                <span className="text-[10px] text-rose-400 uppercase font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Entropic Binding Penalty
                </span>
                {inspectingItem.downsides.map((d) => (
                  <div key={d.name}>
                    <strong className="text-rose-300">{d.name}</strong>
                    <p className="text-[11px] text-[#cbd5e1]">{d.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectingItem(null)}
                className="px-5 py-2 rounded-xl text-xs font-mono bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CelestialRevealStage;
