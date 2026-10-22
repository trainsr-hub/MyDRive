// path: src/apps/golden-hour/packs/index.ts

import type { TicketType, GachaRarity, ElementalAttribute, PullItemCategory } from '../types';

/**
 * =============================================================================
 * ULTRA-EFFICIENT GACHA PACK SCHEMA SPECIFICATION
 * =============================================================================
 * Pure typed numeric definitions for zero runtime string parsing.
 */

export interface PackCost {
  currency: TicketType;
  amount: number;
}

export interface PackVisuals {
  cover_url: string;
  preview_url: string;
  accent_color: string;
  border_color: string;
  bg_gradient: string;
  button_text?: string;
}

export interface PoolEntry {
  item_id: string;
  weight: number;                              // Numeric weight (e.g. 3, 100, 300, 700)
  amount_range?: [number, number];             // [min, max] amount
  step?: number;                               // Rounding step (e.g. 50)
  amount_seconds_range?: [number, number];     // [min_seconds, max_seconds] for time rewards
}

export interface ItemDef {
  name: string;
  category: PullItemCategory;
  rarity: GachaRarity;
  icon_url?: string;
  bg_gradient?: string;
  description: string;
  stem_count?: number;
  energy_attribute?: ElementalAttribute;
}

export interface RawDeckPack {
  id: string;
  title: string;
  subtitle: string;
  cards_per_pull: number;
  cost: PackCost;
  visuals: PackVisuals;
  pools: PoolEntry[];
  guarantees?: string[];                       // Item IDs guaranteed on bonus slots
  items?: Record<string, ItemDef>;
}

// =============================================================================
// DYNAMIC GACHA PACK DISCOVERY (Glob Loader)
// =============================================================================

const packJsonModules = import.meta.glob<Record<string, any>>('./*.json', { eager: true });

export const LOADED_GACHA_PACKS: RawDeckPack[] = Object.values(packJsonModules)
  .map((m: any) => m.default || m)
  .filter((deck: any) => Boolean(deck && deck.id && deck.title && Array.isArray(deck.pools)));

/**
 * Universal Item Metadata Resolver:
 * Scans all loaded pack JSONs for an item's visual & mechanical definition.
 */
export function resolveItemMetaFromPacks(itemId: string): ItemDef {
  for (const pack of LOADED_GACHA_PACKS) {
    if (pack.items && pack.items[itemId]) {
      return pack.items[itemId];
    }
  }

  // Fallback item definition
  return {
    name: itemId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    category: 'collectible',
    rarity: 'common',
    description: 'A synthesized dimensional artifact.',
  };
}
