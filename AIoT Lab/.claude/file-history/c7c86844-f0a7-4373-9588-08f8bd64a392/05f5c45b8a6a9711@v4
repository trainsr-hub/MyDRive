import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ConditionEntry } from '../../types/schema';
import { generateHexId } from '../../utils/hexId';
import { getCategoryBadgeStyle } from './NotionCategorySelect';
import {
  Plus,
  Check,
  X,
  Search,
  Sparkles,
} from 'lucide-react';

interface NotionConditionMultiSelectProps {
  selectedIds: string[]; // Array of Condition Hex IDs (or fallback raw keywords)
  conditions: Record<string, ConditionEntry>; // Condition registry
  variant: 'requirement' | 'impact'; // requirement: emerald, impact: cyan
  onChange: (updatedIds: string[]) => void;
  onConditionCreated?: (newId: string, newEntry: ConditionEntry) => void;
}

export const NotionConditionMultiSelect: React.FC<NotionConditionMultiSelectProps> = ({
  selectedIds = [],
  conditions = {},
  variant,
  onChange,
  onConditionCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Clean list of conditions as array
  const allConditionsList = useMemo(() => {
    return Object.entries(conditions || {}).map(([id, entry]) => ({
      id,
      name: entry.display_name || id,
      category: entry.category || 'General',
      description: entry.description || '',
      completed: Boolean(entry.completed),
    }));
  }, [conditions]);

  // Group conditions by Category
  const groupedConditions = useMemo(() => {
    const groups: Record<string, typeof allConditionsList> = {};
    const q = search.toLowerCase().trim();

    allConditionsList.forEach((cond) => {
      // Filter by search
      if (
        q &&
        !cond.name.toLowerCase().includes(q) &&
        !cond.category.toLowerCase().includes(q) &&
        !cond.id.toLowerCase().includes(q)
      ) {
        return;
      }

      const cat = cond.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(cond);
    });

    return groups;
  }, [allConditionsList, search]);

  const exactMatchExists = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return allConditionsList.some((c) => c.name.toLowerCase() === q);
  }, [allConditionsList, search]);

  // Toggle selection
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  // Remove single selected ID
  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== id));
  };

  // Inline Create New Condition on the fly
  const handleCreateNewCondition = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    const formattedName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    const newHex = generateHexId();

    const newEntry: ConditionEntry = {
      display_name: formattedName,
      category: 'General',
      description: `Auto-created condition for ${formattedName}`,
      completed: false,
      tag_team: [],
      conflicts_with: [],
    };

    if (onConditionCreated) {
      onConditionCreated(newHex, newEntry);
    }

    onChange([...selectedIds, newHex]);
    setIsOpen(false);
    setSearch('');
  };

  const isRequirement = variant === 'requirement';

  return (
    <div className="relative inline-flex items-center w-full min-w-0" ref={popoverRef}>
      {/* Pills Container (Clickable to open popover) */}
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
            <span className="truncate">{isRequirement ? 'Add requirement...' : 'Add impact...'}</span>
          </span>
        ) : (
          selectedIds.map((id) => {
            const condition = conditions?.[id];
            const displayName = condition?.display_name || id;

            return (
              <span
                key={id}
                title={condition?.description || `ID: ${id}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition shadow-xs select-none max-w-full overflow-hidden ${
                  isRequirement
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                    : 'bg-cyan-950/70 border border-cyan-500/50 text-cyan-300'
                }`}
              >
                <span className="truncate max-w-[120px] leading-tight">{displayName}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, id)}
                  className="hover:text-rose-400 p-0.5 rounded hover:bg-black/20 shrink-0"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            );
          })
        )}

        {/* Plus Button inside cell if pills present */}
        {selectedIds.length > 0 && (
          <button
            type="button"
            className="p-1 rounded-lg text-hazard-textMuted hover:text-white hover:bg-hazard-card text-[10px] transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Notion-Style Grouped Category Multi-Select Dropdown Popover */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute ${
            variant === 'impact' ? 'right-0' : 'left-0'
          } top-full mt-1.5 z-50 w-80 sm:w-88 rounded-2xl bg-hazard-card border-2 border-hazard-gold/60 shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2.5 animate-fadeIn max-w-[calc(100vw-32px)]`}
        >
          {/* Header & Search */}
          <div className="flex items-center justify-between text-xs font-mono font-bold text-hazard-textBright px-1">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className={`w-4 h-4 shrink-0 ${isRequirement ? 'text-emerald-400' : 'text-hazard-cyan'}`} />
              <span className="truncate">Select {isRequirement ? 'Requirements' : 'Impacts'}</span>
            </span>
            <span className="text-[10px] text-hazard-textMuted shrink-0">{selectedIds.length} selected</span>
          </div>

          {/* Category Suggestor Pills (Notion-style) */}
          <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-none pb-1 pt-0.5 w-full min-w-0">
            {['All', ...Array.from(
              new Set(allConditionsList.map((c) => c.category || 'General'))
            )].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  if (search.toLowerCase().includes('cat:') && search.toLowerCase().includes(cat.toLowerCase())) {
                    setSearch('');
                  } else {
                    setSearch(`cat:${cat}`);
                  }
                }}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border transition select-none whitespace-nowrap shrink-0 active:scale-95 ${
                  search.toLowerCase().includes('cat:') && search.toLowerCase().includes(cat.toLowerCase())
                    ? isRequirement
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border-emerald-400/50 shadow-sm'
                      : 'bg-cyan-500/20 text-cyan-300 font-bold border-cyan-400/50 shadow-sm'
                    : 'bg-hazard-void text-hazard-textMuted hover:text-white border-hazard-border hover:border-hazard-gold/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search + Create Section */}
          <div className="flex flex-col gap-1.5 px-1 pt-0.5 w-full min-w-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-hazard-void border border-hazard-border w-full min-w-0">
              <Search className="w-3.5 h-3.5 text-hazard-textMuted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search conditions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (!exactMatchExists && search.trim()) {
                      handleCreateNewCondition();
                    }
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                className="w-full min-w-0 bg-transparent text-xs font-mono text-hazard-textBright placeholder:text-hazard-textMuted/50 outline-none"
              />
            </div>

            {/* Create New Condition Button */}
            {!exactMatchExists && search.trim() && (
              <button
                type="button"
                onClick={handleCreateNewCondition}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition text-left shadow-sm w-full min-w-0 overflow-hidden ${
                  isRequirement
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500 hover:text-black'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500 hover:text-black'
                }`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Create "{search.trim()}"</span>
              </button>
            )}
          </div>

          {/* Grouped Category Options List */}
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin w-full min-w-0">
            {Object.keys(groupedConditions).length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-hazard-textMuted/60">
                No matching conditions found.
              </div>
            ) : (
              Object.entries(groupedConditions).map(([category, items]) => (
                <div key={category} className="flex flex-col gap-1.5 w-full min-w-0">
                  {/* Category Header Label */}
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-hazard-textMuted border-b border-hazard-border/40">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${getCategoryBadgeStyle(category).split(' ')[0]}`} />
                    <span className="truncate">{category}</span>
                    <span className="text-hazard-textMuted/50 text-[9px] shrink-0">({items.length})</span>
                  </div>

                  {/* Conditions in this category */}
                  <div className="flex flex-col gap-1 pl-1 w-full min-w-0">
                    {items.map((cond) => {
                      const isSelected = selectedIds.includes(cond.id);

                      return (
                        <button
                          key={cond.id}
                          type="button"
                          onClick={() => handleToggle(cond.id)}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-mono transition text-left w-full min-w-0 min-h-[46px] overflow-hidden ${
                            isSelected
                              ? isRequirement
                                ? 'bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 font-bold'
                                : 'bg-cyan-950/70 border border-cyan-500/60 text-cyan-200 font-bold'
                              : 'text-hazard-textMuted hover:text-white hover:bg-hazard-void'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 flex-1 overflow-hidden gap-0.5">
                            <span className="truncate block font-semibold text-hazard-textBright leading-snug">
                              {cond.name}
                            </span>
                            {cond.description && (
                              <span className="text-[10px] text-hazard-textMuted/70 truncate block leading-tight">
                                {cond.description}
                              </span>
                            )}
                          </div>

                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? isRequirement
                                  ? 'bg-emerald-500 border-emerald-400 text-black'
                                  : 'bg-cyan-500 border-cyan-400 text-black'
                                : 'border-hazard-border bg-hazard-card'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
