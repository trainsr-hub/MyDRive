import React, { useState, useMemo } from 'react';
import { AlbumEntity } from '../../../types/identity';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  X,
  Sparkles,
} from 'lucide-react';

interface AlbumsTableViewProps {
  albums: AlbumEntity[];
  onRefresh: () => void;
}

export const AlbumsTableView: React.FC<AlbumsTableViewProps> = ({
  albums,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<AlbumEntity | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const filteredAlbums = useMemo(() => {
    const q = search.trim().toLowerCase();
    return albums.filter((a) => {
      return (
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q))
      );
    });
  }, [albums, search]);

  const handleOpenCreate = () => {
    setEditingAlbum(null);
    setFormName('');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: AlbumEntity) => {
    setEditingAlbum(a);
    setFormName(a.name);
    setFormDesc(a.description || '');
    setIsModalOpen(true);
  };

  const handleSaveAlbum = async () => {
    if (!formName.trim()) return;

    const payload = {
      id: editingAlbum?.id,
      name: formName.trim(),
      description: formDesc.trim(),
    };

    try {
      const res = await fetch('/api/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onRefresh();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error('[Identity] Failed to save album:', e);
    }
  };

  const handleDeleteAlbum = async (aid: string, name: string) => {
    if (!confirm(`Delete album container "${name}"?`)) return;

    try {
      const res = await fetch(`/api/albums/${encodeURIComponent(aid)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error('[Identity] Failed to delete album:', e);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full font-sans">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-hazard-card border border-hazard-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-hazard-void border border-hazard-border px-3 py-1.5 rounded-xl min-w-[280px]">
            <Search className="w-4 h-4 text-hazard-textMuted" />
            <input
              type="text"
              placeholder="Search album name, ID, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-hazard-textBright outline-none w-full placeholder:text-hazard-textMuted/50"
            />
          </div>

          <span className="text-xs font-mono text-hazard-textMuted">
            Showing <strong className="text-hazard-gold">{filteredAlbums.length}</strong> of {albums.length} albums
          </span>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Album</span>
        </button>
      </div>

      {/* Albums Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-hazard-border bg-hazard-card">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-hazard-border/80 bg-hazard-void/60 text-hazard-textMuted font-mono uppercase text-[11px]">
              <th className="py-3 px-4 w-44">Album Hex ID</th>
              <th className="py-3 px-4 w-60">Album Name</th>
              <th className="py-3 px-4">Description & Lore</th>
              <th className="py-3 px-4 w-44">Created Date</th>
              <th className="py-3 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hazard-border/40 font-mono">
            {filteredAlbums.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-hazard-textMuted">
                  No albums found.
                </td>
              </tr>
            ) : (
              filteredAlbums.map((a) => (
                <tr key={a.id} className="hover:bg-hazard-cardHover/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-hazard-gold bg-hazard-gold/10 px-2 py-0.5 rounded border border-hazard-gold/25 text-[10px]">
                      {a.id}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-hazard-textBright">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-hazard-cyan shrink-0" />
                      <span>{a.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-[320px] truncate text-hazard-textMuted" title={a.description}>
                    {a.description || <span className="text-hazard-textMuted/40">—</span>}
                  </td>
                  <td className="py-3 px-4 text-hazard-textMuted text-[11px]">
                    {a.created_at}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(a)}
                        title="Edit Album"
                        className="p-1.5 text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-void rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAlbum(a.id, a.name)}
                        title="Delete Album"
                        className="p-1.5 text-hazard-textMuted hover:text-hazard-crimson hover:bg-hazard-void rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / Create Album Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
          <div className="w-full max-w-md p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hazard-border pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-hazard-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                  {editingAlbum ? `Edit Album (${editingAlbum.name})` : 'Create New Album Container'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-hazard-textMuted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Album Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Tournament Avatars, Official Artwork"
                  className="w-full bg-hazard-void border border-hazard-border px-3.5 py-2 text-hazard-textBright font-bold rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Description / Purpose
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Purpose of this album collection..."
                  rows={3}
                  className="w-full bg-hazard-void border border-hazard-border p-2.5 text-hazard-textBright font-mono rounded-xl outline-none focus:border-hazard-gold resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-hazard-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-hazard-textMuted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAlbum}
                disabled={!formName.trim()}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition shadow-sm"
              >
                Save Album
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
