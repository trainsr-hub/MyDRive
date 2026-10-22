import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Check, X, Search, Layers, AlertTriangle } from 'lucide-react';
import { getCategoryBadgeStyle } from './NotionCategorySelect';

export interface ConditionRelationItem {
  key: string;
  name: string;
  category?: string;
  description?: string;
}

interface NotionConditionRelationSelectProps {
  selectedIds: string[];
  allConditions: ConditionRelationItem[];
  currentKey?: string;
  variant: 'tag_team' | 'conflict';
  onChange: (updatedIds: string[]) => void;
  placeholder?: string;
}

export const NotionConditionRelationSelect: React.FC<NotionConditionRelationSelectProps> = ({
  selectedIds = [],
  allConditions = [],
  currentKey,
  variant,
  onChange,
  placeholder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setSelectedCategoryFilter('All');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isConflict = variant === 'conflict';

  // Fast map lookup
  const conditionsMap = useMemo(() => {
    const map = new Map<string, ConditionRelationItem>();
    allConditions.forEach((cond) => map.set(cond.key, cond));
    return map;
  }, [allConditions]);

  // Unique categories for filter pills
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    allConditions.forEach((cond) => {
      if (cond.category) set.add(cond.category);
    });
    return ['All', ...Array.from(set)];
  }, [allConditions]);

  // Filtered list
  const filteredConditions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allConditions.filter((cond) => {
      if (currentKey && cond.key === currentKey) return false;

      if (
        selectedCategoryFilter !== 'All' &&
        cond.category?.toLowerCase() !== selectedCategoryFilter.toLowerCase()
      ) {
        return false;
      }

      if (!q) return true;
      return (
        cond.name.toLowerCase().includes(q) ||
        cond.key.toLowerCase().includes(q) ||
        (cond.category && cond.category.toLowerCase().includes(q)) ||
        (cond.description && cond.description.toLowerCase().includes(q))
      );
    });
  }, [allConditions, currentKey, search, selectedCategoryFilter]);

  const handleToggle = (key: string) => {
    if (selectedIds.includes(key)) {
      onChange(selectedIds.filter((k) => k !== key));
    } else {
      onChange([...selectedIds, key]);
    }
  };

  const handleRemove = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter((k) => k !== key));
  };

  const defaultPlaceholder = isConflict ? 'Add collision rule...' : 'Bundle condition...';

  return (
    <div className="relative inline-flex items-center w-full min-w-0" ref={popoverRef}>
      {/* Pills Container */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex flex-wrap items-center gap-1.5 w-full min-h-[38px] p-1.5 rounded-xl bg-transparent hover:bg-hazard-card/60 cursor-pointer transition border border-transparent hover:border-hazard-border/60 overflow-hidden"
      >
        {selectedIds.length === 0 ? (
          <span className="text-[10px] font-mono text-hazard-textMuted/40 italic px-1 flex items-center gap-1.5 truncate max-w-full">
            <Plus className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="truncate">{placeholder || defaultPlaceholder}</span>
          </span>
        ) : (
          selectedIds.map((key) => {
            const item = conditionsMap.get(key);
            const displayName = item?.name || key;

            return (
              <span
                key={key}
                title={`${displayName} (${key})${item?.description ? `\n${item.description}` : ''}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition shadow-xs select-none max-w-full overflow-hidden ${
                  isConflict
                    ? 'bg-rose-950/70 border-rose-500/50 text-rose-300'
                    : 'bg-hazard-purple/20 border-hazard-purple/50 text-hazard-purple'
                }`}
              >
                <span className="truncate max-w-[120px] leading-tight">{displayName}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, key)}
                  className="hover:text-rose-400 p-0.5 rounded hover:bg-black/20 shrink-0"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })
        )}

        {/* Plus Button */}
        {selectedIds.length > 0 && (
          <button
            type="button"
            className="p-1 rounded-lg text-hazard-textMuted hover:text-white hover:bg-hazard-card text-[10px] transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            isConflict ? 'right-0' : 'left-0'
          } top-full mt-1.5 z-50 w-80 sm:w-92 rounded-2xl bg-hazard-card border-2 ${
            isConflict ? 'border-rose-500/60' : 'border-hazard-purple/60'
          } shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2.5 animate-fadeIn max-w-[calc(100vw-32px)]`}
        >
          {/* Header */}
          <div className="flex items-center justify-between text-xs font-mono font-bold text-hazard-textBright px-1">
            <span className="flex items-center gap-1.5 truncate">
              {isConflict ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Layers className="w-4 h-4 text-hazard-purple shrink-0" />
              )}
              <span className="truncate">
                {isConflict ? 'Mutual Collision Exclusions' : 'Tag-Team Implied Bundling'}
              </span>
            </span>
            <span className="text-[10px] text-hazard-textMuted shrink-0">
              {selectedIds.length} linked
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-hazard-void border border-hazard-border w-full min-w-0">
            <Search className="w-3.5 h-3.5 text-hazard-textMuted shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search condition name, key, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
              className="w-full min-w-0 bg-transparent text-xs font-mono text-hazard-textBright placeholder:text-hazard-textMuted/40 outline-none"
            />
          </div>

          {/* Category Filter Pills */}
          {categoriesList.length > 2 && (
            <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-none pb-0.5 w-full min-w-0">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`text-[9px] font-mono px-2.5 py-0.5 rounded-lg border transition select-none whitespace-nowrap shrink-0 active:scale-95 ${
                    selectedCategoryFilter.toLowerCase() === cat.toLowerCase()
                      ? isConflict
                        ? 'bg-rose-500/20 text-rose-300 font-bold border-rose-500/50 shadow-sm'
                        : 'bg-hazard-purple/20 text-hazard-purple font-bold border-hazard-purple/50 shadow-sm'
                      : 'bg-hazard-void text-hazard-textMuted hover:text-white border-hazard-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Options List */}
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin w-full min-w-0">
            {filteredConditions.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-hazard-textMuted/60">
                No matching conditions found.
              </div>
            ) : (
              filteredConditions.map((cond) => {
                const isSelected = selectedIds.includes(cond.key);

                return (
                  <button
                    key={cond.key}
                    type="button"
                    onClick={() => handleToggle(cond.key)}
                    className={`flex items-start justify-between gap-3 px-3 py-2 rounded-xl text-xs font-mono transition text-left w-full min-w-0 overflow-hidden ${
                      isSelected
                        ? isConflict
                          ? 'bg-rose-950/70 border border-rose-500/60 text-rose-200 font-bold'
                          : 'bg-hazard-purple/20 border border-hazard-purple/60 text-white font-bold'
                        : 'text-hazard-textMuted hover:text-white hover:bg-hazard-void border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate block font-semibold text-hazard-textBright leading-snug">
                          {cond.name}
                        </span>
                        {cond.category && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${getCategoryBadgeStyle(
                              cond.category
                            )}`}
                          >
                            {cond.category}
                          </span>
                        )}
                      </div>

                      {cond.description && (
                        <span className="text-[10px] font-mono text-hazard-textMuted/70 truncate block leading-tight">
                          {cond.description}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isSelected
                          ? isConflict
                            ? 'bg-rose-500 border-rose-400 text-black'
                            : 'bg-hazard-purple border-hazard-purple text-white'
                          : 'border-hazard-border bg-hazard-card'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
