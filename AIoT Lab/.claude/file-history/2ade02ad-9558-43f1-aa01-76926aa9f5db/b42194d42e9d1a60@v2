import { App, normalizePath } from 'obsidian';
import {
  TopologyData,
  TopologySubTable,
  TagGroupsTable,
  ConditionGroupsTable,
  ConditionCompositionTable,
  ClothingLayersTable,
  GenericTopologyTable,
  TopologyFileInfo,
} from '../types/topology';

export const TOPOLOGY_DIR = 'Hazard_Trigger_Data/Topology';
export const TOPOLOGY_TREE_DIR = 'Hazard_Trigger_Data/Topology/Tree';
export const TOPOLOGY_TABLES_DIR = 'Hazard_Trigger_Data/Topology/Tables';
export const TAG_GROUPS_PATH = 'Hazard_Trigger_Data/Topology/Tree/_1_groups.json';
export const CONDITION_GROUPS_PATH = 'Hazard_Trigger_Data/Topology/Tables/_2_condition_affect.json';
export const CONDITION_COMPOSITION_PATH = 'Hazard_Trigger_Data/Topology/Tables/_3_condition_layer.json';
export const CLOTHING_LAYERS_PATH = 'Hazard_Trigger_Data/Topology/Tables/_4_condition_construct.json';

function cleanPath(p: string): string {
  return normalizePath(p).replace(/\\/g, '/');
}

export class TopologyManager {
  /**
   * Ensures the Topology directory and subdirectories exist.
   */
  public static async ensureTopologyFiles(app: App): Promise<void> {
    const adapter = app.vault.adapter;
    const dirs = [cleanPath(TOPOLOGY_DIR), cleanPath(TOPOLOGY_TREE_DIR), cleanPath(TOPOLOGY_TABLES_DIR)];

    for (const dir of dirs) {
      try {
        if (!(await adapter.exists(dir))) {
          await adapter.mkdir(dir);
        }
      } catch (err) {
        console.warn(`[TopologyManager] ensureTopologyFiles notice for ${dir}:`, err);
      }
    }
  }

  /**
   * Dynamically lists all .json topology files from Tree/ and Tables/ subdirectories.
   */
  public static async listTopologyFiles(app: App): Promise<TopologyFileInfo[]> {
    await this.ensureTopologyFiles(app);
    const adapter = app.vault.adapter;
    const results: TopologyFileInfo[] = [];

    // 1. Scan Tree Directory
    try {
      const treeDir = cleanPath(TOPOLOGY_TREE_DIR);
      if (await adapter.exists(treeDir)) {
        const listing = await adapter.list(treeDir);
        for (const filePath of listing.files) {
          if (filePath.toLowerCase().endsWith('.json')) {
            const normalized = cleanPath(filePath);
            const parts = normalized.split('/');
            const fileName = parts[parts.length - 1];
            results.push({
              fileName,
              relPath: normalized,
              subdir: 'tree',
            });
          }
        }
      }
    } catch (err) {
      console.error('[TopologyManager] Error listing Tree files:', err);
    }

    // 2. Scan Tables Directory
    try {
      const tablesDir = cleanPath(TOPOLOGY_TABLES_DIR);
      if (await adapter.exists(tablesDir)) {
        const listing = await adapter.list(tablesDir);
        for (const filePath of listing.files) {
          if (filePath.toLowerCase().endsWith('.json')) {
            const normalized = cleanPath(filePath);
            const parts = normalized.split('/');
            const fileName = parts[parts.length - 1];
            results.push({
              fileName,
              relPath: normalized,
              subdir: 'table',
            });
          }
        }
      }
    } catch (err) {
      console.error('[TopologyManager] Error listing Tables files:', err);
    }

    // Sort files alphabetically by name
    results.sort((a, b) => {
      if (a.subdir !== b.subdir) {
        return a.subdir === 'tree' ? -1 : 1;
      }
      return a.fileName.localeCompare(b.fileName);
    });

    return results;
  }

  /**
   * Loads a generic flat table JSON file dynamically into Record<string, Record<string, any>>.
   */
  public static async loadTableFile(app: App, relPath: string): Promise<GenericTopologyTable> {
    const adapter = app.vault.adapter;
    const p = cleanPath(relPath);

    if (!(await adapter.exists(p))) {
      return {};
    }

    try {
      const raw = await adapter.read(p);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
      }

      const result: GenericTopologyTable = {};
      for (const [key, val] of Object.entries(parsed)) {
        const cleanKey = String(key).trim();
        if (!cleanKey) continue;
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          result[cleanKey] = val as Record<string, any>;
        } else {
          result[cleanKey] = { value: val };
        }
      }
      return result;
    } catch (err) {
      console.error(`[TopologyManager] Error loading table file ${relPath}:`, err);
      return {};
    }
  }

  /**
   * Saves a generic flat table JSON file atomically to disk.
   */
  public static async saveTableFile(
    app: App,
    relPath: string,
    data: GenericTopologyTable
  ): Promise<void> {
    const adapter = app.vault.adapter;
    const p = cleanPath(relPath);

    const cleaned: GenericTopologyTable = {};
    for (const [key, row] of Object.entries(data)) {
      const cleanKey = String(key).trim();
      if (!cleanKey) continue;
      cleaned[cleanKey] = row || {};
    }

    const content = JSON.stringify(cleaned, null, 2);
    await adapter.write(p, content);
  }

  /**
   * Creates a new JSON file in Hazard_Trigger_Data/Topology/Tree or Tables
   */
  public static async createTableFile(
    app: App,
    rawName: string,
    subdir: 'tree' | 'table' = 'table'
  ): Promise<TopologyFileInfo> {
    let cleanName = rawName.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    if (!cleanName.toLowerCase().endsWith('.json')) {
      cleanName += '.json';
    }

    const targetDir = subdir === 'tree' ? TOPOLOGY_TREE_DIR : TOPOLOGY_TABLES_DIR;
    const relPath = cleanPath(`${targetDir}/${cleanName}`);
    const adapter = app.vault.adapter;

    if (!(await adapter.exists(relPath))) {
      await adapter.write(relPath, JSON.stringify({}, null, 2));
    }

    return {
      fileName: cleanName,
      relPath,
      subdir,
    };
  }

  /**
   * Deletes a flat table file from disk.
   */
  public static async deleteTableFile(app: App, relPath: string): Promise<void> {
    const adapter = app.vault.adapter;
    const p = cleanPath(relPath);
    if (await adapter.exists(p)) {
      await adapter.remove(p);
    }
  }

  /**
   * Backwards compatible loader for all 4 initial core tables.
   */
  public static async loadAll(app: App): Promise<TopologyData> {
    await this.ensureTopologyFiles(app);

    const tagGroups = (await this.loadTableFile(app, TAG_GROUPS_PATH)) as TagGroupsTable;
    const conditionGroups = (await this.loadTableFile(app, CONDITION_GROUPS_PATH)) as ConditionGroupsTable;
    const conditionComposition = (await this.loadTableFile(app, CONDITION_COMPOSITION_PATH)) as ConditionCompositionTable;
    const clothingLayers = (await this.loadTableFile(app, CLOTHING_LAYERS_PATH)) as ClothingLayersTable;

    return {
      tagGroups,
      conditionGroups,
      conditionComposition,
      clothingLayers,
    };
  }

  /**
   * Backwards compatible sub-table saver.
   */
  public static async saveSubTable(app: App, subTable: TopologySubTable, data: any): Promise<void> {
    switch (subTable) {
      case 'tag_groups':
        return this.saveTableFile(app, TAG_GROUPS_PATH, data);
      case 'condition_groups':
        return this.saveTableFile(app, CONDITION_GROUPS_PATH, data);
      case 'condition_composition':
        return this.saveTableFile(app, CONDITION_COMPOSITION_PATH, data);
      case 'clothing_layers':
        return this.saveTableFile(app, CLOTHING_LAYERS_PATH, data);
    }
  }
}
