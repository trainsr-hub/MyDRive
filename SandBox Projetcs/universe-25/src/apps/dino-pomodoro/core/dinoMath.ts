// path: src/apps/dino-pomodoro/core/dinoMath.ts
// Mathematical Engine for Dino Pomodoro (Manager Calibrated Standard):
// 1. Chance = Modified_Ferocity / sum_of_all_Modified_Ferocity
// 2. Modified_Ferocity = Next_Evo_Ferocity * (1 + 0.1 * total_number_of_partner_dino_and_material_dinos)
// 3. Pomodoro time = Next_Evo_Ferocity / 5 (minutes)
// 4. Evolution progression: 1 evo at a time [1, 2, 4, 8]

import { calcDinoRank, getDinoThresholds } from '../../arc-jurassic/core/evolutionEngine';
import { rutGonTime } from '../../arc-jurassic/core/rutGonTime';

export interface DinoRollResult {
  dino: any;
  chancePercent: number;
  categoryChancePercent: number;
  categoryLabel: string;
  categoryCount: number;
  modifiedFerocity: number;
  nextEvoFerocity: number;
  partnerCount: number;
  bonusMultiplier: number;
  totalPoolFerocity: number;
}

export interface PomodoroTimeResult {
  nextRank: number;
  nextEvoFerocity: number;
  timeInMinutes: number;
  durationSeconds: number;
  isNew: boolean;
  currentRank: number;
  currentCount: number;
  partnerCount?: number;
  bonusMultiplier?: number;
  modifiedFerocity?: number;
}

/**
 * Normalizes category key from rarity and hybrid_type (e.g. 'tournament non-hybrid')
 */
export function getDinoCategoryKey(dino: any): string {
  const r = (dino?.rarity || 'common').toString().trim().toLowerCase();
  const h = (dino?.hybrid_type || 'non-hybrid').toString().trim().toLowerCase();
  return `${r} ${h}`;
}

/**
 * Formats a category key into a clean, human-readable title (e.g. 'Tournament Non-Hybrid', 'VIP Non-Hybrid')
 */
export function formatCategoryLabel(categoryKey: string): string {
  return categoryKey
    .split(' ')
    .map((word) => {
      if (word.toLowerCase() === 'vip') return 'VIP';
      return word
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-');
    })
    .join(' ');
}

/**
 * Builds a bi-directional mapping of partner and material dinosaur relationships across the library.
 * - For a Hybrid: All its recipe ingredients are its Material Dinos.
 * - For an Ingredient: All OTHER ingredients in every recipe containing it are its Partner Dinos.
 */
export function getDinoRelationsMap(dinoLibrary: any[]): Map<string, Set<string>> {
  const relationsMap = new Map<string, Set<string>>();

  // Initialize empty sets for all specimens
  for (const dino of dinoLibrary) {
    const uuid = dino.uuid || dino.id || dino.name;
    if (uuid && !relationsMap.has(uuid)) {
      relationsMap.set(uuid, new Set<string>());
    }
  }

  // Map ingredients (materials) and cross-ingredient partners
  for (const dino of dinoLibrary) {
    const uuid = dino.uuid || dino.id || dino.name;
    if (!uuid) continue;

    const rawIngs = Array.isArray(dino.ingredients) ? dino.ingredients : [];
    const ings = rawIngs.map((i: any) => (typeof i === 'string' ? i : (i?.uuid || i?.id || i?.name))).filter(Boolean);

    // 1. Hybrid <-> Materials (Bi-directional link between Hybrid and its Ingredients)
    for (const ing of ings) {
      if (ing !== uuid) {
        if (!relationsMap.has(uuid)) relationsMap.set(uuid, new Set<string>());
        relationsMap.get(uuid)!.add(ing);

        if (!relationsMap.has(ing)) relationsMap.set(ing, new Set<string>());
        relationsMap.get(ing)!.add(uuid);
      }
    }

    // 2. Partners for each ingredient in this hybrid recipe (Bi-directional co-ingredients)
    for (let i = 0; i < ings.length; i++) {
      const ingA = ings[i];
      if (!relationsMap.has(ingA)) relationsMap.set(ingA, new Set<string>());
      for (let j = 0; j < ings.length; j++) {
        if (i !== j && ings[j] !== ingA) {
          relationsMap.get(ingA)!.add(ings[j]);
        }
      }
    }
  }

  return relationsMap;
}

/**
 * Calculates Next_Evo_Ferocity for a dinosaur based on player's current owned count:
 * - If unowned (currentCount === 0): Evo 1 ferocity (level 10 baseline)
 * - If owned: Ferocity at next evolution rank (level 20, 30, or 40)
 */
export function getDinoNextEvoFerocity(dino: any, currentCount: number): number {
  const evolutions = dino.evolutions || [];
  const evoCount = evolutions.length || 4;
  const currentRank = calcDinoRank(currentCount, evoCount);
  const isNew = currentRank === 0;

  // Next evolution rank is 1 if new, else min(currentRank + 1, evoCount)
  const nextRank = isNew ? 1 : Math.min(currentRank + 1, evoCount);
  const evoIndex = Math.max(0, nextRank - 1);
  const targetEvo = evolutions[evoIndex] || evolutions[0];

  const nextEvoFerocity = Number(
    targetEvo?.ferocity ||
    (targetEvo ? Math.floor(Number(targetEvo.damage || 0) + (Number(targetEvo.health || 0) / 3.2)) : 0) ||
    (isNew ? (dino.evo1_ferocity || 250) : (dino.max_ferocity || 600))
  );

  return Math.max(10, nextEvoFerocity);
}

/**
 * Computes total_number_of_partner_dino_and_material_dinos:
 * Sums the owned counts (.number) of all partner, material, and hybrid dinos possessed by the player.
 */
export function getDinoPartnerAndMaterialCount(
  dinoUuid: string,
  userProgress: any,
  relationsMap: Map<string, Set<string>>
): number {
  if (!userProgress?.owned_dinos) return 0;
  const rels = relationsMap.get(dinoUuid);
  if (!rels || rels.size === 0) return 0;

  let totalCount = 0;
  for (const relUuid of rels) {
    const ownedData = userProgress.owned_dinos[relUuid];
    if (ownedData) {
      totalCount += Number(ownedData.number || 0);
    }
  }
  return totalCount;
}

/**
 * Manager's Formula:
 * - Bonus Multiplier: (1 + 0.1 * total_number_of_related_dinos)
 * - Modified (Effective) Ferocity = Next_Evo_Ferocity / Bonus Multiplier
 *   (Having related dinos lowers the effective barrier, boosting the roll probability!)
 */
export function getDinoModifiedFerocity(
  dino: any,
  userProgress?: any,
  relationsMap?: Map<string, Set<string>>
): {
  modifiedFerocity: number;
  nextEvoFerocity: number;
  partnerCount: number;
  bonusMultiplier: number;
} {
  const uuid = dino.uuid || dino.id || dino.name;
  const userCount = Number(userProgress?.owned_dinos?.[uuid]?.number || 0);
  const nextEvoFerocity = getDinoNextEvoFerocity(dino, userCount);

  let partnerCount = 0;
  if (relationsMap && uuid) {
    partnerCount = getDinoPartnerAndMaterialCount(uuid, userProgress, relationsMap);
  }

  const bonusMultiplier = 1 + 0.1 * partnerCount;
  // Effective ferocity hurdle is reduced by related dino affinity (lowers difficulty, boosting roll chance)
  const modifiedFerocity = bonusMultiplier > 0 ? Math.round(nextEvoFerocity / bonusMultiplier) : nextEvoFerocity;

  return {
    modifiedFerocity,
    nextEvoFerocity,
    partnerCount,
    bonusMultiplier,
  };
}

/**
 * Computes pool weights across all dinosaurs using Manager's Calibrated Inverse Formula:
 * - Higher Ferocity = Lower Chance (rarer, prestigious specimens)
 * - Weight = (1 + 0.1 * partnerCount) / Next_Evo_Ferocity
 * - Chance = Weight / sum(Weights)
 * Also aggregates total weights and specimen counts per category (rarity + hybrid_type).
 */
export function calculateDinoPoolWeights(
  dinoLibrary: any[],
  userProgress?: any,
  cachedRelationsMap?: Map<string, Set<string>>
): {
  weights: Map<string, number>;
  metaMap: Map<string, { nextEvoFerocity: number; partnerCount: number; bonusMultiplier: number; modifiedFerocity: number }>;
  categoryWeights: Map<string, number>;
  categoryCounts: Map<string, number>;
  totalPoolFerocity: number;
  relationsMap: Map<string, Set<string>>;
} {
  const relationsMap = cachedRelationsMap || getDinoRelationsMap(dinoLibrary);
  const weights = new Map<string, number>();
  const metaMap = new Map<string, { nextEvoFerocity: number; partnerCount: number; bonusMultiplier: number; modifiedFerocity: number }>();
  const categoryWeights = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  let totalPoolWeight = 0;

  for (const dino of dinoLibrary) {
    const uuid = dino.uuid || dino.id || dino.name;
    const calc = getDinoModifiedFerocity(dino, userProgress, relationsMap);

    // Inverse weighting: higher ferocity = lower chance; partner affinity boosts roll weight
    const weight = calc.nextEvoFerocity > 0 ? calc.bonusMultiplier / calc.nextEvoFerocity : 0.001;

    weights.set(uuid, weight);
    metaMap.set(uuid, calc);
    totalPoolWeight += weight;

    const catKey = getDinoCategoryKey(dino);
    categoryWeights.set(catKey, (categoryWeights.get(catKey) || 0) + weight);
    categoryCounts.set(catKey, (categoryCounts.get(catKey) || 0) + 1);
  }

  return {
    weights,
    metaMap,
    categoryWeights,
    categoryCounts,
    totalPoolFerocity: totalPoolWeight,
    relationsMap,
  };
}

/**
 * Rolls 1 random dino from all dinos with inverse ferocity weighting:
 * - Higher Ferocity = Lower Chance
 * - Weight = (1 + 0.1 * partnerCount) / Next_Evo_Ferocity
 * - Chance = Weight / sum(Weights)
 * Returns both individual specimen probability and total category probability.
 */
export function rollWeightedDino(
  dinoLibrary: any[],
  userProgress?: any,
  cachedRelationsMap?: Map<string, Set<string>>
): DinoRollResult {
  if (!dinoLibrary || dinoLibrary.length === 0) {
    throw new Error('Dino library is empty');
  }

  const { weights, metaMap, categoryWeights, categoryCounts, totalPoolFerocity } = calculateDinoPoolWeights(
    dinoLibrary,
    userProgress,
    cachedRelationsMap
  );
  const rand = Math.random() * totalPoolFerocity;
  let accumulated = 0;

  for (const dino of dinoLibrary) {
    const uuid = dino.uuid || dino.id || dino.name;
    const w = weights.get(uuid) || 0.001;
    accumulated += w;
    if (accumulated >= rand) {
      const chancePercent = totalPoolFerocity > 0 ? (w / totalPoolFerocity) * 100 : 0;
      const meta = metaMap.get(uuid) || {
        nextEvoFerocity: 300,
        partnerCount: 0,
        bonusMultiplier: 1,
        modifiedFerocity: 300,
      };
      const catKey = getDinoCategoryKey(dino);
      const catWeight = categoryWeights.get(catKey) || w;
      const categoryChancePercent = totalPoolFerocity > 0 ? (catWeight / totalPoolFerocity) * 100 : 0;
      const categoryLabel = formatCategoryLabel(catKey);
      const categoryCount = categoryCounts.get(catKey) || 1;

      return {
        dino,
        chancePercent,
        categoryChancePercent,
        categoryLabel,
        categoryCount,
        modifiedFerocity: meta.modifiedFerocity,
        nextEvoFerocity: meta.nextEvoFerocity,
        partnerCount: meta.partnerCount,
        bonusMultiplier: meta.bonusMultiplier,
        totalPoolFerocity,
      };
    }
  }

  // Fallback to first specimen
  const fallback = dinoLibrary[0];
  const uuid = fallback.uuid || fallback.id || fallback.name;
  const w = weights.get(uuid) || 0.001;
  const meta = metaMap.get(uuid) || {
    nextEvoFerocity: 300,
    partnerCount: 0,
    bonusMultiplier: 1,
    modifiedFerocity: 300,
  };
  const catKey = getDinoCategoryKey(fallback);
  const catWeight = categoryWeights.get(catKey) || w;
  const categoryChancePercent = totalPoolFerocity > 0 ? (catWeight / totalPoolFerocity) * 100 : 0;
  const categoryLabel = formatCategoryLabel(catKey);
  const categoryCount = categoryCounts.get(catKey) || 1;

  return {
    dino: fallback,
    chancePercent: totalPoolFerocity > 0 ? (w / totalPoolFerocity) * 100 : 0,
    categoryChancePercent,
    categoryLabel,
    categoryCount,
    modifiedFerocity: meta.modifiedFerocity,
    nextEvoFerocity: meta.nextEvoFerocity,
    partnerCount: meta.partnerCount,
    bonusMultiplier: meta.bonusMultiplier,
    totalPoolFerocity,
  };
}

/**
 * Calculates the exact active roll chance % for a specific dinosaur using inverse weighting:
 * - Higher Ferocity = Lower Chance
 * - Weight = (1 + 0.1 * partnerCount) / Next_Evo_Ferocity
 * - Chance = Weight / sum(Weights)
 * Also returns total chance % for that dinosaur's category (rarity + hybrid_type).
 */
export function getDinoRollChance(
  dino: any,
  dinoLibrary: any[],
  userProgress?: any,
  cachedRelationsMap?: Map<string, Set<string>>
): {
  chancePercent: number;
  categoryChancePercent: number;
  categoryLabel: string;
  categoryCount: number;
  modifiedFerocity: number;
  totalPoolFerocity: number;
  partnerCount: number;
  bonusMultiplier: number;
} {
  const { weights, metaMap, categoryWeights, categoryCounts, totalPoolFerocity } = calculateDinoPoolWeights(
    dinoLibrary,
    userProgress,
    cachedRelationsMap
  );
  const uuid = dino.uuid || dino.id || dino.name;
  const w = weights.get(uuid) || 0.001;
  const meta = metaMap.get(uuid) || {
    nextEvoFerocity: 300,
    partnerCount: 0,
    bonusMultiplier: 1,
    modifiedFerocity: 300,
  };
  const chancePercent = totalPoolFerocity > 0 ? (w / totalPoolFerocity) * 100 : 0;
  const catKey = getDinoCategoryKey(dino);
  const catWeight = categoryWeights.get(catKey) || w;
  const categoryChancePercent = totalPoolFerocity > 0 ? (catWeight / totalPoolFerocity) * 100 : 0;
  const categoryLabel = formatCategoryLabel(catKey);
  const categoryCount = categoryCounts.get(catKey) || 1;

  return {
    chancePercent,
    categoryChancePercent,
    categoryLabel,
    categoryCount,
    modifiedFerocity: meta.modifiedFerocity,
    totalPoolFerocity,
    partnerCount: meta.partnerCount,
    bonusMultiplier: meta.bonusMultiplier,
  };
}

/** Pomodoro minutes = Next_Evo_Ferocity / FEROCITY_MINUTES_DIVISOR */
export const FEROCITY_MINUTES_DIVISOR = 5;

/** Converts an Evo ferocity value to a whole-second Pomodoro duration (min 60s). */
export function ferocityToSeconds(ferocity: number): number {
  return Math.max(60, Math.round((ferocity / FEROCITY_MINUTES_DIVISOR) * 60));
}

/**
 * Computes Pomodoro time based on:
 * Pomodoro time = Next_Evo_Ferocity / 5 (minutes)
 */
export function calculatePomodoroTime(
  dino: any,
  currentCount: number,
  userProgress?: any,
  relationsMap?: Map<string, Set<string>>
): PomodoroTimeResult {
  const evolutions = dino.evolutions || [];
  const evoCount = evolutions.length || 4;
  const currentRank = calcDinoRank(currentCount, evoCount);
  const isNew = currentRank === 0;

  // Next evo rank is 1 if new, else min(currentRank + 1, evoCount)
  const nextRank = isNew ? 1 : Math.min(currentRank + 1, evoCount);
  const nextEvoFerocity = getDinoNextEvoFerocity(dino, currentCount);

  // Exact formula: Next_Evo_Ferocity / 5 (minutes), converted to whole seconds
  const durationSeconds = ferocityToSeconds(nextEvoFerocity);

  let partnerCount = 0;
  let bonusMultiplier = 1;
  let modifiedFerocity = nextEvoFerocity;

  if (userProgress) {
    const uuid = dino.uuid || dino.id || dino.name;
    const rels = relationsMap || (uuid ? getDinoRelationsMap([dino]) : undefined);
    if (rels && uuid) {
      partnerCount = getDinoPartnerAndMaterialCount(uuid, userProgress, rels);
      bonusMultiplier = 1 + 0.1 * partnerCount;
      modifiedFerocity = nextEvoFerocity * bonusMultiplier;
    }
  }

  return {
    nextRank,
    nextEvoFerocity,
    timeInMinutes: nextEvoFerocity / FEROCITY_MINUTES_DIVISOR,
    durationSeconds,
    isNew,
    currentRank,
    currentCount,
    partnerCount,
    bonusMultiplier,
    modifiedFerocity,
  };
}

/**
 * Advances a creature 1 evo at a time based on standard exponential thresholds [1, 2, 4, 8]
 */
export function advanceDinoOneEvo(currentCount: number, evoCount: number = 4): number {
  const thresholds = getDinoThresholds(evoCount);
  const currentRank = calcDinoRank(currentCount, evoCount);

  if (currentRank < evoCount) {
    // Advance to exact threshold for the next rank
    return thresholds[currentRank]; // Rank 0 -> 1 (Evo 1), Rank 1 -> 2 (Evo 2), Rank 2 -> 4 (Evo 3), Rank 3 -> 8 (Evo 4)
  }

  // Already max rank: increment count
  return (currentCount || 0) + 1;
}

/**
 * Formats seconds into condensed duration using project's standard rutGonTime function
 */
export function formatPomodoroTime(totalSeconds: number): string {
  return rutGonTime(totalSeconds, 'seconds');
}
