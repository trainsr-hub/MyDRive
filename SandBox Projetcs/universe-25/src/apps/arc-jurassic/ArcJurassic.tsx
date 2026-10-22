import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGlobalStore } from '../../store/useGlobalStore';
import { GameLayout } from '../../components/GameLayout';
import { Sparkles, List, Sliders, Dna, Bot } from 'lucide-react';

// Import styles for Black Hole physics and Gacha UI
import './styles/juraGlobal.css';

// Import modular tab views (1 folder per tab architecture)
import { GachaTab } from './components/tabs/gacha/GachaTab';
import { DinoDetailsTab } from './components/tabs/details/DinoDetailsTab';
import { AllDinosTab } from './components/tabs/alldinos/AllDinosTab';
import { SettingsTab } from './components/tabs/settings/SettingsTab';
import { AutoGachaHud } from './components/AutoGachaHud';

import { useArcJurassicStore, type ResourceData } from './store/useArcJurassicStore';
export type { ResourceData };
import { calcUserTop3Ferocity, calcUserTotalFerocity, calcGachaPool, selectWeightedRoll } from './core/calcGachaPool';
import { calcDinoCost } from './core/calcDinoCost';
import { calcDinoMaxCapacity, calcDinoRank, calcDinosNeededForDinoNextEvo, calcDinosNeededForDinoMaxEvo, calcDinoActiveStats } from './core/evolutionEngine';
import { rutGonTime } from './core/rutGonTime';
import {
  fetchArcProgress,
  persistArcProgress,
  resetArcProgress
} from '../../core/syncEngine';
import type { DueDinoData, BuyAnimationTarget } from './components/tabs/gacha/types';

// Import raw game data directly for optimal Vite bundling and zero runtime fetch errors
import dinoRawData from './data/dino.json';
import lookupRawData from './data/lookup.json';

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
  evo1_ferocity?: number;
  max_ferocity?: number;
  evo4_ferocity?: number;
  evolutions: {
    level: number;
    health: number;
    damage: number;
    image_url: string;
    portrait_frame: string;
    ferocity?: number;
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

const LOCAL_STORAGE_CHEAT_KEY = 'arc_jurassic_free_buy_cheat_v1';
const LOCAL_STORAGE_RAPID_MODE_KEY = 'arc_jurassic_rapid_mode_v1';
const LOCAL_STORAGE_AUTO_GACHA_BUY_KEY = 'arc_jurassic_auto_gacha_buy_v1';
const LOCAL_STORAGE_DUE_DINO_KEY = 'arc_jurassic_due_dino_v1';

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
  const myResources = useArcJurassicStore((s) => s.resources);
  const setMyResources = useArcJurassicStore((s) => s.setResources);
  const hydrateArcResources = useArcJurassicStore((s) => s.hydrateFromBackend);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'gacha' | 'alldinos' | 'settings'>('gacha');
  const [rosterTargetUuid, setRosterTargetUuid] = useState<string | null>(null);
  const [buyAnimationTarget, setBuyAnimationTarget] = useState<BuyAnimationTarget | null>(null);

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
  const [isRapidMode, setIsRapidMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_RAPID_MODE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [isAutoGachaBuy, setIsAutoGachaBuy] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LOCAL_STORAGE_AUTO_GACHA_BUY_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Auto Gacha 10x Sequence State
  const AUTO_GACHA_ROLL_CAP = 10;
  const [autoRollsRemaining, setAutoRollsRemaining] = useState<number>(AUTO_GACHA_ROLL_CAP);
  const autoRollsRemainingRef = useRef<number>(AUTO_GACHA_ROLL_CAP);
  autoRollsRemainingRef.current = autoRollsRemaining;

  const [autoGachaPhase, setAutoGachaPhase] = useState<'idle' | 'black-hole' | 'rolling'>('idle');
  interface PlannedRollItem {
    uuid: string;
    multiplier: number;
    dino: DinoObject;
    costSeconds: number;
    evo1Ferocity: number;
  }
  const [plannedRolls, setPlannedRolls] = useState<PlannedRollItem[]>([]);
  const plannedRollsRef = useRef<PlannedRollItem[]>([]);
  plannedRollsRef.current = plannedRolls;
  const [currentRollIdx, setCurrentRollIdx] = useState<number>(0);
  const currentRollIdxRef = useRef<number>(0);
  currentRollIdxRef.current = currentRollIdx;
  const [latestUnlockedDinos, setLatestUnlockedDinos] = useState<string[]>([]);
  const [activeRollTelemetry, setActiveRollTelemetry] = useState<{
    dropRatePercent?: number | null;
    leaderboardRank?: number | null;
    prevLeaderboardRank?: number | null;
    isFinalRoll?: boolean;
  } | null>(null);

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
        // Prefer backend state over bundled fallback. Only use bundled data if backend call fails.
        let initialProgress: UserProgress = { owned_dinos: {} };
        try {
          const backendProgress = await fetchArcProgress();
          if (backendProgress) {
            initialProgress = backendProgress as UserProgress;
          }
        } catch (err) {
          console.warn('[ARC Jurassic] Backend SQLite progress hydration failed, using empty collection:', err);
          // On error, use empty collection (not bundled starter pack)
          initialProgress = { owned_dinos: {} };
        }

        // 3. Authoritative Backend SQLite Resources Hydration via Shared Store
        await hydrateArcResources();

        setObjects(dinoObjects);
        setLookup(lookupRawData as unknown as LookupData);
        setUserProgress(initialProgress);

        // 4. Calculate top 3 ferocity stats & excluded IDs
        const calculatedExcludedIds: string[] = [];

        for (const [uuid, data] of Object.entries(initialProgress.owned_dinos || {})) {
          const dino = dinoObjects.find((d: DinoObject) => (d.uuid || (d as any).id || (d as any).name) === uuid);
          if (dino) {
            const limit = calcDinoMaxCapacity(dino);
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

    // Recalculate excluded IDs for creatures reaching max capacity
    const calculatedExcludedIds: string[] = [];
    for (const [uuid, data] of Object.entries(prog.owned_dinos || {})) {
      const dino = objects.find((d: DinoObject) => (d.uuid || (d as any).id || (d as any).name) === uuid);
      if (dino) {
        const limit = calcDinoMaxCapacity(dino);
        if ((data as any).number >= limit) {
          calculatedExcludedIds.push(uuid);
        }
      }
    }
    setExcludedIds(calculatedExcludedIds);

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
    setExcludedIds([]);
    try {
      await resetArcProgress();
    } catch (e) {
      console.warn('Failed to reset progress in SQLite backend:', e);
    }
  };

  const handleUpdateResources = (res: ResourceData) => {
    setMyResources(res);
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

  const handleToggleRapidMode = (enabled: boolean) => {
    setIsRapidMode(enabled);
    try {
      localStorage.setItem(LOCAL_STORAGE_RAPID_MODE_KEY, String(enabled));
    } catch (e) {
      console.warn('Failed to save rapid mode state to localStorage:', e);
    }
  };

  const handleToggleAutoGachaBuy = (enabled: boolean) => {
    if (!enabled) {
      setIsAutoGachaBuy(false);
      setAutoGachaPhase('idle');
      setPlannedRolls([]);
      plannedRollsRef.current = [];
      setCurrentRollIdx(0);
      currentRollIdxRef.current = 0;
      setLatestUnlockedDinos([]);
      setActiveRollTelemetry(null);
      setBuyAnimationTarget(null);
      setAutoRollsRemaining(AUTO_GACHA_ROLL_CAP);
      autoRollsRemainingRef.current = AUTO_GACHA_ROLL_CAP;
      try {
        localStorage.setItem(LOCAL_STORAGE_AUTO_GACHA_BUY_KEY, 'false');
      } catch (e) {
        console.warn('Failed to save auto gacha buy state to localStorage:', e);
      }
      return;
    }

    if (objects.length === 0) return;

    // Read persisted wager
    let wagerOption: string | number = 1;
    try {
      const saved = localStorage.getItem('arc_jurassic_roll_wager_v1');
      if (saved === 'next-evo' || saved === 'max-evo') {
        wagerOption = saved;
      } else {
        const parsed = Number(saved);
        wagerOption = [1, 2, 3, 4, 8, 16].includes(parsed) ? parsed : 1;
      }
    } catch {
      wagerOption = 1;
    }

    const generatedRolls: {
      uuid: string;
      multiplier: number;
      dino: DinoObject;
      costSeconds: number;
      evo1Ferocity: number;
    }[] = [];

    const simProgress = {
      ...userProgress,
      owned_dinos: { ...(userProgress?.owned_dinos || {}) }
    };

    for (let i = 0; i < 10; i++) {
      const poolResult = calcGachaPool(objects, simProgress, excludedIds);
      if (!poolResult.pool || poolResult.pool.length === 0) break;
      const roll = selectWeightedRoll(poolResult.pool);
      if (!roll) break;

      const dinoObj = objects.find(o => (o.uuid || (o as any).id || (o as any).name) === roll.uuid);
      if (!dinoObj) continue;

      let multiplier = 1;
      if (wagerOption === 'next-evo') {
        multiplier = calcDinosNeededForDinoNextEvo(dinoObj, simProgress);
      } else if (wagerOption === 'max-evo') {
        multiplier = calcDinosNeededForDinoMaxEvo(dinoObj, simProgress);
      } else {
        const num = typeof wagerOption === 'number' ? wagerOption : Number(wagerOption);
        multiplier = isNaN(num) || num < 1 ? 1 : num;
      }

      const cost = calcDinoCost(dinoObj);
      const costSeconds = cost.totalTimeSeconds * multiplier;
      const evo1Ferocity = Number(
        dinoObj.evolutions?.[0]?.ferocity ||
        (dinoObj as any).evo1_ferocity ||
        (dinoObj as any).max_ferocity ||
        1
      );

      generatedRolls.push({
        uuid: roll.uuid,
        multiplier,
        dino: dinoObj,
        costSeconds,
        evo1Ferocity
      });

      const curCount = Number(simProgress.owned_dinos[roll.uuid]?.number || 0);
      const newCount = curCount + multiplier;
      const evoCount = dinoObj.evolutions?.length || 4;
      simProgress.owned_dinos[roll.uuid] = {
        number: newCount,
        rank: calcDinoRank(newCount, evoCount)
      };
    }

    if (generatedRolls.length === 0) {
      alert('No eligible dinosaurs available in Gacha pool!');
      return;
    }

    // Calculate final active ferocity and leaderboard position for each dinosaur in simProgress
    const finalOwnedList = Object.entries(simProgress.owned_dinos || {})
      .filter(([_, d]) => Number((d as any).number || 0) > 0)
      .map(([id, d]) => {
        const dino = objects.find(o => (o.uuid || (o as any).id || (o as any).name) === id);
        const stats = dino ? calcDinoActiveStats(dino, Number((d as any).number || 0)) : { ferocity: 0 };
        return { uuid: id, ferocity: stats.ferocity };
      });
    finalOwnedList.sort((a, b) => b.ferocity - a.ferocity);

    const getSimFinalRank = (uuid: string) => {
      const idx = finalOwnedList.findIndex(o => o.uuid === uuid);
      return idx !== -1 ? idx + 1 : 9999;
    };

    const getSimFinalFerocity = (uuid: string) => {
      const match = finalOwnedList.find(o => o.uuid === uuid);
      return match ? match.ferocity : 0;
    };

    // Sort the 10 rolls so that the dino with the HIGHEST final ranking (Rank #1) appears LAST
    generatedRolls.sort((a, b) => {
      const rankA = getSimFinalRank(a.uuid);
      const rankB = getSimFinalRank(b.uuid);
      // Worse rank (higher number, e.g. 25) first -> Highest rank (lower number, e.g. 1) last
      if (rankA !== rankB) {
        return rankB - rankA;
      }
      // Tie-breaker: lower final ferocity first -> highest final ferocity last
      const feroA = getSimFinalFerocity(a.uuid);
      const feroB = getSimFinalFerocity(b.uuid);
      if (feroA !== feroB) {
        return feroA - feroB;
      }
      return a.evo1Ferocity - b.evo1Ferocity;
    });

    plannedRollsRef.current = generatedRolls;
    setPlannedRolls(generatedRolls);
    currentRollIdxRef.current = 0;
    setCurrentRollIdx(0);
    setLatestUnlockedDinos([]);
    setAutoRollsRemaining(AUTO_GACHA_ROLL_CAP);
    autoRollsRemainingRef.current = AUTO_GACHA_ROLL_CAP;

    setAutoGachaPhase('black-hole');
    setIsAutoGachaBuy(true);
    try {
      localStorage.setItem(LOCAL_STORAGE_AUTO_GACHA_BUY_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save auto gacha buy state to localStorage:', e);
    }
  };

  const executeRollStep = useCallback((rollIdx: number) => {
    const rolls = plannedRollsRef.current;
    if (rollIdx >= rolls.length) {
      // Completed all 10 rolls!
      setIsAutoGachaBuy(false);
      setAutoGachaPhase('idle');
      setPlannedRolls([]);
      plannedRollsRef.current = [];
      setCurrentRollIdx(0);
      currentRollIdxRef.current = 0;
      try {
        localStorage.setItem(LOCAL_STORAGE_AUTO_GACHA_BUY_KEY, 'false');
      } catch (e) {}
      return;
    }

    const roll = rolls[rollIdx];
    if (!roll) return;

    const currentJurassicTime = Number(
      myResources.jurassic_time?.amount ?? myResources.elemental_time?.golden?.amount ?? 0
    );

    // Affordability validation
    if (!isFreeBuyCheat && currentJurassicTime < roll.costSeconds) {
      alert(`Auto-Gacha Paused: Insufficient Jurassic Time for ${roll.dino.name}! Requires ${rutGonTime(roll.costSeconds, 'seconds')}.`);
      setIsAutoGachaBuy(false);
      setAutoGachaPhase('idle');
      setPlannedRolls([]);
      plannedRollsRef.current = [];
      setCurrentRollIdx(0);
      currentRollIdxRef.current = 0;
      try {
        localStorage.setItem(LOCAL_STORAGE_AUTO_GACHA_BUY_KEY, 'false');
      } catch (e) {}
      return;
    }

    // Deduct time
    if (!isFreeBuyCheat) {
      const newRes = { ...myResources };
      newRes.jurassic_time = {
        ...newRes.jurassic_time,
        amount: Math.max(0, Number((currentJurassicTime - roll.costSeconds).toFixed(2)))
      };
      handleUpdateResources(newRes);
    }

    // Pool calculation differential
    const prevPoolResult = calcGachaPool(objects, userProgress, excludedIds);
    const prevPoolSet = new Set(prevPoolResult.pool.map(p => p.uuid));
    const prevCap = prevPoolResult.cap;
    const targetPoolDino = prevPoolResult.pool.find(p => p.uuid === roll.uuid);
    const dropRatePercent = targetPoolDino?.dropRatePercent;

    // Update progress & rank
    const currentData = userProgress?.owned_dinos?.[roll.uuid] || { number: 0, rank: 0 };
    const currentCount = Number((currentData as any).number || 0);
    const maxCapacity = calcDinoMaxCapacity(roll.dino);
    const maxBuyable = Math.max(1, maxCapacity - currentCount);
    const buyQty = Math.min(Math.max(1, roll.multiplier), maxBuyable);

    const getLeaderboardRank = (targetUuid: string, prog: UserProgress) => {
      const owned = Object.entries(prog.owned_dinos || {})
        .filter(([_, d]) => Number((d as any).number || 0) > 0)
        .map(([id, d]) => {
          const dino = objects.find(o => (o.uuid || (o as any).id || (o as any).name) === id);
          const stats = dino ? calcDinoActiveStats(dino, Number((d as any).number || 0)) : { ferocity: 0 };
          return { uuid: id, ferocity: stats.ferocity };
        });
      owned.sort((a, b) => b.ferocity - a.ferocity);
      const idx = owned.findIndex(o => o.uuid === targetUuid);
      return idx !== -1 ? idx + 1 : null;
    };

    const prevLbRank = getLeaderboardRank(roll.uuid, userProgress);

    const updatedCount = currentCount + buyQty;
    const evoCount = roll.dino.evolutions?.length || 4;
    const prevRank = calcDinoRank(currentCount, evoCount);
    const newRank = calcDinoRank(updatedCount, evoCount);
    const wasFirstBuy = currentCount === 0;

    const newProg = { ...userProgress, owned_dinos: { ...(userProgress?.owned_dinos || {}) } };
    newProg.owned_dinos[roll.uuid] = {
      number: updatedCount,
      rank: newRank
    };
    handleUpdateProgress(newProg);

    const newLbRank = getLeaderboardRank(roll.uuid, newProg);

    // Post-progress pool for unlocked species
    const postPoolResult = calcGachaPool(objects, newProg, excludedIds);
    const newCap = postPoolResult.cap;
    const newlyUnlockedPoolDinos = postPoolResult.pool.filter(p => !prevPoolSet.has(p.uuid));
    setLatestUnlockedDinos(newlyUnlockedPoolDinos.map(p => p.name));

    // Clear due dino if this matched
    if (dueDino?.uuid === roll.uuid) {
      handleSetDueDino(null);
    }

    // Decrement remaining rolls indicator
    const nextRemaining = Math.max(0, rolls.length - (rollIdx + 1));
    setAutoRollsRemaining(nextRemaining);
    autoRollsRemainingRef.current = nextRemaining;

    const remainingTimeSeconds = Math.max(0, Number((currentJurassicTime - (isFreeBuyCheat ? 0 : roll.costSeconds)).toFixed(2)));

    const isLastPlannedRoll = rollIdx >= rolls.length - 1;
    const nextRoll = rolls[rollIdx + 1];
    const canAffordNext = nextRoll ? (isFreeBuyCheat || remainingTimeSeconds >= nextRoll.costSeconds) : false;
    const isFinalRoll = isLastPlannedRoll || !canAffordNext;

    setActiveRollTelemetry({
      dropRatePercent,
      leaderboardRank: newLbRank,
      prevLeaderboardRank: prevLbRank,
      isFinalRoll
    });

    // Trigger Rank Climb & Evolution animation in AllDinosTab
    setBuyAnimationTarget({
      uuid: roll.uuid,
      wasFirstBuy,
      prevRank,
      newRank,
      buyQty,
      dropRatePercent,
      newlyUnlockedPoolDinos,
      prevCap,
      newCap,
      costSeconds: roll.costSeconds,
      remainingTimeSeconds,
      isFinalRoll
    });
  }, [myResources, isFreeBuyCheat, objects, userProgress, excludedIds, dueDino]);

  const handleSkipBlackHole = useCallback(() => {
    setAutoGachaPhase('rolling');
    setView('alldinos');
    currentRollIdxRef.current = 0;
    setCurrentRollIdx(0);
    setTimeout(() => {
      executeRollStep(0);
    }, 400);
  }, [executeRollStep]);

  const handleClearAnimation = useCallback(() => {
    setBuyAnimationTarget(null);

    // If auto-gacha sequence is rolling, step to next roll
    if (autoGachaPhase === 'rolling' && plannedRollsRef.current.length > 0) {
      const nextIdx = currentRollIdxRef.current + 1;
      currentRollIdxRef.current = nextIdx;
      setCurrentRollIdx(nextIdx);

      if (nextIdx < plannedRollsRef.current.length) {
        setTimeout(() => {
          executeRollStep(nextIdx);
        }, 500);
      } else {
        // Complete!
        setIsAutoGachaBuy(false);
        setAutoGachaPhase('idle');
        setPlannedRolls([]);
        plannedRollsRef.current = [];
        setCurrentRollIdx(0);
        currentRollIdxRef.current = 0;
        setAutoRollsRemaining(AUTO_GACHA_ROLL_CAP);
        autoRollsRemainingRef.current = AUTO_GACHA_ROLL_CAP;
        try {
          localStorage.setItem(LOCAL_STORAGE_AUTO_GACHA_BUY_KEY, 'false');
        } catch (e) {}
      }
    }
  }, [autoGachaPhase, executeRollStep]);

  const handleReturnToGacha = useCallback(() => {
    setView('gacha');
  }, []);

  const handleBuySuccess = useCallback((summary: BuyAnimationTarget) => {
    setBuyAnimationTarget(summary);
    setView('alldinos');
  }, []);

  const handleOpenDinoDetails = useCallback((uuid: string | null) => {
    // Opening the Dino Details sidebar immediately disarms Auto Gacha & Buy mode
    if (uuid) {
      setIsAutoGachaBuy(prev => {
        if (prev) {
          try {
            localStorage.setItem(LOCAL_STORAGE_AUTO_GACHA_BUY_KEY, 'false');
          } catch (e) {
            console.warn('Failed to save auto gacha buy state to localStorage:', e);
          }
          return false;
        }
        return prev;
      });
    }
    setRosterTargetUuid(uuid);
  }, []);

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
    <>
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

          {/* Quick Control: Auto Gacha & Buy Master Killswitch */}
          <button
            type="button"
            onClick={() => handleToggleAutoGachaBuy(!isAutoGachaBuy)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer select-none ${
              isAutoGachaBuy
                ? 'bg-emerald-950/80 hover:bg-rose-950/80 border-emerald-400 hover:border-rose-400 text-emerald-300 hover:text-rose-300 shadow-[0_0_12px_rgba(52,211,153,0.35)] animate-pulse'
                : 'bg-[#14101c] hover:bg-[#20182c] border-[#2e2638] hover:border-emerald-500/50 text-[#8c7a9e] hover:text-emerald-400 shadow-sm'
            }`}
            title={isAutoGachaBuy ? 'Click to Stop Auto Gacha & Buy' : 'Click to Enable Auto Gacha & Buy (10-Roll Cap)'}
          >
            <Bot className={`w-4 h-4 ${isAutoGachaBuy ? 'text-emerald-400' : 'text-[#8c7a9e]'}`} />
            <span>{isAutoGachaBuy ? `AUTO GACHA: ON (${autoRollsRemaining}/10)` : 'AUTO GACHA: OFF'}</span>
          </button>
        </div>
      }
      tabs={[
        { id: 'gacha', label: 'Gacha', icon: <Sparkles className="w-4 h-4" /> },
        { id: 'alldinos', label: 'List of Dinos', icon: <List className="w-4 h-4" /> },
        { id: 'settings', label: 'Settings', icon: <Sliders className="w-4 h-4" /> },
      ]}
      activeTab={view}
      onTabChange={(id) => setView(id as 'gacha' | 'alldinos' | 'settings')}
    >
      {/* TAB 1: GACHA */}
      <div className={view === 'gacha' ? 'block' : 'hidden'}>
        <GachaTab
          objects={objects}
          lookup={lookup}
          userFerocity={Math.max(Math.floor(top3Ferocity / 2.5), 200)}
          excludedIds={excludedIds}
          userProgress={userProgress}
          myResources={myResources}
          isFreeBuyCheat={isFreeBuyCheat}
          isAutoGachaBuy={isAutoGachaBuy}
          dueDino={dueDino}
          onSetDueDino={handleSetDueDino}
          onUpdateResources={handleUpdateResources}
          onUpdateProgress={handleUpdateProgress}
          onBuySuccess={handleBuySuccess}
        />
      </div>

      {/* TAB 2: ALL DINOS */}
      <div className={view === 'alldinos' ? 'block' : 'hidden'}>
        <AllDinosTab
          objects={objects}
          lookup={lookup}
          userProgress={userProgress}
          buyAnimationTarget={buyAnimationTarget}
          isRapidMode={isRapidMode}
          isAutoGachaBuy={isAutoGachaBuy}
          onClearAnimation={handleClearAnimation}
          onSelectDino={handleOpenDinoDetails}
          onReturnToGacha={handleReturnToGacha}
        />
      </div>

      {/* TAB 3: SETTINGS */}
      <div className={view === 'settings' ? 'block' : 'hidden'}>
        <SettingsTab
          userProgress={userProgress}
          myResources={myResources}
          isFreeBuyCheat={isFreeBuyCheat}
          isRapidMode={isRapidMode}
          isAutoGachaBuy={isAutoGachaBuy}
          autoRollsRemaining={autoRollsRemaining}
          onUpdateProgress={handleUpdateProgress}
          onResetCollection={handleResetCollection}
          onUpdateResources={handleUpdateResources}
          onToggleFreeBuyCheat={handleToggleFreeBuyCheat}
          onToggleRapidMode={handleToggleRapidMode}
          onToggleAutoGachaBuy={handleToggleAutoGachaBuy}
        />
      </div>

      {/* DINO DETAILS SLIDE-OVER INSPECTOR DRAWER */}
      {rosterTargetUuid && (
        <DinoDetailsTab
          uuid={rosterTargetUuid}
          objects={objects}
          lookup={lookup}
          userProgress={userProgress}
          onBack={() => setRosterTargetUuid(null)}
          onGoToGacha={() => {
            setRosterTargetUuid(null);
            setView('gacha');
          }}
        />
      )}
    </GameLayout>

    {/* Auto-Gacha Telemetry HUD & Cosmic Black Hole Stage */}
    <AutoGachaHud
      isActive={isAutoGachaBuy && autoGachaPhase !== 'idle'}
      isBlackHolePlaying={autoGachaPhase === 'black-hole'}
      currentRollIndex={currentRollIdx}
      totalRolls={plannedRolls.length || 10}
      currentDinoName={plannedRolls[currentRollIdx]?.dino?.name || ''}
      currentDinoImage={plannedRolls[currentRollIdx]?.dino?.image_url}
      currentCostSeconds={plannedRolls[currentRollIdx]?.costSeconds || 0}
      currentEvo1Ferocity={plannedRolls[currentRollIdx]?.evo1Ferocity || 0}
      remainingJurassicTime={Number(myResources.jurassic_time?.amount ?? myResources.elemental_time?.golden?.amount ?? 0)}
      newlyUnlockedDinos={latestUnlockedDinos}
      dropRatePercent={activeRollTelemetry?.dropRatePercent}
      leaderboardRank={activeRollTelemetry?.leaderboardRank}
      prevLeaderboardRank={activeRollTelemetry?.prevLeaderboardRank}
      isFinalRoll={activeRollTelemetry?.isFinalRoll}
      onSkipBlackHole={handleSkipBlackHole}
      onStopAutoGacha={() => handleToggleAutoGachaBuy(false)}
    />
  </>
);
};
