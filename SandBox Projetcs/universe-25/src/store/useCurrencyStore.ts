// path: src/store/useCurrencyStore.ts

import { create } from 'zustand'
import { persistState, logAuditEvent } from '../core/syncEngine'

interface CurrencyState {
  /** Universal currency — Time in seconds */
  timeBalance: number

  /** Earn Time (add seconds) and sync to backend */
  earnTime: (seconds: number) => void

  /** Spend Time. Returns false if insufficient balance. */
  spendTime: (seconds: number) => boolean

  /** Format Time for display: "2h 15m 30s" */
  formatTime: (seconds?: number) => string

  /** Developer / Sandbox: Directly set time balance in seconds */
  setTimeBalance: (seconds: number) => void
}

export const useCurrencyStore = create<CurrencyState>()(
  (set, get) => ({
    timeBalance: 3600, // Default 1 hour anchor

    earnTime: (seconds) => {
      const added = Math.max(0, seconds)
      const newBalance = get().timeBalance + added
      set({ timeBalance: newBalance })
      persistState({ timeBalance: newBalance }).catch((err) => {
        console.error('[CurrencyStore] Failed to persist time balance to backend:', err)
      })
      logAuditEvent('TIME_EARNED', { addedSeconds: added, newBalance })
    },

    spendTime: (seconds) => {
      if (get().timeBalance < seconds) return false
      const newBalance = get().timeBalance - seconds
      set({ timeBalance: newBalance })
      persistState({ timeBalance: newBalance }).catch((err) => {
        console.error('[CurrencyStore] Failed to persist time balance to backend:', err)
      })
      logAuditEvent('TIME_SPENT', { spentSeconds: seconds, newBalance })
      return true
    },

    setTimeBalance: (seconds) => {
      const clamped = Math.max(0, seconds)
      set({ timeBalance: clamped })
      persistState({ timeBalance: clamped }).catch((err) => {
        console.error('[CurrencyStore] Failed to persist time balance to backend:', err)
      })
      logAuditEvent('TIME_SET_DEV', { newBalance: clamped })
    },

    formatTime: (seconds) => {
      const total = seconds ?? get().timeBalance
      const h = Math.floor(total / 3600)
      const m = Math.floor((total % 3600) / 60)
      const s = total % 60
      const parts: string[] = []
      if (h > 0) parts.push(`${h}h`)
      if (m > 0) parts.push(`${m}m`)
      parts.push(`${Math.floor(s)}s`)
      return parts.join(' ')
    },
  })
)
