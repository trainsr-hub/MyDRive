import { create } from 'zustand';
import { App } from 'obsidian';
import { ComponentScanner, ComponentFolderNode, ComponentEntry, ComponentFileNode } from '../utils/componentScanner';
import { MatrixScanner } from '../utils/matrixScanner';
import { TemplateManager } from '../utils/templateManager';
import { ConditionManager } from '../utils/conditionManager';
import {
  HazardTemplate,
  HazardActiveState,
  HazardWorkspaceState,
  MatrixDomainNode,
  MatrixStateDefinition,
  ConditionEntry,
  ConditionConflict,
} from '../types/schema';

export const RANDOM_SELECTION_KEY = '__RANDOM__';

export interface SubjectTelemetry {
  totalFemales: number;
  totalMales: number;
  visibleFemales: number;
  visibleMales: number;
  totalVisible: number;
  isSolo: boolean;
  isPOV: boolean;
}

export interface TriggerState {
  app: App | null;
  isLoading: boolean;
  isSaving: boolean;
  isTemplatesLoading: boolean;

  // Data-Driven Hierarchies & Components
  folders: ComponentFolderNode[]; // Standard standalone components (Components/)
  matrixDomains: MatrixDomainNode[]; // Dynamic two-tier hierarchical domains (Matrices/)

  // Conditions Physics Registry & Conflict Resolution
  conditions: Record<string, ConditionEntry>;
  ignoredConditionIds: string[];
  conditionConflicts: ConditionConflict[];

  selections: Record<string, string | null>; // relPath -> selectedKey | '__RANDOM__' (null = blank)
  randomPools: Record<string, string[]>; // relPath -> array of option keys allowed when rolling random

  // Dynamic Data-Driven Matrix Domain States (domainId -> array of active state IDs)
  matrixBaseStates: Record<string, string[]>; // Level 1: Constant Ground Anchors per domain
  matrixUnlockedPools: Record<string, string[]>; // Level 2: Unlocked Dynamic Pools per domain

  // Universal Gacha-Lock Registry & Template Niche Unlocking Keys
  globalLockedKeys: Record<string, boolean>; // relPath:key -> isLocked (locked across all normal templates)
  unlockLockedAll: boolean; // Master override to unlock all niche locked options for active template
  unlockKeys: string[]; // Specific domain lock keys unlocked by active template (e.g. ['niche', 'extreme', 'harem'])
  unlockedOptionKeys: string[]; // Specific option paths unlocked

  // Template-Scoped Component Lock Registry
  // Lock applies to this template only: { relPath: lockedKey } -> pins a specific option when in random mode
  // Note: These locks bind the rolled option locally; if a component rolls differently, the locked result stays pinned.
  perTemplateLockSelections?: Record<string, string>; // Template-level pinned random rolls

  // Local Locked Random Rolls Registry (Component in random mode with a pinned roll for the active workspace/session)
  lockedRandomSelections: Record<string, string>; // relPath -> lockedOptionKey

  resolvedSelections: Record<string, string | null>; // relPath -> actually chosen key for current generation
  randomCount: number; // number of components set to RANDOM_SELECTION_KEY
  rollCount: number; // incremented on each generation / roll

  // Template State
  templates: HazardTemplate[];
  activeTemplate: HazardTemplate | null;

  // Computed State
  telemetry: SubjectTelemetry;
  activeKeywords: string[];
  activeExclusions: string[];
  compiledPrompt: string;
  tokenCount: number;

  // Actions
  init: (app: App) => Promise<void>;
  reload: () => Promise<void>;
  selectOption: (relPath: string, key: string | null) => void;
  rerollRandoms: () => void;
  randomizeAll: () => void;
  clearAllSelections: () => void;

  // Condition Actions
  ignoreCondition: (condId: string) => void;
  unignoreCondition: (condId: string) => void;
  clearIgnoredConditions: () => void;

  // Local Locked Random Roll Actions
  lockRandomOption: (relPath: string, key?: string) => void;
  unlockRandomOption: (relPath: string) => void;
  unlockAllRandomOptions: () => void;
  toggleLockRandomOption: (relPath: string) => void;

  // Random Pool Granular Actions
  toggleRandomOption: (relPath: string, optionKey: string, allKeys: string[]) => void;
  selectAllForRandom: (relPath: string, allKeys: string[]) => void;
  deselectAllForRandom: (relPath: string) => void;

  // Dynamic Data-Driven Matrix Domain Actions
  toggleMatrixBaseState: (domainId: string, stateId: string) => void;
  selectAllMatrixBaseStates: (domainId: string) => void;
  clearMatrixBaseStates: (domainId: string) => void;

  toggleMatrixUnlockedPool: (domainId: string, stateId: string) => void;
  selectAllMatrixUnlockedPools: (domainId: string) => void;
  clearMatrixUnlockedPools: (domainId: string) => void;
  clearMatrixDomain: (domainId: string) => void;

  // Universal Lock Actions (Works across all components)
  toggleGlobalOptionLock: (relPath: string, optionKey: string) => void;
  setUnlockLockedAll: (val: boolean) => void;
  setUnlockKeys: (keys: string[]) => void;
  toggleUnlockKey: (key: string) => void;

  // Template Actions
  loadTemplates: () => Promise<void>;
  saveCurrentAsTemplate: (
    name: string,
    description?: string,
    category?: string,
    tags?: string[],
    unlockLockedAll?: boolean,
    unlockKeys?: string[]
  ) => Promise<HazardTemplate | null>;
  updateActiveTemplate: () => Promise<void>;
  applyTemplate: (template: HazardTemplate) => Promise<void>;
  deleteTemplate: (template: HazardTemplate) => Promise<void>;
  detachActiveTemplate: () => void;

  // Template-Scoped Component Lock Actions
  // When a template defines `lock: { relPath: optionKey }`, that component's roll is pinned locally for that template.
  setTemplateLock: (template: HazardTemplate | null, lockSelections: Record<string, string>) => void;
  applyTemplateLockSelections: (templateLock: Record<string, string>) => void;
  removeTemplateLockSelection: (relPath: string) => void;

  // Workspace State
  _workspace: HazardWorkspaceState;
  setWorkspaceState: (patch: Partial<HazardWorkspaceState>) => void;
}

/**
 * Expands `{opt1|opt2|opt3}` inline dynamic choice syntaxes.
 */
function expandInlineChoices(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_, group) => {
    const choices = group.split('|').map((s: string) => s.trim()).filter(Boolean);
    if (choices.length === 0) return '';
    return choices[Math.floor(Math.random() * choices.length)] || '';
  });
}

/**
 * Dynamically filters random pools for any matrix domain based on active base states & unlocked pools.
 */
function applyMatrixDomainFilters(
  matrixDomains: MatrixDomainNode[],
  currentRandomPools: Record<string, string[]>,
  matrixBaseStates: Record<string, string[]>,
  matrixUnlockedPools: Record<string, string[]>
): Record<string, string[]> {
  const updatedPools = { ...currentRandomPools };

  for (const domain of matrixDomains) {
    const baseStates = matrixBaseStates[domain.domainId] || [];
    const unlockedPools = matrixUnlockedPools[domain.domainId] || [];
    const combinedActiveStates = Array.from(new Set([...baseStates, ...unlockedPools]));

    for (const file of domain.files) {
      const allOptionKeys = Object.keys(file.entries);
      if (combinedActiveStates.length === 0) {
        // When no matrix states are selected, all options remain active
        updatedPools[file.relPath] = allOptionKeys;
      } else {
        // Filter options matching any of the active matrix states
        const matchingKeys = allOptionKeys.filter((key) => {
          const entry = file.entries[key];
          const entryTags = [
            ...(Array.isArray(entry.emotions) ? entry.emotions : []),
            ...(Array.isArray(entry.postures) ? entry.postures : []),
            ...(Array.isArray(entry.tags) ? entry.tags : []),
            ...(Array.isArray(entry.keywords) ? entry.keywords : []),
          ].map((t: string) => t.toLowerCase().trim());

          return entryTags.some((tag: string) => combinedActiveStates.includes(tag));
        });

        updatedPools[file.relPath] = matchingKeys.length > 0 ? matchingKeys : allOptionKeys;
      }
    }
  }

  return updatedPools;
}

/**
 * Recursively resolves a ComponentEntry's full Tag-Team inheritance lineage.
 * Traverses tag_team IDs to inherit:
 * 1. Precondition Requirements (Preconditions needed)
 * 2. Asserted Impacts / Keywords (State assertions)
 * 3. Base prompt tokens (Base building blocks prepended before specific prompts)
 * 4. Anti-prompt exclusions
 * 5. Subject vector modifications
 */
export function resolveTagTeamLineage(
  entry: ComponentEntry,
  lookup: (key: string) => ComponentEntry | undefined
): {
  allEntries: ComponentEntry[];
  combinedRequirements: string[];
  combinedImpacts: string[];
  combinedExclusions: string[];
  combinedPromptTokens: string[];
  subjects?: [number, number];
} {
  const visited = new Set<string>();
  const lineage: ComponentEntry[] = [];
  const queue: ComponentEntry[] = [entry];

  while (queue.length > 0) {
    const current = queue.shift()!;
    lineage.push(current);

    if (Array.isArray(current.tag_team)) {
      for (const tagKey of current.tag_team) {
        const clean = tagKey.trim();
        if (clean && !visited.has(clean)) {
          visited.add(clean);
          const parentEntry = lookup(clean);
          if (parentEntry) {
            queue.push(parentEntry);
          }
        }
      }
    }
  }

  const combinedReqSet = new Set<string>();
  const combinedImpactSet = new Set<string>();
  const combinedExclusionSet = new Set<string>();
  let combinedSubjects: [number, number] | undefined = undefined;

  // Process lineage in reverse (base blocks first, derived entry last)
  const reversedLineage = [...lineage].reverse();
  const rawTokensList: string[] = [];

  for (const item of reversedLineage) {
    // Requirements
    const reqs = [
      ...(Array.isArray(item.requirement) ? item.requirement : []),
      ...(Array.isArray(item.require) ? item.require : []),
    ];
    reqs.forEach((r) => {
      const clean = r.toLowerCase().trim();
      if (clean) combinedReqSet.add(clean);
    });

    // Impacts
    const impacts = [
      ...(Array.isArray(item.impact) ? item.impact : []),
      ...(Array.isArray(item.keywords) ? item.keywords : []),
    ];
    impacts.forEach((i) => {
      const clean = i.toLowerCase().trim();
      if (clean) combinedImpactSet.add(clean);
    });

    // Exclusions / Anti-prompt
    const antiTokens = typeof item['anti-prompt'] === 'string'
      ? item['anti-prompt'].split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(item.exclude)
      ? item.exclude
      : [];
    antiTokens.forEach((e) => {
      const clean = e.toLowerCase().trim();
      if (clean) combinedExclusionSet.add(clean);
    });

    // Prompt tokens
    if (item.prompt && item.prompt.trim()) {
      const expanded = expandInlineChoices(item.prompt);
      expanded.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => rawTokensList.push(t));
    }

    // Subjects: inherit most specific if defined
    if (Array.isArray(item.subjects) && item.subjects.length >= 2) {
      combinedSubjects = [item.subjects[0], item.subjects[1]];
    }
  }

  // Filter raw tokens by combined exclusions
  const exclusionsLower = Array.from(combinedExclusionSet);
  const filteredTokens: string[] = [];
  const seen = new Set<string>();

  for (const token of rawTokensList) {
    const clean = token.toLowerCase();
    if (!exclusionsLower.includes(clean) && !seen.has(clean)) {
      seen.add(clean);
      filteredTokens.push(token);
    }
  }

  return {
    allEntries: lineage,
    combinedRequirements: Array.from(combinedReqSet),
    combinedImpacts: Array.from(combinedImpactSet),
    combinedExclusions: Array.from(combinedExclusionSet),
    combinedPromptTokens: filteredTokens,
    subjects: combinedSubjects,
  };
}

function calculateState(
  folders: ComponentFolderNode[],
  matrixDomains: MatrixDomainNode[],
  selections: Record<string, string | null>,
  randomPools: Record<string, string[]> = {},
  matrixBaseStates: Record<string, string[]> = {},
  matrixUnlockedPools: Record<string, string[]> = {},
  unlockLockedAll: boolean = false,
  unlockKeys: string[] = [],
  unlockedOptionKeys: string[] = [],
  globalLockedKeys: Record<string, boolean> = {},
  lockedRandomSelections: Record<string, string> = {},
  conditions: Record<string, ConditionEntry> = {},
  ignoredConditionIds: string[] = []
) {
  let totalFemales = 0;
  let totalMales = 0;
  let povDeltaFemales = 0;
  let povDeltaMales = 0;
  let isPOV = false;

  const resolvedSelections: Record<string, string | null> = {};
  const activeEntries: { entry: ComponentEntry; fileRelPath: string }[] = [];
  const activeKeywordsSet = new Set<string>();
  const activeExclusionsSet = new Set<string>();
  let randomCount = 0;

  const cleanUnlockKeys = (unlockKeys || []).map((k) => k.toLowerCase().trim());
  const cleanUnlockedOptionKeys = (unlockedOptionKeys || []).map((k) => k.toLowerCase().trim());

  // Helper to gather all files across standalone folders and matrix domains
  const allFolderContainers: { displayName: string; relPath: string; files: ComponentFileNode[]; isMatrixDomain?: boolean; domain?: MatrixDomainNode }[] = [
    ...folders.map((f) => ({ displayName: f.displayName, relPath: f.relPath, files: f.files })),
    ...matrixDomains.map((d) => ({ displayName: d.displayName, relPath: d.relPath, files: d.files, isMatrixDomain: true, domain: d })),
  ];

  // 1. Pass 1: Gather fixed (non-random) active selected entries to establish constraints
  for (const container of allFolderContainers) {
    for (const file of container.files) {
      const selectedKey = selections[file.relPath];
      if (selectedKey === RANDOM_SELECTION_KEY) {
        randomCount++;
        continue;
      }

      if (selectedKey && file.entries[selectedKey]) {
        const entry = file.entries[selectedKey];
        resolvedSelections[file.relPath] = selectedKey;
        activeEntries.push({ entry, fileRelPath: file.relPath });

        // NEW: Resolve tag_team inheritance for this fixed entry
        const lineage = resolveTagTeamLineage(entry, (key) => {
          for (const c of allFolderContainers) {
            for (const f of c.files) {
              if (f.entries[key]) return f.entries[key];
            }
          }
          return undefined;
        });

        // Collect inherited impacts and keywords into active keywords
        lineage.combinedImpacts.forEach((k) => activeKeywordsSet.add(k));
        lineage.combinedRequirements.forEach((r) => activeKeywordsSet.add(r));
        lineage.combinedExclusions.forEach((e) => activeExclusionsSet.add(e));

        if (activeEntries.length > 0) {
          (activeEntries[activeEntries.length - 1] as any).inheritedPromptTokens = lineage.combinedPromptTokens;
        }

        // Collect keywords & impacts (explicit ones)
        const impacts = [
          ...(Array.isArray(entry.impact) ? entry.impact : []),
          ...(Array.isArray(entry.keywords) ? entry.keywords : []),
        ];
        impacts.forEach((k) => activeKeywordsSet.add(k.toLowerCase().trim()));

        // Collect exclusions & anti-prompt
        const antiTokens = typeof entry['anti-prompt'] === 'string'
          ? entry['anti-prompt'].split(',').map((t) => t.trim()).filter(Boolean)
          : Array.isArray(entry.exclude)
          ? entry.exclude
          : [];
        antiTokens.forEach((e) => activeExclusionsSet.add(e.toLowerCase().trim()));

        // Parse subjects vector: [females, males]
        if (Array.isArray(entry.subjects) && entry.subjects.length >= 2) {
          const [f, m] = entry.subjects;
          if (f < 0 || m < 0 || (entry.keywords && entry.keywords.includes('pov'))) {
            povDeltaFemales += f;
            povDeltaMales += m;
            isPOV = true;
          } else {
            totalFemales += f;
            totalMales += m;
          }
        }
      } else {
        resolvedSelections[file.relPath] = null;
      }
    }
  }

  // Pre-Pass 2 Resolution: Compute Base Subject Cardinality & Context Keywords
  let visibleFemales = Math.max(0, totalFemales + povDeltaFemales);
  let visibleMales = Math.max(0, totalMales + povDeltaMales);
  let totalVisible = visibleFemales + visibleMales;
  let isSolo = totalVisible === 1;

  if (isSolo) {
    activeKeywordsSet.add('solo');
    activeKeywordsSet.add('single_visible');
  } else if (totalVisible === 2) {
    activeKeywordsSet.add('duo_visible');
    activeKeywordsSet.add('multiple_visible');
  } else if (totalVisible >= 3) {
    activeKeywordsSet.add('group_visible');
    activeKeywordsSet.add('multiple_visible');
  }

  if (isPOV) {
    activeKeywordsSet.add('pov');
  }

  // Inject Base Anchor Keywords across all Matrix Domains
  for (const domain of matrixDomains) {
    const activeBaseIds = matrixBaseStates[domain.domainId] || [];
    for (const baseId of activeBaseIds) {
      activeKeywordsSet.add(baseId);
      activeKeywordsSet.add(`${domain.domainId}_base`);
    }
  }

  // 2. Pass 2: Resolve random components dynamically honoring subset random pool, universal locked gacha exclusion, priority & active exclusions
  for (const container of allFolderContainers) {
    for (const file of container.files) {
      const selectedKey = selections[file.relPath];
      if (selectedKey !== RANDOM_SELECTION_KEY) continue;

      const allOptionKeys = Object.keys(file.entries);
      if (allOptionKeys.length === 0) {
        resolvedSelections[file.relPath] = null;
        continue;
      }

      // Check if user has defined a subset random pool for this file
      const customPool = randomPools[file.relPath];
      const baseCandidateKeys = Array.isArray(customPool)
        ? allOptionKeys.filter((k) => customPool.includes(k))
        : allOptionKeys;

      // Filter out hidden options (visible === false) and Locked/Niche options unless unlocked
      const candidateKeys = baseCandidateKeys.filter((key) => {
        const entry = file.entries[key];
        if (!entry || entry.visible === false) return false;

        const isLocked = Boolean(
          entry.locked ||
          entry.lock ||
          entry.is_locked ||
          globalLockedKeys[`${file.relPath}:${key}`] ||
          globalLockedKeys[key]
        );

        if (!isLocked) return true;

        // Check if unlocked by template metadata
        if (unlockLockedAll) return true;
        if (entry.lockKey && cleanUnlockKeys.includes(entry.lockKey.toLowerCase().trim())) return true;
        if (cleanUnlockedOptionKeys.includes(`${file.relPath}:${key}`.toLowerCase()) || cleanUnlockedOptionKeys.includes(key.toLowerCase())) return true;

        // Locked out of gacha!
        return false;
      });

      if (candidateKeys.length === 0) {
        // All options were deselected or locked out of gacha
        resolvedSelections[file.relPath] = null;
        continue;
      }

      const activeKw = Array.from(activeKeywordsSet);
      const activeEx = Array.from(activeExclusionsSet);

      const greenKeys: string[] = [];
      const blueKeys: string[] = [];
      const neutralKeys: string[] = [];
      const redKeys: string[] = [];

      for (const key of candidateKeys) {
        const entry = file.entries[key];
        const keywords = [
          ...(Array.isArray(entry.impact) ? entry.impact : []),
          ...(Array.isArray(entry.keywords) ? entry.keywords : []),
        ].map((k) => k.toLowerCase().trim());
        const requires = [
          ...(Array.isArray(entry.requirement) ? entry.requirement : []),
          ...(Array.isArray(entry.require) ? entry.require : []),
        ].map((r) => r.toLowerCase().trim());
        const negates = (entry.negate || []).map((n) => n.toLowerCase().trim());

        const isExcluded = keywords.some((k) => activeEx.includes(k));
        const isNegated = negates.some((n) => activeKw.includes(n));

        if (isExcluded || isNegated) {
          redKeys.push(key);
          continue;
        }

        if (requires.length === 0) {
          greenKeys.push(key);
          continue;
        }

        const matchedReqs = requires.filter((r) => activeKw.includes(r)).length;
        if (matchedReqs === requires.length) {
          greenKeys.push(key);
        } else if (matchedReqs > 0) {
          blueKeys.push(key);
        } else {
          neutralKeys.push(key);
        }
      }

      // Check if user has locked this specific random roll locally
      let chosenKey: string | null = null;
      const lockedRollKey = lockedRandomSelections[file.relPath];
      if (lockedRollKey && file.entries[lockedRollKey]) {
        chosenKey = lockedRollKey;
      } else {
        // Pick randomly from highest eligible tier pool among allowed candidate keys
        let pool = greenKeys;
        if (pool.length === 0) {
          pool = blueKeys.length > 0 ? blueKeys : neutralKeys;
        }
        if (pool.length === 0) {
          pool = candidateKeys.filter((k) => !redKeys.includes(k));
        }
        if (pool.length === 0) {
          pool = candidateKeys; // Fallback to candidate keys
        }

        chosenKey = pool[Math.floor(Math.random() * pool.length)] || null;
      }

      resolvedSelections[file.relPath] = chosenKey;

      if (chosenKey && file.entries[chosenKey]) {
        const entry = file.entries[chosenKey];
        activeEntries.push({ entry, fileRelPath: file.relPath });

        // NEW: Resolve tag_team inheritance for this entry and inherit requirements/impacts
        const lineage = resolveTagTeamLineage(entry, (key) => {
          for (const c of allFolderContainers) {
            for (const f of c.files) {
              if (f.entries[key]) return f.entries[key];
            }
          }
          return undefined;
        });

        // Collect inherited impacts and keywords into active keywords
        lineage.combinedImpacts.forEach((k) => activeKeywordsSet.add(k));
        lineage.combinedRequirements.forEach((r) => activeKeywordsSet.add(r));

        // Also collect inherited exclusions
        lineage.combinedExclusions.forEach((e) => activeExclusionsSet.add(e));

        // Store inherited prompt tokens for later prompt compilation
        if (activeEntries.length > 0) {
          (activeEntries[activeEntries.length - 1] as any).inheritedPromptTokens = lineage.combinedPromptTokens;
        }

        const impacts = [
          ...(Array.isArray(entry.impact) ? entry.impact : []),
          ...(Array.isArray(entry.keywords) ? entry.keywords : []),
        ];
        impacts.forEach((k) => activeKeywordsSet.add(k.toLowerCase().trim()));

        const antiTokens = typeof entry['anti-prompt'] === 'string'
          ? entry['anti-prompt'].split(',').map((t) => t.trim()).filter(Boolean)
          : Array.isArray(entry.exclude)
          ? entry.exclude
          : [];
        antiTokens.forEach((e) => activeExclusionsSet.add(e.toLowerCase().trim()));

        if (Array.isArray(entry.subjects) && entry.subjects.length >= 2) {
          const [f, m] = entry.subjects;
          if (f < 0 || m < 0 || (entry.keywords && entry.keywords.includes('pov'))) {
            povDeltaFemales += f;
            povDeltaMales += m;
            isPOV = true;
          } else {
            totalFemales += f;
            totalMales += m;
          }
        }
      }
    }
  }

  // 3. Re-compute Visible Numbers with any dynamic additions
  visibleFemales = Math.max(0, totalFemales + povDeltaFemales);
  visibleMales = Math.max(0, totalMales + povDeltaMales);
  totalVisible = visibleFemales + visibleMales;
  isSolo = totalVisible === 1;

  // 4. Condition Collision & Physics Engine
  const activeConditionIds = new Set<string>();

  // 3. Expand tag_team: inherit requirements and impacts from parent base components
  //    When a component entry defines tag_team (e.g. "lying on back" inherits from "lying"),
  //    the parent block's conditions propagate down to the derived component.
  console.log('[ConditionEngine] Expanding tag_team from active conditions:', Array.from(activeConditionIds));
  const inheritedConditions = new Map<string, ConditionEntry>();
  Array.from(activeConditionIds).forEach((condId) => {
    const cond = conditions[condId];
    if (cond && Array.isArray(cond.tag_team)) {
      cond.tag_team.forEach((ttId) => {
        if (ttId && !ignoredConditionIds.includes(ttId) && conditions[ttId]) {
          inheritedConditions.set(ttId, conditions[ttId]);
        }
      });
    }
  });

  // Additionally propagate conditions through component-level tag_team inheritance
  const allLibraryLookup = (key: string): ComponentEntry | undefined => {
    for (const c of allFolderContainers) {
      for (const f of c.files) {
        if (f.entries[key]) return f.entries[key];
      }
    }
    return undefined;
  };

  for (const { entry, fileRelPath } of activeEntries) {
    if (Array.isArray(entry.tag_team) && entry.tag_team.length > 0) {
      for (const parentKey of entry.tag_team) {
        const parentEntry = allLibraryLookup(parentKey);
        if (parentEntry) {
          // Propagate the parent's conditions to the derived component's assertions.
          const parentReqs = [
            ...(Array.isArray(parentEntry.requirement) ? parentEntry.requirement : []),
            ...(Array.isArray(parentEntry.require) ? parentEntry.require : []),
          ];
          const parentImpacts = [
            ...(Array.isArray(parentEntry.impact) ? parentEntry.impact : []),
            ...(Array.isArray(parentEntry.keywords) ? parentEntry.keywords : []),
          ];
          parentReqs.forEach((r) => activeConditionIds.add(r.trim()));
          parentImpacts.forEach((i) => activeConditionIds.add(i.trim()));
        }
      }
    }
    const impacts = [
      ...(Array.isArray(entry.impact) ? entry.impact : []),
      ...(Array.isArray(entry.keywords) ? entry.keywords : []),
    ];
    impacts.forEach((imp) => {
      const clean = imp.trim();
      if (clean) activeConditionIds.add(clean);
    });
  }

  // Expand tag_team on active conditions
  console.log('[ConditionEngine] Expanding tag_team from active conditions:', Array.from(activeConditionIds));
  Array.from(activeConditionIds).forEach((condId) => {
    const cond = conditions[condId];
    if (cond && Array.isArray(cond.tag_team)) {
      cond.tag_team.forEach((ttId) => {
        if (ttId && !ignoredConditionIds.includes(ttId)) {
          activeConditionIds.add(ttId);
        }
      });
    }
  });

  // Detect Condition Collisions
  console.log('[ConditionEngine] Checking conflicts for active conditions:', Array.from(activeConditionIds).map((id) => conditions[id]?.display_name || id));
  const conditionConflicts: ConditionConflict[] = [];
  const processedConflictPairs = new Set<string>();

  Array.from(activeConditionIds).forEach((condId) => {
    if (ignoredConditionIds.includes(condId)) return;
    const condA = conditions[condId];
    if (!condA || !Array.isArray(condA.conflicts_with)) return;

    condA.conflicts_with.forEach((conflictingId) => {
      if (ignoredConditionIds.includes(conflictingId)) return;
      if (activeConditionIds.has(conflictingId)) {
        const pairKey = [condId, conflictingId].sort().join('::');
        if (!processedConflictPairs.has(pairKey)) {
          processedConflictPairs.add(pairKey);
          const condB = conditions[conflictingId];
          console.log('[ConditionEngine] Conflict detected:', condId, `(${condA.display_name || condId})`, '↔', conflictingId, `(${condB?.display_name || conflictingId})`);
          conditionConflicts.push({
            conditionAId: condId,
            conditionAName: condA.display_name || condId,
            conditionBId: conflictingId,
            conditionBName: condB?.display_name || conflictingId,
            resolved: false,
          });
        }
      }
    });
  });

  // 5. Compile Master Prompt Chunked by Subfolder separated by "\nBREAK, \n"
  const folderBlocks: string[] = [];
  const seenTokens = new Set<string>();

  for (const container of allFolderContainers) {
    const blockTokens: string[] = [];

    // If container is a Matrix Domain, inject active Base Anchor Prompts first
    if (container.isMatrixDomain && container.domain) {
      const activeBaseIds = matrixBaseStates[container.domain.domainId] || [];
      for (const baseId of activeBaseIds) {
        const stateDef = container.domain.states.find((s) => s.id === baseId);
        if (stateDef && stateDef.basePrompt) {
          const baseTokens = stateDef.basePrompt.split(',').map((t) => t.trim()).filter(Boolean);
          for (const token of baseTokens) {
            const clean = token.toLowerCase();
            if (!activeExclusionsSet.has(clean) && !seenTokens.has(clean)) {
              seenTokens.add(clean);
              blockTokens.push(token);
            }
          }
        }
      }
    }

    // Collect active resolved tokens for each file in this folder container
    for (const file of container.files) {
      const resolvedKey = resolvedSelections[file.relPath];
      if (resolvedKey && file.entries[resolvedKey]) {
        const entry = file.entries[resolvedKey];

        // Check if any required condition of this option is ignored
        const entryReqs = [
          ...(Array.isArray(entry.requirement) ? entry.requirement : []),
          ...(Array.isArray(entry.require) ? entry.require : []),
        ];
        const isBypassed = entryReqs.some((r) => ignoredConditionIds.includes(r.trim()));
        if (isBypassed) {
          // Bypassed because a required condition was ignored by the Manager
          continue;
        }

        // NEW: Include inherited prompt tokens from tag_team lineage
        const activeEntry = activeEntries.find((e) => e.fileRelPath === file.relPath && e.entry === entry);
        if (activeEntry && (activeEntry as any).inheritedPromptTokens) {
          const inheritedTokens = (activeEntry as any).inheritedPromptTokens;
          for (const token of inheritedTokens) {
            const clean = token.toLowerCase();
            if (!activeExclusionsSet.has(clean) && !seenTokens.has(clean)) {
              seenTokens.add(clean);
              blockTokens.push(token);
            }
          }
        }

        if (entry.prompt && entry.prompt.trim()) {
          const expandedPrompt = expandInlineChoices(entry.prompt);
          const tokens = expandedPrompt.split(',').map((t) => t.trim()).filter(Boolean);
          for (const token of tokens) {
            const clean = token.toLowerCase();
            if (!activeExclusionsSet.has(clean) && !seenTokens.has(clean)) {
              seenTokens.add(clean);
              blockTokens.push(token);
            }
          }
        }
      }
    }

    if (blockTokens.length > 0) {
      folderBlocks.push(blockTokens.join(', '));
    }
  }

  const compiledPrompt = folderBlocks.join('\nBREAK, \n');
  const tokenCount = Math.round(
    compiledPrompt
      .replace(/BREAK,/g, '')
      .split(/[\s,]+/)
      .filter(Boolean).length * 1.3
  );

  const telemetry: SubjectTelemetry = {
    totalFemales,
    totalMales,
    visibleFemales,
    visibleMales,
    totalVisible,
    isSolo,
    isPOV,
  };

  return {
    telemetry,
    activeKeywords: Array.from(activeKeywordsSet),
    activeExclusions: Array.from(activeExclusionsSet),
    compiledPrompt,
    tokenCount,
    resolvedSelections,
    randomCount,
    conditionConflicts,
  };
}

let saveTimeout: any = null;

function triggerAutoSave(
  app: App | null,
  selections: Record<string, string | null>,
  randomPools: Record<string, string[]>,
  matrixBaseStates: Record<string, string[]>,
  matrixUnlockedPools: Record<string, string[]>,
  unlockLockedAll: boolean,
  unlockKeys: string[],
  unlockedOptionKeys: string[],
  activeTemplate: HazardTemplate | null,
  lockedRandomSelections: Record<string, string> = {},
  workspaceState?: HazardWorkspaceState
) {
  if (!app) return;
  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    const stateToSave: HazardActiveState = {
      activeTemplateId: activeTemplate?.id || null,
      activeTemplateName: activeTemplate?.name || null,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      lockedRandomSelections,
      lastUpdated: Date.now(),
    };
    await TemplateManager.saveActiveState(app, stateToSave);

    if (workspaceState) {
      await TemplateManager.saveWorkspaceState(app, workspaceState);
    }
  }, 250);
}

export const useTriggerStore = create<TriggerState>((set, get) => ({
  app: null,
  isLoading: true,
  isSaving: false,
  isTemplatesLoading: false,
  folders: [],
  matrixDomains: [],
  conditions: {},
  ignoredConditionIds: [],
  conditionConflicts: [],
  selections: {},
  randomPools: {},
  matrixBaseStates: {},
  matrixUnlockedPools: {},
  globalLockedKeys: {},
  unlockLockedAll: false,
  unlockKeys: [],
  unlockedOptionKeys: [],
  lockedRandomSelections: {},
  resolvedSelections: {},
  randomCount: 0,
  rollCount: 0,

  templates: [],
  activeTemplate: null,

  telemetry: {
    totalFemales: 0,
    totalMales: 0,
    visibleFemales: 0,
    visibleMales: 0,
    totalVisible: 0,
    isSolo: false,
    isPOV: false,
  },
  activeKeywords: [],
  activeExclusions: [],
  compiledPrompt: '',
  tokenCount: 0,

  _workspace: {
    version: 1,
    activeTab: 'triggers',
    reverse: { inputPrompt: '', componentSearch: '' },
    components: {
      selectedFolderId: '',
      selectedFileRelPath: '',
      searchQuery: '',
      filterMode: 'all',
      sortMode: 'default',
    },
    conditions: {
      selectedFolderId: '',
      selectedFileRelPath: '',
      selectedCategory: 'All',
      searchQuery: '',
      filterMode: 'all',
    },
    updatedAt: 0,
  },

  init: async (app: App) => {
    set({ app, isLoading: true });
    try {
      await TemplateManager.ensureFolders(app);
      const [folders, matrixDomains, templates, savedActiveState, savedLockedKeys, conditions, savedWorkspaceState] = await Promise.all([
        ComponentScanner.scanAll(app),
        MatrixScanner.scanAll(app),
        TemplateManager.listTemplates(app),
        TemplateManager.loadActiveState(app),
        TemplateManager.loadGlobalLockedKeys(app),
        ConditionManager.loadAllConditions(app),
        TemplateManager.loadWorkspaceState(app),
      ]);

      let initialSelections: Record<string, string | null> = {};
      let initialRandomPools: Record<string, string[]> = {};
      let initialMatrixBaseStates: Record<string, string[]> = {};
      let initialMatrixUnlockedPools: Record<string, string[]> = {};
      let initialUnlockLockedAll = false;
      let initialUnlockKeys: string[] = [];
      let initialUnlockedOptionKeys: string[] = [];
      let initialLockedRandoms: Record<string, string> = {};
      let matchedActiveTemplate: HazardTemplate | null = null;
      const initialLockedKeys = savedLockedKeys || {};

      const allFilesList = [
        ...folders.flatMap((f) => f.files),
        ...matrixDomains.flatMap((d) => d.files),
      ];

      if (savedActiveState && savedActiveState.selections) {
        initialSelections = { ...savedActiveState.selections };
        initialRandomPools = { ...(savedActiveState.randomPools || {}) };

        // Restore Matrix Base & Unlocked States
        if (savedActiveState.matrixBaseStates) {
          initialMatrixBaseStates = { ...savedActiveState.matrixBaseStates };
        } else {
          // Legacy migration
          if (savedActiveState.baseEmotionStates) initialMatrixBaseStates['_01_Expression'] = savedActiveState.baseEmotionStates;
          if (savedActiveState.basePoseStates) initialMatrixBaseStates['_02_Pose_Action'] = savedActiveState.basePoseStates;
        }

        if (savedActiveState.matrixUnlockedPools) {
          initialMatrixUnlockedPools = { ...savedActiveState.matrixUnlockedPools };
        } else {
          // Legacy migration
          if (savedActiveState.unlockedEmotionPools) initialMatrixUnlockedPools['_01_Expression'] = savedActiveState.unlockedEmotionPools;
          if (savedActiveState.unlockedPosePools) initialMatrixUnlockedPools['_02_Pose_Action'] = savedActiveState.unlockedPosePools;
        }

        initialUnlockLockedAll = Boolean(savedActiveState.unlockLockedAll);
        initialUnlockKeys = Array.isArray(savedActiveState.unlockKeys) ? savedActiveState.unlockKeys : [];
        initialUnlockedOptionKeys = Array.isArray(savedActiveState.unlockedOptionKeys) ? savedActiveState.unlockedOptionKeys : [];
        initialLockedRandoms = savedActiveState.lockedRandomSelections
          ? { ...savedActiveState.lockedRandomSelections }
          : savedActiveState.lock
          ? { ...savedActiveState.lock }
          : {};

        if (savedActiveState.activeTemplateId) {
          matchedActiveTemplate =
            templates.find((t) => t.id === savedActiveState.activeTemplateId) || null;
        }

        // Fill in newly discovered files
        for (const file of allFilesList) {
          if (initialSelections[file.relPath] === undefined) {
            const keys = Object.keys(file.entries);
            if (
              file.meta?.defaultKey !== undefined &&
              (file.meta.defaultKey === null ||
                file.meta.defaultKey === RANDOM_SELECTION_KEY ||
                keys.includes(file.meta.defaultKey))
            ) {
              initialSelections[file.relPath] = file.meta.defaultKey;
            } else if (file.meta?.required && keys.length > 0) {
              initialSelections[file.relPath] = keys[0];
            } else {
              initialSelections[file.relPath] = null;
            }
          }
        }
      } else {
        // Defaults
        for (const file of allFilesList) {
          const keys = Object.keys(file.entries);
          if (
            file.meta?.defaultKey !== undefined &&
            (file.meta.defaultKey === null ||
              file.meta.defaultKey === RANDOM_SELECTION_KEY ||
              keys.includes(file.meta.defaultKey))
          ) {
            initialSelections[file.relPath] = file.meta.defaultKey;
          } else if (file.meta?.required && keys.length > 0) {
            initialSelections[file.relPath] = keys[0];
          } else if (file.fileName.includes('subject') || file.fileName.includes('pov')) {
            initialSelections[file.relPath] = keys[0];
          } else if (file.relPath.includes('Matrices/')) {
            initialSelections[file.relPath] = RANDOM_SELECTION_KEY;
          } else {
            initialSelections[file.relPath] = null;
          }
        }
        triggerAutoSave(app, initialSelections, initialRandomPools, {}, {}, false, [], [], null, {});
      }

      initialRandomPools = applyMatrixDomainFilters(
        matrixDomains,
        initialRandomPools,
        initialMatrixBaseStates,
        initialMatrixUnlockedPools
      );

      const computed = calculateState(
        folders,
        matrixDomains,
        initialSelections,
        initialRandomPools,
        initialMatrixBaseStates,
        initialMatrixUnlockedPools,
        initialUnlockLockedAll,
        initialUnlockKeys,
        initialUnlockedOptionKeys,
        initialLockedKeys,
        initialLockedRandoms,
        conditions,
        []
      );

      const initialWorkspace: HazardWorkspaceState = savedWorkspaceState || {
        version: 1,
        activeTab: 'triggers',
        reverse: { inputPrompt: '', componentSearch: '' },
        components: {
          selectedFolderId: '',
          selectedFileRelPath: '',
          searchQuery: '',
          filterMode: 'all',
          sortMode: 'default',
        },
        conditions: {
          selectedFolderId: '',
          selectedFileRelPath: '',
          selectedCategory: 'All',
          searchQuery: '',
          filterMode: 'all',
        },
        updatedAt: Date.now(),
      };

      triggerAutoSave(app, initialSelections, initialRandomPools, {}, {}, false, [], [], null, {}, initialWorkspace);

      set({
        folders,
        matrixDomains,
        conditions,
        ignoredConditionIds: [],
        templates,
        activeTemplate: matchedActiveTemplate,
        selections: initialSelections,
        randomPools: initialRandomPools,
        matrixBaseStates: initialMatrixBaseStates,
        matrixUnlockedPools: initialMatrixUnlockedPools,
        globalLockedKeys: initialLockedKeys,
        unlockLockedAll: initialUnlockLockedAll,
        unlockKeys: initialUnlockKeys,
        unlockedOptionKeys: initialUnlockedOptionKeys,
        lockedRandomSelections: initialLockedRandoms,
        _workspace: initialWorkspace,
        isLoading: false,
        rollCount: 1,
        ...computed,
      });
    } catch (err) {
      console.error('[TriggerStore] Initialization failed:', err);
      set({ isLoading: false });
    }
  },

  reload: async () => {
    const { app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, ignoredConditionIds } = get();
    if (!app) return;
    set({ isLoading: true });
    try {
      const [folders, matrixDomains, templates, savedLockedKeys, conditions] = await Promise.all([
        ComponentScanner.scanAll(app),
        MatrixScanner.scanAll(app),
        TemplateManager.listTemplates(app),
        TemplateManager.loadGlobalLockedKeys(app),
        ConditionManager.loadAllConditions(app),
      ]);

      const currentLocked = savedLockedKeys || globalLockedKeys;

      const computed = calculateState(
        folders,
        matrixDomains,
        selections,
        randomPools,
        matrixBaseStates,
        matrixUnlockedPools,
        unlockLockedAll,
        unlockKeys,
        unlockedOptionKeys,
        currentLocked,
        lockedRandomSelections,
        conditions,
        ignoredConditionIds
      );
      set({
        folders,
        matrixDomains,
        conditions,
        templates,
        globalLockedKeys: currentLocked,
        isLoading: false,
        ...computed,
      });
    } catch (err) {
      console.error('[TriggerStore] Reload failed:', err);
      set({ isLoading: false });
    }
  },

  ignoreCondition: (condId: string) => {
    const { folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds } = get();
    if (ignoredConditionIds.includes(condId)) return;
    const updatedIgnored = [...ignoredConditionIds, condId];
    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      lockedRandomSelections,
      conditions,
      updatedIgnored
    );
    set({
      ignoredConditionIds: updatedIgnored,
      ...computed,
    });
  },

  unignoreCondition: (condId: string) => {
    const { folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds } = get();
    const updatedIgnored = ignoredConditionIds.filter((id) => id !== condId);
    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      lockedRandomSelections,
      conditions,
      updatedIgnored
    );
    set({
      ignoredConditionIds: updatedIgnored,
      ...computed,
    });
  },

  clearIgnoredConditions: () => {
    const { folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions } = get();
    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      lockedRandomSelections,
      conditions,
      []
    );
    set({
      ignoredConditionIds: [],
      ...computed,
    });
  },

  selectOption: (relPath: string, key: string | null) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds, rollCount, activeTemplate } = get();
    const newKey = selections[relPath] === key && key !== null ? null : key;
    const updatedSelections = { ...selections, [relPath]: newKey };
    const updatedLockedRolls = { ...lockedRandomSelections };
    if (newKey !== RANDOM_SELECTION_KEY) {
      delete updatedLockedRolls[relPath];
    }
    const computed = calculateState(folders, matrixDomains, updatedSelections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, updatedLockedRolls, conditions, ignoredConditionIds);

    set({
      selections: updatedSelections,
      lockedRandomSelections: updatedLockedRolls,
      rollCount: rollCount + 1,
      ...computed,
    });

    triggerAutoSave(app, updatedSelections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, updatedLockedRolls);
  },

  rerollRandoms: () => {
    const { folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds, rollCount } = get();
    const computed = calculateState(folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds);
    set({
      rollCount: rollCount + 1,
      ...computed,
    });
  },

  randomizeAll: () => {
    const { app, folders, matrixDomains, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds, rollCount, activeTemplate } = get();
    const randomizedSelections: Record<string, string | null> = {};
    const allFiles = [...folders.flatMap((f) => f.files), ...matrixDomains.flatMap((d) => d.files)];

    for (const file of allFiles) {
      if (file.relPath.includes('Exclusion') || file.fileName.includes('negative')) {
        randomizedSelections[file.relPath] = Object.keys(file.entries)[0] || null;
      } else {
        randomizedSelections[file.relPath] = RANDOM_SELECTION_KEY;
      }
    }
    const computed = calculateState(folders, matrixDomains, randomizedSelections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds);

    set({
      selections: randomizedSelections,
      rollCount: rollCount + 1,
      ...computed,
    });

    triggerAutoSave(app, randomizedSelections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, lockedRandomSelections);
  },

  clearAllSelections: () => {
    const { app, folders, matrixDomains, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, conditions, ignoredConditionIds, rollCount, activeTemplate } = get();
    const clearedSelections: Record<string, string | null> = {};
    const allFiles = [...folders.flatMap((f) => f.files), ...matrixDomains.flatMap((d) => d.files)];

    for (const file of allFiles) {
      clearedSelections[file.relPath] = null;
    }
    const updatedLockedRolls = {};
    const computed = calculateState(folders, matrixDomains, clearedSelections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, updatedLockedRolls, conditions, ignoredConditionIds);

    set({
      selections: clearedSelections,
      lockedRandomSelections: updatedLockedRolls,
      rollCount: rollCount + 1,
      ...computed,
    });

    triggerAutoSave(app, clearedSelections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, updatedLockedRolls);
  },

  lockRandomOption: (relPath: string, key?: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, resolvedSelections, conditions, ignoredConditionIds, activeTemplate } = get();
    const keyToLock = key || resolvedSelections[relPath];
    if (!keyToLock) return;

    const updatedLockedRolls = { ...lockedRandomSelections, [relPath]: keyToLock };
    const updatedSelections = { ...selections, [relPath]: RANDOM_SELECTION_KEY };

    const computed = calculateState(
      folders,
      matrixDomains,
      updatedSelections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      updatedLockedRolls,
      conditions,
      ignoredConditionIds
    );

    set({
      selections: updatedSelections,
      lockedRandomSelections: updatedLockedRolls,
      ...computed,
    });

    triggerAutoSave(app, updatedSelections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, updatedLockedRolls);
  },

  unlockRandomOption: (relPath: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds, activeTemplate } = get();
    const updatedLockedRolls = { ...lockedRandomSelections };
    delete updatedLockedRolls[relPath];

    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      updatedLockedRolls,
      conditions,
      ignoredConditionIds
    );

    set({
      lockedRandomSelections: updatedLockedRolls,
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, updatedLockedRolls);
  },

  unlockAllRandomOptions: () => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, conditions, ignoredConditionIds, activeTemplate } = get();
    const updatedLockedRolls = {};

    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      updatedLockedRolls,
      conditions,
      ignoredConditionIds
    );

    set({
      lockedRandomSelections: updatedLockedRolls,
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, updatedLockedRolls);
  },

  toggleLockRandomOption: (relPath: string) => {
    const { lockedRandomSelections, resolvedSelections, lockRandomOption, unlockRandomOption } = get();
    if (lockedRandomSelections[relPath]) {
      unlockRandomOption(relPath);
    } else if (resolvedSelections[relPath]) {
      lockRandomOption(relPath, resolvedSelections[relPath]!);
    }
  },

  // Random Pool Granular Actions
  toggleRandomOption: (relPath: string, optionKey: string, allKeys: string[]) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds, activeTemplate } = get();
    const currentPool = randomPools[relPath] ?? [...allKeys];
    let updatedPool: string[];

    if (currentPool.includes(optionKey)) {
      updatedPool = currentPool.filter((k) => k !== optionKey);
    } else {
      updatedPool = [...currentPool, optionKey];
    }

    const updatedRandomPools = { ...randomPools, [relPath]: updatedPool };
    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds);

    set({
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  selectAllForRandom: (relPath: string, allKeys: string[]) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const updatedRandomPools = { ...randomPools, [relPath]: [...allKeys] };
    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  deselectAllForRandom: (relPath: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const updatedRandomPools = { ...randomPools, [relPath]: [] };
    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  // Dynamic Data-Driven Matrix Actions
  toggleMatrixBaseState: (domainId: string, stateId: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const currentBase = matrixBaseStates[domainId] || [];
    const exists = currentBase.includes(stateId);
    const updatedBase = exists
      ? currentBase.filter((id) => id !== stateId)
      : [...currentBase, stateId];

    const updatedMatrixBase = { ...matrixBaseStates, [domainId]: updatedBase };
    const updatedRandomPools = applyMatrixDomainFilters(
      matrixDomains,
      randomPools,
      updatedMatrixBase,
      matrixUnlockedPools
    );

    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, updatedMatrixBase, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      matrixBaseStates: updatedMatrixBase,
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, updatedMatrixBase, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  selectAllMatrixBaseStates: (domainId: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const domain = matrixDomains.find((d) => d.domainId === domainId);
    if (!domain) return;

    const allStateIds = domain.states.map((s) => s.id);
    const updatedMatrixBase = { ...matrixBaseStates, [domainId]: allStateIds };
    const updatedRandomPools = applyMatrixDomainFilters(
      matrixDomains,
      randomPools,
      updatedMatrixBase,
      matrixUnlockedPools
    );

    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, updatedMatrixBase, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      matrixBaseStates: updatedMatrixBase,
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, updatedMatrixBase, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  clearMatrixBaseStates: (domainId: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const updatedMatrixBase = { ...matrixBaseStates, [domainId]: [] };
    const updatedRandomPools = applyMatrixDomainFilters(
      matrixDomains,
      randomPools,
      updatedMatrixBase,
      matrixUnlockedPools
    );

    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, updatedMatrixBase, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      matrixBaseStates: updatedMatrixBase,
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, updatedMatrixBase, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  toggleMatrixUnlockedPool: (domainId: string, stateId: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const currentPools = matrixUnlockedPools[domainId] || [];
    const exists = currentPools.includes(stateId);
    const updatedPools = exists
      ? currentPools.filter((id) => id !== stateId)
      : [...currentPools, stateId];

    const updatedMatrixUnlocked = { ...matrixUnlockedPools, [domainId]: updatedPools };
    const updatedRandomPools = applyMatrixDomainFilters(
      matrixDomains,
      randomPools,
      matrixBaseStates,
      updatedMatrixUnlocked
    );

    // Auto-set child files in this domain to RANDOM if not already selected
    const updatedSelections = { ...selections };
    const domain = matrixDomains.find((d) => d.domainId === domainId);
    if (domain) {
      for (const file of domain.files) {
        if (!updatedSelections[file.relPath]) {
          updatedSelections[file.relPath] = RANDOM_SELECTION_KEY;
        }
      }
    }

    const computed = calculateState(folders, matrixDomains, updatedSelections, updatedRandomPools, matrixBaseStates, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      matrixUnlockedPools: updatedMatrixUnlocked,
      randomPools: updatedRandomPools,
      selections: updatedSelections,
      ...computed,
    });

    triggerAutoSave(app, updatedSelections, updatedRandomPools, matrixBaseStates, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  selectAllMatrixUnlockedPools: (domainId: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const domain = matrixDomains.find((d) => d.domainId === domainId);
    if (!domain) return;

    const allStateIds = domain.states.map((s) => s.id);
    const updatedMatrixUnlocked = { ...matrixUnlockedPools, [domainId]: allStateIds };
    const updatedRandomPools = applyMatrixDomainFilters(
      matrixDomains,
      randomPools,
      matrixBaseStates,
      updatedMatrixUnlocked
    );

    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, matrixBaseStates, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      matrixUnlockedPools: updatedMatrixUnlocked,
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, matrixBaseStates, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  clearMatrixUnlockedPools: (domainId: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const updatedMatrixUnlocked = { ...matrixUnlockedPools, [domainId]: [] };
    const updatedRandomPools = applyMatrixDomainFilters(
      matrixDomains,
      randomPools,
      matrixBaseStates,
      updatedMatrixUnlocked
    );

    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, matrixBaseStates, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      matrixUnlockedPools: updatedMatrixUnlocked,
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, matrixBaseStates, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  clearMatrixDomain: (domainId: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const updatedMatrixBase = { ...matrixBaseStates, [domainId]: [] };
    const updatedMatrixUnlocked = { ...matrixUnlockedPools, [domainId]: [] };

    const updatedRandomPools = applyMatrixDomainFilters(
      matrixDomains,
      randomPools,
      updatedMatrixBase,
      updatedMatrixUnlocked
    );

    const computed = calculateState(folders, matrixDomains, selections, updatedRandomPools, updatedMatrixBase, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      matrixBaseStates: updatedMatrixBase,
      matrixUnlockedPools: updatedMatrixUnlocked,
      randomPools: updatedRandomPools,
      ...computed,
    });

    triggerAutoSave(app, selections, updatedRandomPools, updatedMatrixBase, updatedMatrixUnlocked, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  toggleGlobalOptionLock: (relPath: string, optionKey: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const fullKey = `${relPath}:${optionKey}`;
    const isCurrentlyLocked = Boolean(globalLockedKeys[fullKey] || globalLockedKeys[optionKey]);
    const updatedLocked = { ...globalLockedKeys, [fullKey]: !isCurrentlyLocked };

    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      updatedLocked
    );

    set({
      globalLockedKeys: updatedLocked,
      ...computed,
    });

    if (app) {
      TemplateManager.saveGlobalLockedKeys(app, updatedLocked);
    }

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  setUnlockLockedAll: (val: boolean) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const computed = calculateState(folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, val, unlockKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      unlockLockedAll: val,
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, val, unlockKeys, unlockedOptionKeys, activeTemplate);
  },

  setUnlockKeys: (keys: string[]) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const computed = calculateState(folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, keys, unlockedOptionKeys, globalLockedKeys);

    set({
      unlockKeys: keys,
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, keys, unlockedOptionKeys, activeTemplate);
  },

  toggleUnlockKey: (key: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, activeTemplate } = get();
    const exists = unlockKeys.includes(key);
    const updatedKeys = exists ? unlockKeys.filter((k) => k !== key) : [...unlockKeys, key];
    const computed = calculateState(folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, updatedKeys, unlockedOptionKeys, globalLockedKeys);

    set({
      unlockKeys: updatedKeys,
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, updatedKeys, unlockedOptionKeys, activeTemplate);
  },

  loadTemplates: async () => {
    const { app } = get();
    if (!app) return;
    set({ isTemplatesLoading: true });
    try {
      const templates = await TemplateManager.listTemplates(app);
      set({ templates, isTemplatesLoading: false });
    } catch (e) {
      console.error('[TriggerStore] loadTemplates error:', e);
      set({ isTemplatesLoading: false });
    }
  },

  saveCurrentAsTemplate: async (
    name: string,
    description?: string,
    category?: string,
    tags?: string[],
    unlockLockedAll?: boolean,
    unlockKeys?: string[],
    templateLocks?: Record<string, string>
  ) => {
    const { app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll: storeUnlockAll, unlockKeys: storeUnlockKeys, unlockedOptionKeys, lockedRandomSelections, conditions, ignoredConditionIds } = get();
    if (!app || !name.trim()) return null;

    set({ isSaving: true });
    try {
      const finalUnlockAll = unlockLockedAll !== undefined ? unlockLockedAll : storeUnlockAll;
      const finalUnlockKeys = unlockKeys !== undefined ? unlockKeys : storeUnlockKeys;

      const newTemplate: HazardTemplate = {
        id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'General',
        tags: tags || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        selections: { ...selections },
        randomPools: { ...randomPools },
        matrixBaseStates: { ...matrixBaseStates },
        matrixUnlockedPools: { ...matrixUnlockedPools },
        unlockLockedAll: finalUnlockAll,
        unlockKeys: finalUnlockKeys,
        unlockedOptionKeys: [...unlockedOptionKeys],
        lock: { ...lockedRandomSelections },
        locked_options: { ...lockedRandomSelections },
        lockedRandomSelections: { ...lockedRandomSelections },
      };

      const saved = await TemplateManager.saveTemplate(app, newTemplate);
      const templates = await TemplateManager.listTemplates(app);

      set({
        templates,
        activeTemplate: saved,
        unlockLockedAll: finalUnlockAll,
        unlockKeys: finalUnlockKeys,
        isSaving: false,
      });

      triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, finalUnlockAll, finalUnlockKeys, unlockedOptionKeys, saved, lockedRandomSelections);
      return saved;
    } catch (err) {
      console.error('[TriggerStore] Save template failed:', err);
      set({ isSaving: false });
      return null;
    }
  },

  updateActiveTemplate: async () => {
    const { app, activeTemplate, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, lockedRandomSelections } = get();
    if (!app || !activeTemplate) return;

    set({ isSaving: true });
    try {
      const updated: HazardTemplate = {
        ...activeTemplate,
        selections: { ...selections },
        randomPools: { ...randomPools },
        matrixBaseStates: { ...matrixBaseStates },
        matrixUnlockedPools: { ...matrixUnlockedPools },
        unlockLockedAll,
        unlockKeys: [...unlockKeys],
        unlockedOptionKeys: [...unlockedOptionKeys],
        lock: { ...lockedRandomSelections },
        locked_options: { ...lockedRandomSelections },
        lockedRandomSelections: { ...lockedRandomSelections },
        updatedAt: Date.now(),
      };

      const saved = await TemplateManager.saveTemplate(app, updated);
      const templates = await TemplateManager.listTemplates(app);

      set({
        templates,
        activeTemplate: saved,
        isSaving: false,
      });

      triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, saved, lockedRandomSelections);
    } catch (err) {
      console.error('[TriggerStore] Update active template failed:', err);
      set({ isSaving: false });
    }
  },

  applyTemplate: async (template: HazardTemplate) => {
    const { app, folders, matrixDomains, rollCount, globalLockedKeys } = get();
    const newSelections: Record<string, string | null> = { ...template.selections };
    const newRandomPools: Record<string, string[]> = { ...(template.randomPools || {}) };
    const newLockedRandoms: Record<string, string> = template.lock
      ? { ...template.lock }
      : template.locked_options
      ? { ...template.locked_options }
      : template.lockedRandomSelections
      ? { ...template.lockedRandomSelections }
      : {};

    let newMatrixBase: Record<string, string[]> = {};
    let newMatrixUnlocked: Record<string, string[]> = {};

    if (template.matrixBaseStates) {
      newMatrixBase = { ...template.matrixBaseStates };
    } else {
      if (template.baseEmotionStates) newMatrixBase['_01_Expression'] = template.baseEmotionStates;
      if (template.basePoseStates) newMatrixBase['_02_Pose_Action'] = template.basePoseStates;
    }

    if (template.matrixUnlockedPools) {
      newMatrixUnlocked = { ...template.matrixUnlockedPools };
    } else {
      if (template.unlockedEmotionPools) newMatrixUnlocked['_01_Expression'] = template.unlockedEmotionPools;
      if (template.unlockedPosePools) newMatrixUnlocked['_02_Pose_Action'] = template.unlockedPosePools;
    }

    const newUnlockLockedAll = Boolean(template.unlockLockedAll);
    const newUnlockKeys: string[] = Array.isArray(template.unlockKeys) ? [...template.unlockKeys] : [];
    const newUnlockedOptionKeys: string[] = Array.isArray(template.unlockedOptionKeys) ? [...template.unlockedOptionKeys] : [];

    const allFiles = [...folders.flatMap((f) => f.files), ...matrixDomains.flatMap((d) => d.files)];
    for (const file of allFiles) {
      if (newSelections[file.relPath] === undefined) {
        newSelections[file.relPath] = null;
      }
    }

    const computed = calculateState(
      folders,
      matrixDomains,
      newSelections,
      newRandomPools,
      newMatrixBase,
      newMatrixUnlocked,
      newUnlockLockedAll,
      newUnlockKeys,
      newUnlockedOptionKeys,
      globalLockedKeys,
      newLockedRandoms
    );

    set({
      activeTemplate: template,
      selections: newSelections,
      randomPools: newRandomPools,
      matrixBaseStates: newMatrixBase,
      matrixUnlockedPools: newMatrixUnlocked,
      unlockLockedAll: newUnlockLockedAll,
      unlockKeys: newUnlockKeys,
      unlockedOptionKeys: newUnlockedOptionKeys,
      lockedRandomSelections: newLockedRandoms,
      rollCount: rollCount + 1,
      ...computed,
    });

    triggerAutoSave(app, newSelections, newRandomPools, newMatrixBase, newMatrixUnlocked, newUnlockLockedAll, newUnlockKeys, newUnlockedOptionKeys, template, newLockedRandoms);
  },

  deleteTemplate: async (template: HazardTemplate) => {
    const { app, activeTemplate, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, lockedRandomSelections } = get();
    if (!app) return;

    set({ isSaving: true });
    try {
      await TemplateManager.deleteTemplate(app, template);
      const templates = await TemplateManager.listTemplates(app);
      const isCurrentActive = activeTemplate?.id === template.id;

      set({
        templates,
        activeTemplate: isCurrentActive ? null : activeTemplate,
        isSaving: false,
      });

      if (isCurrentActive) {
        triggerAutoSave(app, get().selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, null, lockedRandomSelections);
      }
    } catch (err) {
      console.error('[TriggerStore] Delete template failed:', err);
      set({ isSaving: false });
    }
  },

  detachActiveTemplate: () => {
    const { app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, lockedRandomSelections } = get();
    set({ activeTemplate: null });
    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, null, lockedRandomSelections);
  },

  // Template-Scoped Component Lock Actions
  setTemplateLock: (template: HazardTemplate | null, lockSelections: Record<string, string>) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, conditions, ignoredConditionIds, activeTemplate } = get();
    if (!template) return;

    // Apply the template locks into the workspace lockedRandomSelections
    const newLockedRolls = { ...lockSelections };
    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      newLockedRolls,
      conditions,
      ignoredConditionIds
    );

    set({
      lockedRandomSelections: newLockedRolls,
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, newLockedRolls);
  },

  applyTemplateLockSelections: (templateLock: Record<string, string>) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, conditions, ignoredConditionIds, activeTemplate } = get();
    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      templateLock,
      conditions,
      ignoredConditionIds
    );

    set({
      lockedRandomSelections: { ...templateLock },
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, templateLock);
  },

  removeTemplateLockSelection: (relPath: string) => {
    const { app, folders, matrixDomains, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, globalLockedKeys, lockedRandomSelections, conditions, ignoredConditionIds, activeTemplate } = get();
    const updatedLockedRolls = { ...lockedRandomSelections };
    delete updatedLockedRolls[relPath];

    const computed = calculateState(
      folders,
      matrixDomains,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      globalLockedKeys,
      updatedLockedRolls,
      conditions,
      ignoredConditionIds
    );

    set({
      lockedRandomSelections: updatedLockedRolls,
      ...computed,
    });

    triggerAutoSave(app, selections, randomPools, matrixBaseStates, matrixUnlockedPools, unlockLockedAll, unlockKeys, unlockedOptionKeys, activeTemplate, updatedLockedRolls);
  },

  setWorkspaceState: (patch: Partial<HazardWorkspaceState>) => {
    let nextWorkspace: HazardWorkspaceState = {
      version: 1,
      activeTab: 'triggers',
      reverse: { inputPrompt: '', componentSearch: '' },
      components: {
        selectedFolderId: '',
        selectedFileRelPath: '',
        searchQuery: '',
        filterMode: 'all',
        sortMode: 'default',
      },
      conditions: {
        selectedFolderId: '',
        selectedFileRelPath: '',
        selectedCategory: 'All',
        searchQuery: '',
        filterMode: 'all',
      },
      updatedAt: Date.now(),
    };

    set((state) => {
      const currentWorkspace = state._workspace || nextWorkspace;
      nextWorkspace = {
        ...currentWorkspace,
        ...patch,
        reverse: {
          ...currentWorkspace.reverse,
          ...(patch.reverse || {}),
        },
        components: {
          ...currentWorkspace.components,
          ...(patch.components || {}),
        },
        conditions: {
          ...currentWorkspace.conditions,
          ...(patch.conditions || {}),
        },
        updatedAt: Date.now(),
      };
      return {
        _workspace: nextWorkspace,
      };
    });

    const {
      app,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      activeTemplate,
      lockedRandomSelections,
    } = get();

    triggerAutoSave(
      app,
      selections,
      randomPools,
      matrixBaseStates,
      matrixUnlockedPools,
      unlockLockedAll,
      unlockKeys,
      unlockedOptionKeys,
      activeTemplate,
      lockedRandomSelections,
      nextWorkspace
    );
  },
})
);
