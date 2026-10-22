import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { TableTabs } from './components/TableTabs';
import { SchemaView } from './components/SchemaView';
import { DataGrid } from './components/DataGrid';
import { MobileCardView } from './components/MobileCardView';
import { MobileRecordDrawer } from './components/MobileRecordDrawer';
import { AuthModal } from './components/AuthModal';
import { VaultGate } from './components/VaultGate';
import { TableSettingsModal } from './components/TableSettingsModal';
import { NewTableModal } from './components/NewTableModal';
import { WorkspaceOutliner } from './components/WorkspaceOutliner';
import { TableSchema, TableRecord, TableGroup, TableMetaRecord, TableState } from './types';
import { api, getAuthKey, checkUrlKey } from './services/api';
import { generateHexId } from './utils/id';
import { SaveStatusNotification } from './components/SaveStatusNotification';
import { ActionToast } from './components/ActionToast';
import {
  ActionNotification,
  NotificationActionType,
  createNotification,
  formatRecordSummary,
  formatValueForDisplay,
} from './services/notificationManager';
import { useSaveTracker } from './hooks/useSaveTracker';
import { resolveActiveSubdomain, navigateToSubdomain, AppSubdomain } from './utils/subdomain';
import { HazardTriggerApp } from './components/hazard/HazardTriggerApp';
import { PromptStudioApp } from './components/prompt/PromptStudioApp';
import { HairCodexApp } from './components/hair/HairCodexApp';
import { FacetCodexApp } from './components/facet/FacetCodexApp';

export const App: React.FC = () => {
  const [activeApp, setActiveApp] = useState<AppSubdomain>(() => resolveActiveSubdomain());
  const [mode, setMode] = useState<'schema' | 'data'>('data');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [tables, setTables] = useState<Record<string, TableSchema>>({});
  const [activeTableName, setActiveTableName] = useState<string>('quotes');
  // Sovereign multi-table RAM cache: table records are kept in memory once loaded (0ms switch, zero re-curling)
  const [tableRecords, setTableRecords] = useState<Record<string, TableRecord[]>>({});
  const records = useMemo(() => tableRecords[activeTableName] || [], [tableRecords, activeTableName]);
  const [recordCounts, setRecordCounts] = useState<Record<string, number>>({});
  const [tableMetadata, setTableMetadata] = useState<TableMetaRecord[]>([]);
  const [groups, setGroups] = useState<TableGroup[]>([]);
  const [tableStates, setTableStates] = useState<Record<string, TableState>>({});
  const [relationOptions, setRelationOptions] = useState<Record<string, { id: string; label: string }[]>>({});
  const [relationStore, setRelationStore] = useState<Record<string, Record<string, TableRecord>>>({});

  const currentSchema = useMemo(
    () => tables[activeTableName] || { table_name: activeTableName, columns: [] },
    [tables, activeTableName]
  );

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<ActionNotification[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActionNotification[]>([]);
  const [lastAction, setLastAction] = useState<ActionNotification | null>(null);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (type: NotificationActionType, title: string, details?: string) => {
      const notif = createNotification(type, title, details);
      setLastAction(notif);
      setRecentActivity((prev) => [notif, ...prev.slice(0, 19)]);
      setNotifications((prev) => [notif, ...prev.slice(0, 3)]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 4000);
    },
    []
  );

  const showToast = useCallback(
    (msg: string, type: NotificationActionType = 'info', details?: string) => {
      let resolvedType = type;
      if (type === 'info') {
        const lower = msg.toLowerCase();
        if (lower.startsWith('deleted') || lower.includes('delete failed')) {
          resolvedType = lower.includes('failed') ? 'error' : 'deleted';
        } else if (lower.startsWith('saved') || lower.startsWith('created') || lower.includes('synchronized')) {
          resolvedType = 'saved';
        } else if (lower.includes('failed') || lower.includes('error')) {
          resolvedType = 'error';
        } else if (lower.startsWith('updated') || lower.startsWith('nested') || lower.startsWith('moved')) {
          resolvedType = 'changed';
        }
      }
      notify(resolvedType, msg, details);
    },
    [notify]
  );

  const {
    isSaving,
    setIsSaving,
    lastSavedTime,
    setLastSavedTime,
    draftSchemas,
    unsavedChanges,
    handleColumnsChange,
    handleReorderRecords,
    saveTable,
    saveAll,
    discardAll,
    autoSaveBeforeTabSwitch,
  } = useSaveTracker({
    tables,
    setTables,
    tableMetadata,
    showToast,
  });

  // Auth & Lock State
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [initialUrlKey, setInitialUrlKey] = useState<string>('');

  // Drawer, Outliner & Modals
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<TableRecord | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [tableSettingsOpen, setTableSettingsOpen] = useState<boolean>(false);
  const [newTableModalOpen, setNewTableModalOpen] = useState<boolean>(false);
  const [defaultNewTableGroupId, setDefaultNewTableGroupId] = useState<string | null>(null);
  const [outlinerOpen, setOutlinerOpen] = useState<boolean>(true);

  // Responsive Hook
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Pure RAM lazy-loader for foreign relation options (0ms initial startup, zero waterfall)
  const syncTableToRelationStore = (tableName: string, tableRecordsList: TableRecord[]) => {
    const byId: Record<string, TableRecord> = {};
    tableRecordsList.forEach((r: TableRecord) => {
      if (r && r.id) byId[r.id] = r;
    });
    setRelationStore((prev) => ({ ...prev, [tableName]: byId }));

    const opts = tableRecordsList.slice(0, 150).map((r: TableRecord) => {
      const label = r.name || r.main_content || r.title || r.headline || r.id;
      return { id: r.id, label: String(label).slice(0, 50) };
    });
    setRelationOptions((prev) => ({ ...prev, [tableName]: opts }));
  };

  const inFlightRelationsRef = useRef<Set<string>>(new Set());
  const tableRecordsRef = useRef(tableRecords);
  tableRecordsRef.current = tableRecords;

  const ensureRelationLoaded = useCallback(async (targetTable?: string) => {
    if (!targetTable) return;
    const currentRecs = tableRecordsRef.current[targetTable];
    if (currentRecs && currentRecs.length > 0) return;
    if (inFlightRelationsRef.current.has(targetTable)) return;

    inFlightRelationsRef.current.add(targetTable);
    try {
      const res = await api.getRecords(targetTable);
      if (res.records) {
        setTableRecords((prev) => ({ ...prev, [targetTable]: res.records }));
        syncTableToRelationStore(targetTable, res.records);
      }
    } catch {
      // Soft-fail for missing table
    } finally {
      inFlightRelationsRef.current.delete(targetTable);
    }
  }, []);

  // Preload foreign relation records for current table's relation columns
  useEffect(() => {
    if (!currentSchema || !currentSchema.columns) return;
    (currentSchema.columns || [])
      .filter((c) => c.type === 'relation_single' || c.type === 'relation_multi')
      .forEach((c) => {
        if (c.metadata?.target) ensureRelationLoaded(c.metadata.target);
        if (c.metadata?.secondary_target) ensureRelationLoaded(c.metadata.secondary_target);
      });
  }, [activeTableName, currentSchema]);

  const loadRecords = async (tableName: string, force = false) => {
    // If table already resides in RAM and force reload is not requested, return instantly (0ms)
    if (!force && tableRecords[tableName] !== undefined) return;
    try {
      const res = await api.getRecords(tableName);
      const recs = res.records || [];
      setTableRecords((prev) => ({ ...prev, [tableName]: recs }));
      setRecordCounts((prev) => ({ ...prev, [tableName]: res.count || recs.length || 0 }));
      syncTableToRelationStore(tableName, recs);
    } catch (e: any) {
      console.warn('Error loading records for table:', tableName, e);
      setTableRecords((prev) => ({ ...prev, [tableName]: [] }));
    }
  };

  // Fast single-query startup (zero multi-table waterfall)
  const refreshAll = async () => {
    setIsSyncing(true);
    try {
      const health = await api.checkHealth().catch(() => null);
      setIsConnected(Boolean(health && health.status === 'connected'));

      const tablesRes = await api.getTables();
      if (tablesRes.tables && Object.keys(tablesRes.tables).length > 0) {
        setTables(tablesRes.tables);

        // Populate sovereign metadata registry
        if (tablesRes.metadata && tablesRes.metadata.length > 0) {
          setTableMetadata(tablesRes.metadata);
        } else {
          try {
            const metaRes = await api.getRecords('tables');
            if (metaRes.records) setTableMetadata(metaRes.records as any);
          } catch {}
        }

        // Populate sovereign table groups taxonomy
        if (tablesRes.groups && tablesRes.groups.length > 0) {
          setGroups(tablesRes.groups);
        } else {
          try {
            const grpRes = await api.getGroups();
            if (grpRes.groups) setGroups(grpRes.groups);
          } catch {}
        }

        // Populate sovereign persistent table states
        if (tablesRes.states) {
          setTableStates(tablesRes.states);
        }

        const tableKeys = Object.keys(tablesRes.tables);
        const dataKeys = tableKeys.filter((k) => k !== 'tables');
        const targetTable = tableKeys.includes(activeTableName)
          ? activeTableName
          : dataKeys[0] || tableKeys[0];
        setActiveTableName(targetTable);
        // Only load records for the active table initially
        await loadRecords(targetTable, true);

        // Preload remaining tables asynchronously in background (0ms tab transitions across all tables)
        const otherTables = dataKeys.filter((k) => k !== targetTable);
        otherTables.forEach((tbl) => {
          api.getRecords(tbl).then((res) => {
            if (res.records) {
              setTableRecords((prev) => ({ ...prev, [tbl]: res.records }));
              setRecordCounts((prev) => ({ ...prev, [tbl]: res.count || res.records.length || 0 }));
              syncTableToRelationStore(tbl, res.records);
            }
          }).catch(() => {});
        });
      }
      showToast('Turso database synchronized');
    } catch (err: any) {
      console.error(err);
      setIsConnected(false);
      showToast(`API: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const checkAuthAndLoad = async () => {
    setIsSyncing(true);
    try {
      const auth = await api.verifyAuth();
      if (auth.required && !auth.authorized) {
        setIsLocked(true);
        setIsSyncing(false);
        return;
      }
      setIsLocked(false);
      await refreshAll();
    } catch {
      setIsLocked(true);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const magicKey = checkUrlKey();
    if (magicKey) setInitialUrlKey(magicKey);
    checkAuthAndLoad();

    const handleAuthRequired = () => setIsLocked(true);
    window.addEventListener('pk_auth_required', handleAuthRequired);
    return () => window.removeEventListener('pk_auth_required', handleAuthRequired);
  }, []);

  const handleSelectTable = async (name: string) => {
    if (name === activeTableName) return;
    await autoSaveBeforeTabSwitch(activeTableName);
    setActiveTableName(name);
    // Instantaneous 0ms switch if already loaded into RAM; only curl if brand new
    if (tableRecords[name] === undefined) {
      await loadRecords(name);
    }
  };

  const handleSetMode = async (nextMode: 'schema' | 'data') => {
    if (mode === 'schema' && nextMode === 'data') {
      await autoSaveBeforeTabSwitch(activeTableName);
    }
    setMode(nextMode);
  };

  const handleOpenAddTableWithGroup = (groupId?: string) => {
    setDefaultNewTableGroupId(groupId || null);
    setNewTableModalOpen(true);
  };

  // Group Logic: Create Group
  const handleAddGroup = async (parentGroupId?: string) => {
    const naturalName = window.prompt('Enter new group name:');
    if (!naturalName || !naturalName.trim()) return;
    try {
      const res = await api.createGroup({
        natural_name: naturalName.trim(),
        sub_group_of: parentGroupId || null,
      });
      if (res.group) {
        setGroups((prev) => [...prev, res.group]);
        showToast(`Created group "${res.group.natural_name}"`);
      }
    } catch (e: any) {
      showToast(`Group creation failed: ${e.message}`);
    }
  };

  // Project Logic: Create table
  const handleCreateNewTable = async (newTable: { id: string; name: string; group_id: string | null }) => {
    try {
      const res = await api.createNewTable(newTable);
      if (res.table) {
        setTables((prev) => ({ ...prev, [newTable.id]: res.table.schema }));
        setTableMetadata((prev) => [
          ...prev,
          { id: newTable.id, name: newTable.name, parent_id: null, group_id: newTable.group_id }
        ]);
        setActiveTableName(newTable.id);
        await loadRecords(newTable.id, true);
        showToast(`Created table "${newTable.name}"`);
      }
    } catch (e: any) {
      showToast(`Creation failed: ${e.message}`);
      throw e;
    }
  };

  // Project Logic: Update table metadata (natural name, group selector)
  const handleUpdateTableSettings = async (updates: { name: string; group_id: string | null }) => {
    try {
      await api.updateTableMeta(activeTableName, updates);
      setTableMetadata((prev) =>
        prev.map((m) => (m.id === activeTableName ? { ...m, ...updates } : m))
      );
      showToast(`Saved settings for "${updates.name}"`);
    } catch (e: any) {
      showToast(`Update failed: ${e.message}`);
      throw e;
    }
  };

  // Drag & Drop: Move Table into a group or to root
  const handleMoveTable = async (tableId: string, targetGroupId: string | null) => {
    // 0ms Optimistic RAM update
    setTableMetadata((prev) =>
      prev.map((m) => (m.id === tableId ? { ...m, group_id: targetGroupId } : m))
    );
    try {
      await api.updateTableMeta(tableId, { group_id: targetGroupId });
      const targetGroup = groups.find((g) => g.id === targetGroupId);
      showToast(targetGroup ? `Moved table into "${targetGroup.natural_name}"` : 'Moved table to Root');
    } catch (e: any) {
      showToast(`Move failed: ${e.message}`);
      await refreshAll();
    }
  };

  // Drag & Drop: Move Group into a parent group or to root
  const handleMoveGroup = async (groupId: string, targetParentGroupId: string | null) => {
    // 0ms Optimistic RAM update
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, sub_group_of: targetParentGroupId } : g))
    );
    try {
      await api.updateGroup(groupId, { sub_group_of: targetParentGroupId });
      const parent = groups.find((g) => g.id === targetParentGroupId);
      showToast(parent ? `Nested group under "${parent.natural_name}"` : 'Moved group to Root');
    } catch (e: any) {
      showToast(`Group move failed: ${e.message}`);
      await refreshAll();
    }
  };

  // Project Logic: Delete table
  const handleDeleteTable = async (tableName: string) => {
    try {
      await api.deleteTable(tableName);
      setTables((prev) => {
        const next = { ...prev };
        delete next[tableName];
        return next;
      });
      setTableRecords((prev) => {
        const next = { ...prev };
        delete next[tableName];
        return next;
      });
      setTableMetadata((prev) => prev.filter((m) => m.id !== tableName));
      showToast(`Deleted table "${tableName}"`);
      const remaining = Object.keys(tables).filter((k) => k !== tableName && k !== 'tables');
      if (remaining.length > 0) {
        setActiveTableName(remaining[0]);
        if (tableRecords[remaining[0]] === undefined) {
          await loadRecords(remaining[0]);
        }
      }
    } catch (e: any) {
      showToast(`Delete failed: ${e.message}`);
      throw e;
    }
  };

  const handleSaveSchema = async (updated: TableSchema) => {
    await saveTable(updated.table_name, updated.columns);
  };

  const handleSaveTableState = async (tableName: string, stateUpdate: Partial<TableState>) => {
    setTableStates((prev) => {
      const existing = prev[tableName] || { table_name: tableName };
      return { ...prev, [tableName]: { ...existing, ...stateUpdate } };
    });
    try {
      await api.saveTableState(tableName, stateUpdate);
    } catch (e: any) {
      console.warn(`Failed to persist table state for ${tableName}:`, e);
    }
  };

  // RAM-First Optimistic Save with Field-Level Dirty Diff
  // RAM-First Optimistic Save with Field-Level Dirty Diff
  const handleSaveRecord = async (formData: Partial<TableRecord>) => {
    setIsSaving(true);
    try {
      if (formData.id && records.some((r) => r.id === formData.id)) {
        // Extract only changed dirty fields to avoid overwriting concurrent edits
        const existing = records.find((r) => r.id === formData.id);
        const dirtyDiff: Record<string, any> = {};
        for (const k of Object.keys(formData)) {
          if (formData[k] !== existing?.[k]) {
            dirtyDiff[k] = formData[k];
          }
        }
        // Update in RAM immediately (0ms)
        setTableRecords((prev) => ({
          ...prev,
          [activeTableName]: (prev[activeTableName] || []).map((r) => (r.id === formData.id ? { ...r, ...formData } : r)),
        }));
        setRelationStore((prev) => {
          const currentTable = prev[activeTableName] || {};
          const updatedRec = { ...(currentTable[formData.id as string] || {}), ...formData };
          return { ...prev, [activeTableName]: { ...currentTable, [formData.id as string]: updatedRec as TableRecord } };
        });
        if (activeTableName === 'tables') {
          setTableMetadata((prev) => prev.map((m) => (m.id === formData.id ? { ...m, ...formData } : m)));
        }
        
        // Push only dirty diff to Turso
        if (Object.keys(dirtyDiff).length > 0) {
          await api.updateRecord(activeTableName, formData.id, dirtyDiff);
        }
        setLastSavedTime(new Date());
        const changedCols = Object.keys(dirtyDiff)
          .map((k) => currentSchema.columns.find((c) => c.slug === k)?.name || k)
          .join(', ');
        const recSummary = formatRecordSummary(existing, formData.id);
        notify('saved', `Saved changes: ${changedCols || 'all fields'}`, `${activeTableName} • ${recSummary}`);
      } else {
        const res = await api.createRecord(activeTableName, formData);
        setTableRecords((prev) => ({
          ...prev,
          [activeTableName]: [res.record, ...(prev[activeTableName] || [])],
        }));
        setRecordCounts((prev) => ({ ...prev, [activeTableName]: (prev[activeTableName] || 0) + 1 }));
        setRelationStore((prev) => {
          const currentTable = prev[activeTableName] || {};
          return { ...prev, [activeTableName]: { ...currentTable, [res.record.id]: res.record } };
        });
        if (activeTableName === 'tables') {
          setTableMetadata((prev) => [...prev, res.record as unknown as TableMetaRecord]);
          // Pull new schema definition created on backend
          const fresh = await api.getTables();
          if (fresh.tables) setTables(fresh.tables);
        }
        setLastSavedTime(new Date());
        const recSummary = formatRecordSummary(res.record, res.record?.id);
        notify('saved', `Created record "${recSummary}"`, `${activeTableName} • #${res.record?.id || 'new'}`);
      }
    } catch (e: any) {
      notify('error', `Save failed: ${e.message}`, activeTableName);
      throw e;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    const targetRec = records.find((r) => r.id === id);
    const recSummary = formatRecordSummary(targetRec, id);

    // Optimistic deletion in RAM
    setTableRecords((prev) => ({
      ...prev,
      [activeTableName]: (prev[activeTableName] || []).filter((r) => r.id !== id),
    }));
    setRecordCounts((prev) => ({ ...prev, [activeTableName]: Math.max(0, (prev[activeTableName] || 1) - 1) }));
    setRelationStore((prev) => {
      if (!prev[activeTableName]) return prev;
      const nextTable = { ...prev[activeTableName] };
      delete nextTable[id];
      return { ...prev, [activeTableName]: nextTable };
    });
    setRelationOptions((prev) => {
      if (!prev[activeTableName]) return prev;
      return { ...prev, [activeTableName]: prev[activeTableName].filter((o) => o.id !== id) };
    });
    if (activeTableName === 'tables') {
      setTableMetadata((prev) => prev.filter((m) => m.id !== id));
      setTables((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setTableRecords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    try {
      await api.deleteRecord(activeTableName, id);
      notify('deleted', `Deleted "${recSummary}"`, `${activeTableName} • #${id}`);
    } catch (e: any) {
      notify('error', `Delete failed: ${e.message}`, `${activeTableName} • #${id}`);
      await loadRecords(activeTableName, true);
    }
  };

  // Discrete Field-Level Inline Update
  const handleInlineUpdate = async (id: string, field: string, value: any) => {
    const col = currentSchema.columns.find((c) => c.slug === field);
    const colName = col?.name || field;
    const displayVal = formatValueForDisplay(value);
    const targetRec = records.find((r) => r.id === id);
    const recSummary = formatRecordSummary(targetRec, id);

    // 0ms RAM update
    setTableRecords((prev) => ({
      ...prev,
      [activeTableName]: (prev[activeTableName] || []).map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }));
    setRelationStore((prev) => {
      const currentTable = prev[activeTableName] || {};
      const updatedRec = { ...(currentTable[id] || {}), [field]: value };
      return { ...prev, [activeTableName]: { ...currentTable, [id]: updatedRec as TableRecord } };
    });
    if (activeTableName === 'tables') {
      setTableMetadata((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
    }
    try {
      // Send discrete field diff to Turso
      await api.updateRecord(activeTableName, id, { [field]: value });
      setLastSavedTime(new Date());
      notify('saved', `Saved "${colName}" → "${displayVal}"`, `${activeTableName} • ${recSummary}`);
    } catch (e: any) {
      notify('error', `Update failed: ${e.message}`, `${activeTableName} • #${id}`);
      await loadRecords(activeTableName, true);
    }
  };

  // Auto-save flat row reorders to Turso immediately without unsaved changes banner
  const handleAutoReorderRecords = async (tableName: string, newRecs: TableRecord[]) => {
    setTableRecords((prev) => ({ ...prev, [tableName]: newRecs }));
    const schemaCols = tables[tableName]?.columns || [];
    if (schemaCols.some((c) => c.slug === 'idx')) {
      for (let i = 0; i < newRecs.length; i++) {
        const r = newRecs[i];
        const newIdx = i + 1;
        if (r.idx !== newIdx) {
          api.updateRecord(tableName, r.id, { idx: newIdx }).catch(() => {});
        }
      }
      setLastSavedTime(new Date());
      notify('changed', `Saved row order`, `${tableName} (${newRecs.length} rows)`);
    }
  };

  // Notion-Style: Pure Inline Row Creation (Zero Popups)
  const handleAddNewRow = async (): Promise<TableRecord | null> => {
    const idCol = currentSchema.columns.find((c) => c.slug === 'id');
    const prefix = idCol?.metadata?.prefix || activeTableName;
    const newId = generateHexId(prefix, activeTableName);
    const newRecord: TableRecord = { id: newId };

    (currentSchema.columns || []).forEach((col) => {
      if (col.slug === 'id') return;
      if (col.slug === 'date') {
        newRecord.date = new Date().toISOString().split('T')[0];
      } else if (col.slug === 'tag') {
        newRecord.tag = newId;
      } else if (col.slug === 'name') {
        newRecord.name = newId;
      } else if (col.slug === 'group_id') {
        newRecord.group_id = 'forehead_accents';
      } else if (col.type === 'relation_multi' || col.type === 'enum_multi') {
        newRecord[col.slug] = [];
      }
    });

    if (currentSchema.columns.some((c) => c.slug === 'idx')) {
      const maxIdx = records.reduce((max, r) => Math.max(max, Number(r.idx) || 0), 0);
      newRecord.idx = maxIdx + 1;
    }

    // 0ms Optimistic RAM update
    setTableRecords((prev) => ({
      ...prev,
      [activeTableName]: [...(prev[activeTableName] || []), newRecord],
    }));
    setRecordCounts((prev) => ({ ...prev, [activeTableName]: (prev[activeTableName] || 0) + 1 }));
    setRelationStore((prev) => {
      const currentTable = prev[activeTableName] || {};
      return { ...prev, [activeTableName]: { ...currentTable, [newId]: newRecord } };
    });

    try {
      await api.createRecord(activeTableName, newRecord);
      setLastSavedTime(new Date());
      notify('saved', `Created row #${newId}`, activeTableName);
      return newRecord;
    } catch (e: any) {
      notify('error', `Row creation error: ${e.message}`, activeTableName);
      await loadRecords(activeTableName, true);
      return null;
    }
  };

  const openDrawerForRecord = (record: TableRecord | null) => {
    setSelectedRecord(record);
    // Lazily load relations required by this table's schema only when drawer opens
    (currentSchema.columns || [])
      .filter((c) => c.type === 'relation_single' || c.type === 'relation_multi')
      .forEach((c) => {
        if (c.metadata?.target) ensureRelationLoaded(c.metadata.target);
        if (c.metadata?.secondary_target) ensureRelationLoaded(c.metadata.secondary_target);
      });
    setDrawerOpen(true);
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveApp(resolveActiveSubdomain());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSwitchToHazard = useCallback(() => {
    setActiveApp('hazard');
    navigateToSubdomain('hazard');
  }, []);

  const handleSwitchToPrompt = useCallback(() => {
    setActiveApp('prompt');
    navigateToSubdomain('prompt');
  }, []);

  const handleSwitchToPk = useCallback(() => {
    setActiveApp('pk');
    navigateToSubdomain('pk');
  }, []);

  const handleSwitchToHair = useCallback(() => {
    setActiveApp('hair');
    navigateToSubdomain('hair');
  }, []);

  const handleSwitchToFacet = useCallback(() => {
    setActiveApp('facet');
    navigateToSubdomain('facet');
  }, []);

  if (activeApp === 'facet') {
    return (
      <FacetCodexApp
        onSwitchToPk={handleSwitchToPk}
        onSwitchToHazard={handleSwitchToHazard}
        onSwitchToPrompt={handleSwitchToPrompt}
        onSwitchToHair={handleSwitchToHair}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeApp === 'hair') {
    return (
      <HairCodexApp
        onSwitchToPk={handleSwitchToPk}
        onSwitchToHazard={handleSwitchToHazard}
        onSwitchToPrompt={handleSwitchToPrompt}
        onSwitchToFacet={handleSwitchToFacet}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeApp === 'hazard') {
    return (
      <HazardTriggerApp
        onSwitchToPk={handleSwitchToPk}
        onSwitchToPrompt={handleSwitchToPrompt}
        onSwitchToHair={handleSwitchToHair}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (activeApp === 'prompt') {
    return (
      <PromptStudioApp
        onSwitchToPk={handleSwitchToPk}
        onSwitchToHazard={handleSwitchToHazard}
        onSwitchToHair={handleSwitchToHair}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="app-container">
      <Header
        mode={mode}
        setMode={handleSetMode}
        isConnected={isConnected}
        isSyncing={isSyncing}
        onSync={refreshAll}
        onOpenAuth={() => setAuthModalOpen(true)}
        hasAuthKey={Boolean(getAuthKey())}
        theme={theme}
        toggleTheme={toggleTheme}
        onNewRecord={handleAddNewRow}
        isMobile={isMobile}
        onToggleOutliner={() => setOutlinerOpen((prev) => !prev)}
        isOutlinerOpen={outlinerOpen}
        onSwitchToHazard={handleSwitchToHazard}
        onSwitchToPrompt={handleSwitchToPrompt}
        onSwitchToHair={handleSwitchToHair}
      />

      <TableTabs
        tables={tables}
        activeTable={activeTableName}
        onSelectTable={handleSelectTable}
        onAddTable={() => handleOpenAddTableWithGroup(undefined)}
        onOpenTableSettings={() => setTableSettingsOpen(true)}
        recordCounts={recordCounts}
        tableMetadata={tableMetadata}
        groups={groups}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <WorkspaceOutliner
          isOpen={outlinerOpen}
          onClose={() => setOutlinerOpen(false)}
          groups={groups}
          tables={tables}
          tableMetadata={tableMetadata}
          activeTable={activeTableName}
          onSelectTable={(id) => {
            handleSelectTable(id);
            if (isMobile) setOutlinerOpen(false);
          }}
          onAddTable={(groupId) => handleOpenAddTableWithGroup(groupId)}
          onAddGroup={handleAddGroup}
          onMoveTable={handleMoveTable}
          onMoveGroup={handleMoveGroup}
          recordCounts={recordCounts}
          isMobile={isMobile}
        />

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', minWidth: 0 }}>
          {mode === 'schema' ? (
            <SchemaView
              schema={currentSchema}
              availableTables={Object.keys(tables)}
              tables={tables}
              relationStore={relationStore}
              draftColumns={draftSchemas[activeTableName]}
              onColumnsChange={(cols) => handleColumnsChange(activeTableName, cols)}
              onSaveSchema={handleSaveSchema}
              isSaving={isSaving}
              isMobile={isMobile}
            />
          ) : isMobile ? (
            <MobileCardView
              schema={currentSchema}
              records={records}
              onSelectRecord={(r) => openDrawerForRecord(r)}
              onNewRecord={handleAddNewRow}
              onDeleteRecord={handleDeleteRecord}
              isLoading={isSyncing}
              relationStore={relationStore}
            />
          ) : (
            <DataGrid
              schema={currentSchema}
              records={records}
              onSelectRecord={(r) => openDrawerForRecord(r)}
              onNewRecord={handleAddNewRow}
              onDeleteRecord={handleDeleteRecord}
              onInlineUpdate={handleInlineUpdate}
              onReorderRecords={(newRecs) => handleAutoReorderRecords(activeTableName, newRecs)}
              isLoading={isSyncing}
              relationOptions={relationOptions}
              relationStore={relationStore}
              tables={tables}
              onEnsureRelation={ensureRelationLoaded}
              onSaveSchema={handleSaveSchema}
              tableState={tableStates[activeTableName]}
              onSaveTableState={(st) => handleSaveTableState(activeTableName, st)}
            />
          )}
        </main>
      </div>

      <MobileRecordDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        schema={currentSchema}
        record={selectedRecord}
        onSave={handleSaveRecord}
        onDelete={handleDeleteRecord}
        isSaving={isSaving}
        relationOptions={relationOptions}
        relationStore={relationStore}
        allRecords={records}
      />

      <TableSettingsModal
        isOpen={tableSettingsOpen}
        onClose={() => setTableSettingsOpen(false)}
        tableId={activeTableName}
        tableMeta={tableMetadata.find((m) => m.id === activeTableName)}
        availableGroups={groups}
        onSave={handleUpdateTableSettings}
        onDelete={handleDeleteTable}
      />

      <NewTableModal
        isOpen={newTableModalOpen}
        onClose={() => setNewTableModalOpen(false)}
        availableGroups={groups}
        defaultGroupId={defaultNewTableGroupId}
        onCreate={handleCreateNewTable}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSaved={refreshAll}
      />

      {isLocked && (
        <VaultGate
          initialKey={initialUrlKey}
          onUnlocked={() => {
            setIsLocked(false);
            refreshAll();
            showToast('Vault unlocked. Edge connected.');
          }}
        />
      )}

      <SaveStatusNotification
        isSaving={isSaving}
        isSyncing={isSyncing}
        lastSavedTime={lastSavedTime}
        unsavedChanges={unsavedChanges}
        recentActivity={recentActivity}
        lastAction={lastAction}
        onSaveAll={saveAll}
        onDiscardAll={() => {
          discardAll();
          loadRecords(activeTableName, true);
        }}
      />

      <ActionToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
};
