// path: src/themes/tokens/christmas.ts

import type { ThemeTokens } from '../../core/types'

/**
 * Winter Solstice / Santa Festive Theme:
 * Main: Snowy White & Crisp Frost Icy Surfaces (#f8fafc / #ffffff)
 * Trim & Accents: Santa Crimson Red (#dc2626 / #ef4444) & Golden Bells (#f59e0b)
 * Contrast Text: Deep Alpine Pine & Charcoal Frost
 */
export const christmasTheme: ThemeTokens = {
  '--bg-primary': '#f0f5fa',
  '--bg-secondary': '#e2ecf5',
  '--bg-card': '#ffffff',
  '--bg-elevated': '#f8fafc',
  '--text-primary': '#0f172a',
  '--text-secondary': '#475569',
  '--text-muted': '#94a3b8',
  '--accent': '#dc2626', // Santa Red
  '--accent-hover': '#ef4444',
  '--accent-soft': 'rgba(220, 38, 38, 0.12)',
  '--border': '#cbd5e1',
  '--border-hover': '#dc2626',
  '--glow': 'rgba(220, 38, 38, 0.3)',
  '--radius': '16px',
  '--radius-sm': '8px',
  '--radius-lg': '22px',
  '--success': '#16a34a',
  '--success-soft': 'rgba(22, 163, 74, 0.15)',
  '--warning': '#d97706',
  '--warning-soft': 'rgba(217, 119, 6, 0.15)',
  '--danger': '#b91c1c',
  '--danger-soft': 'rgba(185, 28, 28, 0.15)',
  '--shadow': '0 8px 24px rgba(15, 23, 42, 0.08)',
  '--shadow-lg': '0 16px 40px rgba(15, 23, 42, 0.12)',
}
