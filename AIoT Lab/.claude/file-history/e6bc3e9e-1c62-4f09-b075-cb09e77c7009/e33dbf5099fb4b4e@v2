// path: src/apps/heraclitus/core/chronoGachaEngine.ts
// Tier 1: Pure domain logic for Chrono Flux Duration Gacha

export type GachaRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC'

export interface GachaDropTier {
  tier: GachaRarity
  weight: number // Relative probability weight
  minSeconds: number
  maxSeconds: number
  roundStepSeconds: number
  color: string
  bgGlow: string
  label: string
}

export const GACHA_TIERS: GachaDropTier[] = [
  {
    tier: 'COMMON',
    weight: 60, // 60%
    minSeconds: 900, // 15m
    maxSeconds: 2700, // 45m
    roundStepSeconds: 300, // 5m intervals
    color: '#94a3b8', // slate-400
    bgGlow: 'rgba(148, 163, 184, 0.4)',
    label: 'Standard Flux',
  },
  {
    tier: 'RARE',
    weight: 25, // 25%
    minSeconds: 3600, // 1h
    maxSeconds: 10800, // 3h
    roundStepSeconds: 900, // 15m intervals
    color: '#38bdf8', // sky-400
    bgGlow: 'rgba(56, 189, 248, 0.5)',
    label: 'Accelerated Stream',
  },
  {
    tier: 'EPIC',
    weight: 10, // 10%
    minSeconds: 14400, // 4h
    maxSeconds: 28800, // 8h
    roundStepSeconds: 1800, // 30m intervals
    color: '#c084fc', // purple-400
    bgGlow: 'rgba(192, 132, 252, 0.6)',
    label: 'Singularity Burst',
  },
  {
    tier: 'LEGENDARY',
    weight: 4, // 4%
    minSeconds: 43200, // 12h
    maxSeconds: 86400, // 24h (1 Day)
    roundStepSeconds: 3600, // 1h intervals
    color: '#fbbf24', // amber-400
    bgGlow: 'rgba(251, 191, 36, 0.7)',
    label: 'Solar Flare Overdrive',
  },
  {
    tier: 'MYTHIC',
    weight: 1, // 1%
    minSeconds: 172800, // 48h (2 Days)
    maxSeconds: 432000, // 120h (5 Days)
    roundStepSeconds: 14400, // 4h intervals
    color: '#f43f5e', // rose-500
    bgGlow: 'rgba(244, 63, 94, 0.9)',
    label: 'Eternity Flux Jackpot',
  },
]

export interface GachaRollResult {
  seconds: number
  tier: GachaRarity
  color: string
  bgGlow: string
  label: string
  formatted: string
  timestamp: string
}

export function formatGachaDuration(seconds: number): string {
  const s = Math.floor(seconds)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const remSec = s % 60

  const parts: string[] = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0 || d > 0) parts.push(`${h}h`)
  if (m > 0 || (d === 0 && h === 0)) parts.push(`${m}m`)
  if (remSec > 0 && d === 0 && h === 0) parts.push(`${remSec}s`)
  return parts.join(' ')
}

export function rollChronoDuration(): GachaRollResult {
  const totalWeight = GACHA_TIERS.reduce((acc, t) => acc + t.weight, 0)
  let rand = Math.random() * totalWeight
  let chosenTier: GachaDropTier = GACHA_TIERS[0]

  for (const tier of GACHA_TIERS) {
    if (rand < tier.weight) {
      chosenTier = tier
      break
    }
    rand -= tier.weight
  }

  // Random duration within tier range, rounded to clean step
  const rawSec = chosenTier.minSeconds + Math.random() * (chosenTier.maxSeconds - chosenTier.minSeconds)
  const steppedSec = Math.round(rawSec / chosenTier.roundStepSeconds) * chosenTier.roundStepSeconds
  const finalSec = Math.max(chosenTier.minSeconds, Math.min(chosenTier.maxSeconds, steppedSec))

  return {
    seconds: finalSec,
    tier: chosenTier.tier,
    color: chosenTier.color,
    bgGlow: chosenTier.bgGlow,
    label: chosenTier.label,
    formatted: formatGachaDuration(finalSec),
    timestamp: new Date().toISOString(),
  }
}
