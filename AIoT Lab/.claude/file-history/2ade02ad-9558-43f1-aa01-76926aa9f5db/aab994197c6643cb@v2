/**
 * Standalone Web Shim for Obsidian API
 * Provides type definitions and mock objects for running Obsidian plugins in standard browser environments.
 */

export interface DataAdapter {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, data: string): Promise<void>;
  list(path: string): Promise<{ files: string[]; folders: string[] }>;
  mkdir(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  remove(path: string): Promise<void>;
  getResourcePath?(path: string): string;
}

export interface Vault {
  adapter: DataAdapter;
}

export interface App {
  vault: Vault;
  workspace?: any;
}

export function normalizePath(path: string): string {
  if (!path) return '';
  return path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\//, '').replace(/\/$/, '');
}

export class Notice {
  constructor(message: string) {
    console.log('[Hazard Notice]', message);
  }
}

export class ItemView {
  contentEl: HTMLElement;
  constructor() {
    this.contentEl = document.createElement('div');
  }
}

export class Plugin {}
export class WorkspaceLeaf {}
