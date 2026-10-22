import { App, normalizePath } from 'obsidian';
import { ConditionEntry } from '../types/schema';

export const CONDITIONS_DIR = 'Hazard_Trigger_Data/Conditions';
export const CONDITIONS_FILE_PATH = 'Hazard_Trigger_Data/Conditions/_00_Core/conditions.json';

export interface ConditionFileNode {
  fileName: string;
  displayName: string;
  relPath: string;
  entries: Record<string, ConditionEntry>;
}

export interface ConditionFolderNode {
  folderName: string;
  displayName: string;
  relPath: string;
  files: ConditionFileNode[];
}

function cleanPath(p: string): string {
  return normalizePath(p).replace(/\\/g, '/');
}

function displayNameFromPath(name: string): string {
  const clean = name
    .replace(/\.json$/i, '')
    .replace(/^[_0-9]+/, '')
    .replace(/[-_]/g, ' ')
    .trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : name;
}

function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return 'A name is required.';
  if (value.length > 120) return 'Names must be 120 characters or fewer.';
  if (/[<>:"/\\|?*\x00-\x1F]/.test(value) || /[. ]$/.test(value)) {
    return 'Names cannot contain path or Windows-reserved characters, or end in a space/period.';
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value)) {
    return 'That name is reserved by Windows.';
  }
  return null;
}

export class ConditionManager {
  /** Sanitizes a ConditionEntry to strictly conform to the clean V2 schema. */
  public static sanitizeCondition(raw: any): ConditionEntry {
    const clean: ConditionEntry = {
      display_name: raw.display_name || 'Unnamed Condition',
      category: raw.category || 'General',
      description: raw.description || '',
    };

    if (raw.completed === true) clean.completed = true;
    if (Array.isArray(raw.tag_team) && raw.tag_team.length > 0) clean.tag_team = raw.tag_team.filter(Boolean);
    if (Array.isArray(raw.conflicts_with) && raw.conflicts_with.length > 0) clean.conflicts_with = raw.conflicts_with.filter(Boolean);
    return clean;
  }

  /** Creates the mirrored Conditions folder structure and safely migrates the legacy root table once. */
  public static async ensureConditionsFolder(app: App): Promise<void> {
    const adapter = app.vault.adapter;
    const root = cleanPath(CONDITIONS_DIR);
    const core = cleanPath(`${CONDITIONS_DIR}/_00_Core`);
    const legacy = cleanPath(`${CONDITIONS_DIR}/conditions.json`);
    const migrated = cleanPath(CONDITIONS_FILE_PATH);

    try {
      if (!(await adapter.exists(root))) await adapter.mkdir(root);
      if (!(await adapter.exists(core))) await adapter.mkdir(core);

      if (await adapter.exists(legacy) && !(await adapter.exists(migrated))) {
        try {
          const raw = await adapter.read(legacy);
          await adapter.write(migrated, raw);
          try {
            await adapter.remove(legacy);
          } catch (delErr) {
            console.warn('[ConditionManager] Legacy conditions.json preserved (remove skipped):', delErr);
          }
        } catch (copyErr) {
          console.warn('[ConditionManager] Migration copy fallback notice:', copyErr);
        }
      }

      if (!(await adapter.exists(migrated)) && !(await adapter.exists(legacy))) {
        await adapter.write(migrated, JSON.stringify({}, null, 2));
      }
    } catch (err) {
      console.warn('[ConditionManager] ensureConditionsFolder notice:', err);
    }
  }

  /** Scans every Conditions/<folder>/<table>.json table. */
  public static async scanAll(app: App): Promise<ConditionFolderNode[]> {
    await this.ensureConditionsFolder(app);
    const adapter = app.vault.adapter;
    const root = cleanPath(CONDITIONS_DIR);
    const folders: ConditionFolderNode[] = [];

    try {
      const listed = await adapter.list(root);

      for (const folderPath of [...listed.folders].map(cleanPath).sort()) {
        const folderName = folderPath.split('/').pop() || folderPath;
        const relPath = folderPath.slice(root.length + 1);
        const content = await adapter.list(folderPath);
        const files: ConditionFileNode[] = [];

        for (const filePath of [...content.files].map(cleanPath).filter((path) => {
          const name = path.split('/').pop() || path;
          return path.endsWith('.json') && !name.startsWith('_');
        }).sort()) {
          try {
            const raw = await adapter.read(filePath);
            const parsed = JSON.parse(raw) as Record<string, ConditionEntry>;
            const fileName = filePath.split('/').pop() || filePath;
            const entries: Record<string, ConditionEntry> = {};
            Object.entries(parsed).forEach(([id, entry]) => (entries[id] = this.sanitizeCondition(entry)));
            files.push({ fileName, displayName: displayNameFromPath(fileName), relPath: `${relPath}/${fileName}`, entries });
          } catch (err) {
            console.error(`[ConditionManager] Failed to parse condition table ${filePath}:`, err);
          }
        }

        folders.push({ folderName, displayName: displayNameFromPath(folderName), relPath, files });
      }
    } catch (err) {
      console.warn('[ConditionManager] scanAll notice:', err);
    }

    return folders;
  }

  /** Loads every condition table into one global registry for condition physics/selectors. */
  public static async loadAllConditions(app: App): Promise<Record<string, ConditionEntry>> {
    const merged: Record<string, ConditionEntry> = {};
    const folders = await this.scanAll(app);
    for (const folder of folders) {
      for (const file of folder.files) {
        Object.entries(file.entries).forEach(([id, entry]) => {
          merged[id] = entry;
        });
      }
    }
    return merged;
  }

  public static async saveConditionFile(app: App, fileRelPath: string, conditions: Record<string, ConditionEntry>): Promise<boolean> {
    await this.ensureConditionsFolder(app);
    const target = cleanPath(`${CONDITIONS_DIR}/${fileRelPath}`);
    try {
      // Ensure parent directory exists
      const lastSlash = target.lastIndexOf('/');
      if (lastSlash > 0) {
        const parentDir = target.substring(0, lastSlash);
        if (!(await app.vault.adapter.exists(parentDir))) {
          await app.vault.adapter.mkdir(parentDir);
        }
      }

      const sanitized: Record<string, ConditionEntry> = {};
      Object.entries(conditions).forEach(([id, entry]) => (sanitized[id] = this.sanitizeCondition(entry)));
      await app.vault.adapter.write(target, JSON.stringify(sanitized, null, 2));
      return true;
    } catch (err) {
      console.error(`[ConditionManager] Failed to write condition table ${target}:`, err);
      return false;
    }
  }

  /** Backwards-compatible default table write. */
  public static async saveAllConditions(app: App, conditions: Record<string, ConditionEntry>): Promise<boolean> {
    return this.saveConditionFile(app, '_00_Core/conditions.json', conditions);
  }

  public static async createConditionCategoryFolder(app: App, name: string): Promise<string | null> {
    await this.ensureConditionsFolder(app);
    const issue = validateName(name);
    if (issue) throw new Error(issue);
    const relPath = name.trim();
    const target = cleanPath(`${CONDITIONS_DIR}/${relPath}`);
    if (await app.vault.adapter.exists(target)) throw new Error('A condition category with that name already exists.');
    await app.vault.adapter.mkdir(target);
    return relPath;
  }

  public static async renameConditionCategoryFolder(app: App, oldRelPath: string, name: string): Promise<string | null> {
    const issue = validateName(name);
    if (issue) throw new Error(issue);
    const oldPath = cleanPath(`${CONDITIONS_DIR}/${oldRelPath}`);
    const newRelPath = name.trim();
    const target = cleanPath(`${CONDITIONS_DIR}/${newRelPath}`);
    if (oldPath === target) return oldRelPath;
    if (await app.vault.adapter.exists(target)) throw new Error('A condition category with that name already exists.');
    await app.vault.adapter.rename(oldPath, target);
    return newRelPath;
  }

  public static async createConditionFile(app: App, folderRelPath: string, name: string): Promise<string | null> {
    const baseName = name.trim().replace(/\.json$/i, '');
    const issue = validateName(baseName);
    if (issue) throw new Error(issue);
    const fileName = `${baseName}.json`;
    const relPath = `${folderRelPath}/${fileName}`;
    const target = cleanPath(`${CONDITIONS_DIR}/${relPath}`);
    if (await app.vault.adapter.exists(target)) throw new Error('A condition file with that name already exists.');
    await app.vault.adapter.write(target, JSON.stringify({}, null, 2));
    return relPath;
  }

  public static async renameConditionFile(app: App, fileRelPath: string, name: string): Promise<string | null> {
    const baseName = name.trim().replace(/\.json$/i, '');
    const issue = validateName(baseName);
    if (issue) throw new Error(issue);
    const folder = fileRelPath.slice(0, fileRelPath.lastIndexOf('/'));
    const newRelPath = `${folder}/${baseName}.json`;
    const source = cleanPath(`${CONDITIONS_DIR}/${fileRelPath}`);
    const target = cleanPath(`${CONDITIONS_DIR}/${newRelPath}`);
    if (source === target) return fileRelPath;
    if (await app.vault.adapter.exists(target)) throw new Error('A condition file with that name already exists.');
    await app.vault.adapter.rename(source, target);
    return newRelPath;
  }

  /** Creates in the default migrated core table for component picker quick-create actions. */
  public static async saveCondition(app: App, id: string, entry: ConditionEntry): Promise<boolean> {
    const folders = await this.scanAll(app);
    const defaultFile = folders.find((folder) => folder.relPath === '_00_Core')?.files.find((file) => file.fileName === 'conditions.json') || folders[0]?.files[0];
    const targetRelPath = defaultFile?.relPath || '_00_Core/conditions.json';
    const entries = { ...(defaultFile?.entries || {}), [id]: this.sanitizeCondition(entry) };
    return this.saveConditionFile(app, targetRelPath, entries);
  }

  public static async deleteCondition(app: App, id: string): Promise<boolean> {
    const folders = await this.scanAll(app);
    for (const folder of folders) {
      for (const file of folder.files) {
        if (file.entries[id]) {
          const entries = { ...file.entries };
          delete entries[id];
          return this.saveConditionFile(app, file.relPath, entries);
        }
      }
    }
    return false;
  }
}
