import {
  RANK_THEMATIC_REGISTRY,
  type GlobalRankTier,
  type RankThematicMeta,
} from '../../../utils/rank';

/**
 * Dinosaur Hazard Ranking Engine (Universe 25 Calibrated Standard)
 *
 * Discrete Ferocity Thresholds:
 * - Tier D (Starters):         Ferocity < 650 (0 – 649)
 * - Tier C (Veterans):         Ferocity 650 – 1399
 * - Tier B (Dominator Core):   Ferocity 1400 – 2199 (⭐ 1,700s Golden Benchmark)
 * - Tier A (Vanguard):         Ferocity 2200 – 2999 (Solid Gold VIPs at 2,992)
 * - Tier S₁ (Apex Awakening):  Ferocity 3000 – 4499
 * - Tier S₂ (Apex Resonant):   Ferocity 4500 – 5999
 * - Tier S₃ (Apex Molten):     Ferocity 6000 – 7499
 * - Tier S₄ (Apex Transmuted): Ferocity 7500 – 8999
 * - Tier Ø (Singularity):      Ferocity 9000 – 14999 (Tournament Super-Hybrids)
 * - Tier ✦ (Polaris):          Ferocity ≥ 15000 (World Bosses & Celestial Supers)
 */

export const DINO_HAZARD_TIERS: GlobalRankTier[] = [
  '✦',
  'Ø',
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

export type DinoCatalogTier = '✦' | 'Ø' | 'S' | 'A' | 'B' | 'C' | 'D';
export const DINO_CATALOG_TIERS: DinoCatalogTier[] = ['✦', 'Ø', 'S', 'A', 'B', 'C', 'D'];

export const DINO_TIER_THRESHOLDS: Record<GlobalRankTier, number> = {
  '✦': 15000,
  'Ø': 9000,
  'Ψ': 8500,
  'S₄': 7500,
  'S₃': 6000,
  'S₂': 4500,
  'S₁': 3000,
  'A+': 2600,
  'A': 2200,
  'B+': 1600, // Dominator Golden Benchmark (1,700s Core)
  'B': 1400,
  'C+': 850,
  'C': 650,
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
  if (ferocity >= 9000) {
    return 7.5 + ((ferocity - 9000) / 6000) * 0.5;
  }
  if (ferocity >= 7500) {
    return 6.75 + ((ferocity - 7500) / 1500) * 0.24;
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
  if (ferocity >= 2200) {
    return 5.0 + ((ferocity - 2200) / 800) * 1.0;
  }
  if (ferocity >= 1400) {
    return 4.0 + ((ferocity - 1400) / 800) * 1.0;
  }
  if (ferocity >= 650) {
    return 3.0 + ((ferocity - 650) / 750) * 1.0;
  }
  return 2.0 + (ferocity / 650) * 1.0;
}

/**
 * Resolves the categorical Global Hazard Rank tier for a given specimen ferocity.
 */
export function getDinoRankTier(ferocity: number): GlobalRankTier {
  if (!ferocity || ferocity <= 0) return 'D';
  if (ferocity >= 15000) return '✦';
  if (ferocity >= 9000) return 'Ø';
  if (ferocity >= 7500) return 'S₄';
  if (ferocity >= 6000) return 'S₃';
  if (ferocity >= 4500) return 'S₂';
  if (ferocity >= 3000) return 'S₁';
  if (ferocity >= 2200) return 'A';
  if (ferocity >= 1400) return 'B';
  if (ferocity >= 650) return 'C';
  return 'D';
}

/**
 * Resolves the higher-level catalog section tier (✦, Ø, S, A, B, C, D).
 */
export function getDinoCatalogTier(ferocity: number): DinoCatalogTier {
  if (!ferocity || ferocity <= 0) return 'D';
  if (ferocity >= 15000) return '✦';
  if (ferocity >= 9000) return 'Ø';
  if (ferocity >= 3000) return 'S';
  if (ferocity >= 2200) return 'A';
  if (ferocity >= 1400) return 'B';
  if (ferocity >= 650) return 'C';
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
 * - Tier S: 4 sub-tier divisions (S₁, S₂, S₃, S₄)
 * - Tier A: 3 sub-tier divisions (Line I High Tournaments, Line II Legendary Hybrids, Line III Solid Gold VIPs)
 * - Tier B: 3 sub-tier divisions (Line I Entry, Line II Golden Standard 1,700s, Line III High Dominator)
 * - Tiers C & D: 3 sub-tier divisions
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
        { subStep: 3, label: 'Line III (Solid Gold VIP & Elite)', minFerocity: 2750, maxFerocity: 3000, rangeLabel: '2,750 – 2,999' },
        { subStep: 2, label: 'Line II (Legendary Hybrids)', minFerocity: 2450, maxFerocity: 2750, rangeLabel: '2,450 – 2,749' },
        { subStep: 1, label: 'Line I (High Tournament & Stars)', minFerocity: 2200, maxFerocity: 2450, rangeLabel: '2,200 – 2,449' },
      ];
    case 'B':
      return [
        { subStep: 3, label: 'Line III (High Dominator)', minFerocity: 1850, maxFerocity: 2200, rangeLabel: '1,850 – 2,199' },
        { subStep: 2, label: 'Line II (⭐ 1,700s Golden Standard)', minFerocity: 1650, maxFerocity: 1850, rangeLabel: '1,650 – 1,849' },
        { subStep: 1, label: 'Line I (Tournament Core & Legends)', minFerocity: 1400, maxFerocity: 1650, rangeLabel: '1,400 – 1,649' },
      ];
    case 'C':
      return [
        { subStep: 3, label: 'Line III', minFerocity: 1150, maxFerocity: 1400, rangeLabel: '1,150 – 1,399' },
        { subStep: 2, label: 'Line II', minFerocity: 900, maxFerocity: 1150, rangeLabel: '900 – 1,149' },
        { subStep: 1, label: 'Line I (Super-Rares)', minFerocity: 650, maxFerocity: 900, rangeLabel: '650 – 899' },
      ];
    case 'D':
      return [
        { subStep: 3, label: 'Line III (Rares)', minFerocity: 450, maxFerocity: 650, rangeLabel: '450 – 649' },
        { subStep: 2, label: 'Line II (Early Rares)', minFerocity: 250, maxFerocity: 450, rangeLabel: '250 – 449' },
        { subStep: 1, label: 'Line I (Commons & Starters)', minFerocity: 0, maxFerocity: 250, rangeLabel: '0 – 249' },
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
      return '≥ 15,000 Ferocity (World Bosses & Celestial Supers)';
    case 'Ø':
      return '9,000 – 14,999 Ferocity (Tournament Super-Hybrids & Singularity)';
    case 'S':
      return '3,000 – 8,999 Ferocity (Apex Hybrids)';
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
      return '2,200 – 2,999 Ferocity (Solid Gold VIP & Super-Stars)';
    case 'B+':
      return '1,600 – 2,199 Ferocity (⭐ Dominator Golden Standard)';
    case 'B':
      return '1,400 – 2,199 Ferocity (Dominator Tournament Standard)';
    case 'C+':
      return '850 – 1,399 Ferocity';
    case 'C':
      return '650 – 1,399 Ferocity (Veterans & Super-Rares)';
    case 'D+':
      return '350 – 649 Ferocity';
    case 'D':
      return '0 – 649 Ferocity (Starters & Commons)';
    default:
      return '0 Ferocity';
  }
}

