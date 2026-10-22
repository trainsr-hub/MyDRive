// path: src/apps/arc-jurassic/components/molecule/ClassFerocityMatrix/ClassFerocityMatrix.tsx
// Matrix displaying Total Menagerie Ferocity and Ferocity across all 10 Canonical Classes:
// Jurassic: Carnivore, Herbivore, Pterosaur, Amphibian
// Aquatic: Surface, Reef, Cave
// Cenozoic: Snow, Savannah, Cavern

import React, { useMemo, useState } from 'react';
import { Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { calcDinoActiveStats } from '../../../core/evolutionEngine';

export interface ClassFerocityData {
  id: string;
  name: string;
  biome: 'jurassic' | 'aquatic' | 'cenozoic';
  biomeLabel: string;
  iconUrl: string;
  themeColor: string;
  borderClass: string;
  bgGradient: string;
  textClass: string;
  activeFerocity: number;
  potentialFerocity: number;
  ownedCount: number;
  totalCount: number;
  contributionPercent: number;
  progressPercent: number;
}

export const CANONICAL_CLASSES: {
  id: string;
  name: string;
  biome: 'jurassic' | 'aquatic' | 'cenozoic';
  biomeLabel: string;
  themeColor: string;
  borderClass: string;
  bgGradient: string;
  textClass: string;
}[] = [
  // Jurassic Biome (4 Classes)
  {
    id: 'carnivore',
    name: 'Carnivore',
    biome: 'jurassic',
    biomeLabel: 'Jurassic',
    themeColor: '#ef4444',
    borderClass: 'border-red-500/40 hover:border-red-400',
    bgGradient: 'from-red-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-red-400',
  },
  {
    id: 'herbivore',
    name: 'Herbivore',
    biome: 'jurassic',
    biomeLabel: 'Jurassic',
    themeColor: '#10b981',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    bgGradient: 'from-emerald-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-emerald-400',
  },
  {
    id: 'pterosaur',
    name: 'Pterosaur',
    biome: 'jurassic',
    biomeLabel: 'Jurassic',
    themeColor: '#f59e0b',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    bgGradient: 'from-amber-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-amber-400',
  },
  {
    id: 'amphibian',
    name: 'Amphibian',
    biome: 'jurassic',
    biomeLabel: 'Jurassic',
    themeColor: '#06b6d4',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    bgGradient: 'from-cyan-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-cyan-400',
  },

  // Aquatic Biome (3 Classes)
  {
    id: 'surface',
    name: 'Surface',
    biome: 'aquatic',
    biomeLabel: 'Aquatic',
    themeColor: '#0ea5e9',
    borderClass: 'border-sky-500/40 hover:border-sky-400',
    bgGradient: 'from-sky-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-sky-400',
  },
  {
    id: 'reef',
    name: 'Reef',
    biome: 'aquatic',
    biomeLabel: 'Aquatic',
    themeColor: '#a855f7',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    bgGradient: 'from-purple-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-purple-400',
  },
  {
    id: 'cave',
    name: 'Cave',
    biome: 'aquatic',
    biomeLabel: 'Aquatic',
    themeColor: '#6366f1',
    borderClass: 'border-indigo-500/40 hover:border-indigo-400',
    bgGradient: 'from-indigo-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-indigo-400',
  },

  // Cenozoic Biome (3 Classes)
  {
    id: 'snow',
    name: 'Snow',
    biome: 'cenozoic',
    biomeLabel: 'Cenozoic',
    themeColor: '#2dd4bf',
    borderClass: 'border-teal-400/40 hover:border-teal-300',
    bgGradient: 'from-teal-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-teal-300',
  },
  {
    id: 'savannah',
    name: 'Savannah',
    biome: 'cenozoic',
    biomeLabel: 'Cenozoic',
    themeColor: '#f97316',
    borderClass: 'border-orange-500/40 hover:border-orange-400',
    bgGradient: 'from-orange-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-orange-400',
  },
  {
    id: 'cavern',
    name: 'Cavern',
    biome: 'cenozoic',
    biomeLabel: 'Cenozoic',
    themeColor: '#ca8a04',
    borderClass: 'border-yellow-600/40 hover:border-yellow-500',
    bgGradient: 'from-yellow-950/40 via-[#181126] to-[#0e0a16]',
    textClass: 'text-yellow-400',
  },
];

interface ClassFerocityMatrixProps {
  objects: any[];
  userProgress: any;
  lookup?: any;
  selectedClasses?: string[];
  onToggleClassFilter?: (className: string) => void;
  defaultExpanded?: boolean;
}

export const ClassFerocityMatrix: React.FC<ClassFerocityMatrixProps> = ({
  objects,
  userProgress,
  lookup,
  selectedClasses = [],
  onToggleClassFilter,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Compute Active Ferocity, Codex Potential Ferocity, and Class Breakdown
  const stats = useMemo(() => {
    const owned = userProgress?.owned_dinos || {};

    let totalActiveFerocity = 0;
    let totalPotentialFerocity = 0;
    let totalOwnedSpecies = 0;

    // Biome Ferocity Accumulators
    const biomeFerocity: Record<'jurassic' | 'aquatic' | 'cenozoic', number> = {
      jurassic: 0,
      aquatic: 0,
      cenozoic: 0,
    };

    // Class Accumulators
    const buckets: Record<
      string,
      {
        activeFerocity: number;
        potentialFerocity: number;
        ownedCount: number;
        totalCount: number;
      }
    > = {};

    for (const c of CANONICAL_CLASSES) {
      buckets[c.id] = {
        activeFerocity: 0,
        potentialFerocity: 0,
        ownedCount: 0,
        totalCount: 0,
      };
    }

    for (const item of objects) {
      let rawClass = (item.class || 'unknown').toLowerCase();
      // Map aquatic hybrid variants
      if (rawClass === 'carnivore-surface') rawClass = 'surface';

      if (!buckets[rawClass]) continue;

      const uuid = item.uuid || item.id || item.name;
      const userDino = owned[uuid];
      const number = userDino ? Number(userDino.number) || 0 : 0;
      const activeStats = calcDinoActiveStats(item, number);

      // Max potential ferocity
      const evos = Array.isArray(item.evolutions) ? item.evolutions : [];
      const maxFero = Number(
        item.max_ferocity ||
        (evos.length > 0 ? evos[evos.length - 1]?.ferocity : 0) ||
        600
      );

      buckets[rawClass].totalCount += 1;
      buckets[rawClass].potentialFerocity += maxFero;
      totalPotentialFerocity += maxFero;

      if (activeStats.isUnlocked) {
        const fero = Number(activeStats.ferocity) || 0;
        buckets[rawClass].activeFerocity += fero;
        buckets[rawClass].ownedCount += 1;
        totalActiveFerocity += fero;
        totalOwnedSpecies += 1;

        const cDef = CANONICAL_CLASSES.find((c) => c.id === rawClass);
        if (cDef) {
          biomeFerocity[cDef.biome] += fero;
        }
      }
    }

    // Compile into sorted view items
    const classDataList: ClassFerocityData[] = CANONICAL_CLASSES.map((c) => {
      const b = buckets[c.id] || {
        activeFerocity: 0,
        potentialFerocity: 1,
        ownedCount: 0,
        totalCount: 0,
      };

      const iconUrl =
        lookup?.class_icons?.[c.id] ||
        `https://cdn.paleo.gg/games/jwtg/images/class/${c.id}.png`;

      const contributionPercent =
        totalActiveFerocity > 0 ? (b.activeFerocity / totalActiveFerocity) * 100 : 0;

      const progressPercent =
        b.potentialFerocity > 0 ? (b.activeFerocity / b.potentialFerocity) * 100 : 0;

      return {
        ...c,
        iconUrl,
        activeFerocity: b.activeFerocity,
        potentialFerocity: b.potentialFerocity,
        ownedCount: b.ownedCount,
        totalCount: b.totalCount,
        contributionPercent,
        progressPercent,
      };
    });

    return {
      totalActiveFerocity,
      totalPotentialFerocity,
      totalOwnedSpecies,
      totalSpecies: objects.length,
      biomeFerocity,
      classDataList,
    };
  }, [objects, userProgress, lookup]);

  return (
    <div className="w-full bg-[#120d1c]/90 backdrop-blur-md border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.65)] space-y-5 transition-all">
      {/* ── TOP GRAND FEROCITY HEADLINE & BIOME TELEMETRY ── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/20 to-red-500/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.35)] shrink-0">
            <Flame className="w-7 h-7 text-amber-300 fill-amber-400/20 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-cinzel font-black tracking-widest uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                MENAGERIE POWER MATRIX
              </span>
              <span className="text-xs font-mono text-zinc-400">
                10-Class Accumulation Hub
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <h1 className="font-cinzel-dec text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ffd86b] to-amber-400 tracking-wide">
                {stats.totalActiveFerocity.toLocaleString()}{' '}
                <span className="text-sm sm:text-base font-cinzel text-amber-400/90 font-bold uppercase tracking-widest">
                  Total Ferocity
                </span>
              </h1>
              <span className="text-xs font-mono text-[#8c7a9e]">
                / {stats.totalPotentialFerocity.toLocaleString()} Max Potential
              </span>
            </div>
          </div>
        </div>

        {/* Biome Sub-totals & Collapse Toggle */}
        <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            {/* Jurassic */}
            <div
              className="px-3 py-1.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 shadow-sm"
              title="Total Active Ferocity in Jurassic Biome (Carnivore, Herbivore, Pterosaur, Amphibian)"
            >
              <span className="text-[10px] text-red-400 font-cinzel font-bold block">JURASSIC</span>
              <strong className="text-white font-bold">{stats.biomeFerocity.jurassic.toLocaleString()}</strong>
            </div>

            {/* Aquatic */}
            <div
              className="px-3 py-1.5 rounded-xl bg-sky-950/40 border border-sky-500/40 text-sky-300 shadow-sm"
              title="Total Active Ferocity in Aquatic Biome (Surface, Reef, Cave)"
            >
              <span className="text-[10px] text-sky-400 font-cinzel font-bold block">AQUATIC</span>
              <strong className="text-white font-bold">{stats.biomeFerocity.aquatic.toLocaleString()}</strong>
            </div>

            {/* Cenozoic */}
            <div
              className="px-3 py-1.5 rounded-xl bg-teal-950/40 border border-teal-500/40 text-teal-300 shadow-sm"
              title="Total Active Ferocity in Cenozoic Biome (Snow, Savannah, Cavern)"
            >
              <span className="text-[10px] text-teal-400 font-cinzel font-bold block">CENOZOIC</span>
              <strong className="text-white font-bold">{stats.biomeFerocity.cenozoic.toLocaleString()}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1d152a] hover:bg-[#281d3a] border border-[#3f2f55] text-xs font-cinzel font-bold text-amber-300 transition cursor-pointer shadow-sm"
          >
            <span>{isExpanded ? 'Hide Classes' : 'View 10 Classes'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── 10-CLASS FEROCITY ACCUMULATION GRID ── */}
      {isExpanded && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#8c7a9e] px-1">
            <span>Click any class card to filter catalog below</span>
            <span>
              Hatched Species:{' '}
              <strong className="text-emerald-400">{stats.totalOwnedSpecies}</strong> / {stats.totalSpecies}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {stats.classDataList.map((c) => {
              const isSelected = selectedClasses.includes(c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => onToggleClassFilter && onToggleClassFilter(c.id)}
                  title={`Click to filter: ${c.name} (${c.biomeLabel} Biome) • ${c.activeFerocity.toLocaleString()} Active Ferocity`}
                  className={`relative rounded-2xl p-3 border transition-all duration-300 select-none cursor-pointer flex flex-col justify-between overflow-hidden group shadow-md ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#2e1d0d] via-[#1c1328] to-[#110a1a] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.35)] scale-[1.02] z-10'
                      : `bg-gradient-to-b ${c.bgGradient} ${c.borderClass} hover:scale-[1.01] hover:shadow-lg`
                  }`}
                >
                  {/* Subtle Glow Accent in corner */}
                  <div
                    className="absolute -right-4 -top-4 w-12 h-12 rounded-full blur-xl pointer-events-none opacity-40 group-hover:opacity-80 transition"
                    style={{ backgroundColor: c.themeColor }}
                  />

                  {/* Header: Class Icon + Name + Biome Tag */}
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={c.iconUrl}
                          alt={c.name}
                          className="w-5 h-5 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                        />
                        <span className="font-cinzel text-xs font-bold text-white tracking-wide uppercase">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-black/40 text-zinc-400 border border-white/10 uppercase">
                        {c.biomeLabel.slice(0, 3)}
                      </span>
                    </div>

                    {/* Ferocity Readout */}
                    <div className="mt-1">
                      <div className={`font-mono text-base sm:text-lg font-black tracking-tight ${c.textClass}`}>
                        {c.activeFerocity.toLocaleString()}
                        <span className="text-[10px] text-zinc-400 font-normal ml-1">FERO</span>
                      </div>
                      <div className="text-[10.5px] font-mono text-[#8c7a9e]">
                        {c.ownedCount} / {c.totalCount} species
                      </div>
                    </div>
                  </div>

                  {/* Footer: Progress bar to class potential */}
                  <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1">
                    <div className="flex items-center justify-between text-[9.5px] font-mono text-[#78698a]">
                      <span>Power: {c.contributionPercent.toFixed(1)}%</span>
                      <span>{c.progressPercent.toFixed(0)}% Cap</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0a0612] rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(c.ownedCount > 0 ? 4 : 0, c.progressPercent))}%`,
                          backgroundColor: c.themeColor,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
