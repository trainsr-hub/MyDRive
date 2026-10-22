// path: src/store/useInventoryStore.ts

import { create } from 'zustand'
import { persistInventory, logAuditEvent } from '../core/syncEngine'

export interface DimensionalTicket {
  id: string
  name: string
  dimension: string
  icon: string
  description: string
  count: number
}

interface InventoryState {
  // Dimensional Currencies & Materials
  discs: number
  solarEssence: number
  codexFragments: number

  // Dimensional Tickets
  angelRollTickets: number
  solarRollTickets: number
  codexRollTickets: number

  // Currency methods
  addDiscs: (count: number) => void
  spendDiscs: (count: number) => boolean

  addSolarEssence: (count: number) => void
  spendSolarEssence: (count: number) => boolean

  // Ticket methods
  addAngelTickets: (count: number) => void
  spendAngelTickets: (count: number) => boolean

  addSolarTickets: (count: number) => void
  spendSolarTickets: (count: number) => boolean

  addCodexTickets: (count: number) => void
  spendCodexTickets: (count: number) => boolean

  // Developer / Testing methods
  clearTickets: () => void
}

function syncInventoryToBackend(get: () => InventoryState) {
  const current = get()
  persistInventory({
    discs: current.discs,
    solarEssence: current.solarEssence,
    codexFragments: current.codexFragments,
    angelRollTickets: current.angelRollTickets,
    solarRollTickets: current.solarRollTickets,
    codexRollTickets: current.codexRollTickets,
  }).catch((err) => {
    console.error('[InventoryStore] Failed to persist inventory to backend:', err)
  })
}

export const useInventoryStore = create<InventoryState>()(
  (set, get) => ({
    discs: 0,
    solarEssence: 0,
    codexFragments: 0,

    angelRollTickets: 0,
    solarRollTickets: 0,
    codexRollTickets: 0,

    addDiscs: (count) => {
      const added = Math.max(0, count)
      set((s) => ({ discs: s.discs + added }))
      syncInventoryToBackend(get)
      logAuditEvent('DISCS_ADDED', { count: added, total: get().discs })
    },

    spendDiscs: (count) => {
      if (get().discs < count) return false
      set((s) => ({ discs: s.discs - count }))
      syncInventoryToBackend(get)
      logAuditEvent('DISCS_SPENT', { count, remaining: get().discs })
      return true
    },

    addSolarEssence: (count) => {
      const added = Math.max(0, count)
      set((s) => ({ solarEssence: s.solarEssence + added }))
      syncInventoryToBackend(get)
      logAuditEvent('SOLAR_ESSENCE_ADDED', { count: added, total: get().solarEssence })
    },

    spendSolarEssence: (count) => {
      if (get().solarEssence < count) return false
      set((s) => ({ solarEssence: s.solarEssence - count }))
      syncInventoryToBackend(get)
      logAuditEvent('SOLAR_ESSENCE_SPENT', { count, remaining: get().solarEssence })
      return true
    },

    addAngelTickets: (count) => {
      const added = Math.max(0, count)
      set((s) => ({ angelRollTickets: s.angelRollTickets + added }))
      syncInventoryToBackend(get)
      logAuditEvent('TICKET_FORGED', { type: 'angel-roll', count: added, total: get().angelRollTickets })
    },

    spendAngelTickets: (count) => {
      if (get().angelRollTickets < count) return false
      set((s) => ({ angelRollTickets: s.angelRollTickets - count }))
      syncInventoryToBackend(get)
      logAuditEvent('TICKET_CONSUMED', { type: 'angel-roll', count, remaining: get().angelRollTickets })
      return true
    },

    addSolarTickets: (count) => {
      const added = Math.max(0, count)
      set((s) => ({ solarRollTickets: s.solarRollTickets + added }))
      syncInventoryToBackend(get)
      logAuditEvent('TICKET_FORGED', { type: 'solar-roll', count: added, total: get().solarRollTickets })
    },

    spendSolarTickets: (count) => {
      if (get().solarRollTickets < count) return false
      set((s) => ({ solarRollTickets: s.solarRollTickets - count }))
      syncInventoryToBackend(get)
      logAuditEvent('TICKET_CONSUMED', { type: 'solar-roll', count, remaining: get().solarRollTickets })
      return true
    },

    addCodexTickets: (count) => {
      const added = Math.max(0, count)
      set((s) => ({ codexRollTickets: s.codexRollTickets + added }))
      syncInventoryToBackend(get)
      logAuditEvent('TICKET_FORGED', { type: 'codex-roll', count: added, total: get().codexRollTickets })
    },

    spendCodexTickets: (count) => {
      if (get().codexRollTickets < count) return false
      set((s) => ({ codexRollTickets: s.codexRollTickets - count }))
      syncInventoryToBackend(get)
      logAuditEvent('TICKET_CONSUMED', { type: 'codex-roll', count, remaining: get().codexRollTickets })
      return true
    },

    clearTickets: () => {
      set({
        angelRollTickets: 0,
        solarRollTickets: 0,
        codexRollTickets: 0,
      })
      syncInventoryToBackend(get)
      logAuditEvent('TICKETS_CLEARED_DEV')
    },
  })
)
