import { App, normalizePath } from 'obsidian';

export interface ComponentEntry {
  display_name: string;
  prompt: string;
  visible?: boolean; // Visibility flag: true (default) = visible as option for Trigger; false = hidden from Trigger
  keywords?: string[];
  require?: string[];
  negate?: string[];
  exclude?: string[];
  inherit?: string[];
  subjects?: [number, number]; // [females, males]
  emotions?: string[];
  postures?: string[]; // Compatible postures (e.g. ['standing', 'sitting', 'chair', 'lying', 'kneeling'])
  locked?: boolean; // Locked option: excluded from standard gacha/random rolls; manual only unless unlocked by template key
  lockKey?: string; // Specific niche lock domain tag (e.g. "extreme", "niche", "custom")
  completed?: boolean; // Completion status: whether this component option has been finalized and verified
  tag_team?: string[]; // Inherited component Hex IDs
  'anti-prompt'?: string; // Local token subtractions
  requirement?: string[]; // Precondition IDs
  impact?: string[]; // State assertion IDs
  [key: string]: any;
}

export interface ComponentFileMetadata {
  displayName?: string;
  description?: string;
  purpose?: string;
  category?: string;
  icon?: string;
  selectionMode?: 'single' | 'multiple' | 'optional' | 'required';
  required?: boolean;
  defaultKey?: string | null;
  order?: number;
  cardinalityNotes?: string;
  completed?: boolean; // Completion status for the entire file
  tags?: string[];
  [key: string]: any;
}

export interface ComponentFolderMetadata {
  displayName?: string;
  description?: string;
  icon?: string;
  order?: number;
  tags?: string[];
  [key: string]: any;
}

export interface ComponentsMetaRegistry {
  version?: string;
  _description?: string;
  folders?: Record<string, ComponentFolderMetadata>;
  files?: Record<string, ComponentFileMetadata>;
}

export interface ComponentFileNode {
  fileName: string;
  displayName: string;
  relPath: string; // e.g. "_01_Subject/1_subjects.json"
  meta?: ComponentFileMetadata;
  entries: Record<string, ComponentEntry>;
}

export interface ComponentFolderNode {
  folderName: string;
  displayName: string;
  relPath: string; // e.g. "_01_Subject"
  meta?: ComponentFolderMetadata;
  files: ComponentFileNode[];
}

export const COMPONENTS_ROOT_DIR = 'Hazard_Trigger_Data/Components';

function cleanPath(p: string): string {
  return normalizePath(p).replace(/\\/g, '/');
}

export class ComponentScanner {
  /**
   * Scans all subfolders and JSON files under Hazard_Trigger_Data/Components/
   * Enriches folders and files with metadata from _components_meta.json
   */
  public static async scanAll(app: App): Promise<ComponentFolderNode[]> {
    const adapter = app.vault.adapter;
    const rootPath = cleanPath(COMPONENTS_ROOT_DIR);
    const rootExists = await adapter.exists(rootPath);

    if (!rootExists) {
      try {
        await adapter.mkdir(rootPath);
      } catch (e) {
        console.warn('[ComponentScanner] Root creation note:', e);
      }
      return [];
    }

    // 1. Load Metadata Registry if available
    let registry: ComponentsMetaRegistry = { folders: {}, files: {} };
    const primaryMetaPath = cleanPath(`${COMPONENTS_ROOT_DIR}/_components_meta.json`);
    const fallbackMetaPath = cleanPath(`${COMPONENTS_ROOT_DIR}/_meta.json`);

    try {
      if (await adapter.exists(primaryMetaPath)) {
        const raw = await adapter.read(primaryMetaPath);
        registry = JSON.parse(raw);
      } else if (await adapter.exists(fallbackMetaPath)) {
        const raw = await adapter.read(fallbackMetaPath);
        registry = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[ComponentScanner] Metadata registry parse warning:', err);
    }

    const listed = await adapter.list(rootPath);
    const folders: ComponentFolderNode[] = [];

    // Sort folders by path initially
    const sortedFolderPaths = [...listed.folders].map(cleanPath).sort();

    for (const folderPath of sortedFolderPaths) {
      const folderName = folderPath.split('/').pop() || folderPath;
      const relFolderPath = folderPath.startsWith(rootPath + '/')
        ? folderPath.slice(rootPath.length + 1)
        : folderName;

      const folderMeta = registry.folders?.[relFolderPath] || registry.folders?.[folderName];

      const folderContents = await adapter.list(folderPath);
      const files: ComponentFileNode[] = [];

      // Sort files in folder, filtering out system/metadata files starting with "_"
      const sortedFilePaths = [...folderContents.files]
        .map(cleanPath)
        .filter((f) => {
          const base = f.split('/').pop() || f;
          return f.endsWith('.json') && !base.startsWith('_');
        })
        .sort();

      for (const filePath of sortedFilePaths) {
        const fileName = filePath.split('/').pop() || filePath;
        const relFilePath = filePath.startsWith(rootPath + '/')
          ? filePath.slice(rootPath.length + 1)
          : `${relFolderPath}/${fileName}`;

        try {
          const raw = await adapter.read(filePath);
          const parsed: Record<string, ComponentEntry> = JSON.parse(raw);

          // Find file metadata with resilient key matching
          const fileMeta =
            registry.files?.[relFilePath] ||
            registry.files?.[fileName] ||
            registry.files?.[relFilePath.replace(/\.json$/i, '')] ||
            registry.files?.[fileName.replace(/\.json$/i, '')];

          // Format clean fallback display name (e.g. "1_subjects.json" -> "Subjects")
          const fallbackCleanName = fileName
            .replace(/\.json$/i, '')
            .replace(/^[_0-9]+/, '')
            .replace(/[-_]/g, ' ')
            .trim();

          const displayName =
            fileMeta?.displayName ||
            (fallbackCleanName.charAt(0).toUpperCase() + fallbackCleanName.slice(1) || fileName);

          files.push({
            fileName,
            displayName,
            relPath: relFilePath,
            meta: fileMeta,
            entries: parsed,
          });
        } catch (err) {
          console.error(`[ComponentScanner] Failed to parse ${filePath}:`, err);
        }
      }

      // Sort files by meta.order, then natural alphanumeric
      files.sort((a, b) => {
        const orderA = typeof a.meta?.order === 'number' ? a.meta.order : 9999;
        const orderB = typeof b.meta?.order === 'number' ? b.meta.order : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
      });

      const fallbackFolderClean = folderName
        .replace(/^[_0-9]+/, '')
        .replace(/[-_]/g, ' ')
        .trim();

      const folderDisplayName =
        folderMeta?.displayName ||
        (fallbackFolderClean.charAt(0).toUpperCase() + fallbackFolderClean.slice(1) || folderName);

      folders.push({
        folderName,
        displayName: folderDisplayName,
        relPath: relFolderPath,
        meta: folderMeta,
        files,
      });
    }

    // Sort folders by meta.order, then natural alphanumeric
    folders.sort((a, b) => {
      const orderA = typeof a.meta?.order === 'number' ? a.meta.order : 9999;
      const orderB = typeof b.meta?.order === 'number' ? b.meta.order : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.folderName.localeCompare(b.folderName, undefined, { numeric: true });
    });

    return folders;
  }
}
