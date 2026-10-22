import { App, DataAdapter } from '../obsidian-shim';

export class WebStorageAdapter implements DataAdapter {
  private baseUrl: string;

  constructor(baseUrl = '/api/fs') {
    this.baseUrl = baseUrl;
  }

  async exists(path: string): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/exists?path=${encodeURIComponent(path)}`);
      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data.exists);
    } catch {
      return false;
    }
  }

  async read(path: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/read?path=${encodeURIComponent(path)}`);
    if (!res.ok) throw new Error(`Failed to read file: ${path} (status ${res.status})`);
    return await res.text();
  }

  async write(path: string, content: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    });
    if (!res.ok) throw new Error(`Failed to write file: ${path} (status ${res.status})`);
  }

  async list(path: string): Promise<{ files: string[]; folders: string[] }> {
    try {
      const res = await fetch(`${this.baseUrl}/list?path=${encodeURIComponent(path)}`);
      if (!res.ok) return { files: [], folders: [] };
      return await res.json();
    } catch {
      return { files: [], folders: [] };
    }
  }

  async mkdir(path: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/mkdir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
    } catch (e) {
      console.warn('[WebStorageAdapter] mkdir note:', e);
    }
  }

  async rename(oldPath: string, newPath: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/rename`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ old_path: oldPath, new_path: newPath }),
    });
    if (!res.ok) throw new Error(`Failed to rename: ${oldPath} -> ${newPath}`);
  }

  async remove(path: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/remove?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
    } catch (e) {
      console.warn('[WebStorageAdapter] remove note:', e);
    }
  }

  getResourcePath(path: string): string {
    return `${this.baseUrl}/read?path=${encodeURIComponent(path)}`;
  }
}

export const createWebObsidianApp = (baseUrl = '/api/fs'): App => {
  return {
    vault: {
      adapter: new WebStorageAdapter(baseUrl),
    },
  };
};
