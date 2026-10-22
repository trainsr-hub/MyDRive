/**
 * API Client Contracts
 */

import { Category, PromptNode, GachaPool, Preset, ResolvedPromptResult } from './schema';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  ok?: boolean;
}

// Categories
export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const res = await fetch('/api/categories');
    return res.json();
  },
  create: async (category: Omit<Category, 'id'>): Promise<Category> => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    return res.json();
  },
  delete: async (id: string): Promise<{ ok: boolean; deleted: string }> => {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// Nodes
export const nodesApi = {
  list: async (categoryId?: string): Promise<PromptNode[]> => {
    const url = categoryId ? `/api/nodes?category_id=${categoryId}` : '/api/nodes';
    const res = await fetch(url);
    return res.json();
  },
  create: async (node: Omit<PromptNode, 'id' | 'created_at'>): Promise<PromptNode> => {
    const res = await fetch('/api/nodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    });
    return res.json();
  },
  update: async (id: string, node: Omit<PromptNode, 'id' | 'created_at'>): Promise<PromptNode> => {
    const res = await fetch(`/api/nodes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(node),
    });
    return res.json();
  },
  delete: async (id: string): Promise<{ ok: boolean; deleted: string }> => {
    const res = await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// Pools
export const poolsApi = {
  list: async (): Promise<GachaPool[]> => {
    const res = await fetch('/api/pools');
    return res.json();
  },
  create: async (pool: Omit<GachaPool, 'id'>): Promise<GachaPool> => {
    const res = await fetch('/api/pools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pool),
    });
    return res.json();
  },
  delete: async (id: string): Promise<{ ok: boolean; deleted: string }> => {
    const res = await fetch(`/api/pools/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// Presets
export const presetsApi = {
  list: async (): Promise<Preset[]> => {
    const res = await fetch('/api/presets');
    return res.json();
  },
  create: async (preset: Omit<Preset, 'id' | 'created_at'>): Promise<Preset> => {
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preset),
    });
    return res.json();
  },
  delete: async (id: string): Promise<{ ok: boolean; deleted: string }> => {
    const res = await fetch(`/api/presets/${id}`, { method: 'DELETE' });
    return res.json();
  },
};

// Graph Resolution
export const graphApi = {
  resolve: async (presetId: string, seed?: number): Promise<ResolvedPromptResult> => {
    const params = new URLSearchParams({ preset_id: presetId });
    if (seed !== undefined) params.append('seed', String(seed));

    const res = await fetch(`/api/graph/resolve?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.json();
  },
};
