import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTriggerStore } from '../../store/useTriggerStore';
import { ConditionEntry } from '../../types/schema';
import { ConditionManager, ConditionFolderNode, ConditionFileNode } from '../../utils/conditionManager';
import { generateHexId } from '../../utils/hexId';
import { NotionCategorySelect } from './NotionCategorySelect';
import { NotionConditionRelationSelect, ConditionRelationItem } from './NotionConditionRelationSelect';
import { HierarchyPromptModal } from './HierarchyPromptModal';
import {
  ShieldAlert,
  Plus,
  Search,
  Layers,
  Sparkles,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Folder,
  ChevronLeft,
  ChevronRight,
  MoveHorizontal,
  Flame,
  CheckSquare,
  Edit3,
} from 'lucide-react';

const PRESET_CATEGORIES = [
  'All',
  'Subject',
  'Pose',
  'Apparel',
  'Environment',
  'Camera',
  'Expression',
  'Lighting',
  'Art Style',
  'General',
];

export const ConditionsManagerView: React.FC = () => {
  const { app, reload } = useTriggerStore();

  const [conditionFolders, setConditionFolders] = useState<ConditionFolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [selectedFileRelPath, setSelectedFileRelPath] = useState('');
  const [conditions, setConditions] = useState<Record<string, ConditionEntry>>({});
  const [workingConditions, setWorkingConditions] = useState<Record<string, ConditionEntry>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Selected Category filter tab
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'draft' | 'conflicts'>('all');

  // Hierarchy Create / Rename Dialog Modal State
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    placeholder?: string;
    defaultValue?: string;
    submitLabel?: string;
    type?: 'category' | 'file';
    onSubmit: (val: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    onSubmit: async () => {},
  });

  // Load conditions from disk
  const loadData = useCallback(async () => {
    if (!app) return;
    setIsLoading(true);
    const folders = await ConditionManager.scanAll(app);
    const selectedFolder = folders.find((folder) => folder.relPath === selectedFolderId) || folders[0];
    const selectedFile = selectedFolder?.files.find((file) => file.relPath === selectedFileRelPath) || selectedFolder?.files[0];
    setConditionFolders(folders);
    setSelectedFolderId(selectedFolder?.relPath || '');
    setSelectedFileRelPath(selectedFile?.relPath || '');
    setConditions(selectedFile?.entries || {});
    setWorkingConditions(JSON.parse(JSON.stringify(selectedFile?.entries || {})));
    setIsDirty(false);
    setDirtyCount(0);
    setIsLoading(false);
  }, [app]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeFolder = useMemo(
    () => conditionFolders.find((folder) => folder.relPath === selectedFolderId) || conditionFolders[0] || null,
    [conditionFolders, selectedFolderId]
  );
  const activeFile = useMemo(
    () => activeFolder?.files.find((file) => file.relPath === selectedFileRelPath) || activeFolder?.files[0] || null,
    [activeFolder, selectedFileRelPath]
  );

  const selectConditionFile = (file: ConditionFileNode) => {
    if (isDirty && !window.confirm('Discard unsaved edits in the current condition file?')) return;
    setSelectedFileRelPath(file.relPath);
    setConditions(file.entries);
    setWorkingConditions(JSON.parse(JSON.stringify(file.entries)));
    setIsDirty(false);
    setDirtyCount(0);
  };

  // --- HORIZONTAL NOTION-STYLE DRAG & WALL EDGE NAVIGATION ---
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const edgeScrollAnimRef = useRef<number | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const checkScrollBoundaries = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < maxScroll - 4);
    setScrollProgress(maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0);
  }, []);

  useEffect(() => {
    checkScrollBoundaries();
    window.addEventListener('resize', checkScrollBoundaries);
    return () => window.removeEventListener('resize', checkScrollBoundaries);
  }, [checkScrollBoundaries, workingConditions]);

  const scrollHorizontally = useCallback((delta: number) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScrollBoundaries, 200);
  }, [checkScrollBoundaries]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.tagName === 'BUTTON' ||
      target.closest('button') ||
      target.closest('select') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }

    if (!tableContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startScrollLeftRef.current = tableContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tableContainerRef.current) return;
    const el = tableContainerRef.current;
    const rect = el.getBoundingClientRect();

    if (isDraggingRef.current) {
      const dx = e.clientX - startXRef.current;
      el.scrollLeft = startScrollLeftRef.current - dx;
      checkScrollBoundaries();
    }

    const distToRight = rect.right - e.clientX;
    const distToLeft = e.clientX - rect.left;

    if (edgeScrollAnimRef.current) {
      cancelAnimationFrame(edgeScrollAnimRef.current);
      edgeScrollAnimRef.current = null;
    }

    if (distToRight >= 0 && distToRight < 60) {
      const speed = Math.max(2, Math.round((60 - distToRight) * 0.4));
      const step = () => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollLeft += speed;
          checkScrollBoundaries();
        }
      };
      edgeScrollAnimRef.current = requestAnimationFrame(step);
    } else if (distToLeft >= 0 && distToLeft < 60) {
      const speed = Math.max(2, Math.round((60 - distToLeft) * 0.4));
      const step = () => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollLeft -= speed;
          checkScrollBoundaries();
        }
      };
      edgeScrollAnimRef.current = requestAnimationFrame(step);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    if (edgeScrollAnimRef.current) {
      cancelAnimationFrame(edgeScrollAnimRef.current);
      edgeScrollAnimRef.current = null;
    }
    checkScrollBoundaries();
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!tableContainerRef.current) return;
    if (e.shiftKey || Math.abs(e.deltaX) > 0) {
      tableContainerRef.current.scrollLeft += e.deltaX || e.deltaY;
      checkScrollBoundaries();
    }
  };

  // Convert working conditions dictionary to array
  const entriesList = useMemo(() => {
    return Object.entries(workingConditions).map(([key, entry]) => ({
      key,
      entry,
    }));
  }, [workingConditions]);

  // All conditions across all condition folders/tables for cross-table linking
  const allConditionsGlobalList = useMemo<ConditionRelationItem[]>(() => {
    const list: ConditionRelationItem[] = [];
    conditionFolders.forEach((folder) => {
      folder.files.forEach((file) => {
        Object.entries(file.entries).forEach(([condKey, condEntry]) => {
          list.push({
            key: condKey,
            name: condEntry.display_name || condKey,
            category: condEntry.category || folder.displayName || 'General',
            description: condEntry.description || '',
          });
        });
      });
    });
    return list;
  }, [conditionFolders]);

  // Available categories with counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: entriesList.length };
    entriesList.forEach(({ entry }) => {
      const cat = entry.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [entriesList]);

  const categoriesList = useMemo(() => {
    const set = new Set([...PRESET_CATEGORIES, ...Object.keys(categoryCounts)]);
    return Array.from(set);
  }, [categoryCounts]);

  // Counts for status
  const completedCount = useMemo(() => entriesList.filter((e) => Boolean(e.entry.completed)).length, [entriesList]);
  const draftCount = useMemo(() => entriesList.filter((e) => !e.entry.completed).length, [entriesList]);
  const conflictCount = useMemo(() => entriesList.filter((e) => e.entry.conflicts_with && e.entry.conflicts_with.length > 0).length, [entriesList]);

  // Filtered rows
  const filteredEntries = useMemo(() => {
    return entriesList.filter(({ key, entry }) => {
      // Category filter
      if (selectedCategory !== 'All' && (entry.category || 'General').toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Status filters
      if (filterMode === 'completed' && !entry.completed) return false;
      if (filterMode === 'draft' && Boolean(entry.completed)) return false;
      if (filterMode === 'conflicts' && (!entry.conflicts_with || entry.conflicts_with.length === 0)) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        key.toLowerCase().includes(q) ||
        (entry.display_name && entry.display_name.toLowerCase().includes(q)) ||
        (entry.description && entry.description.toLowerCase().includes(q)) ||
        (entry.category && entry.category.toLowerCase().includes(q))
      );
    });
  }, [entriesList, selectedCategory, searchQuery, filterMode]);

  // Helper to update working copy
  const updateField = useCallback((key: string, field: keyof ConditionEntry, value: any) => {
    setWorkingConditions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  }, []);

  // Save changes to disk
  const handleSaveToDisk = useCallback(async () => {
    if (!app || isSaving || !activeFile) return;
    setIsSaving(true);

    const success = await ConditionManager.saveConditionFile(app, activeFile.relPath, workingConditions);
    if (success) {
      setConditions(JSON.parse(JSON.stringify(workingConditions)));
      setIsDirty(false);
      setDirtyCount(0);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2000);
      await reload();
    } else {
      window.alert(`Failed to save conditions to ${activeFile.relPath}.`);
    }
    setIsSaving(false);
  }, [app, activeFile, workingConditions, isSaving, reload]);

  const handleCreateCategory = () => {
    if (!app) return;
    setPromptModal({
      isOpen: true,
      title: 'Create Condition Category',
      subtitle: 'Creates a new subfolder under Hazard_Trigger_Data/Conditions/',
      placeholder: 'e.g. _01_Subject or Combat',
      defaultValue: '',
      submitLabel: 'Create Category',
      type: 'category',
      onSubmit: async (name: string) => {
        const relPath = await ConditionManager.createConditionCategoryFolder(app, name);
        if (relPath) {
          await reload();
          await loadData();
          setSelectedFolderId(relPath);
          setSelectedFileRelPath('');
        }
      },
    });
  };

  const handleRenameCategory = () => {
    if (!app || !activeFolder) return;
    setPromptModal({
      isOpen: true,
      title: 'Rename Condition Category',
      subtitle: `Renames folder "${activeFolder.folderName || activeFolder.relPath}"`,
      placeholder: 'Enter new category name...',
      defaultValue: activeFolder.folderName || activeFolder.relPath || '',
      submitLabel: 'Rename Category',
      type: 'category',
      onSubmit: async (name: string) => {
        const relPath = await ConditionManager.renameConditionCategoryFolder(app, activeFolder.relPath, name);
        if (relPath) {
          await reload();
          await loadData();
          setSelectedFolderId(relPath);
          setSelectedFileRelPath(activeFile ? `${relPath}/${activeFile.fileName}` : '');
        }
      },
    });
  };

  const handleCreateFile = () => {
    if (!app || !activeFolder) return;
    setPromptModal({
      isOpen: true,
      title: 'Create Condition Table',
      subtitle: `Creates a new JSON condition table inside ${activeFolder.displayName}`,
      placeholder: 'e.g. status_effects or battle_poses',
      defaultValue: '',
      submitLabel: 'Create Table',
      type: 'file',
      onSubmit: async (name: string) => {
        const relPath = await ConditionManager.createConditionFile(app, activeFolder.relPath, name);
        if (relPath) {
          await reload();
          await loadData();
          setSelectedFolderId(activeFolder.relPath);
          setSelectedFileRelPath(relPath);
        }
      },
    });
  };

  const handleRenameFile = () => {
    if (!app || !activeFile) return;
    setPromptModal({
      isOpen: true,
      title: 'Rename Condition Table',
      subtitle: `Renames file "${activeFile.fileName}"`,
      placeholder: 'Enter new table name...',
      defaultValue: activeFile.fileName.replace(/\.json$/i, '') || '',
      submitLabel: 'Rename Table',
      type: 'file',
      onSubmit: async (name: string) => {
        const relPath = await ConditionManager.renameConditionFile(app, activeFile.relPath, name);
        if (relPath) {
          await reload();
          await loadData();
          setSelectedFileRelPath(relPath);
        }
      },
    });
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (window.confirm('Discard all unsaved edits in Conditions?')) {
      setWorkingConditions(JSON.parse(JSON.stringify(conditions)));
      setIsDirty(false);
      setDirtyCount(0);
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isDirty) {
          handleSaveToDisk();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, handleSaveToDisk]);

  // Add new Condition row
  const handleAddNewCondition = () => {
    const newHex = generateHexId();
    const newEntry: ConditionEntry = {
      display_name: 'New Condition',
      category: selectedCategory !== 'All' ? selectedCategory : 'General',
      description: '',
      completed: false,
      tag_team: [],
      conflicts_with: [],
    };

    setWorkingConditions((prev) => ({
      ...prev,
      [newHex]: newEntry,
    }));
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  };

  // Duplicate Condition row
  const handleDuplicateCondition = (key: string, entry: ConditionEntry) => {
    const newHex = generateHexId();
    const duplicated: ConditionEntry = {
      ...JSON.parse(JSON.stringify(entry)),
      display_name: `${entry.display_name || key} (Copy)`,
      completed: false,
    };

    setWorkingConditions((prev) => ({
      ...prev,
      [newHex]: duplicated,
    }));
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  };

  // Delete Condition row
  const handleDeleteCondition = (key: string) => {
    setWorkingConditions((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  };

  // Toggle Tag-Team implied condition
  const handleToggleTagTeam = (key: string, currentTagTeam: string[] | undefined, targetKey: string) => {
    const list = Array.isArray(currentTagTeam) ? [...currentTagTeam] : [];
    const exists = list.includes(targetKey);
    const updated = exists ? list.filter((k) => k !== targetKey) : [...list, targetKey];
    updateField(key, 'tag_team', updated);
  };

  // Toggle Conflicts-With condition
  const handleToggleConflict = (key: string, currentConflicts: string[] | undefined, targetKey: string) => {
    const list = Array.isArray(currentConflicts) ? [...currentConflicts] : [];
    const exists = list.includes(targetKey);
    const updated = exists ? list.filter((k) => k !== targetKey) : [...list, targetKey];
    updateField(key, 'conflicts_with', updated);
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn select-none">
      {/* Hierarchy Create / Rename Prompt Modal */}
      <HierarchyPromptModal
        isOpen={promptModal.isOpen}
        title={promptModal.title}
        subtitle={promptModal.subtitle}
        placeholder={promptModal.placeholder}
        defaultValue={promptModal.defaultValue}
        submitLabel={promptModal.submitLabel}
        type={promptModal.type}
        onClose={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={promptModal.onSubmit}
      />

      {/* TOP HEADER */}
      <div className="p-6 rounded-3xl bg-hazard-card/90 border border-hazard-border shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-hazard-cyan/10 border border-hazard-cyan/30 text-hazard-cyan shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold uppercase tracking-wider text-hazard-textBright">
                Conditions & Collision Physics Registry
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-hazard-cyan/15 border border-hazard-cyan/40 text-hazard-cyan text-[10px] font-mono font-bold">
                Condition Engine
              </span>
            </div>
            <p className="text-xs text-hazard-textMuted font-mono mt-0.5">
              Defines semantic scene states, prerequisite condition nodes, tag-team bundling, and mutual exclusion collision rules.
            </p>
          </div>
        </div>

        {/* Action: Create Condition */}
        <button
          type="button"
          onClick={handleAddNewCondition}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-hazard-cyan to-hazard-cyan hover:brightness-110 text-black shadow-sm hover:scale-[1.02] active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Condition</span>
        </button>
      </div>

      {/* TOP HORIZONTAL HIERARCHY NAVIGATION (MIRRORS COMPONENTS) */}
      <div className="flex flex-col gap-3 p-4 rounded-3xl bg-hazard-card/90 border border-hazard-border shadow-md">
        {/* Row 1: Condition Folder Categories */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-hazard-textMuted font-mono mr-2 shrink-0 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-hazard-cyan" />
            <span>Categories:</span>
          </span>
          {conditionFolders.map((folder) => {
            const isSelected = selectedFolderId === folder.relPath;
            const totalOptions = folder.files.reduce((sum, f) => sum + Object.keys(f.entries).length, 0);

            return (
              <button
                key={folder.relPath}
                type="button"
                onClick={() => {
                  if (isDirty && !window.confirm('Discard unsaved edits in the current condition file?')) return;
                  setSelectedFolderId(folder.relPath);
                  const nextFile = folder.files[0];
                  setSelectedFileRelPath(nextFile?.relPath || '');
                  setConditions(nextFile?.entries || {});
                  setWorkingConditions(JSON.parse(JSON.stringify(nextFile?.entries || {})));
                  setIsDirty(false);
                  setDirtyCount(0);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition select-none whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-hazard-cyan text-black font-extrabold shadow-sm scale-[1.02]'
                    : 'bg-hazard-void text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover border border-hazard-border'
                }`}
              >
                <span>{folder.displayName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-black/25 text-black' : 'bg-hazard-card text-hazard-textMuted/70'}`}>
                  {totalOptions}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleCreateCategory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono border border-dashed border-hazard-cyan/60 text-hazard-cyan hover:bg-hazard-cyan hover:text-black transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Category</span>
          </button>
          {activeFolder && (
            <button type="button" onClick={handleRenameCategory} title="Rename selected category" className="p-2 rounded-xl border border-hazard-border text-hazard-textMuted hover:text-hazard-cyan hover:border-hazard-cyan/50 transition shrink-0">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Condition Files */}
        {activeFolder && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-hazard-border/60 scrollbar-none">
            <span className="text-[11px] font-mono font-bold text-hazard-textMuted mr-1 shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-hazard-gold" />
              <span>Files:</span>
            </span>
            {activeFolder.files.map((file) => {
              const isSelected = selectedFileRelPath === file.relPath;
              const count = Object.keys(file.entries).length;

              return (
                <button
                  key={file.relPath}
                  type="button"
                  onClick={() => selectConditionFile(file)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition select-none whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-hazard-gold text-black font-extrabold shadow-sm'
                      : 'bg-hazard-void/80 text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover border border-hazard-border/70'
                  }`}
                >
                  <span>{file.displayName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-black/25 text-black' : 'bg-hazard-card text-hazard-textMuted/70'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleCreateFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border border-dashed border-hazard-gold/60 text-hazard-gold hover:bg-hazard-gold hover:text-black transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>File</span>
            </button>
            {activeFile && (
              <button type="button" onClick={handleRenameFile} title="Rename selected file" className="p-1.5 rounded-xl border border-hazard-border text-hazard-textMuted hover:text-hazard-gold hover:border-hazard-gold/50 transition shrink-0">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* SEMANTIC TAG FILTER TABS */}
      <div className="flex flex-col gap-3 p-4 rounded-3xl bg-hazard-card/90 border border-hazard-border shadow-md">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-hazard-textMuted font-mono mr-2 shrink-0 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-hazard-cyan" />
            <span>Filter Tags:</span>
          </span>
          {categoriesList.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition select-none whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-hazard-cyan text-black font-extrabold shadow-sm scale-[1.02]'
                    : 'bg-hazard-void text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover border border-hazard-border'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-black/25 text-black' : 'bg-hazard-card text-hazard-textMuted/70'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NOTION DATABASE TABLE FOR CONDITIONS */}
      <div className="flex flex-col gap-3 p-5 rounded-3xl bg-hazard-card border border-hazard-border shadow-lg w-full relative">
        {/* Toolbar: Category Title, Search, Filters & Save */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-hazard-border">
          {/* Left: Category Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-hazard-cyan/10 border border-hazard-cyan/30 text-hazard-cyan">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hazard-textBright uppercase tracking-wide">
                  {selectedCategory} Conditions
                </h3>
                <span className="px-2 py-0.5 rounded bg-hazard-void border border-hazard-border text-hazard-cyan text-[10px] font-mono">
                  {filteredEntries.length} rows
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-hazard-textMuted/70 bg-hazard-void px-2 py-0.5 rounded border border-hazard-border">
                  <MoveHorizontal className="w-3 h-3 text-hazard-cyan" />
                  <span>Left-click & Drag or move to wall to pan horizontally</span>
                </span>
              </div>
              <p className="text-[11px] text-hazard-textMuted font-mono">
                Storage: <code className="text-hazard-cyan">Hazard_Trigger_Data/Conditions/{activeFile ? activeFile.relPath : '...'}</code>
              </p>
            </div>
          </div>

          {/* Right: Search, Status Filters & Save */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-hazard-void p-1 rounded-xl border border-hazard-border text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'all'
                    ? 'bg-hazard-card text-hazard-cyan font-bold shadow-sm'
                    : 'text-hazard-textMuted hover:text-white'
                }`}
              >
                All ({entriesList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('completed')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/40 shadow-sm'
                    : 'text-hazard-textMuted hover:text-white'
                }`}
              >
                Done ({completedCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('draft')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'draft'
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-400/40 shadow-sm'
                    : 'text-hazard-textMuted hover:text-white'
                }`}
              >
                Draft ({draftCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('conflicts')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'conflicts'
                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-400/40 shadow-sm'
                    : 'text-hazard-textMuted hover:text-white'
                }`}
              >
                Collisions ({conflictCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-1.5 bg-hazard-void border border-hazard-border rounded-xl px-3 py-1.5 min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-hazard-textMuted" />
              <input
                type="text"
                placeholder="Filter conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-hazard-textBright placeholder:text-hazard-textMuted/40 outline-none font-mono"
              />
            </div>

            {/* Add Row Button */}
            <button
              type="button"
              onClick={handleAddNewCondition}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-hazard-card border border-hazard-cyan/40 text-hazard-cyan hover:bg-hazard-cyan hover:text-black transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Condition</span>
            </button>

            {/* Save Status & Button */}
            {isDirty ? (
              <div className="flex items-center gap-2 animate-pulse">
                <button
                  type="button"
                  onClick={handleDiscardChanges}
                  title="Discard all unsaved edits in Conditions"
                  className="p-2 text-hazard-crimson hover:bg-hazard-crimson/20 border border-hazard-crimson/40 rounded-xl transition text-xs font-mono"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleSaveToDisk}
                  disabled={isSaving}
                  title="Save conditions to conditions.json (Ctrl+S)"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-hazard-cyan to-hazard-cyan hover:brightness-110 text-black shadow-sm hover:scale-105 active:scale-95 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save ({dirtyCount} edits)</span>
                </button>
              </div>
            ) : saveSuccessNotice ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-bold">
                <Check className="w-4 h-4" />
                <span>Saved to JSON!</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <div className="w-full h-1 bg-hazard-void rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-hazard-cyan to-hazard-gold transition-all duration-75"
            style={{ width: `${Math.max(10, scrollProgress)}%` }}
          />
        </div>

        {/* TABLE VIEWPORT WITH DRAG-TO-SCROLL & FLOATING EDGE CHEVRON BUTTONS */}
        <div className="relative w-full group/table">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollHorizontally(-350)}
              onMouseEnter={() => scrollHorizontally(-200)}
              title="Pan Left (or drag table / move cursor to left edge)"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-2xl bg-hazard-card/95 hover:bg-hazard-cyan hover:text-black text-hazard-cyan border border-hazard-cyan/50 shadow-2xl backdrop-blur-md transition-all duration-150 active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollHorizontally(350)}
              onMouseEnter={() => scrollHorizontally(200)}
              title="Pan Right (or drag table / move cursor to right edge)"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-2xl bg-hazard-card/95 hover:bg-hazard-cyan hover:text-black text-hazard-cyan border border-hazard-cyan/50 shadow-2xl backdrop-blur-md transition-all duration-150 active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Table Container */}
          <div
            ref={tableContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            onWheel={handleWheel}
            onScroll={checkScrollBoundaries}
            className="w-full overflow-x-auto rounded-2xl border border-hazard-border/80 bg-hazard-void/80 shadow-inner cursor-grab active:cursor-grabbing scrollbar-thin"
          >
            <table className="w-full text-left border-collapse text-xs select-text">
              {/* Column Headers */}
              <thead className="sticky top-0 z-20 bg-hazard-void/95 backdrop-blur-md border-b border-hazard-border shadow-sm">
                <tr className="text-[11px] font-mono uppercase tracking-wider text-hazard-textMuted select-none">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3 font-bold text-emerald-400 w-20 text-center">Done?</th>
                  <th className="py-3 px-3 font-bold text-hazard-cyan min-w-[200px]">Condition Name & Hex ID</th>
                  <th className="py-3 px-3 font-bold text-hazard-gold min-w-[130px]">Category</th>
                  <th className="py-3 px-3 font-bold text-hazard-textBright min-w-[300px]">Description</th>
                  <th className="py-3 px-3 font-bold text-hazard-purple min-w-[180px]">Tag-Team (Implies)</th>
                  <th className="py-3 px-3 font-bold text-rose-400 min-w-[180px]">Conflicts With (Collisions)</th>
                  <th className="py-3 px-3 font-bold text-right w-20">Actions</th>
                </tr>
              </thead>

              {/* Table Rows with In-Place Inline Editing */}
              <tbody className="divide-y divide-hazard-border/40 font-mono text-[11px]">
                {filteredEntries.map(({ key, entry }, index) => {
                  const isCompleted = Boolean(entry.completed);
                  const tagTeamList = Array.isArray(entry.tag_team) ? entry.tag_team : [];
                  const conflictList = Array.isArray(entry.conflicts_with) ? entry.conflicts_with : [];

                  return (
                    <tr
                      key={key}
                      className={`transition-all duration-150 border-b group ${
                        isCompleted
                          ? 'bg-emerald-950/25 hover:bg-emerald-950/45 border-emerald-500/30 shadow-[inset_4px_0_0_0_rgba(16,185,129,0.85)]'
                          : 'bg-hazard-void/40 hover:bg-hazard-cardHover/60 border-hazard-border/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {/* 1. Index */}
                      <td className="py-3.5 px-3 text-center align-middle">
                        <span className={`text-[10px] font-mono ${isCompleted ? 'text-emerald-400 font-bold' : 'text-hazard-textMuted/50'}`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* 2. Completion Checkbox */}
                      <td className="py-3.5 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => updateField(key, 'completed', !isCompleted)}
                          title={isCompleted ? 'Completed (Click to mark Draft)' : 'Draft (Click to mark Completed)'}
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-150 active:scale-90 ${
                            isCompleted
                              ? 'bg-emerald-500 border-emerald-400 text-black shadow-emerald-500/40 shadow-md scale-105'
                              : 'bg-hazard-card border-hazard-border hover:border-emerald-400 text-transparent'
                          }`}
                        >
                          <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'text-black' : 'opacity-0'}`} />
                        </button>
                      </td>

                      {/* 3. Display Name & Hex ID */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex flex-col min-w-0 gap-0.5">
                          <input
                            type="text"
                            value={entry.display_name || ''}
                            onChange={(e) => updateField(key, 'display_name', e.target.value)}
                            placeholder="Condition Title"
                            className={`w-full bg-transparent hover:bg-hazard-card/60 focus:bg-hazard-card px-2 py-1 rounded text-xs font-bold outline-none transition ${
                              isCompleted ? 'text-emerald-200 focus:text-white' : 'text-hazard-textBright focus:text-hazard-cyan'
                            }`}
                          />
                          <span
                            title={`Hex Key: ${key} (Click to copy)`}
                            onClick={() => navigator.clipboard.writeText(key)}
                            className="text-[9px] font-mono text-hazard-cyan/80 px-2 py-0.5 rounded hover:bg-hazard-cyan/20 cursor-pointer truncate max-w-[140px]"
                          >
                            {key}
                          </span>
                        </div>
                      </td>

                      {/* 4. Category (Notion-Style Combobox Suggestor) */}
                      <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <NotionCategorySelect
                          value={entry.category || 'General'}
                          allCategories={categoriesList}
                          onChange={(newCat) => updateField(key, 'category', newCat)}
                        />
                      </td>

                      {/* 5. Description (Full Semantic Text) */}
                      <td className="py-3.5 px-3 align-middle">
                        <textarea
                          rows={2}
                          value={entry.description || ''}
                          onChange={(e) => updateField(key, 'description', e.target.value)}
                          placeholder="Full description of the physical or conceptual scene state..."
                          className="w-full min-h-[48px] bg-transparent hover:bg-hazard-card/60 focus:bg-hazard-card p-2 rounded text-[11px] font-mono text-hazard-textMuted focus:text-hazard-textBright outline-none leading-relaxed resize-none transition"
                        />
                      </td>

                      {/* 6. Tag-Team (Implies/Bundles other conditions) */}
                      <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <NotionConditionRelationSelect
                          selectedIds={tagTeamList}
                          allConditions={allConditionsGlobalList}
                          currentKey={key}
                          variant="tag_team"
                          onChange={(updatedIds) => updateField(key, 'tag_team', updatedIds)}
                        />
                      </td>

                      {/* 7. Conflicts With (Collisions) */}
                      <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                        <NotionConditionRelationSelect
                          selectedIds={conflictList}
                          allConditions={allConditionsGlobalList}
                          currentKey={key}
                          variant="conflict"
                          onChange={(updatedIds) => updateField(key, 'conflicts_with', updatedIds)}
                        />
                      </td>

                      {/* 8. Actions (Duplicate, Delete) */}
                      <td className="py-3.5 px-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => handleDuplicateCondition(key, entry)}
                            title="Duplicate condition"
                            className="p-1.5 rounded-lg text-hazard-textMuted hover:text-hazard-cyan hover:bg-hazard-card transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCondition(key)}
                            title="Delete condition"
                            className="p-1.5 rounded-lg text-hazard-textMuted hover:text-hazard-crimson hover:bg-hazard-card transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Notion "+ New Condition" Bottom Bar */}
                <tr
                  onClick={handleAddNewCondition}
                  className="hover:bg-hazard-cardHover/80 transition cursor-pointer border-t border-hazard-border bg-hazard-void"
                >
                  <td colSpan={8} className="py-3 px-4">
                    <div className="flex items-center gap-2 text-hazard-textMuted hover:text-hazard-cyan text-xs font-mono font-bold transition">
                      <Plus className="w-4 h-4" />
                      <span>+ New Condition in {selectedCategory}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
