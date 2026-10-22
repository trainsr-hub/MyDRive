import { App, normalizePath } from 'obsidian';
import { HazardTemplate, HazardActiveState, HazardWorkspaceState } from '../types/schema';

export const DATA_FOLDER_PATH = 'Hazard_Trigger_Data';
export const TEMPLATES_FOLDER_PATH = 'Hazard_Trigger_Data/Templates';
export const ACTIVE_STATE_FILE_PATH = 'Hazard_Trigger_Data/active_state.json';
export const LOCKED_OPTIONS_FILE_PATH = 'Hazard_Trigger_Data/locked_options.json';
export const WORKSPACE_STATE_FILE_PATH = 'Hazard_Trigger_Data/workspace_state.json';

function cleanPath(p: string): string {
  return normalizePath(p).replace(/\\/g, '/');
}

export class TemplateManager {
  /**
   * Ensures the data and template folders exist in the vault.
   */
  public static async ensureFolders(app: App): Promise<void> {
    const adapter = app.vault.adapter;
    const dataFolder = cleanPath(DATA_FOLDER_PATH);
    const templatesFolder = cleanPath(TEMPLATES_FOLDER_PATH);

    if (!(await adapter.exists(dataFolder))) {
      try {
        await adapter.mkdir(dataFolder);
      } catch (e) {
        console.warn('[TemplateManager] Data folder creation:', e);
      }
    }

    if (!(await adapter.exists(templatesFolder))) {
      try {
        await adapter.mkdir(templatesFolder);
      } catch (e) {
        console.warn('[TemplateManager] Templates folder creation:', e);
      }
    }
  }

  /**
   * Loads global locked option keys from locked_options.json.
   */
  public static async loadGlobalLockedKeys(app: App): Promise<Record<string, boolean>> {
    const adapter = app.vault.adapter;
    const filePath = cleanPath(LOCKED_OPTIONS_FILE_PATH);

    try {
      if (await adapter.exists(filePath)) {
        const raw = await adapter.read(filePath);
        const data = JSON.parse(raw);
        if (data && typeof data === 'object') {
          return data as Record<string, boolean>;
        }
      }
    } catch (err) {
      console.warn('[TemplateManager] Error loading locked options:', err);
    }
    return {};
  }

  /**
   * Saves global locked option keys to locked_options.json.
   */
  public static async saveGlobalLockedKeys(app: App, keys: Record<string, boolean>): Promise<void> {
    const adapter = app.vault.adapter;
    await this.ensureFolders(app);
    const filePath = cleanPath(LOCKED_OPTIONS_FILE_PATH);

    try {
      await adapter.write(filePath, JSON.stringify(keys, null, 2));
    } catch (err) {
      console.error('[TemplateManager] Failed to save locked options:', err);
    }
  }

  /**
   * Loads the saved active state from active_state.json.
   */
  public static async loadActiveState(app: App): Promise<HazardActiveState | null> {
    const adapter = app.vault.adapter;
    const filePath = cleanPath(ACTIVE_STATE_FILE_PATH);

    try {
      if (await adapter.exists(filePath)) {
        const raw = await adapter.read(filePath);
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && data.selections) {
          return data as HazardActiveState;
        }
      }
    } catch (err) {
      console.warn('[TemplateManager] Error loading active state:', err);
    }
    return null;
  }

  /**
   * Saves the current active choices & template state to active_state.json.
   */
  public static async saveActiveState(app: App, state: HazardActiveState): Promise<void> {
    const adapter = app.vault.adapter;
    await this.ensureFolders(app);
    const filePath = cleanPath(ACTIVE_STATE_FILE_PATH);

    try {
      await adapter.write(filePath, JSON.stringify(state, null, 2));
    } catch (err) {
      console.error('[TemplateManager] Failed to save active state:', err);
    }
  }

  /**
   * Loads the saved workspace UI state from workspace_state.json.
   */
  public static async loadWorkspaceState(app: App): Promise<HazardWorkspaceState | null> {
    const adapter = app.vault.adapter;
    await this.ensureFolders(app);
    const filePath = cleanPath(WORKSPACE_STATE_FILE_PATH);

    try {
      if (await adapter.exists(filePath)) {
        const raw = await adapter.read(filePath);
        const data = JSON.parse(raw);
        if (data && typeof data === 'object' && data.version === 1) {
          return data as HazardWorkspaceState;
        }
      }
    } catch (err) {
      console.warn('[TemplateManager] Error loading workspace state:', err);
    }
    return null;
  }

  /**
   * Saves the workspace UI state to workspace_state.json.
   */
  public static async saveWorkspaceState(app: App, state: HazardWorkspaceState): Promise<void> {
    const adapter = app.vault.adapter;
    await this.ensureFolders(app);
    const filePath = cleanPath(WORKSPACE_STATE_FILE_PATH);

    try {
      await adapter.write(filePath, JSON.stringify({ ...state, updatedAt: Date.now() }, null, 2));
    } catch (err) {
      console.error('[TemplateManager] Failed to save workspace state:', err);
    }
  }

  /**
   * Recursively collects all JSON files under a directory.
   */
  private static async collectJsonFiles(app: App, dirPath: string): Promise<string[]> {
    const adapter = app.vault.adapter;
    const results: string[] = [];

    try {
      if (!(await adapter.exists(dirPath))) return results;
      const listed = await adapter.list(dirPath);

      for (const f of listed.files) {
        if (f.endsWith('.json') && !f.split('/').pop()?.startsWith('_')) {
          results.push(cleanPath(f));
        }
      }

      for (const folder of listed.folders) {
        const subFiles = await this.collectJsonFiles(app, cleanPath(folder));
        results.push(...subFiles);
      }
    } catch (e) {
      console.warn(`[TemplateManager] Error scanning directory ${dirPath}:`, e);
    }

    return results;
  }

  /**
   * Lists all templates saved in Hazard_Trigger_Data/Templates/.
   */
  public static async listTemplates(app: App): Promise<HazardTemplate[]> {
    await this.ensureFolders(app);
    const adapter = app.vault.adapter;
    const templatesFolder = cleanPath(TEMPLATES_FOLDER_PATH);
    const jsonPaths = await this.collectJsonFiles(app, templatesFolder);
    const templates: HazardTemplate[] = [];

    for (const filePath of jsonPaths) {
      try {
        const raw = await adapter.read(filePath);
        const parsed = JSON.parse(raw);
        const fileName = filePath.split('/').pop() || filePath;
        const fallbackName = fileName.replace(/\.json$/i, '').replace(/[-_]/g, ' ');

        // If it conforms to HazardTemplate schema
        if (parsed && typeof parsed === 'object') {
          if (parsed.selections && typeof parsed.selections === 'object') {
            templates.push({
              id: parsed.id || `template_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: parsed.name || fallbackName,
              description: parsed.description || '',
              category: parsed.category || 'General',
              tags: Array.isArray(parsed.tags) ? parsed.tags : [],
              createdAt: parsed.createdAt || Date.now(),
              updatedAt: parsed.updatedAt || Date.now(),
              selections: parsed.selections,
              randomPools: parsed.randomPools || {},
              baseEmotionStates: Array.isArray(parsed.baseEmotionStates)
                ? parsed.baseEmotionStates
                : parsed.baseEmotionState
                ? [parsed.baseEmotionState]
                : [],
              unlockedEmotionPools: Array.isArray(parsed.unlockedEmotionPools)
                ? parsed.unlockedEmotionPools
                : Array.isArray(parsed.activeEmotionStates)
                ? parsed.activeEmotionStates
                : [],
              basePoseStates: Array.isArray(parsed.basePoseStates) ? parsed.basePoseStates : [],
              unlockedPosePools: Array.isArray(parsed.unlockedPosePools) ? parsed.unlockedPosePools : [],
              unlockLockedAll: Boolean(parsed.unlockLockedAll),
              unlockKeys: Array.isArray(parsed.unlockKeys) ? parsed.unlockKeys : [],
              unlockedOptionKeys: Array.isArray(parsed.unlockedOptionKeys) ? parsed.unlockedOptionKeys : [],
              lock: parsed.lock || parsed.locked_options || parsed.lockedRandomSelections || {},
              locked_options: parsed.locked_options || parsed.lock || parsed.lockedRandomSelections || {},
              lockedRandomSelections: parsed.lockedRandomSelections || parsed.lock || parsed.locked_options || {},
              filePath,
            });
          } else {
            // Check if it's a legacy or custom JSON template
            templates.push({
              id: parsed.id || fileName.replace(/\.json$/i, ''),
              name: parsed.name || fallbackName,
              description: parsed.description || parsed.notes || '',
              category: parsed.category || 'Legacy',
              tags: Array.isArray(parsed.tags) ? parsed.tags : [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
              selections: parsed.selections || {},
              randomPools: parsed.randomPools || {},
              baseEmotionStates: [],
              unlockedEmotionPools: [],
              basePoseStates: [],
              unlockedPosePools: [],
              unlockLockedAll: false,
              unlockKeys: [],
              unlockedOptionKeys: [],
              lockedRandomSelections: {},
              filePath,
            });
          }
        }
      } catch (err) {
        console.error(`[TemplateManager] Failed to parse template at ${filePath}:`, err);
      }
    }

    // Sort templates by updated timestamp descending, then name ascending
    templates.sort((a, b) => {
      if (b.updatedAt !== a.updatedAt) return b.updatedAt - a.updatedAt;
      return a.name.localeCompare(b.name);
    });

    return templates;
  }

  /**
   * Saves or updates a template in Hazard_Trigger_Data/Templates/.
   */
  public static async saveTemplate(app: App, template: HazardTemplate): Promise<HazardTemplate> {
    await this.ensureFolders(app);
    const adapter = app.vault.adapter;

    let targetFilePath = template.filePath;
    if (!targetFilePath) {
      const sanitizedName = template.name
        .trim()
        .replace(/[/\\?%*:|"<>]/g, '_')
        .replace(/\s+/g, '_');
      targetFilePath = cleanPath(`${TEMPLATES_FOLDER_PATH}/${sanitizedName}.json`);
    }

    const updatedTemplate: HazardTemplate = {
      ...template,
      updatedAt: Date.now(),
      filePath: targetFilePath,
    };

    const serialized = JSON.stringify(
      {
        id: updatedTemplate.id,
        name: updatedTemplate.name,
        description: updatedTemplate.description,
        category: updatedTemplate.category,
        tags: updatedTemplate.tags,
        createdAt: updatedTemplate.createdAt,
        updatedAt: updatedTemplate.updatedAt,
        selections: updatedTemplate.selections,
        randomPools: updatedTemplate.randomPools || {},
        baseEmotionStates: updatedTemplate.baseEmotionStates || [],
        unlockedEmotionPools: updatedTemplate.unlockedEmotionPools || [],
        basePoseStates: updatedTemplate.basePoseStates || [],
        unlockedPosePools: updatedTemplate.unlockedPosePools || [],
        unlockLockedAll: Boolean(updatedTemplate.unlockLockedAll),
        unlockKeys: updatedTemplate.unlockKeys || [],
        unlockedOptionKeys: updatedTemplate.unlockedOptionKeys || [],
        lock: updatedTemplate.lock || updatedTemplate.locked_options || updatedTemplate.lockedRandomSelections || {},
        locked_options: updatedTemplate.locked_options || updatedTemplate.lock || updatedTemplate.lockedRandomSelections || {},
        lockedRandomSelections: updatedTemplate.lockedRandomSelections || updatedTemplate.lock || updatedTemplate.locked_options || {},
      },
      null,
      2
    );

    await adapter.write(targetFilePath, serialized);
    return updatedTemplate;
  }

  /**
   * Deletes a template file from the vault.
   */
  public static async deleteTemplate(app: App, template: HazardTemplate): Promise<boolean> {
    const adapter = app.vault.adapter;
    if (!template.filePath) return false;

    try {
      if (await adapter.exists(template.filePath)) {
        await adapter.remove(template.filePath);
        return true;
      }
    } catch (err) {
      console.error(`[TemplateManager] Failed to delete template ${template.filePath}:`, err);
    }
    return false;
  }
}
