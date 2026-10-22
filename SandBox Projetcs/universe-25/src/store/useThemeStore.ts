// path: src/store/useThemeStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { THEMES_REGISTRY } from '../themes/themes.registry'
import type { ThemeConfig } from '../core/types'

interface ThemeState {
  activeThemeId: string
  unlockedThemeIds: string[]

  setActiveTheme: (themeId: string) => void
  unlockTheme: (themeId: string) => void
  isUnlocked: (themeId: string) => boolean
  getActiveTheme: () => ThemeConfig
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      activeThemeId: 'default',
      unlockedThemeIds: ['default', 'christmas', 'valentine'], // DEV MODE: all unlocked

      setActiveTheme: (themeId) => {
        if (!get().unlockedThemeIds.includes(themeId)) return
        set({ activeThemeId: themeId })
      },

      unlockTheme: (themeId) => {
        if (get().unlockedThemeIds.includes(themeId)) return
        set((s) => ({ unlockedThemeIds: [...s.unlockedThemeIds, themeId] }))
      },

      isUnlocked: (themeId) => get().unlockedThemeIds.includes(themeId),

      getActiveTheme: () => {
        const id = get().activeThemeId
        return THEMES_REGISTRY[id] || THEMES_REGISTRY.default
      },
    }),
    { name: 'universe25-theme' },
  ),
)
