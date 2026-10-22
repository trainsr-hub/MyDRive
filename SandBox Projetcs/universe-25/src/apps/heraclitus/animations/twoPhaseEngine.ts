// path: src/apps/heraclitus/animations/twoPhaseEngine.ts
// Tier 1: Core domain logic — pure functions, zero dependencies

/**
 * Two-Phase Kinetic Animation Engine
 * Canonical paradigm: Phase 1 (Spool/Charge) → Phase 2 (Shatter/Dissolve with Smooth Sink Fade)
 * Extracted from System Design Sandbox / Animations / Accumulating / 2 Phases
 */

export type TwoPhaseTheme = 'chrono' | 'prism' | 'cyber' | 'supernova';

export type TwoPhasePhase =
  | 'idle'
  | 'spooling'
  | 'shattering'
  | 'dissolving'
  | 'complete';

export interface TwoPhaseConfig {
  theme: TwoPhaseTheme;
  spoolDuration?: number;      // default: 450ms
  shatterDuration?: number;    // default: 1000ms
  dissolveDuration?: number;   // default: 1000ms (smooth sink fade)
  easing?: 'kinetic' | 'smooth-sink' | 'expo-out';
  respectReducedMotion?: boolean; // default: true
  onPhaseChange?: (phase: TwoPhasePhase) => void;
  onComplete?: () => void;
}

export interface TwoPhaseState {
  phase: TwoPhasePhase;
  progress: number;        // 0-1 within current phase
  spoolProgress: number;   // 0-1 during spooling (non-linear)
  shatterProgress: number; // 0-1 during shatter
  dissolveProgress: number; // 0-1 during dissolve
}

export interface TwoPhaseCallbacks {
  onPhaseChange?: (phase: TwoPhasePhase) => void;
  onComplete?: () => void;
}

// Default durations matching the 2 Phases source
export const DEFAULT_SPOOL_DURATION = 450;
export const DEFAULT_SHATTER_DURATION = 1000;
export const DEFAULT_DISSOLVE_DURATION = 1000;

// Kinetic easing: Math.pow(t, 1.3) — swift acceleration, matches source
export function kineticEase(t: number): number {
  return Math.pow(Math.max(0, Math.min(1, t)), 1.3);
}

// Smooth sink fade: cubic-bezier(0.22, 1, 0.36, 1) — downward dissolve, matches source
export function smoothSinkEase(t: number): number {
  // CSS cubic-bezier(0.22, 1, 0.36, 1) approximation
  // Using the cubic-bezier formula: https://cubic-bezier.com/#.22,1,.36,1
  const x = Math.max(0, Math.min(1, t));
  // Approximation via polynomial fit for the given bezier
  return 3 * (1 - x) * (1 - x) * x * 1.0 + 3 * (1 - x) * x * x * 1.0 + x * x * x;
}

// Expo-out: 1 - 2^(-10 * t) — for number rolling
export function expoOutEase(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Clamp utility
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Theme color definitions (CSS custom property compatible)
export const THEME_COLORS: Record<TwoPhaseTheme, {
  primary: string;
  secondary: string;
  glow: string;
  particleA: string;
  particleB: string;
  text: string;
  textGlow: string;
}> = {
  chrono: {
    primary: '#fbbf24',      // amber-400
    secondary: '#f97316',    // orange-500
    glow: 'rgba(251, 191, 36, 0.7)',
    particleA: '#facc15',    // yellow-400
    particleB: '#38bdf8',    // sky-400
    text: '#fef08a',         // yellow-200
    textGlow: 'rgba(254, 240, 138, 0.8)',
  },
  prism: {
    primary: '#c084fc',      // purple-400
    secondary: '#d946ef',    // fuchsia-500
    glow: 'rgba(192, 132, 252, 0.7)',
    particleA: '#e879f9',    // pink-300
    particleB: '#38bdf8',    // sky-400
    text: '#f5d0fe',         // pink-200
    textGlow: 'rgba(216, 180, 254, 0.8)',
  },
  cyber: {
    primary: '#00f0ff',      // cyan-300
    secondary: '#06b6d4',    // cyan-500
    glow: 'rgba(0, 240, 255, 0.7)',
    particleA: '#5eead4',    // teal-300
    particleB: '#22d3ee',    // cyan-300
    text: '#5eead4',         // teal-300
    textGlow: 'rgba(94, 234, 212, 0.8)',
  },
  supernova: {
    primary: '#fb923c',      // orange-400
    secondary: '#f97316',    // orange-500
    glow: 'rgba(251, 146, 60, 0.8)',
    particleA: '#ffd700',    // gold
    particleB: '#ffffff',    // white
    text: '#fff7ed',         // orange-50
    textGlow: 'rgba(255, 247, 237, 0.9)',
  },
};

// Generate CSS custom properties for a theme
export function generateThemeCSSVars(theme: TwoPhaseTheme): string {
  const colors = THEME_COLORS[theme];
  return `
  --tp-primary: ${colors.primary};
  --tp-secondary: ${colors.secondary};
  --tp-glow: ${colors.glow};
  --tp-particle-a: ${colors.particleA};
  --tp-particle-b: ${colors.particleB};
  --tp-text: ${colors.text};
  --tp-text-glow: ${colors.textGlow};
  `.trim();
}

// Phase transition thresholds
export const PHASE_THRESHOLDS = {
  spoolComplete: 1.0,
  shatterComplete: 1.0,
  dissolveComplete: 1.0,
} as const;

// Create initial state
export function createInitialState(): TwoPhaseState {
  return {
    phase: 'idle',
    progress: 0,
    spoolProgress: 0,
    shatterProgress: 0,
    dissolveProgress: 0,
  };
}

// Check if reduced motion is preferred
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Format duration for display (matching source)
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0s';
  let s = Math.floor(seconds);
  const Y = Math.floor(s / 31536000); s %= 31536000;
  const M = Math.floor(s / 2592000); s %= 2592000;
  const D = Math.floor(s / 86400); s %= 86400;
  const h = Math.floor(s / 3600); s %= 3600;
  const m = Math.floor(s / 60); const rem = s % 60;
  const parts: string[] = [];
  if (Y > 0) parts.push(`${Y}Y`);
  if (M > 0) parts.push(`${M}M`);
  if (D > 0) parts.push(`${D}D`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (rem > 0 || parts.length === 0) parts.push(`${rem}s`);
  return parts.join('');
}