import React, { useState, useEffect, useMemo } from 'react';
import { ComponentFileNode, ComponentEntry } from '../../utils/componentScanner';
import { useTriggerStore, RANDOM_SELECTION_KEY } from '../../store/useTriggerStore';
import { renderComponentIcon } from '../../utils/iconResolver';
import { OptionEditorModal } from './OptionEditorModal';
import {
  Ban,
  Check,
  User,
  Users,
  Eye,
  Sparkles,
  Layers,
  X,
  Search,
  AlertTriangle,
  Info,
  Dices,
  CheckSquare,
  Square,
  Heart,
  Star,
  Lock,
  Unlock,
  Plus,
  Edit2,
} from 'lucide-react';

interface ComponentCardSelectorProps {
  file: ComponentFileNode;
  folderName: string;
}

export type PriorityTier = 'green' | 'blue' | 'neutral' | 'red';

export interface EvaluatedOption {
  key: string;
  entry: ComponentEntry;
  tier: PriorityTier;
  priority: number;
  matchedCount: number;
  totalRequire: number;
  reason?: string;
  isIncludedInRandom: boolean;
  matchingStates: string[];
  isLocked: boolean;
  isUnlockedByTemplate: boolean;
}

export const ComponentCardSelector: React.FC<ComponentCardSelectorProps> = ({
  file,
}) => {
  const {
    selections,
    randomPools,
    matrixDomains,
    matrixBaseStates,
    matrixUnlockedPools,
    globalLockedKeys,
    unlockLockedAll,
    unlockKeys,
    unlockedOptionKeys,
    lockedRandomSelections,
    resolvedSelections,
    selectOption,
    lockRandomOption,
    unlockRandomOption,
    toggleLockRandomOption,
    toggleRandomOption,
    selectAllForRandom,
    deselectAllForRandom,
    toggleMatrixUnlockedPool,
    toggleGlobalOptionLock,
    activeKeywords,
    activeExclusions,
  } = useTriggerStore();

  const currentSelection = selections[file.relPath] || null;
  const isRandom = currentSelection === RANDOM_SELECTION_KEY;
  const isLockedRoll = isRandom && Boolean(lockedRandomSelections[file.relPath]);
  const resolvedKey = isRandom ? (resolvedSelections[file.relPath] || null) : currentSelection;
  const optionKeys = Object.keys(file.entries);
  const selectedEntry = resolvedKey ? file.entries[resolvedKey] : null;

  // Check if this component file belongs to a dynamic Matrix Domain
  const parentDomain = useMemo(() => {
    return matrixDomains.find((d) => d.files.some((f) => f.relPath === file.relPath)) || null;
  }, [matrixDomains, file.relPath]);

  const cleanUnlockKeys = useMemo(() => {
    return (unlockKeys || []).map((k) => k.toLowerCase().trim());
  }, [unlockKeys]);

  const cleanUnlockedOptionKeys = useMemo(() => {
    return (unlockedOptionKeys || []).map((k) => k.toLowerCase().trim());
  }, [unlockedOptionKeys]);

  // Active combined matrix states list across all domains
  const activeMatrixStatesList = useMemo(() => {
    const allStates: string[] = [];
    Object.values(matrixBaseStates || {}).forEach((arr) => {
      if (Array.isArray(arr)) arr.forEach((s) => allStates.push(s.toLowerCase().trim()));
    });
    Object.values(matrixUnlockedPools || {}).forEach((arr) => {
      if (Array.isArray(arr)) arr.forEach((s) => allStates.push(s.toLowerCase().trim()));
    });
    return Array.from(new Set(allStates));
  }, [matrixBaseStates, matrixUnlockedPools]);

  // Granular Random Pool for this component (default to all keys if unset)
  const currentRandomPool = useMemo(() => {
    return randomPools[file.relPath] !== undefined
      ? randomPools[file.relPath]
      : optionKeys;
  }, [randomPools, file.relPath, optionKeys]);

  const poolCount = currentRandomPool.length;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-modal Option Editor State
  const [isOptionEditorOpen, setIsOptionEditorOpen] = useState(false);
  const [editingOptionKey, setEditingOptionKey] = useState<string | null>(null);
  const [editingOptionEntry, setEditingOptionEntry] = useState<ComponentEntry | null>(null);

  const handleOpenAddOption = () => {
    setEditingOptionKey(null);
    setEditingOptionEntry(null);
    setIsOptionEditorOpen(true);
  };

  const handleOpenEditOption = (optKey: string, entry: ComponentEntry) => {
    setEditingOptionKey(optKey);
    setEditingOptionEntry(entry);
    setIsOptionEditorOpen(true);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen && !isOptionEditorOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isOptionEditorOpen]);

  const getPlaceholderIcon = (entry: ComponentEntry | null, key?: string) => {
    if (isRandom && !entry?.image && !entry?.thumbnail) {
      return <Dices className="w-12 h-12 text-hazard-gold animate-pulse" />;
    }
    if (entry?.subjects) {
      const [f, m] = entry.subjects;
      if (f === 1 && m === 0) return <User className="w-12 h-12 text-hazard-gold/80" />;
      if (f > 1 || m > 1 || (f > 0 && m > 0)) return <Users className="w-12 h-12 text-hazard-cyan/80" />;
      if (f < 0 || m < 0) return <Eye className="w-12 h-12 text-hazard-crimson/80" />;
    }
    if (key && key.includes('pov')) return <Eye className="w-12 h-12 text-hazard-crimson/80" />;
    if (file.meta?.icon) {
      return renderComponentIcon(file.meta.icon, 'w-12 h-12 text-hazard-gold/70');
    }
    return <Sparkles className="w-12 h-12 text-hazard-gold/70" />;
  };

  const hasSelectedImage = Boolean(selectedEntry?.image || selectedEntry?.thumbnail);

  // Evaluate Priority Tier & Sort Options according to ECS Rules, Universal Lock Status, Matrix Unlocking & Random Pool status
  const evaluatedOptions: EvaluatedOption[] = useMemo(() => {
    const activeKwLower = activeKeywords.map((k) => k.toLowerCase().trim());
    const activeExLower = activeExclusions.map((e) => e.toLowerCase().trim());

    // Filter out options marked visible: false from selectable trigger options
    const visibleOptionKeys = optionKeys.filter((key) => file.entries[key]?.visible !== false);

    return visibleOptionKeys.map((key) => {
      const entry = file.entries[key];
      const keywords = (entry.keywords || []).map((k) => k.toLowerCase().trim());
      const requires = (entry.require || []).map((r) => r.toLowerCase().trim());
      const negates = (entry.negate || []).map((n) => n.toLowerCase().trim());
      const isIncludedInRandom = currentRandomPool.includes(key);

      const isLocked = Boolean(
        entry.locked ||
        entry.lock ||
        entry.is_locked ||
        globalLockedKeys[`${file.relPath}:${key}`] ||
        globalLockedKeys[key]
      );

      const isUnlockedByTemplate = Boolean(
        unlockLockedAll ||
        (entry.lockKey && cleanUnlockKeys.includes(entry.lockKey.toLowerCase().trim())) ||
        cleanUnlockedOptionKeys.includes(`${file.relPath}:${key}`.toLowerCase()) ||
        cleanUnlockedOptionKeys.includes(key.toLowerCase())
      );

      const entryTags = [
        ...(Array.isArray(entry.emotions) ? entry.emotions : []),
        ...(Array.isArray(entry.postures) ? entry.postures : []),
        ...(Array.isArray(entry.tags) ? entry.tags : []),
      ].map((t: string) => t.toLowerCase().trim());

      const matchingStates = entryTags.filter((t: string) =>
        activeMatrixStatesList.includes(t)
      );

      // 1. Red Tier: Excluded or Negated (Lowest Priority, Moved to Last Slot)
      const matchedExcluded = keywords.filter((k) => activeExLower.includes(k));
      const matchedNegated = negates.filter((n) => activeKwLower.includes(n));

      if (matchedExcluded.length > 0 || matchedNegated.length > 0) {
        const reason = matchedExcluded.length > 0
          ? `Excluded by: ${matchedExcluded.join(', ')}`
          : `Negated by: ${matchedNegated.join(', ')}`;

        return {
          key,
          entry,
          tier: 'red',
          priority: 3,
          matchedCount: 0,
          totalRequire: requires.length,
          reason,
          isIncludedInRandom,
          matchingStates,
          isLocked,
          isUnlockedByTemplate,
        };
      }

      // 2. Green Tier: All "require" met OR no "require" at all (Highest Priority, Top Slot)
      if (requires.length === 0) {
        return {
          key,
          entry,
          tier: 'green',
          priority: 0,
          matchedCount: 0,
          totalRequire: 0,
          isIncludedInRandom,
          matchingStates,
          isLocked,
          isUnlockedByTemplate,
        };
      }

      const matchedCount = requires.filter((r) => activeKwLower.includes(r)).length;

      if (matchedCount === requires.length) {
        return {
          key,
          entry,
          tier: 'green',
          priority: 0,
          matchedCount,
          totalRequire: requires.length,
          isIncludedInRandom,
          matchingStates,
          isLocked,
          isUnlockedByTemplate,
        };
      }

      // 3. Blue Tier: Some "require" met (Partial Match, Behind Greens)
      if (matchedCount > 0) {
        return {
          key,
          entry,
          tier: 'blue',
          priority: 1,
          matchedCount,
          totalRequire: requires.length,
          reason: `Requires: ${matchedCount}/${requires.length} matched`,
          isIncludedInRandom,
          matchingStates,
          isLocked,
          isUnlockedByTemplate,
        };
      }

      // 4. Neutral Tier: 0 "require" met (After Blue, Above Red)
      return {
        key,
        entry,
        tier: 'neutral',
        priority: 2,
        matchedCount: 0,
        totalRequire: requires.length,
        reason: `Missing requirements: ${requires.join(', ')}`,
        isIncludedInRandom,
        matchingStates,
        isLocked,
        isUnlockedByTemplate,
      };
    });
  }, [optionKeys, file.entries, file.relPath, activeKeywords, activeExclusions, currentRandomPool, activeMatrixStatesList, globalLockedKeys, unlockLockedAll, cleanUnlockKeys, cleanUnlockedOptionKeys]);

  // Sort by priority tier (Green: 0 -> Blue: 1 -> Neutral: 2 -> Red: 3)
  const sortedEvaluatedOptions = useMemo(() => {
    return [...evaluatedOptions].sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return 0; // Preserve relative order within same tier
    });
  }, [evaluatedOptions]);

  // Filter with search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return sortedEvaluatedOptions;
    const q = searchQuery.toLowerCase();
    return sortedEvaluatedOptions.filter(({ key, entry }) => {
      return (
        key.toLowerCase().includes(q) ||
        (entry.display_name && entry.display_name.toLowerCase().includes(q)) ||
        (entry.prompt && entry.prompt.toLowerCase().includes(q)) ||
        (entry.description && entry.description.toLowerCase().includes(q)) ||
        (entry.emotions && entry.emotions.some((e: string) => e.toLowerCase().includes(q))) ||
        (entry.postures && entry.postures.some((p: string) => p.toLowerCase().includes(q))) ||
        (entry.lockKey && entry.lockKey.toLowerCase().includes(q)) ||
        (file.meta?.tags && file.meta.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [sortedEvaluatedOptions, searchQuery, file.meta?.tags]);

  // Counts for summary header
  const tierCounts = useMemo(() => {
    const counts = { green: 0, blue: 0, neutral: 0, red: 0 };
    evaluatedOptions.forEach((o) => counts[o.tier]++);
    return counts;
  }, [evaluatedOptions]);

  return (
    <>
      {/* Base Component Card on Main Canvas */}
      <div className="relative flex flex-col items-center gap-2 select-none">
        {/* Top Label: Icon + Component Name + Metadata Badges */}
        <div className="flex items-center gap-1.5 max-w-[160px] justify-center text-center">
          {file.meta?.icon && (
            <span className="text-hazard-gold/80">
              {renderComponentIcon(file.meta.icon, 'w-3.5 h-3.5')}
            </span>
          )}
          <span
            title={file.meta?.description || file.displayName}
            className="text-xs font-bold uppercase tracking-wider text-hazard-textMuted hover:text-hazard-gold transition-colors duration-150 truncate"
          >
            {file.displayName}
          </span>
          {file.meta?.required && (
            <span
              title="Required Component: Must have an active selection"
              className="text-[9px] font-mono px-1 py-0.2 rounded bg-hazard-gold/15 text-hazard-gold border border-hazard-gold/30"
            >
              REQ
            </span>
          )}
          {isRandom && (
            <span
              title={`Random Mode: Rolls from ${poolCount}/${optionKeys.length} enabled options`}
              className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-hazard-purple/30 text-hazard-purple border border-hazard-purple/50 flex items-center gap-1 font-bold animate-pulse"
            >
              <Dices className="w-2.5 h-2.5" />
              {poolCount}/{optionKeys.length}
            </span>
          )}
        </div>

        {/* Main Selected 1:1 Large Tile (160x160px) - Opens Modal on Click */}
        <div
          onClick={() => setIsModalOpen(true)}
          className={`relative w-40 h-40 aspect-square rounded-2xl border-2 cursor-pointer overflow-hidden flex flex-col items-center justify-center p-2.5 transition-all duration-150 ease-out shadow-lg hover:scale-[1.02] ${
            isRandom
              ? 'border-hazard-gold bg-gradient-to-br from-hazard-purple/20 via-hazard-cardHover to-hazard-gold/15 shadow-hazard-glow ring-1 ring-hazard-gold/50'
              : selectedEntry
              ? 'border-hazard-gold bg-hazard-cardHover shadow-hazard-glow'
              : 'border-hazard-border bg-hazard-void/80 hover:border-hazard-gold/60'
          }`}
        >
          {/* Selected Image or 1:1 Placeholder */}
          {hasSelectedImage ? (
            <img
              src={selectedEntry?.image || selectedEntry?.thumbnail}
              alt={selectedEntry?.display_name || 'Selected'}
              className="absolute inset-0 w-full h-full object-cover rounded-2xl"
            />
          ) : selectedEntry ? (
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-hazard-card to-hazard-void">
              {getPlaceholderIcon(selectedEntry, resolvedKey || undefined)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-hazard-textMuted/60">
              <Ban className="w-10 h-10" />
              <span className="text-xs font-mono font-bold">[ Click to Select ]</span>
            </div>
          )}

          {/* Gradient Overlay for Text Readability */}
          {selectedEntry && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
          )}

          {/* Badges on Top */}
          <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between pointer-events-none">
            {isLockedRoll ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  unlockRandomOption(file.relPath);
                }}
                title="This random roll is locked. Click to unlock and allow rerolling."
                className="pointer-events-auto text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-hazard-gold text-black border border-hazard-gold shadow-hazard-glow flex items-center gap-1 active:scale-90 transition hover:bg-hazard-goldGlow"
              >
                <Lock className="w-3 h-3 text-black" />
                <span>LOCKED ROLL</span>
              </button>
            ) : isRandom ? (
              <div className="flex items-center gap-1 pointer-events-auto">
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-hazard-purple/90 text-white border border-hazard-purple/60 shadow-sm backdrop-blur-xs flex items-center gap-1">
                  <Dices className="w-3 h-3" />
                  RANDOM ({poolCount}/{optionKeys.length})
                </span>
                {resolvedKey && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      lockRandomOption(file.relPath, resolvedKey);
                    }}
                    title="Lock this rolled option so it won't change on reroll"
                    className="p-1 rounded-md bg-black/80 hover:bg-hazard-gold hover:text-black text-hazard-gold border border-hazard-gold/40 text-[9px] font-mono transition active:scale-90 shadow-sm"
                  >
                    <Lock className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ) : selectedEntry && (selectedEntry.locked || globalLockedKeys[`${file.relPath}:${resolvedKey}`] || globalLockedKeys[resolvedKey || '']) ? (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/90 text-black border border-amber-400 shadow-sm backdrop-blur-xs flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" />
                MANUAL ONLY
              </span>
            ) : <span />}

            {selectedEntry?.subjects && (
              <div className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/80 border border-white/10 text-hazard-textBright shadow-sm backdrop-blur-xs">
                {selectedEntry.subjects[0] >= 0 ? `+${selectedEntry.subjects[0]}` : selectedEntry.subjects[0]}♀ / {selectedEntry.subjects[1] >= 0 ? `+${selectedEntry.subjects[1]}` : selectedEntry.subjects[1]}♂
              </div>
            )}
          </div>

          {/* Selected Name at Bottom of Image */}
          {selectedEntry && (
            <div className="absolute bottom-2 inset-x-2 z-10 text-center">
              <span className={`text-xs font-bold block truncate drop-shadow-md ${
                isLockedRoll
                  ? 'text-hazard-gold font-extrabold'
                  : isRandom
                  ? 'text-hazard-goldGlow'
                  : 'text-hazard-gold'
              }`}>
                {isLockedRoll
                  ? `🔒 ${selectedEntry.display_name || resolvedKey}`
                  : isRandom
                  ? `🎲 ${selectedEntry.display_name || resolvedKey}`
                  : (selectedEntry.display_name || currentSelection)}
              </span>
            </div>
          )}
        </div>

        {/* Selected Name & Description Below Image */}
        <div className="flex flex-col items-center text-center max-w-[160px]">
          <span className="text-xs font-bold text-hazard-textBright truncate w-full">
            {isLockedRoll
              ? `🔒 ${selectedEntry?.display_name || resolvedKey}`
              : isRandom
              ? `🎲 ${selectedEntry?.display_name || 'Random Roll'}`
              : selectedEntry
              ? (selectedEntry.display_name || currentSelection)
              : 'None (Blank)'}
          </span>
          {isLockedRoll ? (
            <span className="text-[8px] text-hazard-gold font-mono truncate w-full leading-tight mt-0.5 font-bold">
              Roll Locked • Click badge to unlock
            </span>
          ) : isRandom ? (
            <span className="text-[8px] text-hazard-purple font-mono truncate w-full leading-tight mt-0.5 font-bold">
              Rolls from {poolCount}/{optionKeys.length} enabled options
            </span>
          ) : selectedEntry?.description ? (
            <span className="text-[7px] text-hazard-textMuted truncate w-full leading-tight font-mono mt-0.5">
              {selectedEntry.description}
            </span>
          ) : file.meta?.description ? (
            <span
              title={file.meta.description}
              className="text-[7px] text-hazard-textMuted/70 truncate w-full leading-tight font-mono mt-0.5"
            >
              {file.meta.description}
            </span>
          ) : null}
        </div>
      </div>

      {/* Full-Screen Modal Options Picker with Metadata Purpose Banner & Priority Sorting */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="flex flex-col w-full max-w-6xl h-[88vh] bg-hazard-card border-2 border-hazard-gold/60 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-hazard-border bg-hazard-void shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold">
                  {renderComponentIcon(file.meta?.icon, 'w-5 h-5', <Layers className="w-5 h-5" />)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold uppercase tracking-wider text-hazard-textBright">
                      Select {file.displayName}
                    </h3>
                    {file.meta?.category && (
                      <span className="px-2 py-0.5 rounded bg-hazard-card border border-hazard-border text-hazard-cyan text-[10px] font-mono">
                        {file.meta.category}
                      </span>
                    )}
                    {/* Priority Tier Counts Summary */}
                    <div className="flex items-center gap-1.5 font-mono text-[10px] ml-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 font-bold">
                        {tierCounts.green} Ready (Green)
                      </span>
                      {tierCounts.blue > 0 && (
                        <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/50 text-sky-400 font-bold">
                          {tierCounts.blue} Partial (Blue)
                        </span>
                      )}
                      {tierCounts.red > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-950/80 border border-rose-500/50 text-rose-400 font-bold">
                          {tierCounts.red} Excluded (Red)
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-hazard-textMuted font-mono mt-0.5">
                    {optionKeys.length} available options • {file.fileName}
                  </p>
                </div>
              </div>

              {/* Search Filter, Add Option & Close Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenAddOption}
                  title="Add New Option to this Component File"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hazard-gold/15 text-hazard-gold border border-hazard-gold/40 hover:bg-hazard-gold hover:text-black transition text-xs font-bold font-mono active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Option</span>
                </button>

                <div className="flex items-center gap-2 bg-hazard-card border border-hazard-border rounded-xl px-3 py-1.5 min-w-[200px]">
                  <Search className="w-4 h-4 text-hazard-textMuted" />
                  <input
                    type="text"
                    placeholder="Search options, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-xs text-hazard-textBright placeholder:text-hazard-textMuted/60 outline-none"
                    autoFocus
                  />
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-hazard-textMuted hover:text-white bg-hazard-card border border-hazard-border rounded-xl hover:border-hazard-gold/50 transition"
                  title="Close (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Random Pool Configuration & Metadata Purpose Toolbar */}
            <div className="px-6 py-2.5 bg-hazard-void/95 border-b border-hazard-border/80 flex flex-wrap items-center justify-between gap-4 text-xs shrink-0">
              {/* Left: Role / Purpose Info */}
              <div className="flex items-center gap-2 text-hazard-textMuted">
                <Info className="w-4 h-4 text-hazard-cyan shrink-0" />
                <span>
                  <strong className="text-hazard-textBright">Role:</strong>{' '}
                  {file.meta?.purpose || file.meta?.description || 'Pick an option, configure random pool, or lock niche items.'}
                </span>
                {file.meta?.cardinalityNotes && (
                  <span className="text-[10px] font-mono text-hazard-gold/90 bg-hazard-gold/10 px-2 py-0.5 rounded border border-hazard-gold/20 ml-2">
                    {file.meta.cardinalityNotes}
                  </span>
                )}
              </div>

              {/* Right: Random Pool Subset Control Bar */}
              <div className="flex items-center gap-2.5 bg-hazard-card/90 px-3 py-1.5 rounded-xl border border-hazard-border">
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <Dices className="w-4 h-4 text-hazard-purple" />
                  <span className="text-hazard-textMuted">Random Pool:</span>
                  <strong className="text-hazard-purple">
                    {poolCount}/{optionKeys.length}
                  </strong>
                  <span className="text-[10px] text-hazard-textMuted/70">
                    ({Math.round((poolCount / (optionKeys.length || 1)) * 100)}%)
                  </span>
                </div>

                <div className="h-4 w-px bg-hazard-border" />

                {/* Select All for Random Button */}
                <button
                  type="button"
                  onClick={() => selectAllForRandom(file.relPath, optionKeys)}
                  title="Enable all options in the random pool"
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-hazard-purple hover:text-white bg-hazard-purple/20 hover:bg-hazard-purple border border-hazard-purple/40 rounded-lg transition active:scale-95"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Select All</span>
                </button>

                {/* Deselect All for Random Button */}
                <button
                  type="button"
                  onClick={() => deselectAllForRandom(file.relPath)}
                  title="Deselect all options in the random pool"
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-hazard-crimson hover:text-white bg-hazard-crimson/20 hover:bg-hazard-crimson border border-hazard-crimson/40 rounded-lg transition active:scale-95"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Deselect All</span>
                </button>

                {/* Lock / Unlock Roll Toggle when in Random Mode */}
                {isRandom && (
                  <>
                    <div className="h-4 w-px bg-hazard-border" />
                    <button
                      type="button"
                      onClick={() => toggleLockRandomOption(file.relPath)}
                      title={isLockedRoll ? 'Unlock this roll to allow rerolling' : 'Lock/Pin the currently rolled option'}
                      className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg transition active:scale-95 ${
                        isLockedRoll
                          ? 'bg-hazard-gold text-black border border-hazard-gold shadow-hazard-glow'
                          : 'bg-hazard-gold/15 text-hazard-gold hover:bg-hazard-gold hover:text-black border border-hazard-gold/40'
                      }`}
                    >
                      {isLockedRoll ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{isLockedRoll ? 'Roll Locked 🔒' : 'Lock Roll 📌'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Dynamic Parent Domain Matrix Quick Filter Bar inside Modal */}
            {parentDomain && parentDomain.states && parentDomain.states.length > 0 && (
              <div className="px-6 py-2 bg-hazard-card/80 border-b border-hazard-border/60 flex flex-wrap items-center gap-2 text-xs shrink-0">
                <div className="flex items-center gap-1.5 text-hazard-gold font-bold text-[11px] uppercase tracking-wider mr-2 font-mono">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{parentDomain.displayName} States:</span>
                </div>
                {parentDomain.states.map((state) => {
                  const activeBase = matrixBaseStates[parentDomain.domainId] || [];
                  const activePools = matrixUnlockedPools[parentDomain.domainId] || [];
                  const isBase = activeBase.includes(state.id);
                  const isUnlocked = activePools.includes(state.id);

                  return (
                    <button
                      key={state.id}
                      type="button"
                      onClick={() => toggleMatrixUnlockedPool(parentDomain.domainId, state.id)}
                      title={`Toggle ${state.label} in unlocked pool`}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition active:scale-95 ${
                        isBase
                          ? 'bg-hazard-gold text-black border border-hazard-gold shadow-hazard-glow scale-105'
                          : isUnlocked
                          ? `${state.activeBadgeClass || 'bg-hazard-purple/20 text-hazard-purple border border-hazard-purple/60'} shadow-sm scale-105`
                          : 'bg-hazard-void text-hazard-textMuted border border-hazard-border hover:text-white'
                      }`}
                    >
                      <span>{state.emoji}</span>
                      <span>{state.label.split(' / ')[0]}</span>
                      {isBase && <span>⭐</span>}
                      {isUnlocked && <span>🎲</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Modal Body: Large 1:1 Square Grid (160x160px Tiles) */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {/* 1. Blank / None Option Card (Pinned at Start of Top Tier) */}
                <div
                  onClick={() => {
                    selectOption(file.relPath, null);
                    setIsModalOpen(false);
                  }}
                  className={`relative w-full aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2.5 p-3 cursor-pointer transition-all duration-150 select-none hover:scale-[1.02] ${
                    currentSelection === null
                      ? 'border-hazard-gold bg-hazard-gold/15 shadow-hazard-glow ring-2 ring-hazard-gold/50'
                      : 'border-emerald-500/50 bg-emerald-950/20 hover:border-emerald-400 hover:bg-emerald-950/40'
                  }`}
                >
                  <Ban className="w-10 h-10 text-emerald-400" />
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-bold text-hazard-textBright">None</span>
                    <span className="text-[7px] text-emerald-400/80 font-mono">Deselect / Blank</span>
                  </div>
                  {currentSelection === null && (
                    <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-hazard-gold text-black flex items-center justify-center text-xs font-bold shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* 2. RANDOM ROLL Option Card (Pinned alongside None) */}
                <div
                  onClick={() => {
                    selectOption(file.relPath, RANDOM_SELECTION_KEY);
                    setIsModalOpen(false);
                  }}
                  className={`relative w-full aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-2.5 p-3 cursor-pointer transition-all duration-150 select-none hover:scale-[1.02] ${
                    currentSelection === RANDOM_SELECTION_KEY
                      ? 'border-hazard-gold bg-gradient-to-br from-hazard-purple/40 to-hazard-gold/20 shadow-hazard-glow ring-2 ring-hazard-gold/60'
                      : 'border-hazard-purple/60 bg-gradient-to-br from-hazard-purple/20 to-hazard-card hover:border-hazard-purple hover:bg-hazard-purple/30'
                  }`}
                >
                  <div className="relative">
                    <Dices className="w-10 h-10 text-hazard-purple animate-pulse" />
                    <Sparkles className="w-4 h-4 text-hazard-gold absolute -top-1 -right-1" />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="text-xs font-bold text-hazard-textBright">Random Pool</span>
                    <span className="text-[8px] text-hazard-purple font-mono font-bold">
                      Rolls {poolCount}/{optionKeys.length} choices
                    </span>
                  </div>
                  {currentSelection === RANDOM_SELECTION_KEY && (
                    <span className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-hazard-gold text-black flex items-center justify-center text-xs font-bold shadow-sm">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>

                {/* 3. Priority Sorted Candidate Option Cards */}
                {filteredOptions.map(({ key, entry, tier, reason, isIncludedInRandom, matchingStates, isLocked, isUnlockedByTemplate }) => {
                  const isSelected = currentSelection === key;
                  const hasImg = Boolean(entry.image || entry.thumbnail);
                  const isStateMatched = matchingStates.length > 0;

                  // Border & Glow styling per Priority Tier
                  const tierStyles = {
                    green: 'border-emerald-500/70 bg-emerald-950/15 hover:border-emerald-400 hover:bg-emerald-950/30',
                    blue: 'border-sky-500/70 bg-sky-950/20 hover:border-sky-400 hover:bg-sky-950/40',
                    neutral: 'border-hazard-border bg-hazard-void/90 hover:border-hazard-gold/60 hover:bg-hazard-card',
                    red: 'border-rose-600/70 bg-rose-950/30 opacity-40 hover:opacity-90 hover:border-rose-500 grayscale-[40%] hover:grayscale-0',
                  }[tier];

                  return (
                    <div
                      key={key}
                      onClick={() => {
                        selectOption(file.relPath, key);
                        setIsModalOpen(false);
                      }}
                      title={reason || entry.prompt}
                      className={`relative w-full aspect-square rounded-2xl border-2 flex flex-col justify-between p-2.5 cursor-pointer overflow-hidden transition-all duration-150 select-none group hover:scale-[1.02] ${
                        isSelected
                          ? 'border-hazard-gold bg-hazard-cardHover shadow-hazard-glow ring-2 ring-hazard-gold/60 opacity-100'
                          : isStateMatched
                          ? 'border-cyan-500/70 bg-cyan-950/20 shadow-sm ring-1 ring-cyan-500/40'
                          : isLocked && !isUnlockedByTemplate
                          ? 'border-amber-500/40 bg-hazard-void/90 opacity-80 hover:opacity-100'
                          : tierStyles
                      }`}
                    >
                      {/* 1:1 Image or Placeholder */}
                      {hasImg ? (
                        <img
                          src={entry.image || entry.thumbnail}
                          alt={entry.display_name || key}
                          className="absolute inset-0 w-full h-full object-cover rounded-2xl"
                        />
                      ) : (
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gradient-to-b from-hazard-card to-hazard-void">
                          {getPlaceholderIcon(entry, key)}
                        </div>
                      )}

                      {/* Gradient Overlay for Text Contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                      {/* Top Badges (Random Inclusion Checkbox, Lock Toggle, Tier Indicator, Vector Badges, Selected Checkmark) */}
                      <div className="relative z-10 flex items-center justify-between w-full">
                        {/* Top Left: Interactive Random Pool Toggle & Lock Button */}
                        <div className="flex items-center gap-1">
                          {isLocked && !isUnlockedByTemplate ? (
                            <span
                              title="Locked Option: Excluded from general gacha/random pools. Selectable manually."
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-amber-500/80 text-black border border-amber-400 shadow-sm"
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>LOCK</span>
                            </span>
                          ) : isLocked && isUnlockedByTemplate ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRandomOption(file.relPath, key, optionKeys);
                              }}
                              title="Niche Option Unlocked by Template Key (Click to toggle in random pool)"
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold shadow-sm transition-all duration-150 active:scale-90 ${
                                isIncludedInRandom
                                  ? 'bg-cyan-500 text-black border border-cyan-400 font-extrabold shadow-hazard-glow'
                                  : 'bg-black/80 text-hazard-textMuted/60 border border-white/10 hover:text-white'
                              }`}
                            >
                              <Unlock className="w-2.5 h-2.5" />
                              <span>{isIncludedInRandom ? 'KEY ✓' : 'KEY —'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRandomOption(file.relPath, key, optionKeys);
                              }}
                              title={
                                isIncludedInRandom
                                  ? 'Included in Random Pool (Click to Exclude)'
                                  : 'Excluded from Random Pool (Click to Include)'
                              }
                              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold shadow-sm transition-all duration-150 active:scale-90 ${
                                isIncludedInRandom
                                  ? 'bg-hazard-purple text-white border border-hazard-purple/80 shadow-hazard-glow'
                                  : 'bg-black/80 text-hazard-textMuted/60 border border-white/10 hover:text-white hover:border-hazard-purple/50'
                              }`}
                            >
                              <Dices className="w-2.5 h-2.5" />
                              <span>{isIncludedInRandom ? '✓' : '—'}</span>
                            </button>
                          )}

                          {/* Universal Interactive Lock/Unlock Button on Any Option */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGlobalOptionLock(file.relPath, key);
                            }}
                            title={
                              isLocked
                                ? 'Option is Gacha-Locked (Click to Unlock for general templates)'
                                : 'Lock Option from General Gacha (Click to Lock as niche/manual only)'
                            }
                            className={`p-1 rounded-md text-[9px] font-mono transition-all duration-150 active:scale-90 ${
                              isLocked
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 hover:bg-amber-500 hover:text-black shadow-sm'
                                : 'bg-black/60 text-hazard-textMuted/40 border border-white/5 hover:text-amber-300 hover:border-amber-400/40 opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isLocked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5" />}
                          </button>
                        </div>

                        {/* Top Right: Status Badges / Edit Button / Selected Checkmark */}
                        <div className="flex items-center gap-1">
                          {entry.completed && (
                            <span
                              title="Verified / Completed Option"
                              className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/80 text-black border border-emerald-400 shadow-sm"
                            >
                              ✓ DONE
                            </span>
                          )}

                          {entry.subjects && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/80 text-hazard-textBright border border-white/10 shadow-sm">
                              {entry.subjects[0]}♀ / {entry.subjects[1]}♂
                            </span>
                          )}

                          {/* Quick Edit Option Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditOption(key, entry);
                            }}
                            title="Edit Option in Builder"
                            className="p-1 rounded-md text-hazard-textMuted hover:text-hazard-gold bg-black/60 border border-white/10 hover:border-hazard-gold/50 opacity-0 group-hover:opacity-100 transition active:scale-90"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>

                          {tier === 'red' && (
                            <span title={reason} className="p-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                            </span>
                          )}
                          {tier === 'blue' && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-900/90 text-sky-300 border border-sky-500/40">
                              Partial
                            </span>
                          )}

                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-hazard-gold text-black flex items-center justify-center text-xs font-bold shadow-sm ml-1">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Text Area (Title + Description Sub-line) */}
                      <div className="relative z-10 flex flex-col items-center text-center w-full">
                        <span className={`text-xs font-bold truncate w-full drop-shadow-md ${
                          isSelected
                            ? 'text-hazard-gold'
                            : isStateMatched
                            ? 'text-cyan-300'
                            : isLocked && !isUnlockedByTemplate
                            ? 'text-amber-300'
                            : tier === 'red'
                            ? 'text-rose-300'
                            : tier === 'blue'
                            ? 'text-sky-300'
                            : tier === 'green'
                            ? 'text-emerald-300'
                            : 'text-white group-hover:text-hazard-gold'
                        }`}>
                          {entry.display_name || key}
                        </span>
                        {entry.description ? (
                          <span className="text-[7px] text-hazard-textMuted group-hover:text-hazard-textBright truncate w-full font-mono leading-tight mt-0.5">
                            {entry.description}
                          </span>
                        ) : (
                          <span className="text-[7px] text-hazard-cyan/80 truncate w-full font-mono leading-tight mt-0.5">
                            {entry.prompt || ''}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-hazard-border bg-hazard-void text-xs text-hazard-textMuted font-mono shrink-0">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  Click 🔒 to Lock/Unlock any option across all templates
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  <Unlock className="w-3.5 h-3.5" />
                  Key-Unlocked in Niche Templates
                </span>
                <span className="flex items-center gap-1 text-emerald-400">● Green: Ready</span>
                <span className="flex items-center gap-1 text-rose-400">● Red: Excluded</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-hazard-card hover:bg-hazard-cardHover text-hazard-textBright border border-hazard-border rounded-xl transition"
              >
                Close (ESC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Option Builder & Editor Modal */}
      <OptionEditorModal
        isOpen={isOptionEditorOpen}
        onClose={() => setIsOptionEditorOpen(false)}
        fileRelPath={file.relPath}
        fileDisplayName={file.displayName}
        initialKey={editingOptionKey}
        initialEntry={editingOptionEntry}
      />
    </>
  );
};
