import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTriggerStore } from '../../store/useTriggerStore';
import { ComponentFileNode, ComponentEntry } from '../../utils/componentScanner';
import { ComponentManager } from '../../utils/componentManager';
import { ConditionManager } from '../../utils/conditionManager';
import { OptionEditorModal } from './OptionEditorModal';
import { NotionConditionMultiSelect } from './NotionConditionMultiSelect';
import { NotionTagTeamMultiSelect, TagTeamOptionItem } from './NotionTagTeamMultiSelect';
import { HierarchyPromptModal } from './HierarchyPromptModal';
import { renderComponentIcon } from '../../utils/iconResolver';
import { generateHexId } from '../../utils/hexId';
import {
  Table,
  Plus,
  Search,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Edit3,
  Save,
  RotateCcw,
  Check,
  X,
  ExternalLink,
  Filter,
  CheckSquare,
  Hash,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowUpDown,
  Folder,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MoveHorizontal,
} from 'lucide-react';

export const ComponentsManagerView: React.FC = () => {
  const { app, folders, matrixDomains, conditions, reload } = useTriggerStore();

  // 1. Gather all folder containers
  const allFolderNodes = useMemo(() => {
    return [
      ...folders.map((f) => ({
        id: f.relPath,
        displayName: f.displayName,
        relPath: f.relPath,
        icon: f.meta?.icon,
        files: f.files,
        isMatrix: false,
      })),
      ...matrixDomains.map((d) => ({
        id: d.relPath,
        displayName: d.displayName,
        relPath: d.relPath,
        icon: d.meta?.icon,
        files: d.files,
        isMatrix: true,
      })),
    ];
  }, [folders, matrixDomains]);

  // Selected Folder Index / ID
  const [selectedFolderId, setSelectedFolderId] = useState<string>(() => {
    return allFolderNodes[0]?.id || '';
  });

  // Active Folder Node
  const activeFolder = useMemo(() => {
    return allFolderNodes.find((f) => f.id === selectedFolderId) || allFolderNodes[0] || null;
  }, [allFolderNodes, selectedFolderId]);

  // Selected File RelPath in the Active Folder
  const [selectedFileRelPath, setSelectedFileRelPath] = useState<string>(() => {
    return allFolderNodes[0]?.files[0]?.relPath || '';
  });

  // When active folder changes, auto-select its first file if current selectedFile is not in it
  useEffect(() => {
    if (activeFolder && activeFolder.files.length > 0) {
      const isFileInFolder = activeFolder.files.some((f) => f.relPath === selectedFileRelPath);
      if (!isFileInFolder) {
        setSelectedFileRelPath(activeFolder.files[0].relPath);
      }
    }
  }, [activeFolder, selectedFileRelPath]);

  // Active Selected File Node
  const activeFileNode = useMemo<ComponentFileNode | null>(() => {
    for (const folder of allFolderNodes) {
      const match = folder.files.find((f) => f.relPath === selectedFileRelPath);
      if (match) return match;
    }
    return null;
  }, [allFolderNodes, selectedFileRelPath]);

  // In-Memory Working Copy of the Active File's Entries (for instant in-place Notion table editing)
  const [workingEntries, setWorkingEntries] = useState<Record<string, ComponentEntry>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [dirtyCount, setDirtyCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  // Synchronize working copy when changing files or reloading
  useEffect(() => {
    if (activeFileNode) {
      setWorkingEntries(JSON.parse(JSON.stringify(activeFileNode.entries || {})));
      setIsDirty(false);
      setDirtyCount(0);
    }
  }, [activeFileNode?.relPath, activeFileNode?.entries]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'visible' | 'hidden' | 'completed' | 'draft' | 'tag_team'>('all');
  const [sortMode, setSortMode] = useState<'default' | 'visible-first' | 'hidden-first'>('default');

  const toggleSortMode = () => {
    setSortMode((prev) => {
      if (prev === 'default') return 'visible-first';
      if (prev === 'visible-first') return 'hidden-first';
      return 'default';
    });
  };

  // Deep Modal Inspector State
  const [isModalEditorOpen, setIsModalEditorOpen] = useState(false);
  const [modalKey, setModalKey] = useState<string | null>(null);
  const [modalEntry, setModalEntry] = useState<ComponentEntry | null>(null);

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

  // --- HORIZONTAL NOTION-STYLE DRAG & WALL EDGE NAVIGATION ---
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const edgeScrollAnimRef = useRef<number | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Update scroll boundaries
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
  }, [checkScrollBoundaries, workingEntries]);

  // Smooth Wall Jump / Continuous Pan handlers
  const scrollHorizontally = useCallback((delta: number) => {
    if (!tableContainerRef.current) return;
    tableContainerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(checkScrollBoundaries, 200);
  }, [checkScrollBoundaries]);

  // Mouse Drag-to-Scroll & Wall Proximity Auto-Scroll
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger drag if not clicking inside an interactive input, textarea, select, or button
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

    // 1. Direct Left-Click Drag Pan
    if (isDraggingRef.current) {
      const dx = e.clientX - startXRef.current;
      el.scrollLeft = startScrollLeftRef.current - dx;
      checkScrollBoundaries();
    }

    // 2. Wall Proximity Auto-Scroll (Edge Detection within 60px of left/right walls)
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

  // Shift+Wheel or Header Wheel horizontal scrolling
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!tableContainerRef.current) return;
    if (e.shiftKey || Math.abs(e.deltaX) > 0) {
      tableContainerRef.current.scrollLeft += e.deltaX || e.deltaY;
      checkScrollBoundaries();
    }
  };

  // Flat array of working entries
  const entriesList = useMemo(() => {
    return Object.entries(workingEntries).map(([key, entry]) => ({
      key,
      entry,
    }));
  }, [workingEntries]);

  // Counts for status & visibility
  const visibleCount = useMemo(() => entriesList.filter((e) => e.entry.visible !== false).length, [entriesList]);
  const hiddenCount = useMemo(() => entriesList.filter((e) => e.entry.visible === false).length, [entriesList]);
  const completedCount = useMemo(() => entriesList.filter((e) => Boolean(e.entry.completed)).length, [entriesList]);
  const draftCount = useMemo(() => entriesList.filter((e) => !e.entry.completed).length, [entriesList]);
  const tagTeamCount = useMemo(() => entriesList.filter((e) => e.entry.tag_team && e.entry.tag_team.length > 0).length, [entriesList]);

  // Filtered and sorted rows for search, visibility filter, and sorting
  const filteredEntries = useMemo(() => {
    const list = entriesList.filter(({ key, entry }) => {
      if (filterMode === 'visible' && entry.visible === false) return false;
      if (filterMode === 'hidden' && entry.visible !== false) return false;
      if (filterMode === 'completed' && !entry.completed) return false;
      if (filterMode === 'draft' && Boolean(entry.completed)) return false;
      if (filterMode === 'tag_team' && (!entry.tag_team || entry.tag_team.length === 0)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        key.toLowerCase().includes(q) ||
        (entry.display_name && entry.display_name.toLowerCase().includes(q)) ||
        (entry.prompt && entry.prompt.toLowerCase().includes(q)) ||
        (entry.keywords && entry.keywords.some((k: string) => k.toLowerCase().includes(q))) ||
        (entry.requirement && entry.requirement.some((r: string) => r.toLowerCase().includes(q))) ||
        (entry.impact && entry.impact.some((i: string) => i.toLowerCase().includes(q)))
      );
    });

    // Apply visibility sorting
    if (sortMode === 'visible-first') {
      return [...list].sort((a, b) => (a.entry.visible === false ? 1 : 0) - (b.entry.visible === false ? 1 : 0));
    }
    if (sortMode === 'hidden-first') {
      return [...list].sort((a, b) => (b.entry.visible === false ? 1 : 0) - (a.entry.visible === false ? 1 : 0));
    }

    return list;
  }, [entriesList, searchQuery, filterMode, sortMode]);

  // All library options for Tag-Team picker dropdowns
  const allLibraryOptions = useMemo<TagTeamOptionItem[]>(() => {
    const list: TagTeamOptionItem[] = [];
    allFolderNodes.forEach((folder) => {
      folder.files.forEach((file) => {
        Object.entries(file.entries).forEach(([optKey, optEntry]: [string, any]) => {
          list.push({
            key: optKey,
            name: optEntry.display_name || optKey,
            fileRelPath: file.relPath,
            prompt: optEntry.prompt || '',
            fileName: file.displayName,
            folderName: folder.displayName,
          });
        });
      });
    });
    return list;
  }, [allFolderNodes]);

  // Helper to mark changes in the working copy
  const updateEntryField = useCallback((key: string, field: keyof ComponentEntry, value: any) => {
    setWorkingEntries((prev) => {
      const updated = {
        ...prev,
        [key]: {
          ...prev[key],
          [field]: value,
        },
      };
      return updated;
    });
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  }, []);

  // Save changes to disk
  const handleSaveToDisk = useCallback(async () => {
    if (!app || !activeFileNode || isSaving) return;
    setIsSaving(true);

    const success = await ComponentManager.saveAllFileEntries(
      app,
      activeFileNode.relPath,
      workingEntries
    );

    if (success) {
      await reload();
      setIsDirty(false);
      setDirtyCount(0);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2000);
    } else {
      window.alert(`Failed to save changes to ${activeFileNode.relPath}`);
    }
    setIsSaving(false);
  }, [app, activeFileNode, workingEntries, isSaving, reload]);

  // Discard in-memory edits
  const handleDiscardChanges = () => {
    if (!activeFileNode) return;
    if (window.confirm('Discard all unsaved edits for this file?')) {
      setWorkingEntries(JSON.parse(JSON.stringify(activeFileNode.entries || {})));
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

  const handleCreateCategory = () => {
    if (!app) return;
    setPromptModal({
      isOpen: true,
      title: 'Create Component Category',
      subtitle: 'Creates a new subfolder under Hazard_Trigger_Data/Components/',
      placeholder: 'e.g. _11_Vehicles or Weapons',
      defaultValue: '',
      submitLabel: 'Create Category',
      type: 'category',
      onSubmit: async (name: string) => {
        const relPath = await ComponentManager.createCategoryFolder(app, name);
        if (relPath) {
          await reload();
          setSelectedFolderId(relPath);
          setSelectedFileRelPath('');
        }
      },
    });
  };

  const handleRenameCategory = () => {
    if (!app || !activeFolder || activeFolder.isMatrix) return;
    setPromptModal({
      isOpen: true,
      title: 'Rename Component Category',
      subtitle: `Renames folder "${activeFolder.displayName || activeFolder.relPath}"`,
      placeholder: 'Enter new category name...',
      defaultValue: activeFolder.displayName || activeFolder.relPath || '',
      submitLabel: 'Rename Category',
      type: 'category',
      onSubmit: async (name: string) => {
        const relPath = await ComponentManager.renameCategoryFolder(app, activeFolder.relPath, name);
        if (relPath) {
          await reload();
          setSelectedFolderId(relPath);
          setSelectedFileRelPath(activeFileNode ? `${relPath}/${activeFileNode.fileName}` : '');
        }
      },
    });
  };

  const handleCreateFile = () => {
    if (!app || !activeFolder || activeFolder.isMatrix) return;
    setPromptModal({
      isOpen: true,
      title: 'Create Component Table',
      subtitle: `Creates a new JSON table inside ${activeFolder.displayName}`,
      placeholder: 'e.g. vehicles or weapons',
      defaultValue: '',
      submitLabel: 'Create Table',
      type: 'file',
      onSubmit: async (name: string) => {
        const fullPath = await ComponentManager.createComponentFile(app, activeFolder.relPath, name);
        if (fullPath) {
          const fileName = fullPath.split('/').pop() || '';
          await reload();
          setSelectedFolderId(activeFolder.relPath);
          setSelectedFileRelPath(`${activeFolder.relPath}/${fileName}`);
        }
      },
    });
  };

  const handleRenameFile = () => {
    if (!app || !activeFileNode || activeFolder?.isMatrix) return;
    setPromptModal({
      isOpen: true,
      title: 'Rename Component Table',
      subtitle: `Renames file "${activeFileNode.fileName}"`,
      placeholder: 'Enter new table name...',
      defaultValue: activeFileNode.fileName.replace(/\.json$/i, '') || '',
      submitLabel: 'Rename Table',
      type: 'file',
      onSubmit: async (name: string) => {
        const relPath = await ComponentManager.renameComponentFile(app, activeFileNode.relPath, name);
        if (relPath) {
          await reload();
          setSelectedFileRelPath(relPath);
        }
      },
    });
  };

  // Add a new row directly into the table
  const handleAddNewRow = () => {
    const newHex = generateHexId();
    const newOption: ComponentEntry = {
      display_name: 'New Option',
      prompt: '',
      keywords: [],
      require: [],
      exclude: [],
      requirement: [],
      impact: [],
      subjects: [0, 0],
    };

    setWorkingEntries((prev) => ({
      ...prev,
      [newHex]: newOption,
    }));
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  };

  // Duplicate a row
  const handleDuplicateRow = (key: string, entry: ComponentEntry) => {
    const newHex = generateHexId();
    const duplicated: ComponentEntry = {
      ...JSON.parse(JSON.stringify(entry)),
      display_name: `${entry.display_name || key} (Copy)`,
    };

    setWorkingEntries((prev) => ({
      ...prev,
      [newHex]: duplicated,
    }));
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  };

  // Delete a row
  const handleDeleteRow = (key: string) => {
    setWorkingEntries((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setIsDirty(true);
    setDirtyCount((prev) => prev + 1);
  };

  // Inline Tag-Team toggle
  const handleToggleTagTeam = (key: string, currentTagTeam: string[] | undefined, targetKey: string) => {
    const list = Array.isArray(currentTagTeam) ? [...currentTagTeam] : [];
    const exists = list.includes(targetKey);
    const updated = exists ? list.filter((k) => k !== targetKey) : [...list, targetKey];
    updateEntryField(key, 'tag_team', updated);
  };

  // Inline Tag Add for Requirements & Impacts
  const handleAddTag = (key: string, field: 'requirement' | 'impact', tagValue: string) => {
    const clean = tagValue.trim().toLowerCase();
    if (!clean) return;
    const currentList = (workingEntries[key]?.[field] || []) as string[];
    if (!currentList.includes(clean)) {
      updateEntryField(key, field, [...currentList, clean]);
    }
  };

  const handleRemoveTag = (key: string, field: 'requirement' | 'impact', tagToRemove: string) => {
    const currentList = (workingEntries[key]?.[field] || []) as string[];
    updateEntryField(
      key,
      field,
      currentList.filter((t) => t !== tagToRemove)
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn select-none">
      {/* Deep Modal Inspector (when user wants advanced full-screen modal) */}
      {activeFileNode && (
        <OptionEditorModal
          isOpen={isModalEditorOpen}
          onClose={() => setIsModalEditorOpen(false)}
          fileRelPath={activeFileNode.relPath}
          fileDisplayName={activeFileNode.displayName}
          initialKey={modalKey}
          initialEntry={modalEntry}
          onSaved={() => reload()}
        />
      )}

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

      {/* TOP HORIZONTAL NAVIGATION (No Left Sidebar to maximize table width) */}
      <div className="flex flex-col gap-3 p-4 rounded-3xl bg-hazard-card/90 border border-hazard-border shadow-md">
        {/* Row 1: Folder Categories Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-hazard-textMuted font-mono mr-2 shrink-0 flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-hazard-gold" />
            <span>Categories:</span>
          </span>
          {allFolderNodes.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const totalOptions = folder.files.reduce(
              (sum, f) => sum + Object.keys(f.entries).length,
              0
            );

            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedFolderId(folder.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition select-none whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-hazard-gold text-black shadow-hazard-glow scale-[1.02]'
                    : 'bg-hazard-void text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover border border-hazard-border'
                }`}
              >
                <span>
                  {renderComponentIcon(folder.icon, 'w-3.5 h-3.5', <Layers className="w-3.5 h-3.5" />)}
                </span>
                <span>{folder.displayName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isSelected ? 'bg-black/20 text-black' : 'bg-hazard-card text-hazard-textMuted/70'
                  }`}
                >
                  {totalOptions}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleCreateCategory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold font-mono border border-dashed border-hazard-gold/60 text-hazard-gold hover:bg-hazard-gold hover:text-black transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Category</span>
          </button>
          {activeFolder && !activeFolder.isMatrix && (
            <button type="button" onClick={handleRenameCategory} title="Rename selected category" className="p-2 rounded-xl border border-hazard-border text-hazard-textMuted hover:text-hazard-gold hover:border-hazard-gold/50 transition shrink-0">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Row 2: Child Component Files in Selected Folder */}
        {activeFolder && (
          <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-hazard-border/60 scrollbar-none">
            <span className="text-[11px] font-mono font-bold text-hazard-textMuted mr-1 shrink-0 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-hazard-cyan" />
              <span>Files:</span>
            </span>
            {activeFolder.files.map((file) => {
              const isSelected = selectedFileRelPath === file.relPath;
              const count = Object.keys(file.entries).length;

              return (
                <button
                  key={file.relPath}
                  type="button"
                  onClick={() => setSelectedFileRelPath(file.relPath)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition select-none whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-hazard-cyan text-black font-extrabold shadow-sm'
                      : 'bg-hazard-void/80 text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover border border-hazard-border/70'
                  }`}
                >
                  <span>{file.displayName}</span>
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
            {!activeFolder.isMatrix && (
              <button
                type="button"
                onClick={handleCreateFile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono border border-dashed border-hazard-cyan/60 text-hazard-cyan hover:bg-hazard-cyan hover:text-black transition shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>File</span>
              </button>
            )}
            {activeFileNode && !activeFolder.isMatrix && (
              <button type="button" onClick={handleRenameFile} title="Rename selected file" className="p-1.5 rounded-xl border border-hazard-border text-hazard-textMuted hover:text-hazard-cyan hover:border-hazard-cyan/50 transition shrink-0">
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* FULL-WIDTH NOTION DATABASE TABLE WITH MOUSE DRAG & WALL EDGE NAVIGATION */}
      {activeFileNode ? (
        <div className="flex flex-col gap-3 p-5 rounded-3xl bg-hazard-card border border-hazard-border shadow-lg w-full relative">
          {/* Table Top Toolbar: File Info, Filters, Drag Hint & Save to Disk */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-hazard-border">
            {/* Left: Active File Heading & Pan Hint */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold">
                <Table className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-hazard-textBright uppercase tracking-wide">
                    {activeFileNode.displayName}
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-hazard-void border border-hazard-border text-hazard-cyan text-[10px] font-mono">
                    {entriesList.length} rows
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-hazard-textMuted/70 bg-hazard-void px-2 py-0.5 rounded border border-hazard-border">
                    <MoveHorizontal className="w-3 h-3 text-hazard-gold" />
                    <span>Left-click & Drag or move to wall to pan horizontally</span>
                  </span>
                </div>
                <p className="text-[11px] text-hazard-textMuted font-mono">
                  File: <code className="text-hazard-gold/90">{activeFileNode.fileName}</code>
                </p>
              </div>
            </div>

            {/* Right: Actions, Search, Filters & Save to Disk */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter & Sort Pills */}
              <div className="flex items-center gap-1 bg-hazard-void p-1 rounded-xl border border-hazard-border text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMode === 'all'
                      ? 'bg-hazard-card text-hazard-gold font-bold shadow-sm'
                      : 'text-hazard-textMuted hover:text-white'
                  }`}
                >
                  All ({entriesList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('visible')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMode === 'visible'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40 shadow-sm'
                      : 'text-hazard-textMuted hover:text-white'
                  }`}
                >
                  Visible ({visibleCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('hidden')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMode === 'hidden'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-400/40 shadow-sm'
                      : 'text-hazard-textMuted hover:text-white'
                  }`}
                >
                  Hidden ({hiddenCount})
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
                  onClick={() => setFilterMode('tag_team')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    filterMode === 'tag_team'
                      ? 'bg-hazard-purple/20 text-hazard-purple font-bold border border-hazard-purple/40'
                      : 'text-hazard-textMuted hover:text-white'
                  }`}
                >
                  Tag-Team ({tagTeamCount})
                </button>
              </div>

              {/* Sort Mode Toggle Button */}
              <button
                type="button"
                onClick={toggleSortMode}
                title={`Click to cycle visibility sorting (Current: ${sortMode})`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition select-none active:scale-95 ${
                  sortMode !== 'default'
                    ? 'bg-hazard-cyan/20 border-hazard-cyan/60 text-hazard-cyan shadow-sm'
                    : 'bg-hazard-void border-hazard-border text-hazard-textMuted hover:text-white'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>
                  {sortMode === 'visible-first'
                    ? 'Sort: Visible Top'
                    : sortMode === 'hidden-first'
                    ? 'Sort: Hidden Top'
                    : 'Sort: Natural'}
                </span>
              </button>

              {/* Search Bar */}
              <div className="flex items-center gap-1.5 bg-hazard-void border border-hazard-border rounded-xl px-3 py-1.5 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-hazard-textMuted" />
                <input
                  type="text"
                  placeholder="Filter table rows..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-hazard-textBright placeholder:text-hazard-textMuted/40 outline-none font-mono"
                />
              </div>

              {/* Add New Row Button */}
              <button
                type="button"
                onClick={handleAddNewRow}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-hazard-card border border-hazard-gold/40 text-hazard-gold hover:bg-hazard-gold hover:text-black transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Row</span>
              </button>

              {/* Save Status & Button */}
              {isDirty ? (
                <div className="flex items-center gap-2 animate-pulse">
                  <button
                    type="button"
                    onClick={handleDiscardChanges}
                    title="Discard all unsaved edits"
                    className="p-2 text-hazard-crimson hover:bg-hazard-crimson/20 border border-hazard-crimson/40 rounded-xl transition text-xs font-mono"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToDisk}
                    disabled={isSaving}
                    title="Save changes to JSON file (Ctrl+S)"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-hazard-gold to-hazard-goldGlow text-black shadow-hazard-glow hover:scale-105 active:scale-95 transition"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save ({dirtyCount} edits)</span>
                  </button>
                </div>
              ) : saveSuccessNotice ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-mono font-bold">
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Top Horizontal Scroll Progress Indicator Bar */}
          <div className="w-full h-1 bg-hazard-void rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-hazard-gold to-hazard-cyan transition-all duration-75"
              style={{ width: `${Math.max(10, scrollProgress)}%` }}
            />
          </div>

          {/* TABLE VIEWPORT WITH DRAG-TO-SCROLL & FLOATING EDGE CHEVRON BUTTONS */}
          <div className="relative w-full group/table">
            {/* Floating Left Wall Navigation Jump Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollHorizontally(-350)}
                onMouseEnter={() => scrollHorizontally(-200)}
                title="Pan Table Left (or drag table / move cursor to left edge)"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-2xl bg-hazard-card/95 hover:bg-hazard-gold hover:text-black text-hazard-gold border border-hazard-gold/50 shadow-2xl backdrop-blur-md transition-all duration-150 active:scale-90"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Floating Right Wall Navigation Jump Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollHorizontally(350)}
                onMouseEnter={() => scrollHorizontally(200)}
                title="Pan Table Right (or drag table / move cursor to right edge)"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-2xl bg-hazard-card/95 hover:bg-hazard-gold hover:text-black text-hazard-gold border border-hazard-gold/50 shadow-2xl backdrop-blur-md transition-all duration-150 active:scale-90"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Scrollable Container with Mouse Drag & Edge Listeners */}
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
                {/* Table Column Headers (Sticky Top) */}
                <thead className="sticky top-0 z-20 bg-hazard-void/95 backdrop-blur-md border-b border-hazard-border shadow-sm">
                  <tr className="text-[11px] font-mono uppercase tracking-wider text-hazard-textMuted select-none">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3 font-bold text-emerald-400 w-16 text-center">Done?</th>
                    <th
                      className="py-3 px-3 font-bold text-hazard-cyan w-16 text-center cursor-pointer select-none hover:text-white transition group/th"
                      onClick={toggleSortMode}
                      title="Click to sort by visibility (Visible / Hidden)"
                    >
                      <div className="inline-flex items-center gap-1 justify-center">
                        <span>Show?</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-50 group-hover/th:opacity-100" />
                      </div>
                    </th>
                    <th className="py-3 px-3 font-bold text-hazard-gold min-w-[220px]">Option Name & Key</th>
                    <th className="py-3 px-3 font-bold text-hazard-cyan min-w-[240px]">Prompt Tokens</th>
                    <th className="py-3 px-3 font-bold text-hazard-purple min-w-[160px]">Tag-Team</th>
                    <th className="py-3 px-3 font-bold text-hazard-crimson min-w-[150px]">Anti-Prompt</th>
                    <th className="py-3 px-3 font-bold text-emerald-400 min-w-[160px]">Requirements</th>
                    <th className="py-3 px-3 font-bold text-hazard-cyan min-w-[160px]">Impacts</th>
                    <th className="py-3 px-3 font-bold text-hazard-textBright w-28">Subjects [♀, ♂]</th>
                    <th className="py-3 px-3 font-bold text-right w-20">Actions</th>
                  </tr>
                </thead>

                {/* Table Rows with Instant In-Place Cell Editing */}
                <tbody className="divide-y divide-hazard-border/40 font-mono text-[11px]">
                  {filteredEntries.map(({ key, entry }, index) => {
                    const isCompleted = Boolean(entry.completed);
                    const isVisible = entry.visible !== false;
                    const tagTeamList = Array.isArray(entry.tag_team) ? entry.tag_team : [];
                    const reqList = (entry.requirement || entry.require || []) as string[];
                    const impactList = (entry.impact || entry.keywords || []) as string[];
                    const subjects = entry.subjects || [0, 0];

                    return (
                      <tr
                        key={key}
                        className={`transition-all duration-150 border-b group ${
                          !isVisible
                            ? 'bg-rose-950/15 hover:bg-rose-950/35 border-rose-500/20 opacity-60 hover:opacity-100'
                            : isCompleted
                            ? 'bg-emerald-950/25 hover:bg-emerald-950/45 border-emerald-500/30 shadow-[inset_4px_0_0_0_rgba(16,185,129,0.85)]'
                            : 'bg-hazard-void/40 hover:bg-hazard-cardHover/60 border-hazard-border/30 opacity-75 hover:opacity-100'
                        }`}
                      >
                        {/* 1. Index */}
                        <td className="py-3.5 px-3 text-center align-middle">
                          <span className={`text-[10px] font-mono ${!isVisible ? 'text-rose-400/70' : isCompleted ? 'text-emerald-400 font-bold' : 'text-hazard-textMuted/50'}`}>
                            {index + 1}
                          </span>
                        </td>

                        {/* 2. Completion Checkbox (Prominent Notion Checkbox) */}
                        <td className="py-3.5 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => updateEntryField(key, 'completed', !isCompleted)}
                            title={isCompleted ? 'Marked Completed (Click to mark Draft/Incomplete)' : 'Draft (Click to mark Completed)'}
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-150 active:scale-90 ${
                              isCompleted
                                ? 'bg-emerald-500 border-emerald-400 text-black shadow-emerald-500/40 shadow-md scale-105'
                                : 'bg-hazard-card border-hazard-border hover:border-emerald-400 text-transparent'
                            }`}
                          >
                            <Check className={`w-3.5 h-3.5 stroke-[3] ${isCompleted ? 'text-black' : 'opacity-0'}`} />
                          </button>
                        </td>

                        {/* 3. Visibility Toggle (Show / Hide in Trigger cards) */}
                        <td className="py-3.5 px-3 text-center align-middle" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => updateEntryField(key, 'visible', isVisible ? false : true)}
                            title={
                              isVisible
                                ? 'Visible on Trigger cards (Click to Hide)'
                                : 'Hidden from Trigger cards (Click to Show)'
                            }
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-150 active:scale-90 ${
                              isVisible
                                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300 shadow-sm hover:border-cyan-400 hover:scale-105'
                                : 'bg-rose-950/40 border-rose-500/40 text-rose-400/80 hover:border-rose-400 hover:text-rose-300 hover:scale-105'
                            }`}
                          >
                            {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          </button>
                        </td>

                        {/* 4. Display Name, Hex Key & Image Thumbnail */}
                        <td className="py-3.5 px-3 align-middle">
                          <div className="flex items-center gap-2.5">
                            {/* Image preview / icon */}
                            <div
                              onClick={() => {
                                const newUrl = window.prompt('Set Image URL for this option:', entry.image || '');
                                if (newUrl !== null) updateEntryField(key, 'image', newUrl.trim());
                              }}
                              title="Click to edit Image URL"
                              className="w-9 h-9 rounded-lg bg-hazard-card border border-hazard-border/80 overflow-hidden flex items-center justify-center shrink-0 cursor-pointer hover:border-hazard-gold transition"
                            >
                              {entry.image || entry.thumbnail ? (
                                <img src={entry.image || entry.thumbnail} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Sparkles className="w-4 h-4 text-hazard-gold/40" />
                              )}
                            </div>

                            {/* In-place Editable Display Name & Hex Key */}
                            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                              <input
                                type="text"
                                value={entry.display_name || ''}
                                onChange={(e) => updateEntryField(key, 'display_name', e.target.value)}
                                placeholder="Display Name"
                                className="w-full bg-transparent hover:bg-hazard-card/60 focus:bg-hazard-card px-2 py-1 rounded text-xs font-bold text-hazard-textBright focus:text-hazard-gold outline-none transition"
                              />
                              <span
                                title={`Hex Key: ${key} (Click to copy)`}
                                onClick={() => navigator.clipboard.writeText(key)}
                                className="text-[9px] font-mono text-hazard-gold/70 px-2 py-0.5 rounded hover:bg-hazard-gold/20 cursor-pointer truncate max-w-[140px]"
                              >
                                {key}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Prompt Tokens (In-Place Textarea / Input) */}
                        <td className="py-3.5 px-3 align-middle">
                          <textarea
                            rows={2}
                            value={entry.prompt || ''}
                            onChange={(e) => updateEntryField(key, 'prompt', e.target.value)}
                            placeholder="e.g. wet clothes, translucent shirt"
                            className="w-full min-h-[48px] bg-transparent hover:bg-hazard-card/60 focus:bg-hazard-card p-2 rounded text-[11px] font-mono text-hazard-textBright outline-none leading-relaxed resize-none transition"
                          />
                        </td>

                        {/* 4. Tag-Team (Inheritance Multi-Select Searchable Dropdown) */}
                        <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                          <NotionTagTeamMultiSelect
                            selectedKeys={tagTeamList}
                            allOptions={allLibraryOptions}
                            currentKey={key}
                            onChange={(updatedKeys) => updateEntryField(key, 'tag_team', updatedKeys)}
                          />
                        </td>

                        {/* 5. Anti-Prompt (In-Place Subtractions) */}
                        <td className="py-3.5 px-3 align-middle">
                          <input
                            type="text"
                            value={
                              typeof entry['anti-prompt'] === 'string'
                                ? entry['anti-prompt']
                                : Array.isArray(entry.exclude)
                                ? entry.exclude.join(', ')
                                : ''
                            }
                            onChange={(e) => {
                              updateEntryField(key, 'anti-prompt', e.target.value);
                              updateEntryField(
                                key,
                                'exclude',
                                e.target.value
                                  .split(',')
                                  .map((t) => t.trim())
                                  .filter(Boolean)
                              );
                            }}
                            placeholder="e.g. blazer, necktie"
                            className="w-full bg-transparent hover:bg-hazard-card/60 focus:bg-hazard-card p-2 rounded text-[11px] font-mono text-hazard-crimson outline-none transition"
                          />
                        </td>

                        {/* 6. Requirements (Conditions Needed) — Multi-Select Notion Suggestor */}
                        <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                          <NotionConditionMultiSelect
                            selectedIds={(entry.requirement || []) as string[]}
                            conditions={conditions}
                            variant="requirement"
                            onChange={(updatedIds) => updateEntryField(key, 'requirement', updatedIds)}
                            onConditionCreated={async (newId, newEntry) => {
                              if (app) {
                                await ConditionManager.saveCondition(app, newId, newEntry);
                                await reload();
                              }
                            }}
                          />
                        </td>

                        {/* 7. Impacts (Conditions Asserted) — Multi-Select Notion Suggestor */}
                        <td className="py-3.5 px-3 align-middle" onClick={(e) => e.stopPropagation()}>
                          <NotionConditionMultiSelect
                            selectedIds={(entry.impact || []) as string[]}
                            conditions={conditions}
                            variant="impact"
                            onChange={(updatedIds) => updateEntryField(key, 'impact', updatedIds)}
                            onConditionCreated={async (newId, newEntry) => {
                              if (app) {
                                await ConditionManager.saveCondition(app, newId, newEntry);
                                await reload();
                              }
                            }}
                          />
                        </td>

                        {/* 8. Subjects Vector Math [♀, ♂] */}
                        <td className="py-3.5 px-3 align-middle">
                          <div className="flex items-center gap-1 bg-hazard-card/60 p-1.5 rounded-lg border border-hazard-border w-max">
                            <span className="text-[10px] text-hazard-gold font-bold">♀</span>
                            <input
                              type="number"
                              value={subjects[0]}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                updateEntryField(key, 'subjects', [val, subjects[1]]);
                              }}
                              className="w-8 bg-transparent text-center font-bold text-white outline-none text-[11px]"
                            />
                            <span className="text-hazard-border">/</span>
                            <span className="text-[10px] text-hazard-cyan font-bold">♂</span>
                            <input
                              type="number"
                              value={subjects[1]}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                updateEntryField(key, 'subjects', [subjects[0], val]);
                              }}
                              className="w-8 bg-transparent text-center font-bold text-white outline-none text-[11px]"
                            />
                          </div>
                        </td>

                        {/* 9. Actions (Modal, Duplicate, Delete) */}
                        <td className="py-3.5 px-3 text-right align-middle">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                            {/* Deep Modal Inspector Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setModalKey(key);
                                setModalEntry(entry);
                                setIsModalEditorOpen(true);
                              }}
                              title="Open in deep Inspector Modal"
                              className="p-1.5 rounded-lg text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-card transition"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate Button */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(key, entry)}
                              title="Duplicate row"
                              className="p-1.5 rounded-lg text-hazard-textMuted hover:text-hazard-cyan hover:bg-hazard-card transition"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(key)}
                              title="Delete row"
                              className="p-1.5 rounded-lg text-hazard-textMuted hover:text-hazard-crimson hover:bg-hazard-card transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* NOTION "+ New Row" BOTTOM BAR */}
                  <tr
                    onClick={handleAddNewRow}
                    className="hover:bg-hazard-cardHover/80 transition cursor-pointer border-t border-hazard-border bg-hazard-void"
                  >
                    <td colSpan={11} className="py-3 px-4">
                      <div className="flex items-center gap-2 text-hazard-textMuted hover:text-hazard-gold text-xs font-mono font-bold transition">
                        <Plus className="w-4 h-4" />
                        <span>+ New Option in {activeFileNode.displayName}</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center border-2 border-dashed border-hazard-border rounded-3xl bg-hazard-card/30 text-hazard-textMuted font-mono text-xs">
          Select a category and file above to view and edit its Notion database table.
        </div>
      )}
    </div>
  );
};
