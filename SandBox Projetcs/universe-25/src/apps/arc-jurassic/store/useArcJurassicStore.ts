// path: src/apps/arc-jurassic/store/useArcJurassicStore.ts

import { create } from 'zustand';
import { persistArcResources, fetchArcResources } from '../../../core/syncEngine';
import resourceRawData from '../data/resource.json';

export interface ResourceData {
  jurassic_time: { amount: number; icon?: string; name?: string; unit?: string };
  dna: { amount: number; icon?: string; name?: string; unit?: string };
  red_orbs: { amount: number; icon?: string; name?: string; unit?: string };
  [key: string]: any;
}

interface ArcJurassicStoreState {
  resources: ResourceData;
  isHydrated: boolean;
  setResources: (resOrFn: ResourceData | ((prev: ResourceData) => ResourceData)) => void;
  addResources: (delta: { dna?: number; red_orbs?: number; jurassic_time?: number }) => void;
  spendResources: (cost: { dna?: number; red_orbs?: number; jurassic_time?: number }) => boolean;
  hydrateFromBackend: () => Promise<void>;
}

export const useArcJurassicStore = create<ArcJurassicStoreState>((set, get) => ({
  resources: {
    jurassic_time: {
      amount: Number((resourceRawData as any)?.jurassic_time?.amount ?? 14400),
      icon: 'https://cdn.paleo.gg/games/jwtg/images/stats/speed.png',
      name: 'Jurassic Time',
      unit: 'seconds',
    },
    dna: {
      amount: Number((resourceRawData as any)?.dna?.amount ?? 50000),
      icon: 'https://cdn.paleo.gg/games/jwtg/images/resource/dna.png',
      name: 'DNA',
      unit: 'dna',
    },
    red_orbs: {
      amount: Number((resourceRawData as any)?.red_orbs?.amount ?? 50),
      icon: 'https://cdn.paleo.gg/games/jwtg/images/hybrid-type/super-hybrid.png',
      name: 'Red Orbs',
      unit: 'orbs',
    },
  },
  isHydrated: false,

  setResources: (resOrFn) => {
    set((state) => {
      const next = typeof resOrFn === 'function' ? resOrFn(state.resources) : resOrFn;
      persistArcResources(next as any).catch((err) => {
        console.error('[ArcJurassicStore] Failed to persist resources:', err);
      });
      return { resources: next };
    });
  },

  addResources: (delta) => {
    set((state) => {
      const next: ResourceData = {
        ...state.resources,
        dna: {
          ...state.resources.dna,
          amount: Math.max(0, (state.resources.dna?.amount || 0) + (delta.dna || 0)),
        },
        red_orbs: {
          ...state.resources.red_orbs,
          amount: Math.max(0, (state.resources.red_orbs?.amount || 0) + (delta.red_orbs || 0)),
        },
        jurassic_time: {
          ...state.resources.jurassic_time,
          amount: Math.max(0, (state.resources.jurassic_time?.amount || 0) + (delta.jurassic_time || 0)),
        },
      };

      persistArcResources(next as any).catch((err) => {
        console.error('[ArcJurassicStore] Failed to persist added resources:', err);
      });

      return { resources: next };
    });
  },

  spendResources: (cost) => {
    const current = get().resources;
    if (
      (cost.dna && (current.dna?.amount || 0) < cost.dna) ||
      (cost.red_orbs && (current.red_orbs?.amount || 0) < cost.red_orbs) ||
      (cost.jurassic_time && (current.jurassic_time?.amount || 0) < cost.jurassic_time)
    ) {
      return false;
    }

    set((state) => {
      const next: ResourceData = {
        ...state.resources,
        dna: {
          ...state.resources.dna,
          amount: Math.max(0, (state.resources.dna?.amount || 0) - (cost.dna || 0)),
        },
        red_orbs: {
          ...state.resources.red_orbs,
          amount: Math.max(0, (state.resources.red_orbs?.amount || 0) - (cost.red_orbs || 0)),
        },
        jurassic_time: {
          ...state.resources.jurassic_time,
          amount: Math.max(0, (state.resources.jurassic_time?.amount || 0) - (cost.jurassic_time || 0)),
        },
      };

      persistArcResources(next as any).catch((err) => {
        console.error('[ArcJurassicStore] Failed to persist spent resources:', err);
      });

      return { resources: next };
    });

    return true;
  },

  hydrateFromBackend: async () => {
    try {
      const backendResources = await fetchArcResources();
      if (backendResources && Object.keys(backendResources).length > 0) {
        set((state) => ({
          isHydrated: true,
          resources: {
            jurassic_time: {
              amount: Number(backendResources.jurassic_time?.amount ?? state.resources.jurassic_time.amount),
              icon: backendResources.jurassic_time?.icon || state.resources.jurassic_time.icon,
              name: backendResources.jurassic_time?.name || state.resources.jurassic_time.name,
              unit: backendResources.jurassic_time?.unit || state.resources.jurassic_time.unit,
            },
            dna: {
              amount: Number(backendResources.dna?.amount ?? state.resources.dna.amount),
              icon: backendResources.dna?.icon || state.resources.dna.icon,
              name: backendResources.dna?.name || state.resources.dna.name,
              unit: backendResources.dna?.unit || state.resources.dna.unit,
            },
            red_orbs: {
              amount: Number(backendResources.red_orbs?.amount ?? state.resources.red_orbs.amount),
              icon: backendResources.red_orbs?.icon || state.resources.red_orbs.icon,
              name: backendResources.red_orbs?.name || state.resources.red_orbs.name,
              unit: backendResources.red_orbs?.unit || state.resources.red_orbs.unit,
            },
          },
        }));
      } else {
        await persistArcResources(get().resources as any);
        set({ isHydrated: true });
      }
    } catch (err) {
      console.warn('[ArcJurassicStore] Backend SQLite resources hydration notice:', err);
    }
  },
}));
