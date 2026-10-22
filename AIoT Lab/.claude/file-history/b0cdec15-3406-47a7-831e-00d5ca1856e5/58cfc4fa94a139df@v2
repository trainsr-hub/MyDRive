import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Check, X, Search, Layers, Sparkles, Folder, FileText } from 'lucide-react';

export interface TagTeamOptionItem {
  key: string;
  name: string;
  fileRelPath: string;
  prompt?: string;
  fileName?: string;
  folderName?: string;
}

interface NotionTagTeamMultiSelectProps {
  selectedKeys: string[];
  allOptions: TagTeamOptionItem[];
  currentKey?: string; // Current row's key so it cannot inherit from itself
  onChange: (updatedKeys: string[]) => void;
  placeholder?: string;
  badgeVariant?: 'purple' | 'cyan' | 'gold' | 'rose';
}

export const NotionTagTeamMultiSelect: React.FC<NotionTagTeamMultiSelectProps> = ({
  selectedKeys = [],
  allOptions = [],
  currentKey,
  onChange,
  placeholder = 'Add inheritance...',
  badgeVariant = 'purple',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>('All');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
        setSelectedFolderFilter('All');
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

  // Lookup map for fast name retrieval
  const optionsMap = useMemo(() => {
    const map = new Map<string, TagTeamOptionItem>();
    allOptions.forEach((opt) => map.set(opt.key, opt));
    return map;
  }, [allOptions]);

  // Unique list of parent folders for filter tabs
  const folderFilters = useMemo(() => {
    const set = new Set<string>();
    allOptions.forEach((opt) => {
      if (opt.folderName) set.add(opt.folderName);
    });
    return ['All', ...Array.from(set)];
  }, [allOptions]);

  // Filtered available options for picker
  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allOptions.filter((opt) => {
      if (currentKey && opt.key === currentKey) return false;

      // Folder filter
      if (
        selectedFolderFilter !== 'All' &&
        opt.folderName?.toLowerCase() !== selectedFolderFilter.toLowerCase()
      ) {
        return false;
      }

      // Text search
      if (!q) return true;
      return (
        opt.name.toLowerCase().includes(q) ||
        opt.key.toLowerCase().includes(q) ||
        (opt.fileName && opt.fileName.toLowerCase().includes(q)) ||
        (opt.folderName && opt.folderName.toLowerCase().includes(q)) ||
        (opt.prompt && opt.prompt.toLowerCase().includes(q))
      );
    });
  }, [allOptions, currentKey, search, selectedFolderFilter]);

  const handleToggle = (key: string) => {
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter((k) => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  };

  const handleRemove = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    onChange(selectedKeys.filter((k) => k !== key));
  };

  const getBadgeColors = () => {
    switch (badgeVariant) {
      case 'cyan':
        return 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300';
      case 'gold':
        return 'bg-amber-950/70 border-amber-500/50 text-amber-300';
      case 'rose':
        return 'bg-rose-950/70 border-rose-500/50 text-rose-300';
      case 'purple':
      default:
        return 'bg-hazard-purple/20 border-hazard-purple/50 text-hazard-purple';
    }
  };

  return (
    <div className="relative inline-flex items-center w-full min-w-0" ref={popoverRef}>
      {/* Trigger Area: Selected Pills Container */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex flex-wrap items-center gap-1.5 w-full min-h-[38px] p-1.5 rounded-xl bg-transparent hover:bg-hazard-card/60 cursor-pointer transition border border-transparent hover:border-hazard-border/60 overflow-hidden"
      >
        {selectedKeys.length === 0 ? (
          <span className="text-[10px] font-mono text-hazard-textMuted/40 italic px-1 flex items-center gap-1.5 truncate max-w-full">
            <Plus className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="truncate">{placeholder}</span>
          </span>
        ) : (
          selectedKeys.map((key) => {
            const item = optionsMap.get(key);
            const displayName = item?.name || key;

            return (
              <span
                key={key}
                title={`${displayName} (${key})${item?.prompt ? `\nPrompt: ${item.prompt}` : ''}`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition shadow-xs select-none max-w-full overflow-hidden ${getBadgeColors()}`}
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

        {/* Plus Button inside cell if pills are present */}
        {selectedKeys.length > 0 && (
          <button
            type="button"
            className="p-1 rounded-lg text-hazard-textMuted hover:text-white hover:bg-hazard-card text-[10px] transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Notion Popover Searchable Dropdown */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-1.5 z-50 w-84 sm:w-96 rounded-2xl bg-hazard-card border-2 border-hazard-purple/60 shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2.5 animate-fadeIn max-w-[calc(100vw-32px)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between text-xs font-mono font-bold text-hazard-textBright px-1">
            <span className="flex items-center gap-1.5 truncate">
              <Layers className="w-4 h-4 text-hazard-purple shrink-0" />
              <span className="truncate">Tag-Team Prompt Inheritance</span>
            </span>
            <span className="text-[10px] text-hazard-textMuted shrink-0">
              {selectedKeys.length} inherited
            </span>
          </div>

          {/* Search Input Bar */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-hazard-void border border-hazard-border w-full min-w-0">
            <Search className="w-3.5 h-3.5 text-hazard-textMuted shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, key, folder, or prompt token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
              className="w-full min-w-0 bg-transparent text-xs font-mono text-hazard-textBright placeholder:text-hazard-textMuted/40 outline-none"
            />
          </div>

          {/* Category / Folder Filters */}
          {folderFilters.length > 2 && (
            <div className="flex items-center gap-1.5 px-1 overflow-x-auto scrollbar-none pb-0.5 w-full min-w-0">
              {folderFilters.map((folder) => (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setSelectedFolderFilter(folder)}
                  className={`text-[9px] font-mono px-2.5 py-0.5 rounded-lg border transition select-none whitespace-nowrap shrink-0 active:scale-95 ${
                    selectedFolderFilter.toLowerCase() === folder.toLowerCase()
                      ? 'bg-hazard-purple/20 text-hazard-purple font-bold border-hazard-purple/50 shadow-sm'
                      : 'bg-hazard-void text-hazard-textMuted hover:text-white border-hazard-border hover:border-hazard-purple/30'
                  }`}
                >
                  {folder}
                </button>
              ))}
            </div>
          )}

          {/* Search Results List */}
          <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1 scrollbar-thin w-full min-w-0">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-hazard-textMuted/60">
                No matching component options found.
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = selectedKeys.includes(opt.key);

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleToggle(opt.key)}
                    className={`flex items-start justify-between gap-3 px-3 py-2 rounded-xl text-xs font-mono transition text-left w-full min-w-0 overflow-hidden ${
                      isSelected
                        ? 'bg-hazard-purple/20 border border-hazard-purple/60 text-white font-bold'
                        : 'text-hazard-textMuted hover:text-white hover:bg-hazard-void border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1 overflow-hidden gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate block font-semibold text-hazard-textBright leading-snug">
                          {opt.name}
                        </span>
                        {opt.fileName && (
                          <span className="text-[9px] font-mono text-hazard-purple/80 bg-hazard-purple/10 px-1.5 py-0.2 rounded shrink-0 truncate max-w-[120px]">
                            {opt.fileName}
                          </span>
                        )}
                      </div>

                      {opt.prompt && (
                        <span className="text-[10px] font-mono text-hazard-textMuted/60 truncate block leading-tight">
                          {opt.prompt}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition ${
                        isSelected
                          ? 'bg-hazard-purple border-hazard-purple text-white'
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
