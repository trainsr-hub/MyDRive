import {
  RANK_THEMATIC_REGISTRY,
  type GlobalRankTier,
  type RankThematicMeta,
} from '../../../utils/rank';

/**
 * Dinosaur Hazard Ranking Engine (Universe 25 Calibrated Standard)
 *
 * Discrete Ferocity Thresholds:
 * - Tier D:            Ferocity < 750 (0 – 749)
 * - Tier C:            Ferocity 750 – 1499
 * - Tier B:            Ferocity 1500 – 2249
 * - Tier A:            Ferocity 2250 – 2999
 * - Tier S₁:           Ferocity 3000 – 4499
 * - Tier S₂:           Ferocity 4500 – 5999
 * - Tier S₃:           Ferocity 6000 – 7499
 * - Tier S₄:           Ferocity 7500 – 8999
 * - Tier Ψ (Psi):      Ferocity 9000 – 11999
 * - Tier Ø (Singularity): Ferocity 12000 – 14999
 * - Tier ✦ (Polaris):  Ferocity ≥ 15000
 */

export const DINO_HAZARD_TIERS: GlobalRankTier[] = [
  '✦',
  'Ø',
  'Ψ',
  'S₄',
  'S₃',
  'S₂',
  'S₁',
  'A',
  'B',
  'C',
  'D',
];

export const ALL_HAZARD_TIERS: GlobalRankTier[] = DINO_HAZARD_TIERS;

export type DinoCatalogTier = '✦' | 'Ø' | 'Ψ' | 'S' | 'A' | 'B' | 'C' | 'D';
export const DINO_CATALOG_TIERS: DinoCatalogTier[] = ['✦', 'Ø', 'Ψ', 'S', 'A', 'B', 'C', 'D'];

export const DINO_TIER_THRESHOLDS: Record<GlobalRankTier, number> = {
  '✦': 15000,
  'Ø': 12000,
  'Ψ': 9000,
  'S₄': 7500,
  'S₃': 6000,
  'S₂': 4500,
  'S₁': 3000,
  'A+': 2600,
  'A': 2250,
  'B+': 1850,
  'B': 1500,
  'C+': 1100,
  'C': 750,
  'D+': 350,
  'D': 0,
  'F': 0,
};

/**
 * Calculates continuous hazard rank score matching the discrete tier intervals.
 */
export function calcDinoHazardScore(ferocity: number): number {
  if (!ferocity || ferocity <= 0) return 0;
  if (ferocity >= 15000) {
    return 8.0 + Math.min(1.0, ((ferocity - 15000) / 15000) * 0.5);
  }
  if (ferocity >= 12000) {
    return 7.5 + ((ferocity - 12000) / 3000) * 0.5;
  }
  if (ferocity >= 9000) {
    return 7.0 + ((ferocity - 9000) / 3000) * 0.5;
  }
  if (ferocity >= 7500) {
    return 6.75 + ((ferocity - 7500) / 1500) * 0.25;
  }
  if (ferocity >= 6000) {
    return 6.5 + ((ferocity - 6000) / 1500) * 0.25;
  }
  if (ferocity >= 4500) {
    return 6.25 + ((ferocity - 4500) / 1500) * 0.25;
  }
  if (ferocity >= 3000) {
    return 6.0 + ((ferocity - 3000) / 1500) * 0.25;
  }
  if (ferocity >= 2250) {
    return 5.0 + ((ferocity - 2250) / 750) * 1.0;
  }
  if (ferocity >= 1500) {
    return 4.0 + ((ferocity - 1500) / 750) * 1.0;
  }
  if (ferocity >= 750) {
    return 3.0 + ((ferocity - 750) / 750) * 1.0;
  }
  return 2.0 + (ferocity / 750) * 1.0;
}

/**
 * Resolves the categorical Global Hazard Rank tier for a given specimen ferocity.
 */
export function getDinoRankTier(ferocity: number): GlobalRankTier {
  if (!ferocity || ferocity <= 0) return 'D';
  if (ferocity >= 15000) return '✦';
  if (ferocity >= 12000) return 'Ø';
  if (ferocity >= 9000) return 'Ψ';
  if (ferocity >= 7500) return 'S₄';
  if (ferocity >= 6000) return 'S₃';
  if (ferocity >= 4500) return 'S₂';
  if (ferocity >= 3000) return 'S₁';
  if (ferocity >= 2250) return 'A';
  if (ferocity >= 1500) return 'B';
  if (ferocity >= 750) return 'C';
  return 'D';
}

/**
 * Resolves the higher-level catalog section tier (✦, Ø, Ψ, S, A, B, C, D).
 */
export function getDinoCatalogTier(ferocity: number): DinoCatalogTier {
  if (!ferocity || ferocity <= 0) return 'D';
  if (ferocity >= 15000) return '✦';
  if (ferocity >= 12000) return 'Ø';
  if (ferocity >= 9000) return 'Ψ';
  if (ferocity >= 3000) return 'S';
  if (ferocity >= 2250) return 'A';
  if (ferocity >= 1500) return 'B';
  if (ferocity >= 750) return 'C';
  return 'D';
}

/**
 * Resolves the full thematic metadata (title, badgeClass, description) for a ferocity level.
 */
export function getDinoRankMeta(ferocity: number): RankThematicMeta {
  const tier = getDinoRankTier(ferocity);
  return RANK_THEMATIC_REGISTRY[tier] || RANK_THEMATIC_REGISTRY['D'];
}

/**
 * Calculates the exact minimum ferocity threshold required to enter a Hazard Tier.
 */
export function getMinFerocityForTier(tier: GlobalRankTier): number {
  return DINO_TIER_THRESHOLDS[tier] ?? 0;
}

export interface SubTierDivision {
  subStep: number;
  label: string;
  minFerocity: number;
  maxFerocity: number;
  rangeLabel: string;
}

/**
 * Returns the sub-tier divisions for Tiers D through S.
 * - Tier S: 4 sub-tier divisions (S₁, S₂, S₃, S₄ - 1500 ferocity step each)
 * - Tiers D through A: 3 sub-tier divisions (250 ferocity step each: Line I, Line II, Line III)
 */
export function getTierSubDivisions(tier: GlobalRankTier | DinoCatalogTier | string): SubTierDivision[] | null {
  switch (tier) {
    case 'S':
    case 'S₄':
      return [
        { subStep: 4, label: 'Line IV (S₄)', minFerocity: 7500, maxFerocity: 9000, rangeLabel: '7,500 – 8,999' },
        { subStep: 3, label: 'Line III (S₃)', minFerocity: 6000, maxFerocity: 7500, rangeLabel: '6,000 – 7,499' },
        { subStep: 2, label: 'Line II (S₂)', minFerocity: 4500, maxFerocity: 6000, rangeLabel: '4,500 – 5,999' },
        { subStep: 1, label: 'Line I (S₁)', minFerocity: 3000, maxFerocity: 4500, rangeLabel: '3,000 – 4,499' },
      ];
    case 'A':
      return [
        { subStep: 3, label: 'Line III', minFerocity: 2750, maxFerocity: 3000, rangeLabel: '2,750 – 2,999' },
        { subStep: 2, label: 'Line II', minFerocity: 2500, maxFerocity: 2750, rangeLabel: '2,500 – 2,749' },
        { subStep: 1, label: 'Line I', minFerocity: 2250, maxFerocity: 2500, rangeLabel: '2,250 – 2,499' },
      ];
    case 'B':
      return [
        { subStep: 3, label: 'Line III', minFerocity: 2000, maxFerocity: 2250, rangeLabel: '2,000 – 2,249' },
        { subStep: 2, label: 'Line II', minFerocity: 1750, maxFerocity: 2000, rangeLabel: '1,750 – 1,999' },
        { subStep: 1, label: 'Line I', minFerocity: 1500, maxFerocity: 1750, rangeLabel: '1,500 – 1,749' },
      ];
    case 'C':
      return [
        { subStep: 3, label: 'Line III', minFerocity: 1250, maxFerocity: 1500, rangeLabel: '1,250 – 1,499' },
        { subStep: 2, label: 'Line II', minFerocity: 1000, maxFerocity: 1250, rangeLabel: '1,000 – 1,249' },
        { subStep: 1, label: 'Line I', minFerocity: 750, maxFerocity: 1000, rangeLabel: '750 – 999' },
      ];
    case 'D':
      return [
        { subStep: 3, label: 'Line III', minFerocity: 500, maxFerocity: 750, rangeLabel: '500 – 749' },
        { subStep: 2, label: 'Line II', minFerocity: 250, maxFerocity: 500, rangeLabel: '250 – 499' },
        { subStep: 1, label: 'Line I', minFerocity: 0, maxFerocity: 250, rangeLabel: '0 – 249' },
      ];
    default:
      return null;
  }
}

/**
 * Formats the discrete ferocity threshold range label for a given Hazard Tier.
 */
export function getTierFerocityRangeLabel(tier: GlobalRankTier | DinoCatalogTier | string): string {
  switch (tier) {
    case '✦':
      return '≥ 15,000 Ferocity';
    case 'Ø':
      return '12,000 – 14,999 Ferocity';
    case 'Ψ':
      return '9,000 – 11,999 Ferocity';
    case 'S':
      return '3,000 – 8,999 Ferocity';
    case 'S₄':
      return '7,500 – 8,999 Ferocity';
    case 'S₃':
      return '6,000 – 7,499 Ferocity';
    case 'S₂':
      return '4,500 – 5,999 Ferocity';
    case 'S₁':
      return '3,000 – 4,499 Ferocity';
    case 'A+':
      return '2,600 – 2,999 Ferocity';
    case 'A':
      return '2,250 – 2,999 Ferocity';
    case 'B+':
      return '1,850 – 2,249 Ferocity';
    case 'B':
      return '1,500 – 2,249 Ferocity';
    case 'C+':
      return '1,100 – 1,499 Ferocity';
    case 'C':
      return '750 – 1,499 Ferocity';
    case 'D+':
      return '350 – 749 Ferocity';
    case 'D':
      return '0 – 749 Ferocity';
    default:
      return '0 Ferocity';
  }
}

