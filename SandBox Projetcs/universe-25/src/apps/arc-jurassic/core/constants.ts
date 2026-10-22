// path: src/apps/arc-jurassic/core/constants.ts
/**
 * Root directory for static data of Jurassic game.
 * In Universe 25, we load static JSON files from the data directory.
 */
export const ARC_DATA_ROOT = "./data";

export const JURA_VAULT_PATHS = {
    // Static data files
    RESOURCE: `${ARC_DATA_ROOT}/resource.json`,
    DINO_OBJECTS: `${ARC_DATA_ROOT}/dino.json`,
    LOOKUP: `${ARC_DATA_ROOT}/lookup.json`,
    // User progress and resources are stored in Zustand store and persisted to backend/localStorage
    USER_PROGRESS: "", // Not used as a static file
} as const;