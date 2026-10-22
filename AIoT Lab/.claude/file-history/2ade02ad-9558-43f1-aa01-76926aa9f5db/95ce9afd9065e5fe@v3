import { create } from 'zustand';
import { App } from 'obsidian';
import {
  Category,
  PromptNode,
  GachaPool,
  WildcardRegistry,
  ExclusionConfig,
  Preset,
  TargetEngine,
  ResolvedPromptResult,
} from '../types/schema';
import { resolvePromptGraph } from '../engine/graphResolver';
import { VaultIoManager, HazardVaultData } from '../utils/vaultIo';

export interface StudioState {
  app: App | null;
  isLoading: boolean;
  categories: Category[];
  nodes: PromptNode[];
  gachaPools: GachaPool[];
  wildcards: WildcardRegistry;
  exclusions: ExclusionConfig;
  presets: Preset[];

  activePresetId: string | null;
  activeNodeIds: string[];
  nodeWeights: Record<string, number>;
  activeGachaPoolIds: string[];
  targetEngine: TargetEngine;
  customPositive: string;
  customNegative: string;
  seed: number;
  isSeedLocked: boolean;

  selectedCategoryId: string;
  lastResolved: ResolvedPromptResult | null;

  // Actions
  init: (app: App) => Promise<void>;
  reloadVaultData: () => Promise<void>;
  toggleNode: (nodeId: string) => void;
  setNodeWeight: (nodeId: string, weight: number) => void;
  toggleGachaPool: (poolId: string) => void;
  setTargetEngine: (engine: TargetEngine) => void;
  setCustomPositive: (val: string) => void;
  setCustomNegative: (val: string) => void;
  setSeed: (seed: number) => void;
  toggleSeedLock: () => void;
  setSelectedCategory: (catId: string) => void;
  loadPreset: (presetId: string) => void;
  saveCurrentPreset: (name: string, description?: string) => Promise<void>;
  reroll: () => void;
  clearSelections: () => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  app: null,
  isLoading: true,
  categories: [],
  nodes: [],
  gachaPools: [],
  wildcards: {},
  exclusions: { forbiddenKeywords: [], autoNegatives: {}, globalNegatives: [] },
  presets: [],

  activePresetId: 'preset_eva_hazard_overdrive',
  activeNodeIds: [],
  nodeWeights: {},
  activeGachaPoolIds: ['pool_her_hands', 'pool_facial_nuance', 'pool_hazard_entropy'],
  targetEngine: 'ComfyUI',
  customPositive: '',
  customNegative: '',
  seed: Math.floor(Math.random() * 1000000000),
  isSeedLocked: false,

  selectedCategoryId: 'all',
  lastResolved: null,

  init: async (app: App) => {
    set({ app, isLoading: true });
    try {
      const data: HazardVaultData = await VaultIoManager.bootstrap(app);
      set({
        categories: data.categories,
        nodes: data.nodes,
        gachaPools: data.gachaPools,
        wildcards: data.wildcards,
        exclusions: data.exclusions,
        presets: data.presets,
        isLoading: false,
      });

      // Load initial default preset if available
      const initialPreset = data.presets.find((p) => p.id === 'preset_eva_hazard_overdrive') || data.presets[0];
      if (initialPreset) {
        get().loadPreset(initialPreset.id);
      } else {
        get().reroll();
      }
    } catch (e) {
      console.error('[Hazard Trigger] Initialization error:', e);
      set({ isLoading: false });
    }
  },

  reloadVaultData: async () => {
    const { app } = get();
    if (!app) return;
    set({ isLoading: true });
    try {
      const data = await VaultIoManager.loadAll(app);
      set({
        categories: data.categories,
        nodes: data.nodes,
        gachaPools: data.gachaPools,
        wildcards: data.wildcards,
        exclusions: data.exclusions,
        presets: data.presets,
        isLoading: false,
      });
      get().reroll();
    } catch (e) {
      console.error('[Hazard Trigger] Reload error:', e);
      set({ isLoading: false });
    }
  },

  toggleNode: (nodeId: string) => {
    const { nodes, categories, activeNodeIds } = get();
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const category = categories.find((c) => c.id === targetNode.categoryId);
    const isAlreadyActive = activeNodeIds.includes(nodeId);

    let newActiveIds = [...activeNodeIds];

    if (isAlreadyActive) {
      newActiveIds = newActiveIds.filter((id) => id !== nodeId);
    } else {
      if (category && category.selectionType === 'single') {
        // Remove any other node in this same single-selection category
        const otherCategoryNodeIds = nodes
          .filter((n) => n.categoryId === category.id)
          .map((n) => n.id);
        newActiveIds = newActiveIds.filter((id) => !otherCategoryNodeIds.includes(id));
      }
      newActiveIds.push(nodeId);
    }

    set({ activeNodeIds: newActiveIds });
    get().reroll();
  },

  setNodeWeight: (nodeId: string, weight: number) => {
    const { nodeWeights } = get();
    const clamped = Math.max(0.1, Math.min(2.0, Math.round(weight * 100) / 100));
    set({ nodeWeights: { ...nodeWeights, [nodeId]: clamped } });
    get().reroll();
  },

  toggleGachaPool: (poolId: string) => {
    const { activeGachaPoolIds } = get();
    const exists = activeGachaPoolIds.includes(poolId);
    set({
      activeGachaPoolIds: exists
        ? activeGachaPoolIds.filter((id) => id !== poolId)
        : [...activeGachaPoolIds, poolId],
    });
    get().reroll();
  },

  setTargetEngine: (engine: TargetEngine) => {
    set({ targetEngine: engine });
    get().reroll();
  },

  setCustomPositive: (val: string) => {
    set({ customPositive: val });
    get().reroll();
  },

  setCustomNegative: (val: string) => {
    set({ customNegative: val });
    get().reroll();
  },

  setSeed: (seed: number) => {
    set({ seed });
    get().reroll();
  },

  toggleSeedLock: () => {
    set((state) => ({ isSeedLocked: !state.isSeedLocked }));
  },

  setSelectedCategory: (catId: string) => {
    set({ selectedCategoryId: catId });
  },

  loadPreset: (presetId: string) => {
    const { presets } = get();
    const target = presets.find((p) => p.id === presetId);
    if (!target) return;

    set({
      activePresetId: target.id,
      targetEngine: target.targetEngine || 'ComfyUI',
      activeNodeIds: [...target.activeNodeIds],
      nodeWeights: { ...(target.nodeWeights || {}) },
      customPositive: target.customPositive || '',
      customNegative: target.customNegative || '',
      activeGachaPoolIds: target.activeGachaPoolIds || [],
    });

    get().reroll();
  },

  saveCurrentPreset: async (name: string, description?: string) => {
    const {
      app,
      presets,
      targetEngine,
      activeNodeIds,
      nodeWeights,
      customPositive,
      customNegative,
      activeGachaPoolIds,
    } = get();
    if (!app) return;

    const newPreset: Preset = {
      id: `preset_${Date.now()}`,
      name,
      description: description || 'User saved configuration preset',
      targetEngine,
      activeNodeIds: [...activeNodeIds],
      nodeWeights: { ...nodeWeights },
      customPositive,
      customNegative,
      activeGachaPoolIds: [...activeGachaPoolIds],
    };

    const updatedPresets = [...presets, newPreset];
    set({ presets: updatedPresets, activePresetId: newPreset.id });
    await VaultIoManager.saveFile(app, 'presets.json', updatedPresets);
  },

  reroll: () => {
    const {
      nodes,
      activeNodeIds,
      nodeWeights,
      gachaPools,
      activeGachaPoolIds,
      wildcards,
      exclusions,
      targetEngine,
      customPositive,
      customNegative,
      seed,
      isSeedLocked,
    } = get();

    const activeNodesList = nodes.filter((n) => activeNodeIds.includes(n.id));
    const effectiveSeed = isSeedLocked ? seed : Math.floor(Math.random() * 1000000000);

    if (!isSeedLocked) {
      set({ seed: effectiveSeed });
    }

    const resolved = resolvePromptGraph({
      activeNodes: activeNodesList,
      nodeWeights,
      gachaPools,
      activeGachaPoolIds,
      wildcards,
      exclusions,
      targetEngine,
      customPositive,
      customNegative,
      seed: effectiveSeed,
    });

    set({ lastResolved: resolved });
  },

  clearSelections: () => {
    set({
      activeNodeIds: [],
      nodeWeights: {},
      customPositive: '',
      customNegative: '',
      activePresetId: null,
    });
    get().reroll();
  },
}));
