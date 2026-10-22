// path: src/apps/golden-hour/components/GachaAltar.tsx

import React, { useState } from 'react';
import { useGoldenHourStore, RARITY_TABLE, TICKET_REGISTRY } from '../store/useGoldenHourStore';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { HazardBadge } from '../../../components/HazardBadge';
import type { PullItem, TicketType } from '../types';
import {
  SharedButton,
  ModalContainer
} from '../../../components/shared';
import {
  Ticket,
  Sparkles,
  Zap,
  Shield,
  BookOpen,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface PackConfig {
  ticketType: TicketType;
  name: string;
  subtitle: string;
  dimension: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  featuredRelic: string;
}

const PACKS: PackConfig[] = [
  {
    ticketType: 'angel-roll',
    name: 'Celestial Empyrean Pack',
    subtitle: 'Music & Harmonic Dimension',
    dimension: 'Vinyl Angel',
    icon: '🎟️',
    color: '#ffd86b',
    bgGradient: 'from-[#291e07] via-[#1a1424] to-[#120f18]',
    borderColor: '#d4af37',
    featuredRelic: 'Celestial Harmonica (✦ 7.85)',
  },
  {
    ticketType: 'solar-roll',
    name: 'Solar Corona Pack',
    subtitle: 'Agrarian & Plasma Dimension',
    dimension: 'Farm Alpha / Beta',
    icon: '☀️',
    color: '#f97316',
    bgGradient: 'from-[#2c1305] via-[#1a1424] to-[#120f18]',
    borderColor: '#f97316',
    featuredRelic: 'Sunforged Aegis (✦ 8.10)',
  },
  {
    ticketType: 'codex-roll',
    name: 'Void Codex Pack',
    subtitle: 'Ancient Rune & Aether Dimension',
    dimension: 'Artifact Codex',
    icon: '📜',
    color: '#38bdf8',
    bgGradient: 'from-[#082f49] via-[#1a1424] to-[#120f18]',
    borderColor: '#38bdf8',
    featuredRelic: 'Void Codex (Ø 7.55)',
  },
];

export const GachaAltar: React.FC = () => {
  const { pullFromPack, totalPulls } = useGoldenHourStore();
  const {
    angelRollTickets,
    solarRollTickets,
    codexRollTickets,
  } = useInventoryStore();

  const [activePack, setActivePack] = useState<TicketType>('angel-roll');
  const [pulling, setPulling] = useState<boolean>(false);
  const [recentPull, setRecentPull] = useState<PullItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getTicketCount = (type: TicketType): number => {
    switch (type) {
      case 'angel-roll':
        return angelRollTickets;
      case 'solar-roll':
        return solarRollTickets;
      case 'codex-roll':
        return codexRollTickets;
    }
  };

  const handlePull = (type: TicketType) => {
    const count = getTicketCount(type);
    if (count < 1) {
      const meta = TICKET_REGISTRY[type];
      showToast(`Insufficient ${meta.name}s! Earn them in ${meta.origin}.`, 'error');
      return;
    }

    setPulling(true);
    setRecentPull(null);

    // Instant summoning execution with immediate feedback
    const item = pullFromPack(type);
    setPulling(false);
    if (item) {
      setRecentPull(item);
      const rarityMeta = RARITY_TABLE[item.rarity];
      showToast(`✨ Summoned [${rarityMeta.label}] ${item.name}!`, 'success');
    } else {
      showToast('Summoning failed.', 'error');
    }
  };

  const selectedPack = PACKS.find((p) => p.ticketType === activePack) || PACKS[0];
  const ticketCount = getTicketCount(activePack);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast */}
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

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#120f18] border border-[#2b2238] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#291e07] to-[#120f18] border border-[#524124]">
            <Sparkles className="w-7 h-7 text-[#ffd86b]" />
          </div>
          <div>
            <h2 className="font-cinzel text-xl font-bold text-[#ffd86b] flex items-center gap-2">
              Dimensional Summoning Altar
            </h2>
            <p className="text-xs text-[#8c7a9e]">
              Channel proof-of-effort tickets from origin worlds into relics, collectibles, and IoT energy fuel.
            </p>
          </div>
        </div>

        {/* Global Ticket Balances */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-[#171320] px-3 py-1.5 rounded-xl border border-[#3d304f]">
            <span>🎟️</span>
            <span className="text-[#8c7a9e]">Angel:</span>
            <strong className="text-[#ffd86b]">{angelRollTickets}</strong>
          </div>
          <div className="flex items-center gap-1.5 bg-[#171320] px-3 py-1.5 rounded-xl border border-[#3d304f]">
            <span>☀️</span>
            <span className="text-[#8c7a9e]">Solar:</span>
            <strong className="text-[#f97316]">{solarRollTickets}</strong>
          </div>
          <div className="flex items-center gap-1.5 bg-[#171320] px-3 py-1.5 rounded-xl border border-[#3d304f]">
            <span>📜</span>
            <span className="text-[#8c7a9e]">Codex:</span>
            <strong className="text-[#38bdf8]">{codexRollTickets}</strong>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1c1424] px-3 py-1.5 rounded-xl border border-[#4a3461]">
            <span className="text-[#8c7a9e]">Pulls:</span>
            <strong className="text-white">{totalPulls}</strong>
          </div>
        </div>
      </div>

      {/* Pack Selection Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PACKS.map((pack) => {
          const count = getTicketCount(pack.ticketType);
          const isSelected = activePack === pack.ticketType;

          return (
            <SharedButton
              key={pack.ticketType}
              className={`p-5 rounded-2xl border text-left transition-[border-color,box-shadow,transform] duration-75 flex flex-col justify-between space-y-3 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-2 shadow-gold-md scale-[1.01]'
                  : 'border-[#2b2238] bg-[#120f18] hover:border-[#4a3a5e] opacity-80'
              }`}
              style={{
                borderColor: isSelected ? pack.borderColor : undefined,
                background: isSelected
                  ? `linear-gradient(135deg, ${pack.bgGradient.replace('from-', '').replace('to-', '').split(' ')[0]} 0%, #120f18 100%)`
                  : undefined,
              }}
              onClick={() => {
                setActivePack(pack.ticketType);
                setRecentPull(null);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="text-3xl">{pack.icon}</div>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded border"
                  style={{
                    color: pack.color,
                    borderColor: `${pack.color}40`,
                    backgroundColor: `${pack.color}15`,
                  }}
                >
                  {pack.dimension}
                </span>
              </div>

              <div>
                <h3 className="font-cinzel text-base font-bold text-white">{pack.name}</h3>
                <p className="text-[11px] text-[#8c7a9e]">{pack.subtitle}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-[#8c7a9e]">Featured:</span>
                <span className="text-[11px] font-semibold" style={{ color: pack.color }}>
                  {pack.featuredRelic}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <span className="text-[#8c7a9e]">Available:</span>
                <span className="font-bold text-white flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5" style={{ color: pack.color }} />
                  {count} Ticket{count !== 1 ? 's' : ''}
                </span>
              </div>
            </SharedButton>
          );
        })}
      </div>

      {/* Active Pack Summoning Chamber */}
      <div
        className="p-8 rounded-3xl border-2 space-y-6 relative overflow-hidden shadow-2xl"
        style={{
          borderColor: selectedPack.borderColor,
          background: `linear-gradient(180deg, #1c1424 0%, #0f0d14 100%)`,
        }}
      >
        {/* Decorative background glow */}
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: selectedPack.color }}
        />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-2xl">{selectedPack.icon}</span>
              <h3 className="font-cinzel text-xl md:text-2xl font-black text-white">
                {selectedPack.name}
              </h3>
            </div>
            <p className="text-xs text-[#cbd5e1] max-w-xl leading-relaxed">
              Consumes 1 <strong style={{ color: selectedPack.color }}>{selectedPack.name.split(' ')[0]} Ticket</strong>. Guaranteed to contain a combat relic, a lore collectible, or multi-attribute IoT energy cores.
            </p>
          </div>

          {/* Summon Button */}
          <SharedButton
            disabled={pulling || ticketCount < 1}
            onClick={() => handlePull(selectedPack.ticketType)}
            className={`px-8 py-5 min-h-[64px] rounded-2xl font-cinzel font-black text-sm md:text-base flex items-center justify-center gap-3 transition-[transform,opacity,box-shadow] duration-75 cursor-pointer active:scale-[0.98] shadow-xl ${
              ticketCount >= 1 && !pulling
                ? 'text-black shadow-gold-lg hover:brightness-110'
                : 'bg-[#1a1424] text-[#685c78] border border-[#2b2238] cursor-not-allowed'
            }`}
            style={{
              backgroundColor: ticketCount >= 1 && !pulling ? selectedPack.color : undefined,
            }}
          >
            {pulling ? (
              <>
                <RotateCcw className="w-5 h-5 animate-spin" />
                <span>Channeling Leylines...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  {ticketCount >= 1
                    ? `Summon Card Pack (1 Ticket)`
                    : `Need 1 Ticket (Have 0)`}
                </span>
              </>
            )}
          </SharedButton>
        </div>

        {/* Pull Result Display Modal/Card */}
        <ModalContainer
          isOpen={!!recentPull}
          onClose={() => setRecentPull(null)}
          title="Summoned Item"
          className="mt-6 p-6 rounded-2xl bg-[#120f18] border-2 border-[#ffd86b] shadow-2xl animate-in fade-in zoom-in-95 duration-300"
        >
          {recentPull && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#2b2238] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{recentPull.iconEmoji}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: RARITY_TABLE[recentPull.rarity].bgColor,
                          color: RARITY_TABLE[recentPull.rarity].color,
                          borderColor: RARITY_TABLE[recentPull.rarity].borderColor,
                        }}
                      >
                        {RARITY_TABLE[recentPull.rarity].label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1c1424] text-[#8c7a9e] border border-[#2b2238]">
                        {recentPull.category.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-cinzel text-lg font-bold text-white mt-1">
                      {recentPull.name}
                    </h4>
                  </div>
                </div>

                <HazardBadge score={recentPull.score} rank={recentPull.rank} size="md" />
              </div>

              <p className="text-xs text-[#cbd5e1] leading-relaxed">
                {recentPull.description}
              </p>

              {/* Relic Stats & Buffs & Downsides */}
              {recentPull.category === 'relic' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                  {/* Stats */}
                  {recentPull.stats && recentPull.stats.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#171320] border border-[#2b2238] space-y-1.5">
                      <span className="text-[10px] text-[#8c7a9e] uppercase block flex items-center gap-1">
                        <Shield className="w-3 h-3 text-[#ffd86b]" /> Combat Stats
                      </span>
                      <div className="space-y-1">
                        {recentPull.stats.map((s) => (
                          <div key={s.name} className="flex justify-between">
                            <span className="text-[#9c93a8]">{s.name}:</span>
                            <strong className={s.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                              {s.value >= 0 ? `+${s.value}` : s.value}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buffs */}
                  {recentPull.buffs && recentPull.buffs.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#082015] border border-[#16a34a]/40 space-y-1.5">
                      <span className="text-[10px] text-emerald-400 uppercase block flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Tactical Buff
                      </span>
                      {recentPull.buffs.map((b) => (
                        <div key={b.name} className="text-[11px] text-[#cbd5e1]">
                          <strong className="text-emerald-300">{b.name}</strong>
                          <p className="text-[10px] text-[#9c93a8] leading-tight">{b.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Downsides */}
                  {recentPull.downsides && recentPull.downsides.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#3b080f]/40 border border-[#841822] space-y-1.5">
                      <span className="text-[10px] text-rose-400 uppercase block flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Double-Edged Curse
                      </span>
                      {recentPull.downsides.map((d) => (
                        <div key={d.name} className="text-[11px] text-[#cbd5e1]">
                          <strong className="text-rose-300">{d.name}</strong>
                          <p className="text-[10px] text-[#9c93a8] leading-tight">{d.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Energy Core details */}
              {recentPull.category === 'energy-core' && recentPull.energyCores && (
                <div className="p-4 rounded-xl bg-[#171320] border border-[#2b2238] flex items-center gap-4 text-xs font-mono">
                  <Zap className="w-6 h-6 text-[#ffd86b]" />
                  <div>
                    <span className="text-[#8c7a9e] block">Added to IoT Fuel Reserves:</span>
                    <div className="flex gap-3 mt-1">
                      {recentPull.energyCores.map((c) => (
                        <span key={c.attribute} className="font-bold text-[#ffd86b]">
                          +{c.amount} {c.attribute.toUpperCase()} Energy
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Collectible Lore */}
              {recentPull.category === 'collectible' && recentPull.loreText && (
                <div className="p-4 rounded-xl bg-[#171320] border border-[#2b2238] text-xs space-y-1 font-serif italic text-[#cbd5e1]">
                  <div className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-[#ffd86b] uppercase not-italic">
                    <BookOpen className="w-3.5 h-3.5" /> Series: {recentPull.seriesName || 'Curated'}
                  </div>
                  <p>"{recentPull.loreText}"</p>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <SharedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setRecentPull(null)}
                >
                  Send to Vault
                </SharedButton>
              </div>
            </div>
          )}
        </ModalContainer>

        {/* Drop Rate Transparency Info */}
        <div className="p-4 rounded-xl bg-[#0f0d14] border border-[#261d33] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-[#8c7a9e]">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#ffd86b]" />
            <span>Drop Probability Rates:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.values(RARITY_TABLE).map((r) => (
              <span key={r.rarity} style={{ color: r.color }}>
                {r.label}: <strong>{r.weight}%</strong>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GachaAltar;
