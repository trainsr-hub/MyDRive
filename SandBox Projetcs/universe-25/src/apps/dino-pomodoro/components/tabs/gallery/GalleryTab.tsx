// path: src/apps/dino-pomodoro/components/tabs/gallery/GalleryTab.tsx
// Tab 2 Gallery: Master Prehistoric Roster with authentic Arc Jurassic Hazard Tier Catalog,
// Interactive DinoDetails slide-over drawer, and dual Hazard Roster / Card Showcase modes.

import React, { useState, useMemo } from 'react';
import { useDinoPomodoroStore } from '../../../store/useDinoPomodoroStore';
import { AllDinosTab } from '../../../../arc-jurassic/components/tabs/alldinos/AllDinosTab';
import { DinoDetailsTab } from '../../../../arc-jurassic/components/tabs/details/DinoDetailsTab';
import { DinoCard } from '../../molecule/DinoCard';
import { calcDinoActiveStats } from '../../../../arc-jurassic/core/evolutionEngine';
import { ClassFerocityMatrix } from '../../../../arc-jurassic/components/molecule/ClassFerocityMatrix/ClassFerocityMatrix';
import { Layers, Sparkles, Search, Flame, Shield, Swords, Info } from 'lucide-react';

interface GalleryTabProps {
  objects: any[];
  lookup?: any;
}

export const GalleryTab: React.FC<GalleryTabProps> = ({ objects, lookup }) => {
  const userProgress = useDinoPomodoroStore((s) => s.userProgress);

  // View mode: 'catalog' (Hazard Tier Catalog - default) or 'showcase' (Full Dino Cards)
  const [viewMode, setViewMode] = useState<'catalog' | 'showcase'>('catalog');

  // Slide-over drawer target UUID for specimen inspection
  const [selectedDinoUuid, setSelectedDinoUuid] = useState<string | null>(null);

  // Showcase Filter / Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClasses, setFilterClasses] = useState<string[]>([]);
  const [filterRarities, setFilterRarities] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unlocked' | 'locked'>('unlocked');
  const [sortBy, setSortBy] = useState<string>('ferocity');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Discover all unique classes and rarities
  const { uniqueClasses, uniqueRarities } = useMemo(() => {
    const classes = new Set<string>();
    const rarities = new Set<string>();

    for (const item of objects) {
      if (item.class) classes.add(item.class.toLowerCase());
      if (item.rarity) rarities.add(item.rarity.toLowerCase());
    }

    return {
      uniqueClasses: Array.from(classes).sort(),
      uniqueRarities: Array.from(rarities).sort(),
    };
  }, [objects]);

  // Compute active stats & catalog for Showcase mode
  const baseCatalog = useMemo(() => {
    return objects.map((item) => {
      const uuid = item.uuid || item.id || item.name;
      const userDino = userProgress?.owned_dinos?.[uuid];
      const number = userDino ? Number(userDino.number) || 0 : 0;

      const stats = calcDinoActiveStats(item, number);
      const { isUnlocked, rank, level, damage, health, ferocity, image_url: evoImg, maxCapacity } = stats;

      const hatchTime = Number(item.hatch_time_mins) || 0;
      const sellPrice = (Number(item.sell_price_dna) || 0) * 2;
      const efficiency = sellPrice > 0 && hatchTime > 0 ? ferocity / (sellPrice * hatchTime) : 0;
      const releaseTime = new Date(item.release_date || '1970-01-01').getTime();

      return {
        raw: item,
        uuid,
        isUnlocked,
        number,
        rank,
        level,
        maximumNumber: maxCapacity,
        ferocity,
        damage,
        health,
        hatchTime,
        sellPrice,
        efficiency,
        releaseTime,
        evoImg: evoImg || item.image_url,
        rarity: (item.rarity || '').toLowerCase(),
        class: (item.class || '').toLowerCase(),
        name: item.name || '',
      };
    });
  }, [objects, userProgress]);

  // Filter & sort catalog for Showcase mode
  const sortedList = useMemo(() => {
    let mapped = [...baseCatalog];

    if (filterStatus === 'unlocked') {
      mapped = mapped.filter((d) => d.isUnlocked);
    } else if (filterStatus === 'locked') {
      mapped = mapped.filter((d) => !d.isUnlocked);
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      mapped = mapped.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          d.class.includes(term) ||
          d.rarity.includes(term)
      );
    }

    if (filterClasses.length > 0) {
      mapped = mapped.filter((d) => filterClasses.includes(d.class));
    }

    if (filterRarities.length > 0) {
      mapped = mapped.filter((d) => filterRarities.includes(d.rarity));
    }

    mapped.sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;

      const valA = (a as any)[sortBy] || 0;
      const valB = (b as any)[sortBy] || 0;
      const modifier = sortOrder === 'asc' ? 1 : -1;

      if (valA !== valB) {
        return (valA - valB) * modifier;
      }

      return b.releaseTime - a.releaseTime;
    });

    return mapped;
  }, [baseCatalog, searchTerm, filterClasses, filterRarities, filterStatus, sortBy, sortOrder]);

  const toggleFilter = (
    item: string,
    currentList: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (currentList.includes(item)) {
      setter(currentList.filter((i) => i !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  const unlockedCount = useMemo(() => {
    return baseCatalog.filter((d) => d.isUnlocked).length;
  }, [baseCatalog]);

  const handleToggleClassFilter = (className: string) => {
    toggleFilter(className, filterClasses, setFilterClasses);
    if (viewMode === 'catalog') {
      setViewMode('showcase');
    }
  };

  return (
    <div className="w-full space-y-6 relative">
      {/* ── TOP CONTROL & VIEW SWITCHER BAR ── */}
      <div className="bg-gradient-to-r from-[#181126]/95 via-[#130d20]/95 to-[#1c122c]/95 border border-amber-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        {/* Gallery Title & Population Telemetry */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.25)]">
            {viewMode === 'catalog' ? (
              <Layers className="w-6 h-6 text-amber-300" />
            ) : (
              <Sparkles className="w-6 h-6 text-amber-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cinzel text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                Prehistoric Roster & Genetic Vault
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                {viewMode === 'catalog' ? 'HAZARD TIERS' : 'CARD SHOWCASE'}
              </span>
            </div>
            <p className="text-xs font-mono text-[#a89bb8] mt-0.5">
              Hatched: <span className="text-emerald-400 font-bold">{unlockedCount}</span> / {baseCatalog.length} Species ({((unlockedCount / Math.max(1, baseCatalog.length)) * 100).toFixed(1)}%) • Click any specimen to inspect
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switcher */}
        <div className="flex items-center bg-[#0c0814]/90 rounded-xl p-1 border border-white/15 text-xs font-cinzel">
          <button
            type="button"
            onClick={() => setViewMode('catalog')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'catalog'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Hazard Catalog</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('showcase')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              viewMode === 'showcase'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Card Showcase</span>
          </button>
        </div>
      </div>

      {/* ── 10-CLASS FEROCITY MATRIX & TELEMETRY HUB ── */}
      <ClassFerocityMatrix
        objects={objects}
        userProgress={userProgress}
        lookup={lookup}
        selectedClasses={filterClasses}
        onToggleClassFilter={handleToggleClassFilter}
      />

      {/* ── MODE 1: HAZARD TIER CATALOG (AUTHENTIC ARC JURASSIC ARCHITECTURE) ── */}
      {viewMode === 'catalog' && (
        <div className="w-full">
          <AllDinosTab
            objects={objects}
            lookup={lookup}
            userProgress={userProgress}
            onSelectDino={(uuid) => setSelectedDinoUuid(uuid)}
          />
        </div>
      )}

      {/* ── MODE 2: CARD SHOWCASE (SNUG, AMBIENT ILLUMINATION, ZERO DEAD-SPACE) ── */}
      {viewMode === 'showcase' && (
        <div className="w-full space-y-6">
          {/* Filter & Sort Controls for Showcase */}
          <div className="p-4 bg-gradient-to-r from-[#160f24]/90 via-[#100b1a]/95 to-[#160f24]/90 border border-white/10 rounded-2xl space-y-3 shadow-md">
            {/* Search */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-cinzel font-bold text-gray-400 uppercase min-w-[50px]">Search:</span>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, class, rarity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1b122b] text-white border border-white/15 pl-9 pr-3 py-1.5 rounded-xl text-xs outline-none focus:border-amber-400"
                />
              </div>

              {/* Status filter buttons */}
              <div className="flex items-center bg-[#130d20] rounded-xl p-1 border border-[#271c36] text-xs font-cinzel">
                {(['all', 'unlocked', 'locked'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                      filterStatus === status
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-[#8c7a9e] hover:text-white'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Class filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-cinzel font-bold text-gray-400 uppercase min-w-[50px]">Class:</span>
              {uniqueClasses.map((cls) => (
                <button
                  key={cls}
                  type="button"
                  onClick={() => toggleFilter(cls, filterClasses, setFilterClasses)}
                  className={`px-3 py-1 text-xs rounded-full font-bold capitalize transition border cursor-pointer ${
                    filterClasses.includes(cls)
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

            {/* Rarity filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-cinzel font-bold text-gray-400 uppercase min-w-[50px]">Rarity:</span>
              {uniqueRarities.map((rarity) => (
                <button
                  key={rarity}
                  type="button"
                  onClick={() => toggleFilter(rarity, filterRarities, setFilterRarities)}
                  className={`px-3 py-1 text-xs rounded-full font-bold capitalize transition border cursor-pointer ${
                    filterRarities.includes(rarity)
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {rarity}
                </button>
              ))}
            </div>

            {/* Sorting options */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10 flex-wrap">
              <span className="text-xs font-cinzel font-bold text-gray-400 uppercase min-w-[50px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#1b122b] text-white border border-white/15 px-3 py-1.5 rounded-xl text-xs outline-none cursor-pointer focus:border-amber-400"
              >
                <option value="ferocity">Ferocity</option>
                <option value="damage">Damage</option>
                <option value="health">Health</option>
                <option value="hatchTime">Hatching Time</option>
                <option value="sellPrice">Sell Price (DNA)</option>
                <option value="efficiency">Efficiency Index (Fero / Price × Time)</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-b from-gray-700 to-gray-800 border border-gray-500 text-white text-xs font-cinzel font-bold cursor-pointer transition active:scale-95"
              >
                {sortOrder === 'desc' ? '⬇ DESCENDING' : '⬆ ASCENDING'}
              </button>

              <span className="text-[11px] font-mono text-[#a89bb8] ml-auto">
                Showing {sortedList.length} specimens
              </span>
            </div>
          </div>

          {/* Cards Showcase Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
            {sortedList.map((dino) => (
              <div
                key={dino.uuid}
                onClick={() => setSelectedDinoUuid(dino.uuid)}
                className="flex flex-col items-center bg-gradient-to-b from-white/[0.07] via-white/[0.02] to-black/60 border border-white/10 hover:border-amber-400/60 rounded-2xl p-2.5 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:-translate-y-1 cursor-pointer group w-full max-w-[230px]"
              >
                {/* Scaled Dino Card */}
                <div className="w-full flex justify-center overflow-hidden rounded">
                  <DinoCard
                    dino={dino.raw}
                    isUnlocked={dino.isUnlocked}
                    scale={0.82}
                  />
                </div>

                {/* Footer Telemetry Strip */}
                <div className="w-full mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1 text-amber-400 font-bold" title="Ferocity">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>{dino.ferocity.toLocaleString()}</span>
                  </div>

                  {dino.isUnlocked ? (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-sky-400 flex items-center gap-0.5" title="Health">
                        <Shield className="w-3 h-3" />
                        <span>{Math.round(dino.health)}</span>
                      </span>
                      <span className="text-red-400 flex items-center gap-0.5" title="Damage">
                        <Swords className="w-3 h-3" />
                        <span>{Math.round(dino.damage)}</span>
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500 font-mono font-bold flex items-center gap-1">
                      <Info className="w-3 h-3 text-gray-500" />
                      INSPECT
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── INTERACTIVE DINO DETAILS SLIDE-OVER INSPECTOR DRAWER ── */}
      {selectedDinoUuid && (
        <DinoDetailsTab
          uuid={selectedDinoUuid}
          objects={objects}
          lookup={lookup}
          userProgress={userProgress}
          onBack={() => setSelectedDinoUuid(null)}
        />
      )}
    </div>
  );
};
