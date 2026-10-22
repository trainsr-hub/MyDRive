// path: src/apps/golden-hour/store/useGoldenHourStore.ts

import { create } from 'zustand';
import type {
  GoldenHourState,
  PullItem,
  TicketType,
  ElementalAttribute,
  GachaRarity,
  VaultCategory,
  GachaRarityMeta,
  TicketMeta,
} from '../types';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { useVinylStore } from '../../vinyl-angel/store/useVinylStore';
import { useArcJurassicStore } from '../../arc-jurassic/store/useArcJurassicStore';
import { persistVault, logAuditEvent } from '../../../core/syncEngine';
import { executePackRoll } from '../engine/gachaEngine';
import type { RawDeckPack } from '../packs';

// =============================================================================
// HAZARD LEVEL MATHEMATICAL FORMULA
// hazard = ln(x + 1), where x is golden hours (timeSeconds / 3600, clamped >= 0)
// =============================================================================

export function calculateHazardLevel(goldenHours: number): number {
  if (goldenHours < 0) return 0;
  return Math.round(Math.log(goldenHours + 1) * 100) / 100;
}

export function calculateHazardFromTime(timeBalanceSeconds: number): { timeSeconds: number; goldenHours: number; hazardLevel: number } {
  const timeSeconds = Math.max(0, timeBalanceSeconds);
  const goldenHours = timeSeconds / 3600;
  const hazardLevel = calculateHazardLevel(goldenHours);
  return { timeSeconds, goldenHours, hazardLevel };
}

// =============================================================================
// RARITY METADATA & PROBABILITY WEIGHTS
// =============================================================================

export const RARITY_TABLE: Record<GachaRarity, GachaRarityMeta> = {
  common: {
    rarity: 'common',
    label: 'Common',
    color: '#94a3b8',
    borderColor: '#475569',
    bgColor: '#1e293b',
    weight: 50,
  },
  uncommon: {
    rarity: 'uncommon',
    label: 'Uncommon',
    color: '#4ade80',
    borderColor: '#16a34a',
    bgColor: '#052e16',
    weight: 30,
  },
  rare: {
    rarity: 'rare',
    label: 'Rare',
    color: '#38bdf8',
    borderColor: '#0284c7',
    bgColor: '#082f49',
    weight: 14,
  },
  epic: {
    rarity: 'epic',
    label: 'Epic',
    color: '#c084fc',
    borderColor: '#9333ea',
    bgColor: '#3b0764',
    weight: 5,
  },
  legendary: {
    rarity: 'legendary',
    label: 'Legendary',
    color: '#fbbf24',
    borderColor: '#d97706',
    bgColor: '#451a03',
    weight: 1,
  },
};

// =============================================================================
// TICKET REGISTRY
// =============================================================================

export const TICKET_REGISTRY: Record<TicketType, TicketMeta> = {
  'angel-roll': {
    type: 'angel-roll',
    name: 'Angel Roll Ticket',
    origin: 'Vinyl Angel (Harmonic Lab)',
    icon: '🎟️',
    color: '#ffd86b',
    description: 'Earned by generating tracks, training neural audio weights, or mastering records.',
  },
  'solar-roll': {
    type: 'solar-roll',
    name: 'Solar Roll Ticket',
    origin: 'Farm Alpha / Beta (Bio-Agrarian)',
    icon: '☀️',
    color: '#f97316',
    description: 'Harvested from solar crops and agrarian yield contracts.',
  },
  'codex-roll': {
    type: 'codex-roll',
    name: 'Codex Roll Ticket',
    origin: 'Artifact Codex (Hazard Visualizer)',
    icon: '📜',
    color: '#38bdf8',
    description: 'Synthesized from hazard rank validations and dimensional matrix indexing.',
  },
  'discs': {
    type: 'discs',
    name: 'Celestial Vinyl Discs',
    origin: 'Vinyl Angel (Harmonic Player)',
    icon: '💽',
    color: '#ffffff',
    description: 'Harmonic resonance discs earned by rating, mastering, and playing vinyl music tracks.',
  },
  'shredder-ticket': {
    type: 'shredder-ticket',
    name: 'Shredder Ticket',
    origin: 'Universal Gacha Gate',
    icon: '🎫',
    color: '#ffc107',
    description: 'A9 precision-cut universal ticket — valid across ALL card pack dimensions. Tri-color authority: Blue dominion, Yellow valor, Red sovereignty.',
  },
};

// =============================================================================
// ELEMENTAL ATTRIBUTE DEFINITIONS
// =============================================================================

export const ELEMENT_REGISTRY: Record<ElementalAttribute, { name: string; color: string; icon: string }> = {
  solar: { name: 'Solar Thermal', color: '#f97316', icon: '☀️' },
  void: { name: 'Void Kinetic', color: '#a855f7', icon: '🌌' },
  verdant: { name: 'Verdant Bio', color: '#22c55e', icon: '🌿' },
  celestial: { name: 'Celestial Astral', color: '#ffd86b', icon: '✨' },
  aether: { name: 'Aether Cyber', color: '#38bdf8', icon: '⚡' },
};

// =============================================================================
// PROCEDURAL ITEM GENERATION TEMPLATES
// =============================================================================

const SAMPLE_RELIC_PREFIXES = [
  'Babylonian', 'Celestial', 'Abyssal', 'Aetheric', 'Sunforged', 'Resonant', 'Hyperborean', 'Elysian', 'Voidbound', 'Chronos'
];

const SAMPLE_RELIC_NOUNS = [
  'Blade', 'Aegis', 'Scepter', 'Harmonica', 'Gauntlet', 'Pendant', 'Hourglass', 'Codex', 'Crucible', 'Prism'
];

const SAMPLE_COLLECTIBLES = [
  { name: 'Enuma Elish Tablet Fragment', series: 'Ancient Mesopotamia', lore: 'When on high the heaven was not named, and the earth beneath yet bare no name...' },
  { name: 'First Edition Vinyl: Angelic Sine Waves', series: 'Harmonic Archives', lore: 'Mastered in the 432Hz harmonic chamber during the 2026 Solstice.' },
  { name: 'Bio-Magnetic Agrarian Core', series: 'Solar Agrarian', lore: 'A pulsating chlorophyll battery capable of sustaining miniature biosensors.' },
  { name: 'Zero-Point Matrix Crystal', series: 'Aetheric Physics', lore: 'Refracts multidimensional light into raw electrical potential.' },
];

function generateRandomItem(ticketType: TicketType): PullItem {
  // 1. Roll Rarity
  const roll = Math.random() * 100;
  let accumulated = 0;
  let chosenRarity: GachaRarity = 'common';

  for (const r of Object.values(RARITY_TABLE)) {
    accumulated += r.weight;
    if (roll <= accumulated) {
      chosenRarity = r.rarity;
      break;
    }
  }

  const categoryRoll = Math.random();
  const id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Category 1: Relic (45% chance)
  if (categoryRoll < 0.45) {
    const prefix = SAMPLE_RELIC_PREFIXES[Math.floor(Math.random() * SAMPLE_RELIC_PREFIXES.length)];
    const noun = SAMPLE_RELIC_NOUNS[Math.floor(Math.random() * SAMPLE_RELIC_NOUNS.length)];
    const name = `${prefix} ${noun}`;

    const scoreMultiplier = { common: 2.0, uncommon: 4.0, rare: 6.0, epic: 8.0, legendary: 10.0 }[chosenRarity];
    const score = Math.round((Math.random() * 2.0 + scoreMultiplier) * 100) / 100;

    const rank = chosenRarity === 'legendary' ? '✦'
      : chosenRarity === 'epic' ? 'Ψ'
      : chosenRarity === 'rare' ? 'S₁'
      : chosenRarity === 'uncommon' ? 'A+'
      : 'B';

    const atk = Math.floor(Math.random() * 15 * scoreMultiplier);
    const def = Math.floor(Math.random() * 12 * scoreMultiplier);
    const spd = Math.floor(Math.random() * 10 * scoreMultiplier);
    const luck = Math.floor(Math.random() * 8 * scoreMultiplier);

    const downsideSeverity = Math.floor(Math.random() * 3) + 1;
    const downsidePenalty = downsideSeverity * 3;

    return {
      id,
      name,
      description: `Double-edged ancient armament summoned from the ${TICKET_REGISTRY[ticketType].name}. Bestows tremendous power with a binding penalty.`,
      category: 'relic',
      rarity: chosenRarity,
      rank,
      score,
      origin: ticketType,
      iconEmoji: '⚔️',
      stats: [
        { name: 'ATK', value: atk },
        { name: 'DEF', value: def },
        { name: 'SPD', value: spd - downsidePenalty },
        { name: 'LUCK', value: luck },
      ],
      buffs: [
        {
          name: `${prefix} Resonance`,
          description: `Boosts Golden Hour yield multiplier by +${(scoreMultiplier * 2.5).toFixed(1)}%.`,
          magnitude: scoreMultiplier * 0.025,
        },
      ],
      downsides: [
        {
          name: `Curse of ${prefix}`,
          description: `Reduces combat movement speed by -${downsidePenalty} and increases stamina drain.`,
          severity: downsideSeverity,
        },
      ],
      pulledAt: new Date().toISOString(),
    };
  }

  // Category 2: Collectible (30% chance)
  if (categoryRoll < 0.75) {
    const template = SAMPLE_COLLECTIBLES[Math.floor(Math.random() * SAMPLE_COLLECTIBLES.length)];
    const scoreMultiplier = { common: 1.5, uncommon: 3.5, rare: 5.5, epic: 7.5, legendary: 9.5 }[chosenRarity];
    const score = Math.round((Math.random() * 1.5 + scoreMultiplier) * 100) / 100;

    const rank = chosenRarity === 'legendary' ? 'Ø'
      : chosenRarity === 'epic' ? 'Ψ'
      : chosenRarity === 'rare' ? 'S₂'
      : chosenRarity === 'uncommon' ? 'A'
      : 'C';

    return {
      id,
      name: template.name,
      description: `Historical archival relic representing milestone achievements across dimensional worlds.`,
      category: 'collectible',
      rarity: chosenRarity,
      rank,
      score,
      origin: ticketType,
      iconEmoji: '🏺',
      seriesName: template.series,
      loreText: template.lore,
      pulledAt: new Date().toISOString(),
    };
  }

  // Category 3: Multi-Attribute Energy Cores (IoT Fuel - 25% chance)
  const elements: ElementalAttribute[] = ['solar', 'void', 'verdant', 'celestial', 'aether'];
  const element = elements[Math.floor(Math.random() * elements.length)];
  const amount = Math.floor(Math.random() * 5 + 1) * 10;

  return {
    id,
    name: `${ELEMENT_REGISTRY[element].name} Energy Core (${amount}u)`,
    description: `Multi-attribute IoT fuel cell. Used to power real-world sensory telemetry and fitness gear.`,
    category: 'energy-core',
    rarity: chosenRarity,
    rank: 'D',
    score: 1.2,
    origin: ticketType,
    iconEmoji: '⚡',
    energyCores: [{ attribute: element, amount }],
    pulledAt: new Date().toISOString(),
  };
}

function syncVaultToBackend(get: () => GoldenHourState) {
  const current = get();
  persistVault({
    vault: current.vault,
    arenaSlots: current.arenaSlots,
    energyReserves: current.energyReserves,
    totalPulls: current.totalPulls,
  }).catch((err) => {
    console.error('[GoldenHourStore] Failed to persist vault to backend:', err);
  });
}

// =============================================================================
// ZUSTAND STORE IMPLEMENTATION
// =============================================================================

export const useGoldenHourStore = create<GoldenHourState>()(
  (set, get) => ({
    vault: [],
    hazardProfile: {
      goldenHours: 0,
      hazardLevel: 0,
    },
    energyReserves: {
      solar: 120,
      void: 50,
      verdant: 80,
      celestial: 30,
      aether: 65,
    },
    arenaSlots: [
      { slotIndex: 0, equippedItem: null },
      { slotIndex: 1, equippedItem: null },
      { slotIndex: 2, equippedItem: null },
      { slotIndex: 3, equippedItem: null },
    ],
    totalPulls: 0,
    totalPacksOpened: 0,
    lifetimeDict: {},

    // -----------------------------------------------------------------------
    // PULL PACK BATCH (High-Efficiency Multi-Pull Engine)
    // -----------------------------------------------------------------------
    pullPackBatch: (deck: RawDeckPack, multiplier: number = 1, useUniversalShredderTicket: boolean = false) => {
      const inv = useInventoryStore.getState();
      const mult = Math.max(1, multiplier);
      const currency = deck.cost.currency;
      const standardCost = deck.cost.amount * mult;
      // 1 Shredder Ticket replaces the ENTIRE cost of 1 pack roll (regardless of whether standard cost is 100 discs, 2 codex, etc.)
      const shredderTicketCost = mult * 1;

      let hasPaid = false;
      let paidViaShredder = false;

      // Check if explicitly using Shredder Ticket or if the pack itself requires Shredder Ticket
      if (useUniversalShredderTicket || currency === 'shredder-ticket') {
        if (inv.shredderTickets >= shredderTicketCost) {
          inv.spendShredderTickets(shredderTicketCost);
          hasPaid = true;
          paidViaShredder = true;
        }
      } else {
        // Attempt standard currency consumption first
        if (currency === 'angel-roll' && inv.angelRollTickets >= standardCost) {
          inv.spendAngelTickets(standardCost);
          hasPaid = true;
        } else if (currency === 'solar-roll' && inv.solarRollTickets >= standardCost) {
          inv.spendSolarTickets(standardCost);
          hasPaid = true;
        } else if (currency === 'codex-roll' && inv.codexRollTickets >= standardCost) {
          inv.spendCodexTickets(standardCost);
          hasPaid = true;
        } else if (currency === 'discs') {
          const vinylDiscs = useVinylStore.getState().discs || inv.discs || 0;
          if (vinylDiscs >= standardCost) {
            inv.spendDiscs(standardCost);
            useVinylStore.getState().spendDiscs(standardCost);
            hasPaid = true;
          }
        }

        // Seamless Wildcard Fallback: If standard currency is insufficient, allow 1:1 Shredder Ticket substitute
        if (!hasPaid && inv.shredderTickets >= shredderTicketCost) {
          inv.spendShredderTickets(shredderTicketCost);
          hasPaid = true;
          paidViaShredder = true;
        }
      }

      if (!hasPaid) {
        return null;
      }

      // 2. Execute multi-roll via compiled engine
      const { items, dict } = executePackRoll(deck, mult);

      // 3. Inject energy cores if any & accumulate cross-app resources
      let newReserves = { ...get().energyReserves };
      let totalDnaReward = 0;
      let totalRedOrbsReward = 0;
      let totalTimeRewardSeconds = 0;

      for (const item of items) {
        if (item.category === 'energy-core' && item.energyCores) {
          for (const core of item.energyCores) {
            newReserves[core.attribute] = (newReserves[core.attribute] || 0) + core.amount;
          }
        }
        if (item.dnaReward) {
          totalDnaReward += item.dnaReward;
        }
        if (item.redOrbsReward) {
          totalRedOrbsReward += item.redOrbsReward;
        }
        if (item.timeRewardSeconds) {
          totalTimeRewardSeconds += item.timeRewardSeconds;
        }
      }

      // 4. Update Arc Jurassic resources live in shared store & backend
      if (totalDnaReward > 0 || totalRedOrbsReward > 0 || totalTimeRewardSeconds > 0) {
        useArcJurassicStore.getState().addResources({
          dna: totalDnaReward,
          red_orbs: totalRedOrbsReward,
          jurassic_time: totalTimeRewardSeconds,
        });
      }

      // 4. Update lifetime dictionary tallies
      const updatedLifetimeDict = { ...get().lifetimeDict };
      for (const [key, count] of Object.entries(dict)) {
        updatedLifetimeDict[key] = (updatedLifetimeDict[key] || 0) + count;
      }

      // 5. Atomic state update
      set((state) => ({
        vault: [...items, ...state.vault],
        energyReserves: newReserves,
        totalPulls: state.totalPulls + items.length,
        totalPacksOpened: state.totalPacksOpened + mult,
        lifetimeDict: updatedLifetimeDict,
      }));

      // 6. Persist & Audit
      syncVaultToBackend(get);
      logAuditEvent('GACHA_PACK_BATCH_PULL', {
        deckId: deck.id,
        deckTitle: deck.title,
        multiplier: mult,
        itemCount: items.length,
        ticketCost: paidViaShredder ? shredderTicketCost : standardCost,
        paidViaShredder,
      });

      return { items, dict };
    },

    // -----------------------------------------------------------------------
    // PULL FROM PACK (Single Roll)
    // -----------------------------------------------------------------------
    pullFromPack: (ticketType: TicketType) => {
      const inv = useInventoryStore.getState();

      // 1. Check ticket availability and consume
      let hasTicket = false;
      if (ticketType === 'angel-roll' && inv.angelRollTickets >= 1) {
        inv.spendAngelTickets(1);
        hasTicket = true;
      } else if (ticketType === 'solar-roll' && inv.solarRollTickets >= 1) {
        inv.spendSolarTickets(1);
        hasTicket = true;
      } else if (ticketType === 'codex-roll' && inv.codexRollTickets >= 1) {
        inv.spendCodexTickets(1);
        hasTicket = true;
      } else if (ticketType === 'shredder-ticket' && inv.shredderTickets >= 1) {
        inv.spendShredderTickets(1);
        hasTicket = true;
      }

      if (!hasTicket) {
        return null;
      }

      // 2. Generate item
      const item = generateRandomItem(ticketType);

      // 3. If energy core, auto-inject into energy reserves
      let newReserves = { ...get().energyReserves };
      if (item.category === 'energy-core' && item.energyCores) {
        for (const core of item.energyCores) {
          newReserves[core.attribute] = (newReserves[core.attribute] || 0) + core.amount;
        }
      }

      // 4. Update store state
      set((state) => ({
        vault: [item, ...state.vault],
        energyReserves: newReserves,
        totalPulls: state.totalPulls + 1,
      }));

      // 5. Persist to backend and log audit event
      syncVaultToBackend(get);
      logAuditEvent('GACHA_PULL', {
        ticketType,
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        rarity: item.rarity,
        rank: item.rank,
      });

      return item;
    },

    // -----------------------------------------------------------------------
    // ARENA EQUIPMENT ACTIONS
    // -----------------------------------------------------------------------
    equipRelic: (slotIndex: number, itemId: string) => {
      const item = get().vault.find((i) => i.id === itemId);
      if (!item || item.category !== 'relic') return;

      set((state) => {
        const newSlots = state.arenaSlots.map((slot) => {
          if (slot.equippedItem?.id === itemId && slot.slotIndex !== slotIndex) {
            return { ...slot, equippedItem: null };
          }
          if (slot.slotIndex === slotIndex) {
            return { ...slot, equippedItem: item };
          }
          return slot;
        });
        return { arenaSlots: newSlots };
      });

      syncVaultToBackend(get);
      logAuditEvent('RELIC_EQUIPPED', { slotIndex, itemId, relicName: item.name });
    },

    unequipRelic: (slotIndex: number) => {
      set((state) => ({
        arenaSlots: state.arenaSlots.map((s) =>
          s.slotIndex === slotIndex ? { ...s, equippedItem: null } : s
        ),
      }));

      syncVaultToBackend(get);
      logAuditEvent('RELIC_UNEQUIPPED', { slotIndex });
    },

    // -----------------------------------------------------------------------
    // GOLDEN HOURS & HAZARD LEVEL
    // -----------------------------------------------------------------------
    addGoldenHours: (hours: number) => {
      set((state) => {
        const newHours = Math.max(0, state.hazardProfile.goldenHours + hours);
        return {
          hazardProfile: {
            goldenHours: Math.round(newHours * 100) / 100,
            hazardLevel: calculateHazardLevel(newHours),
          },
        };
      });
    },

    // -----------------------------------------------------------------------
    // ENERGY CONSUMPTION
    // -----------------------------------------------------------------------
    consumeEnergy: (attribute: ElementalAttribute, amount: number) => {
      const current = get().energyReserves[attribute] || 0;
      if (current < amount) return false;

      set((state) => ({
        energyReserves: {
          ...state.energyReserves,
          [attribute]: current - amount,
        },
      }));

      syncVaultToBackend(get);
      logAuditEvent('ENERGY_CONSUMED', { attribute, amount });
      return true;
    },

    // -----------------------------------------------------------------------
    // VAULT FILTERING
    // -----------------------------------------------------------------------
    getVaultByCategory: (category: VaultCategory) => {
      const vault = get().vault;
      switch (category) {
        case 'tactical':
          return vault.filter((i) => i.category === 'relic');
        case 'collection':
          return vault.filter((i) => i.category === 'collectible');
        case 'energy':
          return vault.filter((i) => i.category === 'energy-core');
      }
    },

    // -----------------------------------------------------------------------
    // DEVELOPER / SANDBOX CHEAT SUITE
    // -----------------------------------------------------------------------
    injectSampleRelics: () => {
      const sampleRelics: PullItem[] = [
        {
          id: `cheat_relic_1_${Date.now()}`,
          name: 'Babylonian Star Scepter',
          description: 'Forged from the primordial core of Babylon. Bestows supreme cosmic authority with moderate agility drain.',
          category: 'relic',
          rarity: 'legendary',
          rank: '✦',
          score: 11.45,
          origin: 'angel-roll',
          iconEmoji: '✨',
          stats: [
            { name: 'ATK', value: 85 },
            { name: 'DEF', value: 40 },
            { name: 'SPD', value: -12 },
            { name: 'LUCK', value: 30 },
          ],
          buffs: [
            { name: 'Gate of Babylon Mastery', description: 'Increases all gacha relic multipliers by +50%.', magnitude: 0.5 },
          ],
          downsides: [
            { name: 'Heavy Burden', description: 'Reduces combat speed by -12.', severity: 3 },
          ],
          pulledAt: new Date().toISOString(),
        },
        {
          id: `cheat_relic_2_${Date.now()}`,
          name: 'Solar Plasma Greatsword',
          description: 'Blazing broadsword radiating stellar heat. Ignites enemies at the expense of defensive resilience.',
          category: 'relic',
          rarity: 'epic',
          rank: 'Ψ',
          score: 8.85,
          origin: 'solar-roll',
          iconEmoji: '🗡️',
          stats: [
            { name: 'ATK', value: 65 },
            { name: 'DEF', value: -15 },
            { name: 'SPD', value: 20 },
            { name: 'LUCK', value: 10 },
          ],
          buffs: [
            { name: 'Solar Corona Burst', description: 'Deals 20% passive burn damage to targets.', magnitude: 0.2 },
          ],
          downsides: [
            { name: 'Fragile Shell', description: 'Reduces defense by -15.', severity: 2 },
          ],
          pulledAt: new Date().toISOString(),
        },
        {
          id: `cheat_relic_3_${Date.now()}`,
          name: 'Voidbound Aegis',
          description: 'Indestructible shield carved from the abyssal void.',
          category: 'relic',
          rarity: 'epic',
          rank: 'S₄',
          score: 7.95,
          origin: 'codex-roll',
          iconEmoji: '🛡️',
          stats: [
            { name: 'ATK', value: -10 },
            { name: 'DEF', value: 75 },
            { name: 'SPD', value: -5 },
            { name: 'LUCK', value: 15 },
          ],
          buffs: [
            { name: 'Void Barrier', description: 'Absorbs up to 40% incoming damage.', magnitude: 0.4 },
          ],
          downsides: [
            { name: 'Weight of the Void', description: 'Reduces attack power by -10.', severity: 2 },
          ],
          pulledAt: new Date().toISOString(),
        },
        {
          id: `cheat_col_1_${Date.now()}`,
          name: 'Epic of Gilgamesh (Original Cuneiform Tablet XI)',
          description: 'The ancient flood myth tablet inscribed in Akkadian cuneiform.',
          category: 'collectible',
          rarity: 'legendary',
          rank: '✦',
          score: 12.0,
          origin: 'codex-roll',
          iconEmoji: '📜',
          seriesName: 'Babylonian Prime Archive',
          loreText: 'He who saw the deep, the country’s foundation, who knew the proper ways, was wise in all things...',
          pulledAt: new Date().toISOString(),
        },
      ];

      set((state) => ({
        vault: [...sampleRelics, ...state.vault],
      }));

      syncVaultToBackend(get);
      logAuditEvent('CHEAT_RELICS_INJECTED', { count: sampleRelics.length });
    },

    injectEnergyReserves: (attribute: ElementalAttribute, amount: number) => {
      set((state) => ({
        energyReserves: {
          ...state.energyReserves,
          [attribute]: (state.energyReserves[attribute] || 0) + amount,
        },
      }));

      syncVaultToBackend(get);
      logAuditEvent('CHEAT_ENERGY_INJECTED', { attribute, amount });
    },

    clearVault: () => {
      set({
        vault: [],
        arenaSlots: [
          { slotIndex: 0, equippedItem: null },
          { slotIndex: 1, equippedItem: null },
          { slotIndex: 2, equippedItem: null },
          { slotIndex: 3, equippedItem: null },
        ],
      });

      syncVaultToBackend(get);
      logAuditEvent('VAULT_CLEARED_DEV');
    },

    resetEnergyReserves: () => {
      set({
        energyReserves: {
          solar: 100,
          void: 100,
          verdant: 100,
          celestial: 100,
          aether: 100,
        },
      });

      syncVaultToBackend(get);
      logAuditEvent('ENERGY_RESERVES_RESET_DEV');
    },
  })
);
