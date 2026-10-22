// path: src/apps/golden-hour/types.ts

// =============================================================================
// [GOLDEN HOUR NEXUS — MASTER GAME TYPE DEFINITIONS]
// =============================================================================

import type { GlobalRankTier } from '../../utils/rank';

// ---------------------------------------------------------------------------
// ELEMENTAL ATTRIBUTES (Multi-Attribute Energy Cores / IoT Fuel)
// ---------------------------------------------------------------------------

export type ElementalAttribute =
  | 'solar'      // Solar/Fire
  | 'void'       // Void/Dark
  | 'verdant'    // Verdant/Earth
  | 'celestial'  // Celestial/Light
  | 'aether';    // Aether/Cyber

export interface EnergyCore {
  attribute: ElementalAttribute;
  amount: number;
}

export type EnergyReserves = Record<ElementalAttribute, number>;

// ---------------------------------------------------------------------------
// DIMENSIONAL TICKET TYPES (consumed in gacha)
// ---------------------------------------------------------------------------

export type TicketType = 'angel-roll' | 'solar-roll' | 'codex-roll';

export interface TicketMeta {
  type: TicketType;
  name: string;
  origin: string;
  icon: string;
  color: string;
  description: string;
}

// ---------------------------------------------------------------------------
// GACHA RARITY TIERS
// ---------------------------------------------------------------------------

export type GachaRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface GachaRarityMeta {
  rarity: GachaRarity;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
  weight: number; // pull probability weight
}

// ---------------------------------------------------------------------------
// RELIC STATS & COMBAT TRAITS (for Tactical Battle Arena)
// ---------------------------------------------------------------------------

export interface RelicStat {
  name: string;     // e.g. "ATK", "DEF", "SPD", "LUCK"
  value: number;    // signed — can be negative (downsides)
}

export interface RelicBuff {
  name: string;        // e.g. "Golden Hour ×1.3", "Core Drop +20%"
  description: string;
  magnitude: number;   // multiplier or flat bonus
}

export interface RelicDownside {
  name: string;        // e.g. "Fragile", "Cursed Drain"
  description: string;
  severity: number;    // 1-5 scale
}

// ---------------------------------------------------------------------------
// GACHA PULL RESULT ITEM (what you get from a card pack)
// ---------------------------------------------------------------------------

export type PullItemCategory = 'relic' | 'collectible' | 'energy-core';

export interface PullItem {
  id: string;
  name: string;
  description: string;
  category: PullItemCategory;
  rarity: GachaRarity;
  rank: GlobalRankTier;
  score: number;               // hazard score for rank calculation
  origin: TicketType;          // which dimension this came from
  iconEmoji: string;

  // Relic-specific (combat equipment for Tab 1)
  stats?: RelicStat[];
  buffs?: RelicBuff[];
  downsides?: RelicDownside[];

  // Energy Core specific (IoT fuel filler)
  energyCores?: EnergyCore[];

  // Collectible specific (pure display)
  loreText?: string;
  seriesName?: string;

  pulledAt: string;            // ISO timestamp
}

// ---------------------------------------------------------------------------
// VAULT COLLECTION (Tab 3 — sorted by purpose)
// ---------------------------------------------------------------------------

export type VaultCategory = 'tactical' | 'collection' | 'energy';

// ---------------------------------------------------------------------------
// GACHA CARD PACK DEFINITION
// ---------------------------------------------------------------------------

export interface CardPack {
  id: string;
  name: string;
  description: string;
  ticketType: TicketType;
  ticketCost: number;
  color: string;
  iconEmoji: string;
  poolItems: PullItem[];      // pool of possible items (template, without pulledAt)
}

// ---------------------------------------------------------------------------
// GOLDEN HOURS & HAZARD LEVEL
// ---------------------------------------------------------------------------

export interface HazardProfile {
  goldenHours: number;         // accumulated lifetime productive hours
  hazardLevel: number;         // f(x) = 1.5 * ln(x + 1), clamped >= 0
}

// ---------------------------------------------------------------------------
// BATTLE ARENA STATE (Tab 1 — Babylonian Altar Loadout)
// ---------------------------------------------------------------------------

export interface ArenaSlot {
  slotIndex: number;           // 0-3 (4 equipment slots)
  equippedItem: PullItem | null;
}

// ---------------------------------------------------------------------------
// STORE STATE SHAPE
// ---------------------------------------------------------------------------

export interface GoldenHourState {
  // Vault — all pulled items
  vault: PullItem[];

  // Hazard Profile
  hazardProfile: HazardProfile;

  // Energy Reserves (IoT fuel)
  energyReserves: EnergyReserves;

  // Battle Arena slots
  arenaSlots: ArenaSlot[];

  // Pull history count
  totalPulls: number;

  // Actions
  pullFromPack: (ticketType: TicketType) => PullItem | null;
  equipRelic: (slotIndex: number, itemId: string) => void;
  unequipRelic: (slotIndex: number) => void;
  addGoldenHours: (hours: number) => void;
  consumeEnergy: (attribute: ElementalAttribute, amount: number) => boolean;
  getVaultByCategory: (category: VaultCategory) => PullItem[];

  // Developer / Sandbox Cheat Actions
  injectSampleRelics: () => void;
  injectEnergyReserves: (attribute: ElementalAttribute, amount: number) => void;
  clearVault: () => void;
  resetEnergyReserves: () => void;
}
