// path: src/apps/golden-hour/engine/gachaEngine.ts

import type { PullItem, TicketType, GachaRarity, GlobalRankTier, ElementalAttribute } from '../types';
import { resolveItemMetaFromPacks, type RawDeckPack, type PoolEntry } from '../packs';

export interface CompiledPoolEntry {
  pool: PoolEntry;
  rate: number;
  cumulative: number;
}

export interface CompiledDeck {
  deck: RawDeckPack;
  standardPool: CompiledPoolEntry[];
  guaranteePool: string[];
}

export interface RollEngineResult {
  items: PullItem[];
  stringList: string[];
  dict: Record<string, number>;
}

// =============================================================================
// HELPER UTILITIES
// =============================================================================

function getRandomInt(min: number, max: number): number {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

// =============================================================================
// NUMERIC CUMULATIVE PROBABILITY TABLE COMPILER
// =============================================================================

export function compileDeckPool(deck: RawDeckPack): CompiledDeck {
  const totalWeight = deck.pools.reduce((sum, p) => sum + (p.weight || 0), 0) || 1;
  let cumulative = 0;

  const standardPool: CompiledPoolEntry[] = deck.pools.map((pool) => {
    const rate = pool.weight / totalWeight;
    cumulative += rate;
    return {
      pool,
      rate,
      cumulative: Math.min(1.0, cumulative),
    };
  });

  return {
    deck,
    standardPool,
    guaranteePool: deck.guarantees || [],
  };
}

// Cache compiled decks in memory
const COMPILED_DECKS_CACHE = new Map<string, CompiledDeck>();

export function getOrCompileDeck(deck: RawDeckPack): CompiledDeck {
  if (!COMPILED_DECKS_CACHE.has(deck.id)) {
    COMPILED_DECKS_CACHE.set(deck.id, compileDeckPool(deck));
  }
  return COMPILED_DECKS_CACHE.get(deck.id)!;
}

// =============================================================================
// O(1) SAMPLING & PULL ITEM BUILDER (Zero String Parsing)
// =============================================================================

function samplePoolEntry(compiled: CompiledDeck): PoolEntry {
  const roll = Math.random();
  for (const entry of compiled.standardPool) {
    if (roll <= entry.cumulative) {
      return entry.pool;
    }
  }
  return compiled.standardPool[compiled.standardPool.length - 1].pool;
}

export function createPullItemFromPool(
  pool: PoolEntry,
  ticketType: TicketType
): PullItem {
  const meta = resolveItemMetaFromPacks(pool.item_id);
  const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const rarity: GachaRarity = meta.rarity || 'common';
  const category = meta.category || 'collectible';

  const scoreMultiplier = {
    common: 2.0,
    uncommon: 4.0,
    rare: 6.0,
    epic: 8.5,
    legendary: 11.0,
  }[rarity];

  const score = Math.round((Math.random() * 1.5 + scoreMultiplier) * 100) / 100;
  const rank: GlobalRankTier =
    rarity === 'legendary' ? '✦'
    : rarity === 'epic' ? 'Ψ'
    : rarity === 'rare' ? 'S₁'
    : rarity === 'uncommon' ? 'A+'
    : 'B';

  // 1. Relic armaments
  if (category === 'relic') {
    const atk = Math.floor(Math.random() * 20 * (scoreMultiplier / 2));
    const def = Math.floor(Math.random() * 15 * (scoreMultiplier / 2));
    const spd = Math.floor(Math.random() * 10 * (scoreMultiplier / 2));
    const luck = Math.floor(Math.random() * 10 * (scoreMultiplier / 2));
    const penalty = Math.floor(Math.random() * 8) + 2;

    return {
      id,
      name: meta.name,
      description: meta.description,
      category: 'relic',
      rarity,
      rank,
      score,
      origin: ticketType,
      iconEmoji: '⚔️',
      stats: [
        { name: 'ATK', value: atk },
        { name: 'DEF', value: def },
        { name: 'SPD', value: spd - penalty },
        { name: 'LUCK', value: luck },
      ],
      buffs: [
        {
          name: `${meta.name} Resonance`,
          description: `Amplifies Golden Hour efficiency multiplier by +${(scoreMultiplier * 2.2).toFixed(1)}%.`,
          magnitude: scoreMultiplier * 0.022,
        },
      ],
      downsides: [
        {
          name: 'Entropic Friction',
          description: `Imposes a -${penalty} speed penalty during tactical traversal.`,
          severity: Math.min(5, Math.ceil(penalty / 2)),
        },
      ],
      pulledAt: new Date().toISOString(),
    };
  }

  // 2. Energy Cores (IoT Fuel)
  if (category === 'energy-core') {
    const element: ElementalAttribute = meta.energy_attribute || 'aether';
    const amount = pool.amount_range ? getRandomInt(pool.amount_range[0], pool.amount_range[1]) : 50;

    return {
      id,
      name: `${meta.name} (${amount}u)`,
      description: meta.description,
      category: 'energy-core',
      rarity,
      rank: 'D',
      score: 1.5,
      origin: ticketType,
      iconEmoji: '⚡',
      energyCores: [{ attribute: element, amount }],
      pulledAt: new Date().toISOString(),
    };
  }

  // 3. Purple DNA
  if (category === 'dna') {
    let dnaAmount = 1000;
    if (pool.amount_range) {
      const step = pool.step || 50;
      dnaAmount = getRandomInt(Math.floor(pool.amount_range[0] / step), Math.floor(pool.amount_range[1] / step)) * step;
    }

    return {
      id,
      name: `${meta.name} (+${dnaAmount.toLocaleString()})`,
      description: meta.description,
      category: 'dna',
      rarity,
      rank: rarity === 'rare' ? 'S₁' : rarity === 'uncommon' ? 'A+' : 'B',
      score: scoreMultiplier,
      origin: ticketType,
      iconEmoji: '🧬',
      dnaReward: dnaAmount,
      pulledAt: new Date().toISOString(),
    };
  }

  // 4. Red DNA Orbs
  if (category === 'red-orbs') {
    const redCount = pool.amount_range ? getRandomInt(pool.amount_range[0], pool.amount_range[1]) : 1;

    return {
      id,
      name: `${meta.name} (x${redCount})`,
      description: meta.description,
      category: 'red-orbs',
      rarity: redCount >= 2 ? 'epic' : 'rare',
      rank: redCount >= 2 ? 'Ψ' : 'S₁',
      score: scoreMultiplier,
      origin: ticketType,
      iconEmoji: '🔴',
      redOrbsReward: redCount,
      pulledAt: new Date().toISOString(),
    };
  }

  // 5. Game Time (Temporal Energy)
  if (category === 'time') {
    let seconds = 86400;
    if (pool.amount_seconds_range) {
      seconds = getRandomInt(pool.amount_seconds_range[0], pool.amount_seconds_range[1]);
    }
    const hours = Math.round(seconds / 3600);
    const label = hours >= 24 ? `${(hours / 24).toFixed(1)} Days` : `${hours} Hours`;

    return {
      id,
      name: `${meta.name} (${label})`,
      description: meta.description,
      category: 'time',
      rarity: seconds >= 86400 ? 'rare' : 'uncommon',
      rank: seconds >= 86400 ? 'S₁' : 'A+',
      score: scoreMultiplier,
      origin: ticketType,
      iconEmoji: '⏳',
      timeRewardSeconds: seconds,
      pulledAt: new Date().toISOString(),
    };
  }

  // 6. Collectibles & Vinyl Stems
  const isStem = Boolean(meta.stem_count);
  return {
    id,
    name: meta.name,
    description: meta.description,
    category: 'collectible',
    rarity: isStem ? 'legendary' : rarity,
    rank: isStem ? '✦' : rarity === 'legendary' ? '✦' : rank,
    score: isStem ? 11.85 : score,
    origin: ticketType,
    iconEmoji: isStem ? '🪽' : '🏺',
    seriesName: isStem ? 'Koi no Koe Archival Stems' : 'Babylonian Codex Archive',
    stemCount: isStem ? 1 : undefined,
    dnaReward: isStem ? 1000 : undefined,
    loreText: `Synthesized during the Golden Hour cycle from dimensional world [${ticketType}].`,
    pulledAt: new Date().toISOString(),
  };
}

// =============================================================================
// MAIN PACK ROLLING ACTION
// =============================================================================

export function executePackRoll(deck: RawDeckPack, multiplier: number = 1): RollEngineResult {
  const compiled = getOrCompileDeck(deck);
  const totalCards = Math.max(1, deck.cards_per_pull * multiplier);

  const items: PullItem[] = [];
  const stringList: string[] = [];
  const dict: Record<string, number> = {};

  // 1. Guaranteed slots if configured
  const guaranteeCount = (compiled.guaranteePool.length > 0 ? 1 : 0) * multiplier;
  for (let g = 0; g < guaranteeCount; g++) {
    const guaranteedId = compiled.guaranteePool[Math.floor(Math.random() * compiled.guaranteePool.length)];
    const matchingPool = deck.pools.find((p) => p.item_id === guaranteedId) || { item_id: guaranteedId, weight: 1 };
    const item = createPullItemFromPool(matchingPool, deck.cost.currency);
    items.push(item);
    stringList.push(`${item.name} ~ ${item.category}`);
    dict[item.name] = (dict[item.name] || 0) + 1;
  }

  // 2. Standard pool rolls
  const standardRolls = Math.max(0, totalCards - guaranteeCount);
  for (let i = 0; i < standardRolls; i++) {
    const pool = samplePoolEntry(compiled);
    const item = createPullItemFromPool(pool, deck.cost.currency);
    items.push(item);
    stringList.push(`${item.name} ~ ${item.category}`);
    dict[item.name] = (dict[item.name] || 0) + 1;
  }

  return { items, stringList, dict };
}
