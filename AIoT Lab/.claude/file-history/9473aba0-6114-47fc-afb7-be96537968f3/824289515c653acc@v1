import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '../../store/useGlobalStore';
import { GameLayout } from '../../components/GameLayout';
import { Users, Sparkles, List, Sliders, Dna } from 'lucide-react';

// Import styles for Black Hole physics and Gacha UI
import './styles/juraGlobal.css';

// Import modular tab views (1 folder per tab architecture)
import { GachaTab } from './components/tabs/gacha/GachaTab';
import { DinoDetailsTab } from './components/tabs/details/DinoDetailsTab';
import { AllDinosTab } from './components/tabs/alldinos/AllDinosTab';
import { SettingsTab } from './components/tabs/settings/SettingsTab';

import { calcUserTop3Ferocity, calcUserTotalFerocity } from './core/calcGachaPool';
import { rutGonTime } from './core/rutGonTime';
import {
  fetchArcResources,
  persistArcResources,
  fetchArcProgress,
  persistArcProgress,
  resetArcProgress
} from '../../core/syncEngine';
import type { DueDinoData } from './components/tabs/gacha/types';

// Import raw game data directly for optimal Vite bundling and zero runtime fetch errors
import dinoRawData from './data/dino.json';
import lookupRawData from './data/lookup.json';
import resourceRawData from './data/resource.json';
import userProgressRawData from './data/user_progress.json';

// Complete data structures for Universe 25 integration
interface DinoObject {
  uuid: string;
  name: string;
  image_url: string;
  region: string;
  rarity: string;
  hybrid_type: string;
  class: string;
  hatch_time_mins: number;
  buy_price_dna: number;
  sell_price_dna: number;
  release_date: string;
  facts: string[];
  ingredients: any[];
  evolutions: {
    level: number;
    health: number;
    damage: number;
    image_url: string;
    portrait_frame: string;
  }[];
}

interface LookupData {
  class_icons: Record<string, string>;
  card_backgrounds: Record<string, string>;
  hybrid_types: Record<string, string>;
  region: Record<string, string>;
  portrait_frames: Record<string, string>;
  stats: Record<string, string>;
}

interface UserProgress {
  owned_dinos: Record<string, { number: number; rank: number; ferocity?: number }>;
}

export interface ResourceData {
  jurassic_time?: { amount: number; icon?: string; name?: string };
  dna?: { amount: number; icon?: string; name?: string };
  red_orbs?: { amount: number; icon?: string; name?: string };
  [key: string]: any;
}

const LOCAL_STORAGE_CHEAT_KEY = 'arc_jurassic_free_buy_cheat_v1';
const LOCAL_STORAGE_DUE_DINO_KEY = 'arc_jurassic_due_dino_v1';

const normalizeResources = (raw: any): ResourceData => {
  return {
    jurassic_time: {
      amount: Number(raw?.jurassic_time?.amount ?? raw?.elemental_time?.golden?.amount ?? 14400),
      icon: raw?.jurassic_time?.icon || 'https://cdn.paleo.gg/games/jwtg/images/stats/speed.png',
      name: 'Jurassic Time'
    },
    dna: {
      amount: Number(raw?.dna?.amount ?? raw?.dna ?? raw?.elemental_time?.jurassic?.amount ?? 50000),
      icon: raw?.dna?.icon || 'https://cdn.paleo.gg/games/jwtg/images/resource/dna.png',
      name: 'DNA'
    },
    red_orbs: {
      amount: Number(raw?.red_orbs?.amount ?? raw?.orbs?.red_orb?.amount ?? 50),
      icon: raw?.red_orbs?.icon || 'https://cdn.paleo.gg/games/jwtg/images/hybrid-type/super-hybrid.png',
      name: 'Red Orbs'
    }
  };
};

export const ArcJurassic: React.FC = () => {
  const setActiveApp = useGlobalStore((s) => s.setActiveApp);

  // State for game data
  const [objects, setObjects] = useState<DinoObject[]>([]);
  const [lookup, setLookup] = useState<LookupData>({
    class_icons: {},
    card_backgrounds: {},
    hybrid_types: {},
    region: {},
    portrait_frames: {},
    stats: {},
  });
  const [userProgress, setUserProgress] = useState<UserProgress>({ owned_dinos: {} });
  const [myResources, setMyResources] = useState<ResourceData>({
    jurassic_time: { amount: 14400 },
    dna: { amount: 50000 },
    red_orbs: { amount: 50 }
  });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gacha' | 'details' | 'alldinos' | 'settings'>('gacha');
  const [rosterTargetUuid, setRosterTargetUuid] = useState<string | null>(null);

  // Due Dino persistence: lightweight frontend state (remembers unbought roll)
  const [dueDino, setDueDino] = useState<DueDinoData | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_DUE_DINO_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [top3Ferocity, setTop3Ferocity] = useState(0);
  const [totalArmyFerocity, setTotalArmyFerocity] = useState(0);
  const [isFreeBuyCheat, setIsFreeBuyCheat] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_CHEAT_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Load game data from authoritative backend SQLite tiers with bundled fallback
  useEffect(() => {
    const initGameData = async () => {
      try {
        // 1. Process Dino Objects
        const dinoObjects: DinoObject[] = Object.entries(dinoRawData).map(([uuid, dino]) => ({
          uuid,
          ...(dino as Omit<DinoObject, 'uuid'>)
        }));

        // 2. Authoritative Backend SQLite Progress Hydration
        let initialProgress: UserProgress = userProgressRawData as UserProgress;
        try {
          const backendProgress = await fetchArcProgress();
          if (backendProgress && Object.keys(backendProgress.owned_dinos || {}).length > 0) {
            initialProgress = backendProgress as UserProgress;
          } else {
            await persistArcProgress(initialProgress as any);
          }
        } catch (err) {
          console.warn('[ARC Jurassic] Backend SQLite progress hydration notice:', err);
        }

        // 3. Authoritative Backend SQLite Resources Hydration
        let initialResources: ResourceData = normalizeResources(resourceRawData);
        try {
          const backendResources = await fetchArcResources();
          if (backendResources && Object.keys(backendResources).length > 0) {
            initialResources = normalizeResources(backendResources);
          } else {
            await persistArcResources(initialResources as any);
          }
        } catch (err) {
          console.warn('[ARC Jurassic] Backend SQLite resources hydration notice:', err);
        }

        setObjects(dinoObjects);
        setLookup(lookupRawData as unknown as LookupData);
        setUserProgress(initialProgress);
        setMyResources(initialResources);

        // 4. Calculate top 3 ferocity stats & excluded IDs
        const calculatedExcludedIds: string[] = [];

        for (const [uuid, data] of Object.entries(initialProgress.owned_dinos || {})) {
          const dino = dinoObjects.find((d: DinoObject) => (d.uuid || (d as any).id || (d as any).name) === uuid);
          if (dino) {
            const limit = Number((dino as any).maximum_number || Math.pow(2, Math.max(0, (dino.evolutions?.length || 1) - 1)));
            if ((data as any).number >= limit) {
              calculatedExcludedIds.push(uuid);
            }
          }
        }

        const top3 = calcUserTop3Ferocity(dinoObjects, initialProgress);
        const totalFero = calcUserTotalFerocity(dinoObjects, initialProgress);

        setExcludedIds(calculatedExcludedIds);
        setTop3Ferocity(top3);
        setTotalArmyFerocity(totalFero);
        setLoading(false);
      } catch (error) {
        console.error("Error initializing ARC Jurassic game data:", error);
        setLoading(false);
      }
    };

    initGameData();
  }, []);

  const handleUpdateProgress = async (prog: UserProgress) => {
    setUserProgress(prog);
    const totalFero = calcUserTotalFerocity(objects, prog);
    const top3 = calcUserTop3Ferocity(objects, prog);
    setTotalArmyFerocity(totalFero);
    setTop3Ferocity(top3);

    try {
      await persistArcProgress(prog as any);
    } catch (e) {
      console.warn('Failed to save progress to SQLite backend:', e);
    }
  };

  const handleResetCollection = async () => {
    setUserProgress({ owned_dinos: {} });
    setTotalArmyFerocity(0);
    setTop3Ferocity(0);
    try {
      await resetArcProgress();
    } catch (e) {
      console.warn('Failed to reset progress in SQLite backend:', e);
    }
  };

  const handleUpdateResources = async (res: ResourceData) => {
    const normalized = normalizeResources(res);
    setMyResources(normalized);
    try {
      await persistArcResources(normalized as any);
    } catch (e) {
      console.warn('Failed to save resources to SQLite backend:', e);
    }
  };

  const handleSetDueDino = (data: DueDinoData | null) => {
    setDueDino(data);
    try {
      if (data) {
        localStorage.setItem(LOCAL_STORAGE_DUE_DINO_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_DUE_DINO_KEY);
      }
    } catch (e) {
      console.warn('Failed to save due dino to localStorage:', e);
    }
  };

  const handleToggleFreeBuyCheat = (enabled: boolean) => {
    setIsFreeBuyCheat(enabled);
    try {
      localStorage.setItem(LOCAL_STORAGE_CHEAT_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to save cheat state to localStorage:', e);
    }
  };

  // Handle navigation back to master game
  const handleBackToHub = () => {
    setActiveApp('golden-hour');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="text-4xl mb-6">⏳ Loading ARC Jurassic...</div>
        <div className="animate-spin rounded-full border-4 border-b-4 border-amber-500 w-16 h-16"></div>
      </div>
    );
  }

  return (
    <GameLayout
      title="ARC Jurassic"
      gameTitleIcon={<Dna className="w-5 h-5 text-[#ffd86b]" />}
      gameTitleBadge="GENETIC VAULT"
      gameTitleSubtitle="Prehistoric Gacha Nexus • DNA Synthesis Lab"
      showBackButton={true}
      backButton="Golden Hour"
      onBackClick={handleBackToHub}
      headerRight={
        <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
          {/* Total Army Ferocity Indicator */}
          <div className="flex items-center gap-2 bg-[#161208] px-3.5 py-1.5 rounded-xl border border-amber-500/50 text-xs font-mono font-bold text-amber-300 shadow-[0_0_12px_rgba(255,215,0,0.18)]">
            <img
              src="https://cdn.paleo.gg/games/jwtg/images/stats/ferocity.png"
              className="w-4 h-4 object-contain"
              alt="Ferocity"
            />
            <span>{totalArmyFerocity.toLocaleString()} Total Fero</span>
          </div>

          {/* Dedicated Resource 1: Jurassic Time */}
          <div className="flex items-center gap-2 bg-[#14101c] px-3.5 py-1.5 rounded-xl border border-[#2e2638] text-xs font-mono font-bold text-sky-400 shadow-sm">
            <img src={myResources.jurassic_time?.icon} className="w-4 h-4 object-contain" alt="Jurassic Time" />
            <span>{rutGonTime(myResources.jurassic_time?.amount || 0, "seconds")}</span>
          </div>

          {/* Dedicated Resource 2: DNA */}
          <div className="flex items-center gap-2 bg-[#14101c] px-3.5 py-1.5 rounded-xl border border-[#2e2638] text-xs font-mono font-bold text-[#ffd86b] shadow-sm">
            <img src={myResources.dna?.icon} className="w-4 h-4 object-contain" alt="DNA" />
            <span>{(myResources.dna?.amount || 0).toLocaleString()} DNA</span>
          </div>

          {/* Dedicated Resource 3: Red Orbs */}
          <div className="flex items-center gap-2 bg-[#1c1424] px-3.5 py-1.5 rounded-xl border border-rose-900/60 text-xs font-mono font-bold text-rose-400 shadow-sm">
            <img src={myResources.red_orbs?.icon} className="w-4 h-4 object-contain" alt="Red Orbs" />
            <span>{myResources.red_orbs?.amount || 0} Orbs</span>
          </div>
        </div>
      }
      tabs={[
        { id: 'gacha', label: 'Gacha', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'details', label: 'Dino Details', icon: <Users className="w-4 h-4" /> },
        { id: 'alldinos', label: 'List of Dinos', icon: <List className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
      ]}
      activeTab={view}
      onTabChange={(id) => setView(id as 'gacha' | 'details' | 'alldinos' | 'settings')}
    >
      {/* TAB 1: GACHA */}
      {view === 'gacha' && (
        <GachaTab
          objects={objects}
          lookup={lookup}
          userFerocity={Math.max(top3Ferocity, 200)}
          excludedIds={excludedIds}
          userProgress={userProgress}
          myResources={myResources}
          isFreeBuyCheat={isFreeBuyCheat}
          dueDino={dueDino}
          onSetDueDino={handleSetDueDino}
          onUpdateResources={handleUpdateResources}
          onUpdateProgress={handleUpdateProgress}
          onBuySuccess={() => {
            // Stay in gacha tab
            setView('gacha');
          }}
        />
      )}

      {/* TAB 2: DINO DETAILS */}
      {view === 'details' && (
        <DinoDetailsTab
          uuid={rosterTargetUuid || ''}
          objects={objects}
          lookup={lookup}
          userProgress={userProgress}
          onBack={() => setView('alldinos')}
          onGoToGacha={() => setView('gacha')}
        />
      )}

      {/* TAB 3: ALL DINOS */}
      {view === 'alldinos' && (
        <AllDinosTab
          objects={objects}
          lookup={lookup}
          userProgress={userProgress}
          onSelectDino={(uuid) => {
            setRosterTargetUuid(uuid);
            setView('details'); // Tab 3 click -> Tab 2 Details per Manager's vision
          }}
        />
      )}

      {/* TAB 4: SETTINGS */}
      {view === 'settings' && (
        <SettingsTab
          userProgress={userProgress}
          myResources={myResources}
          isFreeBuyCheat={isFreeBuyCheat}
          onUpdateProgress={handleUpdateProgress}
          onResetCollection={handleResetCollection}
          onUpdateResources={handleUpdateResources}
          onToggleFreeBuyCheat={handleToggleFreeBuyCheat}
        />
      )}
    </GameLayout>
  );
};
