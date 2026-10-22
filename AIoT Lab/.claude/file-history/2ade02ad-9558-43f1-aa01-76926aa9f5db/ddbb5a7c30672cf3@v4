import type { ComponentFileNode } from '../utils/componentScanner';

export type SelectionType = 'single' | 'multiple' | 'gacha';
export type Rarity = 'SSR' | 'SR' | 'R' | 'N';
export type TargetEngine = 'ComfyUI' | 'SD_WebUI' | 'NovelAI' | 'Midjourney' | 'Flux';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  order: number;
  description?: string;
  selectionType: SelectionType;
  maxSelections?: number;
}

export interface PromptNode {
  id: string;
  categoryId: string;
  label: string;
  token: string;
  defaultWeight: number;
  rarity?: Rarity;
  gachaPoolId?: string;
  wildcards?: string[];
  tags?: string[];
  loras?: string[];
  isExcludeNode?: boolean;
  description?: string;
}

export interface GachaPoolItem {
  token: string;
  weight?: number;
  rarity?: Rarity;
  label?: string;
}

export interface GachaPool {
  id: string;
  name: string;
  description?: string;
  drawCount: number;
  items: (string | GachaPoolItem)[];
}

export interface WildcardOption {
  token: string;
  weight?: number;
}

export interface ConditionEntry {
  display_name: string;
  category: string;
  description: string;
  completed?: boolean;
  tag_team?: string[]; // Array of other condition Hex IDs this condition implies/bundles
  conflicts_with?: string[]; // Array of condition Hex IDs that collide with this condition
}

export interface ConditionConflict {
  conditionAId: string;
  conditionAName: string;
  conditionBId: string;
  conditionBName: string;
  resolved: boolean;
  ignoredConditionId?: string;
}

export type WildcardRegistry = Record<string, (string | WildcardOption)[]>;

export interface ExclusionConfig {
  forbiddenKeywords: string[];
  autoNegatives: Record<string, string[]>;
  globalNegatives: string[];
}

export interface Preset {
  id: string;
  name: string;
  description?: string;
  targetEngine: TargetEngine;
  activeNodeIds: string[];
  nodeWeights: Record<string, number>;
  customPositive: string;
  customNegative: string;
  activeGachaPoolIds: string[];
}

export interface ResolvedPromptResult {
  positivePrompt: string;
  negativePrompt: string;
  loras: string[];
  tokenCount: number;
  activeNodes: PromptNode[];
  gachaDraws: { poolId: string; poolName: string; items: string[] }[];
  seed: number;
  timestamp: number;
}

export interface MatrixStateDefinition {
  id: string;
  label: string;
  emoji: string;
  color: string;
  borderColor: string;
  bgColor: string;
  activeBadgeClass: string;
  description: string;
  basePrompt: string;
}

export interface MatrixDomainMetadata {
  displayName?: string;
  description?: string;
  icon?: string;
  order?: number;
  tags?: string[];
}

export interface MatrixDomainNode {
  domainId: string; // e.g. "_01_Expression", "_02_Pose_Action"
  displayName: string; // e.g. "Expression & Mood"
  description?: string;
  relPath: string; // e.g. "Matrices/_01_Expression"
  icon?: string;
  meta?: MatrixDomainMetadata;
  states: MatrixStateDefinition[]; // Dynamically parsed from _matrix.json
  files: ComponentFileNode[]; // Dynamic child component files inside domain folder
}

export interface HazardTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  selections: Record<string, string | null>; // relPath -> selectedKey | '__RANDOM__'
  randomPools?: Record<string, string[]>; // relPath -> allowed option keys for random rolling
  // Dynamic Matrix Domain States: domainId -> array of active state IDs
  matrixBaseStates?: Record<string, string[]>; // e.g. { "_01_Expression": ["embarrassed"], "_02_Pose_Action": ["standing"] }
  matrixUnlockedPools?: Record<string, string[]>; // e.g. { "_01_Expression": ["happy", "nervous"] }
  // Legacy aliases
  baseEmotionStates?: string[];
  unlockedEmotionPools?: string[];
  basePoseStates?: string[];
  unlockedPosePools?: string[];
  // Locked Options & Niche Gacha Keys
  unlockLockedAll?: boolean;
  unlockKeys?: string[];
  unlockedOptionKeys?: string[];
  lock?: Record<string, string>; // Template-scoped: { relPath: optionKey } -> pins random roll to a specific option
  locked_options?: Record<string, string>; // Alias for lock
  lockedRandomSelections?: Record<string, string>; // Active workspace lock (component-level random roll pin)
  filePath?: string;
}

export type HazardWorkspaceTab = 'triggers' | 'tournaments' | 'templates' | 'reverse' | 'components' | 'conditions' | 'pools' | 'wildcards' | 'exclusions';

export interface HazardWorkspaceState {
  version: 1;
  activeTab: HazardWorkspaceTab;
  reverse: {
    inputPrompt: string;
    componentSearch: string;
  };
  components: {
    selectedFolderId: string;
    selectedFileRelPath: string;
    searchQuery: string;
    filterMode: 'all' | 'visible' | 'hidden' | 'completed' | 'draft' | 'tag_team';
    sortMode: 'default' | 'visible-first' | 'hidden-first';
  };
  conditions: {
    selectedFolderId: string;
    selectedFileRelPath: string;
    selectedCategory: string;
    searchQuery: string;
    filterMode: 'all' | 'completed' | 'draft' | 'conflicts';
  };
  updatedAt: number;
}

export interface HazardActiveState {
  activeTemplateId?: string | null;
  activeTemplateName?: string | null;
  selections: Record<string, string | null>;
  randomPools?: Record<string, string[]>;
  matrixBaseStates?: Record<string, string[]>;
  matrixUnlockedPools?: Record<string, string[]>;
  baseEmotionStates?: string[];
  unlockedEmotionPools?: string[];
  basePoseStates?: string[];
  unlockedPosePools?: string[];
  unlockLockedAll?: boolean;
  unlockKeys?: string[];
  unlockedOptionKeys?: string[];
  lock?: Record<string, string>; // Template-scoped locks
  locked_options?: Record<string, string>;
  lockedRandomSelections?: Record<string, string>; // relPath -> lockedKey for local random rolls
  lastUpdated: number;
}

export type RatingScore = 3 | 4 | 5 | 6 | 7;

export interface ResolvedComponentSummary {
  relPath: string; // e.g. "_01_Subject/1_subjects.json"
  key: string; // e.g. "1girl_solo"
  displayName: string; // e.g. "Eva Solo"
  promptSnippet: string; // e.g. "1girl, solo"
  isRandomRoll: boolean; // whether it was randomly chosen via random roll
}

export interface PromptRatingRecord {
  id: string; // e.g. "rate_1726224123456"
  timestamp: number;
  dateTime: string; // ISO date string
  rating: RatingScore; // 3 | 4 | 5 | 6 | 7
  compiledPrompt: string;
  tokenCount: number;
  templateId?: string | null;
  templateName?: string | null;
  baseEmotionStates?: string[];
  basePoseStates?: string[];
  resolvedComponents: ResolvedComponentSummary[];
  activeKeywords: string[];
  activeExclusions: string[];
  notes?: string;
}

export interface ComponentPerformanceStats {
  relPath: string;
  key: string;
  displayName: string;
  totalRolls: number;
  avgRating: number;
  ratingsCount: Record<RatingScore, number>;
  winRate: number; // percentage of ratings >= 5
  status: 'booster' | 'neutral' | 'culprit'; // >= 5.8 = booster, < 4.8 = culprit
}


