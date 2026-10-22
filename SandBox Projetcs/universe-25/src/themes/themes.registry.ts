// path: src/themes/themes.registry.ts

import type { ThemeConfig } from '../core/types'
import { defaultTheme } from './tokens/default'
import { christmasTheme } from './tokens/christmas'
import { valentineTheme } from './tokens/valentine'

/**
 * All themes in Universe 25.
 * Players start with 'default' unlocked; others are unlocked via missions.
 */
export const THEMES_REGISTRY: Record<string, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Cosmic Core',
    icon: '🌌',
    tokens: defaultTheme,
    unlocked: true,
  },
  christmas: {
    id: 'christmas',
    name: 'Winter Solstice',
    icon: '🎄',
    tokens: christmasTheme,
    unlocked: false, // unlocked via mission / time purchase
  },
  valentine: {
    id: 'valentine',
    name: 'Neon Blossom',
    icon: '🌸',
    tokens: valentineTheme,
    unlocked: false, // unlocked via mission / time purchase
  },
}
