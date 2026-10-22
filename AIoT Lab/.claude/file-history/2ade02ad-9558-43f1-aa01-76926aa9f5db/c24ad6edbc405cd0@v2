import { App, normalizePath } from 'obsidian';

export interface VisualTraitDefinition {
  label?: string;
  svg?: string;
  gradient?: string;
  borderColor?: string;
  color?: string;
  isIris?: boolean;
  image?: string; // Relative vault path, e.g. "Hazard_Trigger_Data/Assets/eyes/tareme.png"
  resolvedImageUrl?: string;
}

export type VisualTraitPackage = Record<string, VisualTraitDefinition>;

type Listener = () => void;

export class VisualAssetManager {
  public static readonly PACKAGES_DIR = 'Hazard_Trigger_Data/Packages/Visual_Traits';

  private static traitsMap: Record<string, VisualTraitDefinition> = {};
  private static listeners: Set<Listener> = new Set();
  private static isLoaded = false;
  private static appInstance: App | null = null;

  /**
   * Subscribe to asset updates
   */
  public static subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('[VisualAssetManager] Error in listener:', e);
      }
    });
  }

  /**
   * Loads all JSON trait packages from Hazard_Trigger_Data/Packages/Visual_Traits/
   */
  public static async loadPackages(app: App): Promise<Record<string, VisualTraitDefinition>> {
    this.appInstance = app;
    const adapter = app.vault.adapter;
    const dir = normalizePath(this.PACKAGES_DIR);

    const dirExists = await adapter.exists(dir);
    if (!dirExists) {
      try {
        await adapter.mkdir(dir);
      } catch (e) {
        console.warn('[VisualAssetManager] Failed to create packages directory:', e);
      }
      return this.traitsMap;
    }

    try {
      const listing = await adapter.list(dir);
      const newTraitsMap: Record<string, VisualTraitDefinition> = {};

      for (const filePath of listing.files) {
        if (!filePath.endsWith('.json')) continue;

        try {
          const content = await adapter.read(filePath);
          const pkgData: VisualTraitPackage = JSON.parse(content);

          for (const [key, def] of Object.entries(pkgData)) {
            const normalizedKey = key.toLowerCase().trim();
            let resolvedUrl = '';

            if (def.image && def.image.trim()) {
              const imgPath = normalizePath(def.image.trim());
              try {
                if (await adapter.exists(imgPath)) {
                  resolvedUrl = adapter.getResourcePath ? adapter.getResourcePath(imgPath) : '';
                }
              } catch (err) {
                console.warn(`[VisualAssetManager] Failed to resolve image path: ${imgPath}`, err);
              }
            }

            newTraitsMap[normalizedKey] = {
              ...def,
              resolvedImageUrl: resolvedUrl,
            };
          }
        } catch (e) {
          console.warn(`[VisualAssetManager] Failed to parse package file ${filePath}:`, e);
        }
      }

      this.traitsMap = newTraitsMap;
      this.isLoaded = true;
      this.notify();
      return this.traitsMap;
    } catch (e) {
      console.error('[VisualAssetManager] Failed to list packages:', e);
      return this.traitsMap;
    }
  }

  /**
   * Retrieves a trait definition by key
   */
  public static getTrait(key: string): VisualTraitDefinition | undefined {
    const normalizedKey = key.toLowerCase().trim();
    return this.traitsMap[normalizedKey];
  }

  /**
   * Check if packages have loaded
   */
  public static isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Returns all loaded traits
   */
  public static getAllTraits(): Record<string, VisualTraitDefinition> {
    return this.traitsMap;
  }
}
