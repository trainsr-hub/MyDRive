// path: src/store/useGlobalStore.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { hydrateAllStores, persistState } from '../core/syncEngine'
import { checkBackendHealth, getBackendStatus } from '../core/api'
import type { AppManifest } from '../core/types'

/** All apps registered in Universe 25. Plugin folders in src/apps are discovered dynamically. */
export const APP_REGISTRY: AppManifest[] = [
  { id: 'golden-hour', name: 'Golden Hour', icon: '✨', description: 'Universal Stake Nexus • Babylonian Altar' },
  { id: 'vinyl-angel', name: 'Vinyl Angel', icon: '💿', description: 'Autonomous Music Laboratory' },
  { id: 'arc-jurassic', name: 'ARC Jurassic', icon: '🦕', description: 'Dino Collector & Battler' },
  // Plugin architecture: deleted folders (farm-a, farm-b) should not crash the app.
  // If restored, they are loaded as plugin tabs automatically.
]

interface GlobalState {
  // Navigation (Transient UI State)
  activeApp: string
  setActiveApp: (appId: string) => void

  // User profile
  userProfile: { name: string; avatar: string; createdAt: string } | null
  setUserProfile: (profile: GlobalState['userProfile']) => void

  // Hydration & Connection Status
  isLoaded: boolean
  isLoading: boolean
  backendError: string | null
  isOnline: boolean
  lastSavedAt: string | null

  // Backend I/O
  loadFromBackend: () => Promise<void>
  saveToBackend: (snapshot: Record<string, unknown>) => Promise<void>
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      activeApp: 'golden-hour',
      setActiveApp: (appId) => set({ activeApp: appId }),

      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),

      isLoaded: false,
      isLoading: false,
      backendError: null,
      isOnline: true,
      lastSavedAt: null,

      loadFromBackend: async () => {
        set({ isLoading: true, backendError: null })
        try {
          // 1. Authoritative health verification
          const isHealthy = await checkBackendHealth()
          if (!isHealthy) {
            const status = getBackendStatus()
            const errorMsg = status.lastError || 'Backend storage engine is offline or unreachable at http://localhost:8080'
            set({
              isLoaded: false,
              isLoading: false,
              isOnline: false,
              backendError: errorMsg,
            })
            console.error(`[GlobalStore] Backend Health Check Failed: ${errorMsg}`)
            return
          }

          // 2. Authoritative hydration across all stores
          await hydrateAllStores()

          set({
            isLoaded: true,
            isLoading: false,
            isOnline: true,
            backendError: null,
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to hydrate game state from backend'
          set({
            isLoaded: false,
            isLoading: false,
            isOnline: false,
            backendError: errorMsg,
          })
          console.error(`[GlobalStore] Hydration Critical Failure: ${errorMsg}`)
        }
      },

      saveToBackend: async (snapshot) => {
        try {
          await persistState(snapshot)
          set({ lastSavedAt: new Date().toISOString(), backendError: null, isOnline: true })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to persist state snapshot to backend'
          set({ backendError: errorMsg, isOnline: false })
          console.error(`[GlobalStore] Save Failed: ${errorMsg}`)
          throw err
        }
      },
    }),
    {
      name: 'universe25-transient-ui',
      partialize: (state) => ({ activeApp: state.activeApp }), // Strictly restrict local storage to transient UI state
    },
  ),
)
