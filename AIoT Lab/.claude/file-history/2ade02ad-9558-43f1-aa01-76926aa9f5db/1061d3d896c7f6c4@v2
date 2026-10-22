import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTriggerStore } from '../../store/useTriggerStore';
import { GenericTopologyTable, TopologyFileInfo } from '../../types/topology';
import { TopologyManager } from '../../utils/topologyManager';
import { TopologyBulkPromptModal } from './TopologyBulkPromptModal';
import {
  Table2,
  FolderTree,
  Search,
  Plus,
  Trash2,
  Copy,
  Save,
  RefreshCw,
  Check,
  X,
  ListPlus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FilePlus,
  FileCode,
  Sparkles,
  Tag,
  ChevronRight,
  ChevronDown,
  Hash,
  AlignLeft,
  Code2,
  Columns,
  Layers,
  Folder,
} from 'lucide-react';

// ============================================================================
// Markdown-JSON Tree Bidirectional Serialization Helpers
// ============================================================================

/**
 * Serializes a nested JSON tree object into a human-readable Markdown outline.
 * Headers (#, ##, ###) denote hierarchical keys; list items (- item) denote leaf token arrays.
 */
export function jsonToMarkdownTree(data: any, depth = 1): string {
  if (!data || typeof data !== 'object') return '';
  const lines: string[] = [];

  for (const [key, val] of Object.entries(data)) {
    const cleanKey = String(key).trim();
    if (!cleanKey) continue;
    const headerPrefix = '#'.repeat(Math.max(1, depth));

    if (Array.isArray(val)) {
      lines.push(`${headerPrefix} ${cleanKey}`);
      for (const item of val) {
        if (item !== null && item !== undefined && String(item).trim()) {
          lines.push(`- ${String(item).trim()}`);
        }
      }
      lines.push(''); // Blank line separator
    } else if (val && typeof val === 'object') {
      lines.push(`${headerPrefix} ${cleanKey}`);
      const sub = jsonToMarkdownTree(val, depth + 1);
      if (sub) {
        lines.push(sub);
      } else {
        lines.push('');
      }
    } else if (val !== null && val !== undefined) {
      lines.push(`${headerPrefix} ${cleanKey}`);
      lines.push(`- ${String(val).trim()}`);
      lines.push('');
    }
  }

  return lines.join('\n').trim() + '\n';
}

/**
 * Parses a Markdown outline with headers (#, ##, ###) and list items (- item)
 * back into a clean, nested JSON tree object with string arrays.
 */
export function markdownTreeToJson(md: string): Record<string, any> {
  const root: Record<string, any> = {};
  const lines = md.split(/\r?\n/);

  interface StackFrame {
    depth: number;
    key: string;
    container: Record<string, any>;
    isArray: boolean;
    arrayItems: string[];
  }

  const stack: StackFrame[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 1. Header match (# Header)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      const depth = headerMatch[1].length;
      const key = headerMatch[2].trim();
      if (!key) continue;

      // Pop stack until parent depth is less than current depth
      while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
        const popped = stack.pop()!;
        if (popped.isArray) {
          popped.container[popped.key] = popped.arrayItems;
        }
      }

      // Determine parent container
      let parentContainer: Record<string, any>;
      if (stack.length === 0) {
        parentContainer = root;
      } else {
        const parentFrame = stack[stack.length - 1];
        if (parentFrame.isArray) {
          // Parent was flagged as array, but has child header -> convert back to object
          parentFrame.isArray = false;
          parentFrame.container[parentFrame.key] = {};
        }
        if (
          !parentFrame.container[parentFrame.key] ||
          typeof parentFrame.container[parentFrame.key] !== 'object' ||
          Array.isArray(parentFrame.container[parentFrame.key])
        ) {
          parentFrame.container[parentFrame.key] = {};
        }
        parentContainer = parentFrame.container[parentFrame.key];
      }

      // Initialize this node as empty object
      parentContainer[key] = {};

      stack.push({
        depth,
        key,
        container: parentContainer,
        isArray: false,
        arrayItems: [],
      });
      continue;
    }

    // 2. List bullet item match (- item or * item or + item)
    const listMatch = line.match(/^[-*+]\s+(.+)$/);
    if (listMatch) {
      const itemText = listMatch[1].trim();
      if (itemText && stack.length > 0) {
        const top = stack[stack.length - 1];
        top.isArray = true;
        top.arrayItems.push(itemText);
      }
      continue;
    }
  }

  // Final flush of remaining stack frames
  while (stack.length > 0) {
    const popped = stack.pop()!;
    if (popped.isArray) {
      popped.container[popped.key] = popped.arrayItems;
    }
  }

  return root;
}

// ============================================================================
// Main Studio Component
// ============================================================================

export const TopologyManagerView: React.FC = () => {
  const { app } = useTriggerStore();

  // Discovered files from Tree/ and Tables/
  const [files, setFiles] = useState<TopologyFileInfo[]>([]);
  const [activeFile, setActiveFile] = useState<TopologyFileInfo | null>(null);

  // In-memory data store for loaded files: relPath -> GenericTopologyTable / Nested Tree
  const [tablesData, setTablesData] = useState<Record<string, any>>({});
  // Dirty tracking per file
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedRowKey, setHighlightedRowKey] = useState<string | null>(null);

  // Tree Editor view styles: 'visual' (Interactive Markdown Outline), 'raw' (Textarea), 'split' (Side by Side)
  const [treeEditorStyle, setTreeEditorStyle] = useState<'visual' | 'raw' | 'split'>('visual');
  // Raw markdown buffer for active tree file
  const [rawMarkdownBuffer, setRawMarkdownBuffer] = useState<string>('');

  // Table Sorting state
  const [sortColumn, setSortColumn] = useState<string>('__key__');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>('none');

  // New Column Modal / Popover State (for Table mode)
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<'array' | 'string' | 'number'>('array');

  // New File Modal / Popover State
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSubdir, setNewFileSubdir] = useState<'tree' | 'table'>('table');

  // Bulk Edit Modal State
  const [bulkModal, setBulkModal] = useState<{
    isOpen: boolean;
    rowKey: string;
    fieldKey: string;
    tokens: string[];
  }>({
    isOpen: false,
    rowKey: '',
    fieldKey: '',
    tokens: [],
  });

  // Inline Tag Input buffer for Table view: `${rowKey}:${column}` -> string
  const [tagInputBuffer, setTagInputBuffer] = useState<Record<string, string>>({});

  // Tree Node Inline Quick Add Buffer: path string -> string
  const [treeQuickAddInput, setTreeQuickAddInput] = useState<Record<string, string>>({});
  const [activeSuggestPath, setActiveSuggestPath] = useState<string | null>(null);
  const [selectedSuggestIndex, setSelectedSuggestIndex] = useState(0);

  // 1. Initial Discovery & Loading
  const loadFilesAndData = useCallback(async () => {
    if (!app) return;
    setIsLoading(true);
    try {
      const discovered = await TopologyManager.listTopologyFiles(app);
      setFiles(discovered);

      const dataMap: Record<string, any> = {};
      for (const file of discovered) {
        const loaded = await TopologyManager.loadTableFile(app, file.relPath);
        dataMap[file.relPath] = loaded;
      }

      setTablesData(dataMap);
      setDirtyMap({});

      // Set active file if none or invalid
      if (discovered.length > 0) {
        setActiveFile((prev) => {
          if (prev && discovered.some((f) => f.relPath === prev.relPath)) {
            return prev;
          }
          return discovered[0];
        });
      } else {
        setActiveFile(null);
      }
    } catch (err) {
      console.error('[TopologyManagerView] Error initializing files:', err);
    } finally {
      setIsLoading(false);
    }
  }, [app]);

  useEffect(() => {
    loadFilesAndData();
  }, [loadFilesAndData]);

  // Current Active File Data
  const currentData = useMemo(() => {
    if (!activeFile) return {};
    return tablesData[activeFile.relPath] || {};
  }, [activeFile, tablesData]);

  // Automatically update Raw Markdown Buffer when active tree file data changes
  useEffect(() => {
    if (activeFile && activeFile.subdir === 'tree') {
      const md = jsonToMarkdownTree(currentData);
      setRawMarkdownBuffer(md);
    }
  }, [activeFile, currentData]);

  // View Mode: Auto-detected from activeFile.subdir ('tree' vs 'table')
  const viewMode: 'tree' | 'table' = useMemo(() => {
    if (activeFile?.subdir === 'tree') return 'tree';
    return 'table';
  }, [activeFile]);

  // Global Cross-File Key Registry & Suggestions Pool
  const { globalKeyLookup, globalKeySuggestions } = useMemo(() => {
    const lookupMap = new Map<string, { fileName: string; relPath: string }>();
    const suggestionsSet = new Set<string>();

    const traverseObject = (obj: any, file: TopologyFileInfo) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        const cleanK = String(k).trim();
        if (cleanK) {
          lookupMap.set(cleanK, { fileName: file.fileName, relPath: file.relPath });
          suggestionsSet.add(cleanK);
        }
        if (Array.isArray(v)) {
          for (const item of v) {
            if (typeof item === 'string' && item.trim()) {
              suggestionsSet.add(item.trim());
            }
          }
        } else if (v && typeof v === 'object') {
          traverseObject(v, file);
        } else if (typeof v === 'string' && v.trim()) {
          suggestionsSet.add(v.trim());
        }
      }
    };

    for (const file of files) {
      const data = tablesData[file.relPath] || {};
      traverseObject(data, file);
    }

    return {
      globalKeyLookup: lookupMap,
      globalKeySuggestions: Array.from(suggestionsSet).sort((a, b) => a.localeCompare(b)),
    };
  }, [files, tablesData]);

  // Introspect Columns dynamically for Table mode
  const dynamicColumns = useMemo(() => {
    if (viewMode !== 'table') return [];
    const colSet = new Set<string>();
    for (const row of Object.values(currentData)) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        for (const k of Object.keys(row)) {
          colSet.add(k);
        }
      }
    }
    return Array.from(colSet);
  }, [currentData, viewMode]);

  // 2. Save Active File Atomically
  const handleSaveActive = useCallback(async () => {
    if (!app || !activeFile) return;
    setIsSaving(true);
    try {
      await TopologyManager.saveTableFile(app, activeFile.relPath, currentData);
      setDirtyMap((prev) => ({ ...prev, [activeFile.relPath]: false }));
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2000);
    } catch (err) {
      console.error('[TopologyManagerView] Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [app, activeFile, currentData]);

  // Save All Dirty Files
  const handleSaveAll = useCallback(async () => {
    if (!app) return;
    setIsSaving(true);
    try {
      for (const file of files) {
        if (dirtyMap[file.relPath]) {
          await TopologyManager.saveTableFile(app, file.relPath, tablesData[file.relPath] || {});
        }
      }
      setDirtyMap({});
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 2000);
    } catch (err) {
      console.error('[TopologyManagerView] Save All failed:', err);
    } finally {
      setIsSaving(false);
    }
  }, [app, files, dirtyMap, tablesData]);

  // 3. Keyboard Shortcut (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveActive();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveActive]);

  // 4. File Creation & Deletion
  const handleCreateFile = async () => {
    if (!app || !newFileName.trim()) return;
    try {
      const created = await TopologyManager.createTableFile(app, newFileName, newFileSubdir);
      setNewFileName('');
      setIsAddingFile(false);
      await loadFilesAndData();
      setActiveFile(created);
    } catch (err) {
      console.error('[TopologyManagerView] Create file failed:', err);
    }
  };

  const handleDeleteFile = async (file: TopologyFileInfo) => {
    if (!app) return;
    const confirm = window.confirm(`Permanently delete ${file.fileName}?`);
    if (!confirm) return;

    try {
      await TopologyManager.deleteTableFile(app, file.relPath);
      await loadFilesAndData();
    } catch (err) {
      console.error('[TopologyManagerView] Delete file failed:', err);
    }
  };

  // ==========================================================================
  // TABLE VIEW MUTATIONS
  // ==========================================================================

  const updateTableCell = (rowKey: string, fieldKey: string, value: any) => {
    if (!activeFile) return;
    const relPath = activeFile.relPath;

    setTablesData((prev) => {
      const table = { ...(prev[relPath] || {}) };
      const row = { ...(table[rowKey] || {}) };
      row[fieldKey] = value;
      table[rowKey] = row;
      return { ...prev, [relPath]: table };
    });

    setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
  };

  const renameTableRowKey = (oldKey: string, newKeyRaw: string) => {
    if (!activeFile) return;
    const newKey = newKeyRaw.trim();
    if (!newKey || oldKey === newKey) return;
    const relPath = activeFile.relPath;

    setTablesData((prev) => {
      const table = { ...(prev[relPath] || {}) };
      const rowData = table[oldKey] || {};
      delete table[oldKey];
      table[newKey] = rowData;
      return { ...prev, [relPath]: table };
    });

    setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
  };

  const handleAddTableRow = () => {
    if (!activeFile) return;
    const relPath = activeFile.relPath;
    const count = Object.keys(currentData).length + 1;
    let baseKey = `item_${count}`;
    while (currentData[baseKey]) {
      baseKey = `item_${Math.floor(Math.random() * 10000)}`;
    }

    const newRow: Record<string, any> = {};
    for (const col of dynamicColumns) {
      newRow[col] = [];
    }

    setTablesData((prev) => ({
      ...prev,
      [relPath]: {
        [baseKey]: newRow,
        ...(prev[relPath] || {}),
      },
    }));

    setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
    setHighlightedRowKey(baseKey);
  };

  const handleDuplicateTableRow = (rowKey: string) => {
    if (!activeFile) return;
    const relPath = activeFile.relPath;
    const sourceRow = currentData[rowKey];
    if (!sourceRow) return;

    let newKey = `${rowKey}_copy`;
    let i = 2;
    while (currentData[newKey]) {
      newKey = `${rowKey}_copy_${i++}`;
    }

    const cloned = JSON.parse(JSON.stringify(sourceRow));

    setTablesData((prev) => ({
      ...prev,
      [relPath]: {
        ...(prev[relPath] || {}),
        [newKey]: cloned,
      },
    }));

    setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
  };

  const handleDeleteTableRow = (rowKey: string) => {
    if (!activeFile) return;
    const relPath = activeFile.relPath;

    setTablesData((prev) => {
      const table = { ...(prev[relPath] || {}) };
      delete table[rowKey];
      return { ...prev, [relPath]: table };
    });

    setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
  };

  const handleAddTableColumn = () => {
    const colName = newColumnName.trim().replace(/[^a-zA-Z0-9_]/g, '_');
    if (!colName || !activeFile) return;
    const relPath = activeFile.relPath;

    const defaultValue = newColumnType === 'array' ? [] : newColumnType === 'number' ? 0 : '';

    setTablesData((prev) => {
      const table = { ...(prev[relPath] || {}) };
      for (const rk of Object.keys(table)) {
        table[rk] = {
          ...table[rk],
          [colName]: Array.isArray(defaultValue) ? [] : defaultValue,
        };
      }
      return { ...prev, [relPath]: table };
    });

    setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
    setNewColumnName('');
    setIsAddingColumn(false);
  };

  const handleDeleteTableColumn = (columnName: string) => {
    if (!activeFile) return;
    const relPath = activeFile.relPath;

    setTablesData((prev) => {
      const table = { ...(prev[relPath] || {}) };
      for (const rk of Object.keys(table)) {
        const row = { ...table[rk] };
        delete row[columnName];
        table[rk] = row;
      }
      return { ...prev, [relPath]: table };
    });

    setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
  };

  const handleAddTableTag = (rowKey: string, fieldKey: string) => {
    const bufferKey = `${rowKey}:${fieldKey}`;
    const tagText = (tagInputBuffer[bufferKey] || '').trim();
    if (!tagText) return;

    const row = currentData[rowKey] || {};
    const existing: string[] = Array.isArray(row[fieldKey]) ? row[fieldKey] : [];
    if (!existing.includes(tagText)) {
      updateTableCell(rowKey, fieldKey, [...existing, tagText]);
    }

    setTagInputBuffer((prev) => ({ ...prev, [bufferKey]: '' }));
  };

  const handleRemoveTableTag = (rowKey: string, fieldKey: string, tagToRemove: string) => {
    const row = currentData[rowKey] || {};
    const existing: string[] = Array.isArray(row[fieldKey]) ? row[fieldKey] : [];
    updateTableCell(
      rowKey,
      fieldKey,
      existing.filter((t) => t !== tagToRemove)
    );
  };

  // Table Sorting logic
  const toggleTableSort = (column: string) => {
    if (sortColumn !== column) {
      setSortColumn(column);
      setSortDirection('asc');
    } else {
      if (sortDirection === 'none') setSortDirection('asc');
      else if (sortDirection === 'asc') setSortDirection('desc');
      else setSortDirection('none');
    }
  };

  // Filtered & Sorted Table Rows
  const sortedTableRows = useMemo(() => {
    if (viewMode !== 'table') return [];
    let entries = Object.entries(currentData);

    // 1. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      entries = entries.filter(([key, row]) => {
        if (key.toLowerCase().includes(q)) return true;
        if (row && typeof row === 'object') {
          return Object.entries(row).some(([colName, colVal]) => {
            if (colName.toLowerCase().includes(q)) return true;
            if (Array.isArray(colVal)) {
              return colVal.some((item) => String(item).toLowerCase().includes(q));
            }
            return String(colVal).toLowerCase().includes(q);
          });
        }
        return false;
      });
    }

    // 2. Sort
    if (sortDirection !== 'none') {
      entries.sort(([keyA, rowA], [keyB, rowB]) => {
        let valA: any = keyA;
        let valB: any = keyB;

        if (sortColumn !== '__key__') {
          valA = rowA ? (rowA as any)[sortColumn] : '';
          valB = rowB ? (rowB as any)[sortColumn] : '';

          if (Array.isArray(valA)) valA = valA.join(', ');
          if (Array.isArray(valB)) valB = valB.join(', ');
        }

        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();

        const comparison = valA.localeCompare(valB, undefined, { numeric: true });
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return entries;
  }, [currentData, searchQuery, sortColumn, sortDirection, viewMode]);

  // ==========================================================================
  // TREE VIEW MUTATIONS & MARkDOWN ENGINE
  // ==========================================================================

  // Live Raw Markdown Textarea Change -> Parses to JSON & sets in-memory
  const handleRawMarkdownChange = (text: string) => {
    setRawMarkdownBuffer(text);
    if (!activeFile) return;

    try {
      const parsedTree = markdownTreeToJson(text);
      setTablesData((prev) => ({
        ...prev,
        [activeFile.relPath]: parsedTree,
      }));
      setDirtyMap((prev) => ({ ...prev, [activeFile.relPath]: true }));
    } catch (err) {
      console.warn('[TopologyManagerView] Markdown parse error:', err);
    }
  };

  // Helper to deep mutate in-memory tree via path traversal
  const mutateTreeData = useCallback(
    (mutator: (draft: Record<string, any>) => void) => {
      if (!activeFile) return;
      const relPath = activeFile.relPath;

      setTablesData((prev) => {
        const cloned = JSON.parse(JSON.stringify(prev[relPath] || {}));
        mutator(cloned);
        return { ...prev, [relPath]: cloned };
      });

      setDirtyMap((prev) => ({ ...prev, [relPath]: true }));
    },
    [activeFile]
  );

  // Add Root Level Header (# Node)
  const handleAddRootHeader = () => {
    mutateTreeData((draft) => {
      const count = Object.keys(draft).length + 1;
      let newKey = `group_${count}`;
      while (draft[newKey]) {
        newKey = `group_${Math.floor(Math.random() * 10000)}`;
      }
      draft[newKey] = [];
    });
  };

  // Add Child Header (## Sub-Group) to a given path
  const handleAddChildHeader = (path: string[]) => {
    mutateTreeData((draft) => {
      let current: any = draft;
      for (const segment of path) {
        if (!current[segment] || typeof current[segment] !== 'object' || Array.isArray(current[segment])) {
          current[segment] = {};
        }
        current = current[segment];
      }
      const childCount = Object.keys(current).length + 1;
      let childKey = `sub_${childCount}`;
      while (current[childKey]) {
        childKey = `sub_${Math.floor(Math.random() * 10000)}`;
      }
      current[childKey] = [];
    });
  };

  // Rename a header at a specific path
  const handleRenameTreeHeader = (path: string[], newNameRaw: string) => {
    const newName = newNameRaw.trim();
    if (!newName) return;
    const oldName = path[path.length - 1];
    if (oldName === newName) return;

    mutateTreeData((draft) => {
      const parentPath = path.slice(0, -1);
      let parent: any = draft;
      for (const segment of parentPath) {
        parent = parent[segment];
      }
      if (parent && parent[oldName] !== undefined) {
        const val = parent[oldName];
        delete parent[oldName];
        parent[newName] = val;
      }
    });
  };

  // Delete a header / subtree at a path
  const handleDeleteTreePath = (path: string[]) => {
    mutateTreeData((draft) => {
      const parentPath = path.slice(0, -1);
      const targetKey = path[path.length - 1];
      let parent: any = draft;
      for (const segment of parentPath) {
        parent = parent[segment];
      }
      if (parent && parent[targetKey] !== undefined) {
        delete parent[targetKey];
      }
    });
  };

  // Add Token to a Tree Leaf Node Array (with Autosuggest)
  const handleAddTreeToken = (path: string[], token: string) => {
    const cleanToken = token.trim();
    if (!cleanToken) return;

    mutateTreeData((draft) => {
      const parentPath = path.slice(0, -1);
      const targetKey = path[path.length - 1];
      let parent: any = draft;
      for (const segment of parentPath) {
        parent = parent[segment];
      }
      if (parent) {
        if (!Array.isArray(parent[targetKey])) {
          parent[targetKey] = [];
        }
        if (!parent[targetKey].includes(cleanToken)) {
          parent[targetKey].push(cleanToken);
        }
      }
    });

    // Clear input buffer & close dropdown
    const pathKey = path.join('.');
    setTreeQuickAddInput((prev) => ({ ...prev, [pathKey]: '' }));
    setActiveSuggestPath(null);
  };

  // Remove Token from a Tree Leaf Node Array
  const handleRemoveTreeToken = (path: string[], tokenToRemove: string) => {
    mutateTreeData((draft) => {
      const parentPath = path.slice(0, -1);
      const targetKey = path[path.length - 1];
      let parent: any = draft;
      for (const segment of parentPath) {
        parent = parent[segment];
      }
      if (parent && Array.isArray(parent[targetKey])) {
        parent[targetKey] = parent[targetKey].filter((t: string) => t !== tokenToRemove);
      }
    });
  };

  // Tree Quick Add Autosuggest Filter
  const getFilteredTreeSuggestions = (path: string[], currentTokens: string[]) => {
    const pathKey = path.join('.');
    const q = (treeQuickAddInput[pathKey] || '').trim().toLowerCase();
    if (!q) return [];
    return globalKeySuggestions
      .filter((s) => s.toLowerCase().includes(q) && !currentTokens.includes(s))
      .slice(0, 8);
  };

  // ==========================================================================
  // RENDER RECURSIVE TREE NODE
  // ==========================================================================

  const renderTreeNode = (key: string, value: any, path: string[], depth = 1) => {
    const currentPath = [...path, key];
    const pathKey = currentPath.join('.');
    const isArray = Array.isArray(value);
    const isObject = value && typeof value === 'object' && !isArray;
    const tokens: string[] = isArray ? value : [];

    // Header prefix styling based on depth level
    const depthColors = [
      { border: 'border-hazard-gold/40', text: 'text-hazard-gold', bg: 'bg-hazard-gold/10', hash: '#' },
      { border: 'border-hazard-cyan/40', text: 'text-hazard-cyan', bg: 'bg-hazard-cyan/10', hash: '##' },
      { border: 'border-hazard-purple/40', text: 'text-hazard-purple', bg: 'bg-hazard-purple/10', hash: '###' },
      { border: 'border-hazard-emerald/40', text: 'text-hazard-emerald', bg: 'bg-hazard-emerald/10', hash: '####' },
    ];
    const colorStyle = depthColors[Math.min(depth - 1, depthColors.length - 1)];

    // Filtered autosuggest items for this specific node
    const filteredSuggests = getFilteredTreeSuggestions(currentPath, tokens);
    const inputValue = treeQuickAddInput[pathKey] || '';
    const isDropdownOpen = activeSuggestPath === pathKey && filteredSuggests.length > 0;

    return (
      <div
        key={pathKey}
        className={`flex flex-col gap-2 p-3.5 rounded-2xl border bg-hazard-card/40 hover:bg-hazard-card/60 transition shadow-md ${colorStyle.border}`}
        style={{ marginLeft: depth > 1 ? `${Math.min(depth - 1, 4) * 16}px` : '0px' }}
      >
        {/* Node Header Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            {/* Markdown Header Level Badge */}
            <span
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border ${colorStyle.border} ${colorStyle.text} ${colorStyle.bg}`}
              title={`Markdown Level ${depth} Header (${colorStyle.hash})`}
            >
              {colorStyle.hash} L{depth}
            </span>

            {/* Editable Header Name */}
            <input
              type="text"
              defaultValue={key}
              onBlur={(e) => handleRenameTreeHeader(currentPath, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              className="bg-transparent font-mono text-xs font-bold text-hazard-textBright focus:text-white px-2 py-1 rounded-lg border border-transparent focus:border-hazard-gold/50 focus:bg-hazard-void/90 outline-none flex-1"
            />
          </div>

          {/* Node Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Batch / Bulk Edit Button */}
            {isArray && (
              <button
                type="button"
                onClick={() =>
                  setBulkModal({
                    isOpen: true,
                    rowKey: key,
                    fieldKey: 'tokens',
                    tokens,
                  })
                }
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-hazard-void border border-hazard-border text-hazard-textMuted hover:text-hazard-gold hover:border-hazard-gold/40 transition"
                title="Batch Edit or Paste Prompts"
              >
                <ListPlus className="w-3 h-3" />
                <span>Batch ({tokens.length})</span>
              </button>
            )}

            {/* Add Sub-Header / Child Group */}
            <button
              type="button"
              onClick={() => handleAddChildHeader(currentPath)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono rounded-lg bg-hazard-cyan/10 border border-hazard-cyan/30 text-hazard-cyan hover:bg-hazard-cyan/20 transition"
              title="Add a Nested Sub-Header / Child Group"
            >
              <Plus className="w-3 h-3" />
              <span>Sub-Group</span>
            </button>

            {/* Delete Node Button */}
            <button
              type="button"
              onClick={() => handleDeleteTreePath(currentPath)}
              className="p-1 text-hazard-textMuted hover:text-hazard-crimson rounded-lg hover:bg-hazard-cardHover transition"
              title="Delete this Group and all Children"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* If Leaf Token Array: Render Chips & Quick Add with Autosuggest */}
        {isArray && (
          <div className="flex flex-col gap-2 pl-2 border-l-2 border-hazard-border/50 mt-1">
            {/* Tag Chips Pool */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {tokens.length === 0 ? (
                <span className="text-[11px] font-mono text-hazard-textMuted/50 italic py-1">
                  No tokens in this group. Add via input or batch editor.
                </span>
              ) : (
                tokens.map((token, tIdx) => (
                  <span
                    key={tIdx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-mono bg-hazard-void border border-hazard-border text-hazard-gold group hover:border-hazard-gold/40 transition"
                  >
                    <span>-</span>
                    <span>{token}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTreeToken(currentPath, token)}
                      className="text-hazard-textMuted hover:text-hazard-crimson transition opacity-60 group-hover:opacity-100 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Inline Quick Add with Autosuggest Dropdown */}
            <div className="relative flex items-center gap-2 max-w-md mt-1">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setTreeQuickAddInput((prev) => ({ ...prev, [pathKey]: e.target.value }));
                    setActiveSuggestPath(pathKey);
                    setSelectedSuggestIndex(0);
                  }}
                  onFocus={() => setActiveSuggestPath(pathKey)}
                  onKeyDown={(e) => {
                    if (isDropdownOpen) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedSuggestIndex((prev) => (prev + 1) % filteredSuggests.length);
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedSuggestIndex(
                          (prev) => (prev - 1 + filteredSuggests.length) % filteredSuggests.length
                        );
                        return;
                      }
                      if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        handleAddTreeToken(currentPath, filteredSuggests[selectedSuggestIndex]);
                        return;
                      }
                      if (e.key === 'Escape') {
                        setActiveSuggestPath(null);
                        return;
                      }
                    }

                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (inputValue.trim()) {
                        handleAddTreeToken(currentPath, inputValue.trim());
                      }
                    }
                  }}
                  placeholder="Quick add token with autosuggest (- token)..."
                  className="w-full bg-hazard-void/90 border border-hazard-border rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder:text-hazard-textMuted/40 focus:outline-none focus:border-hazard-cyan"
                />

                {/* Floating Autosuggest Dropdown */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#141720] border border-hazard-cyan/40 rounded-xl shadow-2xl overflow-hidden max-h-44 overflow-y-auto custom-scrollbar">
                    {filteredSuggests.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleAddTreeToken(currentPath, suggestion)}
                        onMouseEnter={() => setSelectedSuggestIndex(sIdx)}
                        className={`w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between transition ${
                          sIdx === selectedSuggestIndex
                            ? 'bg-hazard-cyan/20 text-hazard-cyan font-bold'
                            : 'text-hazard-textBright hover:bg-hazard-cardHover'
                        }`}
                      >
                        <span>- {suggestion}</span>
                        <span className="text-[10px] text-hazard-textMuted font-sans">suggested</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (inputValue.trim()) {
                    handleAddTreeToken(currentPath, inputValue.trim());
                  }
                }}
                disabled={!inputValue.trim()}
                className="px-3 py-1.5 bg-hazard-cyan/10 border border-hazard-cyan/30 hover:bg-hazard-cyan/20 text-hazard-cyan text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>
        )}

        {/* If Nested Object: Recursively Render Child Nodes */}
        {isObject && (
          <div className="flex flex-col gap-2.5 mt-2">
            {Object.entries(value).map(([childKey, childVal]) =>
              renderTreeNode(childKey, childVal, currentPath, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Count total groups and tokens in tree
  const treeStatistics = useMemo(() => {
    let groupCount = 0;
    let tokenCount = 0;

    const countRec = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      for (const [_, val] of Object.entries(obj)) {
        groupCount++;
        if (Array.isArray(val)) {
          tokenCount += val.length;
        } else if (val && typeof val === 'object') {
          countRec(val);
        }
      }
    };

    if (viewMode === 'tree') {
      countRec(currentData);
    }

    return { groupCount, tokenCount };
  }, [currentData, viewMode]);

  // ==========================================================================
  // RENDER MAIN COMPONENT
  // ==========================================================================

  return (
    <div className="p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full font-sans text-hazard-textBright">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col gap-4">
        {/* Top Title & Save Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Topology Studio</span>
              </h2>
              {activeFile && (
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border uppercase tracking-wider ${
                    activeFile.subdir === 'tree'
                      ? 'bg-hazard-gold/10 text-hazard-gold border-hazard-gold/40'
                      : 'bg-hazard-cyan/10 text-hazard-cyan border-hazard-cyan/40'
                  }`}
                >
                  {activeFile.subdir === 'tree' ? '🌳 Tree Mode' : '📊 Table Mode'}
                </span>
              )}
            </div>
            <p className="text-xs text-hazard-textMuted mt-1">
              Dual-paradigm topology manager: Markdown-driven taxonomy trees & relational entity tables
            </p>
          </div>

          {/* Save Buttons & Status Indicators */}
          <div className="flex items-center gap-2.5">
            {saveSuccessNotice && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-bold animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                <span>Saved atomically</span>
              </span>
            )}

            {/* Save Active Button */}
            <button
              type="button"
              onClick={handleSaveActive}
              disabled={isSaving || !activeFile || !dirtyMap[activeFile.relPath]}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                activeFile && dirtyMap[activeFile.relPath]
                  ? 'bg-hazard-gold text-black hover:bg-hazard-goldGlow hover:scale-105 active:scale-95'
                  : 'bg-hazard-card border border-hazard-border text-hazard-textMuted cursor-not-allowed opacity-60'
              }`}
              title="Save active file to vault disk (Ctrl+S / Cmd+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save File {activeFile && dirtyMap[activeFile.relPath] ? '*' : ''}</span>
            </button>

            {/* Save All Dirty Button */}
            {Object.values(dirtyMap).some(Boolean) && (
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-hazard-cardHover border border-hazard-gold/50 text-hazard-gold hover:bg-hazard-gold/20 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
                <span>Save All Dirty</span>
              </button>
            )}

            {/* New File Button */}
            <button
              type="button"
              onClick={() => setIsAddingFile(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-hazard-card hover:bg-hazard-cardHover text-hazard-cyan border border-hazard-border hover:border-hazard-cyan/40 rounded-xl font-bold text-xs transition"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>New File</span>
            </button>
          </div>
        </div>

        {/* Discovered Files Tab Selector */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-hazard-card/60 backdrop-blur-md border border-hazard-border rounded-2xl">
          {/* Tree Category Label */}
          <div className="flex items-center gap-1 px-2 text-[11px] font-mono font-bold text-hazard-gold/80 uppercase">
            <FolderTree className="w-3 h-3 text-hazard-gold" />
            <span>Tree:</span>
          </div>

          {files
            .filter((f) => f.subdir === 'tree')
            .map((file) => {
              const isActive = activeFile?.relPath === file.relPath;
              const isDirty = dirtyMap[file.relPath];
              return (
                <div
                  key={file.relPath}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                    isActive
                      ? 'bg-hazard-gold/20 text-hazard-gold border border-hazard-gold/50 font-bold shadow-hazard-glow'
                      : 'text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover border border-transparent'
                  }`}
                  onClick={() => setActiveFile(file)}
                >
                  <FolderTree className="w-3.5 h-3.5 shrink-0" />
                  <span>{file.fileName}</span>
                  {isDirty && <span className="text-hazard-gold font-bold">*</span>}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-hazard-crimson transition p-0.5"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}

          <div className="h-5 w-px bg-hazard-border mx-1" />

          {/* Tables Category Label */}
          <div className="flex items-center gap-1 px-2 text-[11px] font-mono font-bold text-hazard-cyan/80 uppercase">
            <Table2 className="w-3 h-3 text-hazard-cyan" />
            <span>Tables:</span>
          </div>

          {files
            .filter((f) => f.subdir === 'table')
            .map((file) => {
              const isActive = activeFile?.relPath === file.relPath;
              const isDirty = dirtyMap[file.relPath];
              return (
                <div
                  key={file.relPath}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer ${
                    isActive
                      ? 'bg-hazard-cyan/20 text-hazard-cyan border border-hazard-cyan/50 font-bold shadow-cyan-glow'
                      : 'text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover border border-transparent'
                  }`}
                  onClick={() => setActiveFile(file)}
                >
                  <Table2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{file.fileName}</span>
                  {isDirty && <span className="text-hazard-gold font-bold">*</span>}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-hazard-crimson transition p-0.5"
                    title="Delete file"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
        </div>
      </div>

      {/* 2. New File Popover Modal */}
      {isAddingFile && (
        <div className="p-4 bg-hazard-card/90 border border-hazard-gold/40 rounded-2xl flex flex-wrap items-center gap-4 shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-hazard-gold" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">Create Topology File</span>
          </div>

          <div className="flex items-center gap-2 bg-hazard-void p-1 rounded-xl border border-hazard-border">
            <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer transition text-hazard-gold">
              <input
                type="radio"
                name="subdir"
                value="tree"
                checked={newFileSubdir === 'tree'}
                onChange={() => setNewFileSubdir('tree')}
                className="hidden"
              />
              <FolderTree className="w-3 h-3" />
              <span>Tree/ (Hierarchical)</span>
            </label>
            <label className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono cursor-pointer transition text-hazard-cyan">
              <input
                type="radio"
                name="subdir"
                value="table"
                checked={newFileSubdir === 'table'}
                onChange={() => setNewFileSubdir('table')}
                className="hidden"
              />
              <Table2 className="w-3 h-3" />
              <span>Tables/ (Relational)</span>
            </label>
          </div>

          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="e.g. _5_outfit_taxonomy.json"
            className="bg-hazard-void border border-hazard-border rounded-xl px-3 py-1.5 text-xs font-mono text-white placeholder:text-hazard-textMuted/50 focus:outline-none focus:border-hazard-gold flex-1 min-w-[200px]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFile();
              if (e.key === 'Escape') setIsAddingFile(false);
            }}
          />

          <button
            type="button"
            onClick={handleCreateFile}
            className="px-4 py-1.5 bg-hazard-gold text-black font-bold text-xs rounded-xl hover:bg-hazard-goldGlow transition"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsAddingFile(false)}
            className="p-1.5 text-hazard-textMuted hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE VIEW (TREE vs TABLE) */}
      {viewMode === 'tree' ? (
        /* ==================================================================== */
        /* TREE MODE: MARKDOWN-DRIVEN TAXONOMY TREE EDITOR                      */
        /* ==================================================================== */
        <div className="flex flex-col gap-4">
          {/* Tree Sub-Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-hazard-card/60 border border-hazard-border rounded-2xl">
            {/* View Style Switcher (Interactive Visual Outline vs Raw Markdown) */}
            <div className="flex items-center gap-1 bg-hazard-void p-1 rounded-xl border border-hazard-border text-xs font-mono">
              <button
                type="button"
                onClick={() => setTreeEditorStyle('visual')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  treeEditorStyle === 'visual'
                    ? 'bg-hazard-gold text-black font-bold shadow-md'
                    : 'text-hazard-textMuted hover:text-white'
                }`}
                title="Interactive Markdown outline blocks with editable headers and tag pools"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Visual Outline</span>
              </button>
              <button
                type="button"
                onClick={() => setTreeEditorStyle('raw')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  treeEditorStyle === 'raw'
                    ? 'bg-hazard-gold text-black font-bold shadow-md'
                    : 'text-hazard-textMuted hover:text-white'
                }`}
                title="Raw Markdown editor with headers (#, ##) and list bullets (- token)"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Raw Markdown</span>
              </button>
              <button
                type="button"
                onClick={() => setTreeEditorStyle('split')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                  treeEditorStyle === 'split'
                    ? 'bg-hazard-gold text-black font-bold shadow-md'
                    : 'text-hazard-textMuted hover:text-white'
                }`}
                title="Split View: Markdown Editor + Live JSON Inspector"
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split View</span>
              </button>
            </div>

            {/* Tree Statistics */}
            <div className="flex items-center gap-3 text-xs font-mono text-hazard-textMuted">
              <span>
                Groups: <strong className="text-hazard-gold">{treeStatistics.groupCount}</strong>
              </span>
              <span>•</span>
              <span>
                Leaf Tokens: <strong className="text-hazard-cyan">{treeStatistics.tokenCount}</strong>
              </span>
            </div>

            {/* Add Root Header Button */}
            <button
              type="button"
              onClick={handleAddRootHeader}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-hazard-gold/10 hover:bg-hazard-gold/20 text-hazard-gold border border-hazard-gold/30 hover:border-hazard-gold/60 rounded-xl font-bold text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Root Header (# ID)</span>
            </button>
          </div>

          {/* Tree Main Canvas */}
          {treeEditorStyle === 'visual' && (
            <div className="flex flex-col gap-3 rounded-2xl border border-hazard-border bg-hazard-card/30 p-4 shadow-xl">
              {Object.keys(currentData).length === 0 ? (
                <div className="p-8 text-center text-hazard-textMuted/60 text-xs font-mono italic">
                  No hierarchy defined in this file yet. Click "Add Root Header" or switch to Raw Markdown to type.
                </div>
              ) : (
                Object.entries(currentData).map(([key, val]) => renderTreeNode(key, val, [], 1))
              )}
            </div>
          )}

          {treeEditorStyle === 'raw' && (
            <div className="flex flex-col gap-3 rounded-2xl border border-hazard-border bg-[#0a0c12] p-4 shadow-2xl">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-mono text-hazard-gold font-bold flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Live Markdown Editor (Synchronized to JSON Tree)</span>
                </span>
                <span className="text-[11px] font-mono text-hazard-textMuted">
                  Use <code className="text-hazard-gold"># Header</code> for groups and{' '}
                  <code className="text-hazard-cyan">- token</code> for items
                </span>
              </div>
              <textarea
                value={rawMarkdownBuffer}
                onChange={(e) => handleRawMarkdownChange(e.target.value)}
                rows={22}
                placeholder="# category&#10;## sub_category&#10;- token_1&#10;- token_2"
                className="w-full bg-[#0d0f16] border border-hazard-border rounded-xl p-4 text-xs font-mono text-hazard-textBright placeholder:text-hazard-textMuted/40 focus:outline-none focus:border-hazard-gold resize-y custom-scrollbar leading-relaxed"
                spellCheck={false}
              />
            </div>
          )}

          {treeEditorStyle === 'split' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Markdown Editor */}
              <div className="flex flex-col gap-2 rounded-2xl border border-hazard-border bg-[#0a0c12] p-4 shadow-xl">
                <span className="text-xs font-mono text-hazard-gold font-bold flex items-center gap-1.5">
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Markdown Outline</span>
                </span>
                <textarea
                  value={rawMarkdownBuffer}
                  onChange={(e) => handleRawMarkdownChange(e.target.value)}
                  rows={20}
                  className="w-full bg-[#0d0f16] border border-hazard-border rounded-xl p-3.5 text-xs font-mono text-hazard-textBright focus:outline-none focus:border-hazard-gold resize-y custom-scrollbar leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Right Column: Live JSON Inspector */}
              <div className="flex flex-col gap-2 rounded-2xl border border-hazard-border bg-[#0a0c12] p-4 shadow-xl">
                <span className="text-xs font-mono text-hazard-cyan font-bold flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Parsed JSON Structure</span>
                </span>
                <pre className="w-full bg-[#0d0f16] border border-hazard-border rounded-xl p-3.5 text-xs font-mono text-hazard-textMuted overflow-auto max-h-[460px] custom-scrollbar">
                  {JSON.stringify(currentData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ==================================================================== */
        /* TABLE MODE: DYNAMIC RELATIONAL ENTITY-COMPONENT GRID                */
        /* ==================================================================== */
        <div className="flex flex-col gap-4">
          {/* Table Action Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-hazard-card/60 border border-hazard-border rounded-2xl">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-3.5 h-3.5 text-hazard-textMuted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keys, column values, or prompt tokens..."
                className="w-full bg-hazard-void border border-hazard-border rounded-xl pl-9 pr-8 py-1.5 text-xs font-mono text-white placeholder:text-hazard-textMuted/50 focus:outline-none focus:border-hazard-cyan"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-hazard-textMuted hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Column & Row Adders */}
            <div className="flex items-center gap-2">
              {isAddingColumn ? (
                <div className="flex items-center gap-1.5 bg-hazard-void p-1 rounded-xl border border-hazard-gold/50 animate-fadeIn">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    placeholder="col_name"
                    className="bg-transparent text-xs font-mono px-2 py-0.5 outline-none text-white w-24"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTableColumn();
                      if (e.key === 'Escape') setIsAddingColumn(false);
                    }}
                  />
                  <select
                    value={newColumnType}
                    onChange={(e: any) => setNewColumnType(e.target.value)}
                    className="bg-hazard-card text-xs text-hazard-gold px-1.5 py-0.5 rounded border border-hazard-border outline-none font-mono"
                  >
                    <option value="array">Tags[]</option>
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddTableColumn}
                    className="px-2 py-0.5 bg-hazard-gold text-black text-xs font-bold rounded hover:bg-hazard-goldGlow"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingColumn(false)}
                    className="p-1 text-hazard-textMuted hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingColumn(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-hazard-textMuted hover:text-hazard-cyan bg-hazard-card border border-hazard-border rounded-xl transition hover:border-hazard-cyan/40"
                  title="Add a new property column to this table"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Column</span>
                </button>
              )}

              {/* Add Row Button */}
              <button
                type="button"
                onClick={handleAddTableRow}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-hazard-gold/10 hover:bg-hazard-gold/20 text-hazard-gold border border-hazard-gold/30 hover:border-hazard-gold/60 rounded-xl font-bold text-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Table View Grid */}
          <div className="w-full overflow-x-auto rounded-2xl border border-hazard-border bg-hazard-card/60 backdrop-blur-md shadow-xl custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-hazard-void/90 border-b border-hazard-border select-none">
                  <th className="w-12 px-3 py-3 text-center text-hazard-textMuted/60 font-mono font-medium">#</th>

                  {/* Primary Key Header */}
                  <th
                    className="px-4 py-3 font-mono font-bold uppercase tracking-wider text-hazard-gold cursor-pointer hover:bg-hazard-cardHover transition"
                    onClick={() => toggleTableSort('__key__')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>ID (Primary Key)</span>
                      {sortColumn === '__key__' && sortDirection !== 'none' ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-hazard-gold" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-hazard-gold" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-hazard-textMuted/40" />
                      )}
                    </div>
                  </th>

                  {/* Dynamic Column Headers */}
                  {dynamicColumns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 font-mono font-bold uppercase tracking-wider text-hazard-cyan hover:bg-hazard-cardHover transition group relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className="flex items-center gap-1.5 cursor-pointer flex-1"
                          onClick={() => toggleTableSort(col)}
                        >
                          <span>{col}</span>
                          {sortColumn === col && sortDirection !== 'none' ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-hazard-cyan" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-hazard-cyan" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-hazard-textMuted/40" />
                          )}
                        </div>

                        {/* Delete Column Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Remove column "${col}" from all rows?`)) {
                              handleDeleteTableColumn(col);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-hazard-crimson transition"
                          title="Delete Column"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}

                  <th className="w-24 px-4 py-3 text-right font-mono font-bold uppercase text-hazard-textMuted">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-hazard-border/50 font-mono">
                {sortedTableRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={dynamicColumns.length + 3}
                      className="py-12 text-center text-hazard-textMuted/60 italic text-xs"
                    >
                      {searchQuery
                        ? 'No rows matching current search query.'
                        : 'No entries found in this table. Click "+ Add Row" above to start.'}
                    </td>
                  </tr>
                ) : (
                  sortedTableRows.map(([rowKey, rowData], index) => {
                    const isHighlighted = highlightedRowKey === rowKey;
                    return (
                      <tr
                        key={rowKey}
                        className={`transition-colors hover:bg-hazard-cardHover/80 group ${
                          isHighlighted ? 'bg-hazard-gold/10' : ''
                        }`}
                      >
                        {/* Index Number */}
                        <td className="px-3 py-3 text-center text-hazard-textMuted/50 text-[11px]">
                          {index + 1}
                        </td>

                        {/* Primary Key Cell */}
                        <td className="px-4 py-3 min-w-[180px]">
                          <input
                            type="text"
                            defaultValue={rowKey}
                            onBlur={(e) => renameTableRowKey(rowKey, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            }}
                            className="w-full bg-transparent font-bold text-hazard-gold focus:text-white px-2 py-1 rounded-lg border border-transparent focus:border-hazard-gold/50 focus:bg-hazard-void/90 outline-none"
                          />
                        </td>

                        {/* Dynamic Column Attribute Cells */}
                        {dynamicColumns.map((colName) => {
                          const cellVal = rowData ? (rowData as any)[colName] : undefined;
                          const isArray = Array.isArray(cellVal);
                          const bufferKey = `${rowKey}:${colName}`;

                          return (
                            <td key={colName} className="px-4 py-3 min-w-[240px] align-top">
                              {isArray ? (
                                <div className="flex flex-col gap-2">
                                  {/* Tag Chips */}
                                  <div className="flex flex-wrap gap-1.5 items-center">
                                    {cellVal.map((item: string, i: number) => (
                                      <span
                                        key={i}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-hazard-void border border-hazard-border text-hazard-textBright group/tag hover:border-hazard-cyan/40 transition"
                                      >
                                        <span>{item}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTableTag(rowKey, colName, item)}
                                          className="text-hazard-textMuted hover:text-hazard-crimson transition opacity-60 group-hover/tag:opacity-100 ml-0.5"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}

                                    {/* Batch Edit Modal Launcher */}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setBulkModal({
                                          isOpen: true,
                                          rowKey,
                                          fieldKey: colName,
                                          tokens: cellVal,
                                        })
                                      }
                                      className="px-2 py-0.5 text-[10px] rounded-lg bg-hazard-card hover:bg-hazard-cardHover text-hazard-textMuted hover:text-hazard-gold border border-hazard-border transition flex items-center gap-1"
                                      title="Batch Prompt Editor"
                                    >
                                      <ListPlus className="w-3 h-3" />
                                      <span>Batch</span>
                                    </button>
                                  </div>

                                  {/* Inline Single Tag Adder */}
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={tagInputBuffer[bufferKey] || ''}
                                      onChange={(e) =>
                                        setTagInputBuffer((prev) => ({
                                          ...prev,
                                          [bufferKey]: e.target.value,
                                        }))
                                      }
                                      placeholder="Add item..."
                                      className="flex-1 bg-hazard-void border border-hazard-border rounded-lg px-2 py-1 text-xs text-white placeholder:text-hazard-textMuted/40 focus:outline-none focus:border-hazard-cyan"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddTableTag(rowKey, colName);
                                      }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleAddTableTag(rowKey, colName)}
                                      className="p-1 bg-hazard-void border border-hazard-border hover:border-hazard-cyan hover:text-hazard-cyan text-hazard-textMuted rounded-lg transition"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ) : typeof cellVal === 'number' ? (
                                <input
                                  type="number"
                                  value={cellVal}
                                  onChange={(e) =>
                                    updateTableCell(rowKey, colName, parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full bg-hazard-void border border-hazard-border rounded-lg px-2.5 py-1 text-xs text-hazard-amber focus:outline-none focus:border-hazard-amber"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={cellVal || ''}
                                  onChange={(e) => updateTableCell(rowKey, colName, e.target.value)}
                                  className="w-full bg-transparent text-xs text-hazard-textBright px-2 py-1 rounded-lg border border-transparent focus:border-hazard-cyan/50 focus:bg-hazard-void outline-none"
                                />
                              )}
                            </td>
                          );
                        })}

                        {/* Row Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDuplicateTableRow(rowKey)}
                              className="p-1.5 text-hazard-textMuted hover:text-hazard-cyan hover:bg-hazard-card rounded-lg transition"
                              title="Duplicate Row"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTableRow(rowKey)}
                              className="p-1.5 text-hazard-textMuted hover:text-hazard-crimson hover:bg-hazard-card rounded-lg transition"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Batch Prompt Modal with Global Autosuggest Pool */}
      <TopologyBulkPromptModal
        isOpen={bulkModal.isOpen}
        groupKey={bulkModal.rowKey}
        fieldKey={bulkModal.fieldKey}
        initialPrompts={bulkModal.tokens}
        suggestions={globalKeySuggestions}
        onClose={() =>
          setBulkModal({
            isOpen: false,
            rowKey: '',
            fieldKey: '',
            tokens: [],
          })
        }
        onSave={(newPrompts) => {
          if (viewMode === 'tree') {
            // Update leaf array for tree
            handleAddTreeToken([bulkModal.rowKey], '');
            mutateTreeData((draft) => {
              const findAndSet = (obj: any) => {
                if (!obj || typeof obj !== 'object') return false;
                if (obj[bulkModal.rowKey] !== undefined) {
                  obj[bulkModal.rowKey] = newPrompts;
                  return true;
                }
                for (const sub of Object.values(obj)) {
                  if (findAndSet(sub)) return true;
                }
                return false;
              };
              findAndSet(draft);
            });
          } else {
            // Update table cell
            updateTableCell(bulkModal.rowKey, bulkModal.fieldKey, newPrompts);
          }
        }}
      />

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-hazard-textMuted font-mono pt-4 border-t border-hazard-border">
        <div className="flex items-center gap-2">
          <span>Active:</span>
          <span className="text-hazard-gold">{activeFile?.relPath || 'None'}</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <kbd className="px-1.5 py-0.5 rounded bg-hazard-void border border-hazard-border text-hazard-textBright">
            Ctrl+S
          </kbd>
          <span>to save atomically to vault</span>
        </div>
      </div>
    </div>
  );
};
