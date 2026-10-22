import {
  PromptNode,
  GachaPool,
  GachaPoolItem,
  WildcardRegistry,
  ExclusionConfig,
  TargetEngine,
  ResolvedPromptResult,
} from '../types/schema';
import { assembleCleanPrompt, assembleNegativePrompt } from './tokenSanitizer';

/**
 * Randomly picks one item from a weighted or unweighted array.
 */
function pickWeighted<T extends { weight?: number } | string>(items: T[]): T | null {
  if (!items || items.length === 0) return null;

  const weights = items.map((item) => (typeof item === 'object' && item.weight ? item.weight : 1.0));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  return items[items.length - 1];
}

/**
 * Expands `{opt1|opt2|opt3}` dynamic choice syntaxes and `__wildcard__` references recursively.
 */
export function expandWildcards(
  text: string,
  wildcards: WildcardRegistry,
  depth = 0
): string {
  if (depth > 5) return text; // Prevent infinite recursion

  // 1. Resolve {a|b|c} choices
  let result = text.replace(/\{([^{}]+)\}/g, (_, group) => {
    const choices = group.split('|').map((s: string) => s.trim());
    return choices[Math.floor(Math.random() * choices.length)] || '';
  });

  // 2. Resolve __wildcard__ tokens
  result = result.replace(/__([a-zA-Z0-9_-]+)__/g, (match, key) => {
    const pool = wildcards[match] || wildcards[key] || wildcards[`__${key}__`];
    if (pool && pool.length > 0) {
      const picked = pickWeighted(pool);
      const tokenStr = typeof picked === 'object' && picked ? picked.token : String(picked || '');
      return expandWildcards(tokenStr, wildcards, depth + 1);
    }
    return match;
  });

  return result;
}

/**
 * Resolves the full prompt graph, rolling gacha pools, applying weights, and assembling positive/negative prompts.
 */
export function resolvePromptGraph(params: {
  activeNodes: PromptNode[];
  nodeWeights: Record<string, number>;
  gachaPools: GachaPool[];
  activeGachaPoolIds: string[];
  wildcards: WildcardRegistry;
  exclusions: ExclusionConfig;
  targetEngine: TargetEngine;
  customPositive?: string;
  customNegative?: string;
  seed?: number;
}): ResolvedPromptResult {
  const {
    activeNodes,
    nodeWeights,
    gachaPools,
    activeGachaPoolIds,
    wildcards,
    exclusions,
    targetEngine,
    customPositive = '',
    customNegative = '',
    seed = Math.floor(Math.random() * 1000000000),
  } = params;

  const rawChunks: { token: string; weight: number }[] = [];
  const activeTags: string[] = [];
  const gachaDraws: { poolId: string; poolName: string; items: string[] }[] = [];

  // 1. Process active nodes
  for (const node of activeNodes) {
    const weight = nodeWeights[node.id] !== undefined ? nodeWeights[node.id] : (node.defaultWeight || 1.0);
    const expandedToken = expandWildcards(node.token, wildcards);
    rawChunks.push({ token: expandedToken, weight });

    if (node.tags) {
      activeTags.push(...node.tags);
    }

    if (node.loras) {
      for (const lora of node.loras) {
        rawChunks.push({ token: lora, weight: 1.0 });
      }
    }
  }

  // 2. Process Gacha Pools (both explicitly active and attached to active nodes)
  const poolsToDraw = new Map<string, GachaPool>();

  for (const pool of gachaPools) {
    if (activeGachaPoolIds.includes(pool.id)) {
      poolsToDraw.set(pool.id, pool);
    }
  }

  for (const node of activeNodes) {
    if (node.gachaPoolId) {
      const pool = gachaPools.find((p) => p.id === node.gachaPoolId);
      if (pool) {
        poolsToDraw.set(pool.id, pool);
      }
    }
  }

  // Execute Gacha Draws
  poolsToDraw.forEach((pool) => {
    const drawnTokens: string[] = [];
    const count = Math.max(1, pool.drawCount || 1);

    for (let i = 0; i < count; i++) {
      if (pool.items.length === 0) continue;
      const picked = pickWeighted(pool.items);
      if (!picked) continue;

      const tokenStr = typeof picked === 'object' ? (picked as GachaPoolItem).token : String(picked);
      const weight = typeof picked === 'object' ? (picked as GachaPoolItem).weight || 1.0 : 1.0;
      const expanded = expandWildcards(tokenStr, wildcards);

      rawChunks.push({ token: expanded, weight });
      drawnTokens.push(expanded);
    }

    if (drawnTokens.length > 0) {
      gachaDraws.push({
        poolId: pool.id,
        poolName: pool.name,
        items: drawnTokens,
      });
    }
  });

  // 3. Append custom positive string if present
  if (customPositive.trim()) {
    const expandedCustom = expandWildcards(customPositive.trim(), wildcards);
    rawChunks.push({ token: expandedCustom, weight: 1.0 });
  }

  // 4. Assemble Clean Positive Prompt & Extract LoRAs
  const { prompt: positivePrompt, tokenCount, loras } = assembleCleanPrompt(
    rawChunks,
    targetEngine,
    exclusions.forbiddenKeywords || []
  );

  // 5. Assemble Negative Prompt
  const negativePrompt = assembleNegativePrompt(
    exclusions.globalNegatives || [],
    exclusions.autoNegatives || {},
    activeTags,
    customNegative
  );

  return {
    positivePrompt,
    negativePrompt,
    loras,
    tokenCount,
    activeNodes,
    gachaDraws,
    seed,
    timestamp: Date.now(),
  };
}
