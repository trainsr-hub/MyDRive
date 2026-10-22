import { App, normalizePath } from 'obsidian';
import { ComponentEntry } from './componentScanner';

function validateHierarchyName(name: string): string | null {
  const value = name.trim();
  if (!value) return 'A name is required.';
  if (value.length > 120) return 'Names must be 120 characters or fewer.';
  if (/[<>:"/\\|?*\x00-\x1F]/.test(value) || /[. ]$/.test(value)) {
    return 'Names cannot contain path or Windows-reserved characters, or end in a space/period.';
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value)) return 'That name is reserved by Windows.';
  return null;
}

export class ComponentManager {
  /**
   * Sanitizes a ComponentEntry to strictly conform to the clean V2 schema,
   * removing any obsolete legacy keys (keywords, require, negate, exclude, inherit, etc.).
   */
  public static sanitizeEntry(raw: any): ComponentEntry {
    const clean: ComponentEntry = {
      display_name: raw.display_name || '',
      prompt: raw.prompt || '',
    };

    if (raw.image && typeof raw.image === 'string' && raw.image.trim()) {
      clean.image = raw.image.trim();
    }

    if (Array.isArray(raw.tag_team) && raw.tag_team.length > 0) {
      clean.tag_team = raw.tag_team.filter(Boolean);
    }

    const antiPrompt =
      typeof raw['anti-prompt'] === 'string'
        ? raw['anti-prompt'].trim()
        : Array.isArray(raw.exclude)
        ? raw.exclude.join(', ').trim()
        : '';
    if (antiPrompt) {
      clean['anti-prompt'] = antiPrompt;
    }

    const requirements = Array.isArray(raw.requirement)
      ? raw.requirement.filter(Boolean)
      : Array.isArray(raw.require)
      ? raw.require.filter(Boolean)
      : [];
    if (requirements.length > 0) {
      clean.requirement = requirements;
    }

    const impacts = Array.isArray(raw.impact)
      ? raw.impact.filter(Boolean)
      : Array.isArray(raw.keywords)
      ? raw.keywords.filter(Boolean)
      : [];
    if (impacts.length > 0) {
      clean.impact = impacts;
    }

    if (raw.completed === true) {
      clean.completed = true;
    }

    if (raw.visible === false) {
      clean.visible = false;
    }

    if (Array.isArray(raw.subjects) && raw.subjects.length >= 2) {
      clean.subjects = [Number(raw.subjects[0]) || 0, Number(raw.subjects[1]) || 0];
    }

    if (raw.description && typeof raw.description === 'string' && raw.description.trim()) {
      clean.description = raw.description.trim();
    }

    return clean;
  }

  /**
   * Resolves the full vault path for a given component file relative path.
   */
  public static resolveFullPath(relPath: string): string {
    const clean = normalizePath(relPath).replace(/\\/g, '/');
    if (clean.startsWith('Hazard_Trigger_Data/')) {
      return clean;
    }
    if (clean.startsWith('Matrices/')) {
      return normalizePath(`Hazard_Trigger_Data/${clean}`).replace(/\\/g, '/');
    }
    return normalizePath(`Hazard_Trigger_Data/Components/${clean}`).replace(/\\/g, '/');
  }

  /**
   * Overwrites the entire JSON file with the full set of sanitized entries (batch table commit).
   */
  public static async saveAllFileEntries(
    app: App,
    fileRelPath: string,
    entries: Record<string, ComponentEntry>
  ): Promise<boolean> {
    const adapter = app.vault.adapter;
    const targetPath = this.resolveFullPath(fileRelPath);

    try {
      // Ensure parent directory exists
      const lastSlash = targetPath.lastIndexOf('/');
      if (lastSlash > 0) {
        const parentDir = targetPath.substring(0, lastSlash);
        if (!(await adapter.exists(parentDir))) {
          await adapter.mkdir(parentDir);
        }
      }

      // Sanitize all entries to pristine clean schema
      const sanitizedEntries: Record<string, ComponentEntry> = {};
      Object.entries(entries).forEach(([k, v]) => {
        sanitizedEntries[k] = this.sanitizeEntry(v);
      });

      await adapter.write(targetPath, JSON.stringify(sanitizedEntries, null, 2));
      return true;
    } catch (err) {
      console.error(`[ComponentManager] Failed to write file ${targetPath}:`, err);
      return false;
    }
  }

  /**
   * Saves, creates, or updates a single component option entry in a JSON file.
   * If oldKey is provided and different from newKey, oldKey will be removed (rename support).
   */
  public static async saveEntry(
    app: App,
    fileRelPath: string,
    newKey: string,
    entryData: ComponentEntry,
    oldKey?: string
  ): Promise<boolean> {
    const adapter = app.vault.adapter;
    const targetPath = this.resolveFullPath(fileRelPath);

    try {
      let existingEntries: Record<string, ComponentEntry> = {};

      if (await adapter.exists(targetPath)) {
        const raw = await adapter.read(targetPath);
        existingEntries = JSON.parse(raw);
      }

      // If renaming, remove old key
      if (oldKey && oldKey !== newKey && existingEntries[oldKey] !== undefined) {
        delete existingEntries[oldKey];
      }

      // Sanitize and set new entry
      existingEntries[newKey] = this.sanitizeEntry(entryData);

      // Sanitize all other existing entries as well
      const sanitizedEntries: Record<string, ComponentEntry> = {};
      Object.entries(existingEntries).forEach(([k, v]) => {
        sanitizedEntries[k] = this.sanitizeEntry(v);
      });

      // Write back formatted JSON
      await adapter.write(targetPath, JSON.stringify(sanitizedEntries, null, 2));
      return true;
    } catch (err) {
      console.error(`[ComponentManager] Failed to save entry to ${targetPath}:`, err);
      return false;
    }
  }

  /**
   * Deletes a component option entry from a JSON file.
   */
  public static async deleteEntry(
    app: App,
    fileRelPath: string,
    keyToDelete: string
  ): Promise<boolean> {
    const adapter = app.vault.adapter;
    const targetPath = this.resolveFullPath(fileRelPath);

    try {
      if (!(await adapter.exists(targetPath))) return false;

      const raw = await adapter.read(targetPath);
      const existingEntries: Record<string, ComponentEntry> = JSON.parse(raw);

      if (existingEntries[keyToDelete] !== undefined) {
        delete existingEntries[keyToDelete];
        await adapter.write(targetPath, JSON.stringify(existingEntries, null, 2));
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[ComponentManager] Failed to delete entry from ${targetPath}:`, err);
      return false;
    }
  }

  /** Creates a category folder directly below Components/. */
  public static async createCategoryFolder(app: App, name: string): Promise<string | null> {
    const issue = validateHierarchyName(name);
    if (issue) throw new Error(issue);
    const relPath = name.trim();
    const targetPath = this.resolveFullPath(relPath);
    if (await app.vault.adapter.exists(targetPath)) throw new Error('A component category with that name already exists.');
    await app.vault.adapter.mkdir(targetPath);
    return relPath;
  }

  /** Renames a category folder while retaining every child table. */
  public static async renameCategoryFolder(app: App, oldRelPath: string, name: string): Promise<string | null> {
    const issue = validateHierarchyName(name);
    if (issue) throw new Error(issue);
    const oldPath = this.resolveFullPath(oldRelPath);
    const newRelPath = name.trim();
    const targetPath = this.resolveFullPath(newRelPath);
    if (oldPath === targetPath) return oldRelPath;
    if (await app.vault.adapter.exists(targetPath)) throw new Error('A component category with that name already exists.');
    await app.vault.adapter.rename(oldPath, targetPath);
    return newRelPath;
  }

  /** Renames one component JSON table while retaining its entries. */
  public static async renameComponentFile(app: App, fileRelPath: string, name: string): Promise<string | null> {
    const baseName = name.trim().replace(/\.json$/i, '');
    const issue = validateHierarchyName(baseName);
    if (issue) throw new Error(issue);
    const folder = fileRelPath.slice(0, fileRelPath.lastIndexOf('/'));
    const newRelPath = `${folder}/${baseName}.json`;
    const sourcePath = this.resolveFullPath(fileRelPath);
    const targetPath = this.resolveFullPath(newRelPath);
    if (sourcePath === targetPath) return fileRelPath;
    if (await app.vault.adapter.exists(targetPath)) throw new Error('A component table with that name already exists.');
    await app.vault.adapter.rename(sourcePath, targetPath);
    return newRelPath;
  }

  /**
   * Creates a brand new component JSON file.
   */
  public static async createComponentFile(
    app: App,
    folderRelPath: string,
    fileName: string,
    displayName?: string
  ): Promise<string | null> {
    const adapter = app.vault.adapter;
    const sanitizedFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    const folderPath = this.resolveFullPath(folderRelPath);
    const targetFilePath = normalizePath(`${folderPath}/${sanitizedFileName}`).replace(/\\/g, '/');

    try {
      if (!(await adapter.exists(folderPath))) {
        await adapter.mkdir(folderPath);
      }

      if (await adapter.exists(targetFilePath)) {
        return targetFilePath; // Already exists
      }

      // Write initial empty entries JSON
      await adapter.write(targetFilePath, JSON.stringify({}, null, 2));
      return targetFilePath;
    } catch (err) {
      console.error(`[ComponentManager] Failed to create file at ${targetFilePath}:`, err);
      return null;
    }
  }
}
