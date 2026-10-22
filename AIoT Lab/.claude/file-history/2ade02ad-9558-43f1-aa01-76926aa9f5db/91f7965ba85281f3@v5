import React, { useState, useEffect, useMemo } from 'react';
import { CharacterEntity, WorldEntity, AlbumEntity, CharacterImageEntry } from '../../../types/identity';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Check,
  X,
  User,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Image as ImageIcon,
  FolderOpen,
} from 'lucide-react';

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231a1f3a'/%3E%3Ctext x='50' y='55' font-size='32' text-anchor='middle' fill='%23d4af37' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E";

interface CharactersTableViewProps {
  worlds: WorldEntity[];
  albums?: AlbumEntity[];
  onSelectCharacterForVariants?: (charCode: string) => void;
}

export const CharactersTableView: React.FC<CharactersTableViewProps> = ({
  worlds,
  albums = [],
  onSelectCharacterForVariants,
}) => {
  const [characters, setCharacters] = useState<CharacterEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [worldFilter, setWorldFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterEntity | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formShortNames, setFormShortNames] = useState('');
  const [formSeriesId, setFormSeriesId] = useState('');
  const [formHazardRank, setFormHazardRank] = useState(0);
  const [formAvatar, setFormAvatar] = useState('');
  const [formPrompt, setFormPrompt] = useState('');
  const [formOutfit, setFormOutfit] = useState('');

  // Image Chest Modal State (O(1) Per-Character Images in {char_code}.json)
  const [chestChar, setChestChar] = useState<CharacterEntity | null>(null);
  const [chestImages, setChestImages] = useState<CharacterImageEntry[]>([]);
  const [isChestLoading, setIsChestLoading] = useState(false);
  const [newChestUrl, setNewChestUrl] = useState('');
  const [newChestAlbumId, setNewChestAlbumId] = useState('');

  const worldIdToName = useMemo(() => {
    const map = new Map<string, string>();
    worlds.forEach((w) => map.set(w.id, w.name));
    return map;
  }, [worlds]);

  const loadCharacters = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/characters/all');
      if (res.ok) {
        const data: CharacterEntity[] = await res.json();
        setCharacters(data);
      }
    } catch (e) {
      console.error('[Identity] Failed to load characters:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const filteredCharacters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return characters.filter((c) => {
      const matchesSearch =
        !q ||
        c.char_code.toLowerCase().includes(q) ||
        c.canonical_name.toLowerCase().includes(q) ||
        (c.short_names && c.short_names.some((s) => s.toLowerCase().includes(q))) ||
        (c.series_ids && c.series_ids.some((id) => (worldIdToName.get(id) || '').toLowerCase().includes(q)));

      const matchesWorld =
        worldFilter === 'all' ||
        (c.series_ids && c.series_ids.includes(worldFilter));

      return matchesSearch && matchesWorld;
    });
  }, [characters, search, worldFilter, worldIdToName]);

  const handleOpenCreate = () => {
    setEditingChar(null);
    setFormCode('');
    setFormName('');
    setFormShortNames('');
    setFormSeriesId(worlds[0]?.id || '');
    setFormHazardRank(3);
    setFormAvatar('');
    setFormPrompt('');
    setFormOutfit('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CharacterEntity) => {
    setEditingChar(c);
    setFormCode(c.char_code);
    setFormName(c.canonical_name);
    setFormShortNames(c.short_names ? c.short_names.join(', ') : '');
    setFormSeriesId(c.series_ids && c.series_ids.length > 0 ? c.series_ids[0] : '');
    setFormHazardRank(c.hazard_rank ?? 0);
    setFormAvatar(c.avatar_url || '');
    setFormPrompt(c.base_prompt || '');
    setFormOutfit(c.outfit || '');
    setIsModalOpen(true);
  };

  const handleSaveCharacter = async () => {
    if (!formCode.trim() || !formName.trim()) return;

    const shortList = formShortNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const seriesList = formSeriesId ? [formSeriesId] : [];

    const payload = {
      char_code: formCode.trim().toUpperCase(),
      canonical_name: formName.trim(),
      short_names: shortList,
      series_ids: seriesList,
      hazard_rank: parseInt(String(formHazardRank), 10) || 0,
      avatar_url: formAvatar.trim() || undefined,
      base_prompt: formPrompt.trim() || undefined,
      outfit: formOutfit.trim() || undefined,
    };

    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadCharacters();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error('[Identity] Failed to save character:', e);
    }
  };

  const handleDeleteCharacter = async (charCode: string) => {
    if (!confirm(`Are you sure you want to delete character ${charCode}? This will also delete all its variants.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(charCode)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadCharacters();
      }
    } catch (e) {
      console.error('[Identity] Failed to delete character:', e);
    }
  };

  // Open Image Treasure Chest Modal (O(1) Direct Character Image File)
  const handleOpenChest = async (c: CharacterEntity) => {
    setChestChar(c);
    setIsChestLoading(true);
    setNewChestUrl('');
    setNewChestAlbumId(albums[0]?.id || '');
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(c.char_code)}/images`);
      if (res.ok) {
        const data = await res.json();
        setChestImages(data);
      }
    } catch (e) {
      console.error('[Identity] Error loading images for character:', e);
    } finally {
      setIsChestLoading(false);
    }
  };

  const handleAddChestImage = async () => {
    if (!chestChar || !newChestUrl.trim()) return;
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(chestChar.char_code)}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: newChestUrl.trim(),
          album_id: newChestAlbumId || (albums[0]?.id || ''),
          char_code: chestChar.char_code,
        }),
      });
      if (res.ok) {
        setNewChestUrl('');
        const imgsRes = await fetch(`/api/characters/${encodeURIComponent(chestChar.char_code)}/images`);
        if (imgsRes.ok) {
          setChestImages(await imgsRes.json());
        }
        await loadCharacters();
      }
    } catch (e) {
      console.error('[Identity] Error adding image:', e);
    }
  };

  const handleDeleteChestImage = async (imageId: string) => {
    if (!chestChar) return;
    try {
      const res = await fetch(`/api/characters/${encodeURIComponent(chestChar.char_code)}/images/${encodeURIComponent(imageId)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setChestImages((prev) => prev.filter((img) => img.image_id !== imageId));
        await loadCharacters();
      }
    } catch (e) {
      console.error('[Identity] Error deleting image:', e);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-hazard-card border border-hazard-border">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-hazard-void border border-hazard-border px-3 py-1.5 rounded-xl min-w-[260px]">
            <Search className="w-4 h-4 text-hazard-textMuted" />
            <input
              type="text"
              placeholder="Search code, name, short name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-hazard-textBright outline-none w-full placeholder:text-hazard-textMuted/50"
            />
          </div>

          {/* World Filter */}
          <div className="flex items-center gap-2 bg-hazard-void border border-hazard-border px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-hazard-textMuted" />
            <select
              value={worldFilter}
              onChange={(e) => setWorldFilter(e.target.value)}
              className="bg-transparent text-xs text-hazard-textBright outline-none cursor-pointer"
            >
              <option value="all">All World Branches ({characters.length})</option>
              {worlds.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} {w.parent_name ? `(${w.parent_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-hazard-textMuted">
            Showing <strong className="text-hazard-gold">{filteredCharacters.length}</strong> of {characters.length} characters
          </span>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Original Character</span>
        </button>
      </div>

      {/* Characters Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-hazard-border bg-hazard-card">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-hazard-border/80 bg-hazard-void/60 text-hazard-textMuted font-mono uppercase text-[11px]">
              <th className="py-3 px-4 w-12">Avatar</th>
              <th className="py-3 px-4 w-24">ID</th>
              <th className="py-3 px-4">Canonical Name</th>
              <th className="py-3 px-4">Short Names</th>
              <th className="py-3 px-4">World Tree IDs</th>
              <th className="py-3 px-4 w-24">Hazard Rank</th>
              <th className="py-3 px-4">Base Prompt (_prpt_)</th>
              <th className="py-3 px-4">Default Outfit</th>
              <th className="py-3 px-4 w-24 text-center">Variants</th>
              <th className="py-3 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hazard-border/40 font-mono">
            {filteredCharacters.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-hazard-textMuted">
                  {isLoading ? 'Loading characters from SQLite...' : 'No characters matched the filter.'}
                </td>
              </tr>
            ) : (
              filteredCharacters.map((c) => (
                <tr key={c.char_code} className="hover:bg-hazard-cardHover/50 transition">
                  <td className="py-2.5 px-4">
                    <div
                      onClick={() => handleOpenChest(c)}
                      title={`Open Image Treasure Chest (${c.char_code}.json)`}
                      className="relative w-9 h-9 rounded-lg overflow-hidden border border-hazard-border hover:border-hazard-gold bg-hazard-void cursor-pointer group/avatar transition shadow-sm"
                    >
                      <img
                        src={c.avatar_url || FALLBACK_AVATAR}
                        alt={c.canonical_name}
                        className="w-full h-full object-cover group-hover/avatar:scale-110 transition"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition">
                        <ImageIcon className="w-3.5 h-3.5 text-hazard-gold" />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="font-bold text-hazard-gold bg-hazard-gold/15 px-2 py-0.5 rounded border border-hazard-gold/30">
                      {c.char_code}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-sans font-bold text-hazard-textBright">
                    {c.canonical_name}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {c.short_names && c.short_names.length > 0 ? (
                        c.short_names.map((sn, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded bg-hazard-void text-hazard-gold text-[10px] border border-hazard-gold/25 font-bold"
                          >
                            {sn}
                          </span>
                        ))
                      ) : (
                        <span className="text-hazard-textMuted/40">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {c.series_ids && c.series_ids.length > 0 ? (
                        c.series_ids.map((id, i) => (
                          <span
                            key={i}
                            title={`ID: ${id}`}
                            className="px-1.5 py-0.2 rounded bg-hazard-void text-hazard-cyan text-[10px] border border-hazard-cyan/30 font-sans"
                          >
                            {worldIdToName.get(id) || id}
                          </span>
                        ))
                      ) : (
                        <span className="text-hazard-textMuted/40">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded-full bg-hazard-void border border-hazard-border text-hazard-cyan font-bold text-[10px]">
                      Rank {c.hazard_rank ?? 0}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 max-w-[200px] truncate text-hazard-textMuted" title={c.base_prompt}>
                    {c.base_prompt || <span className="text-hazard-textMuted/40">—</span>}
                  </td>
                  <td className="py-2.5 px-4 max-w-[180px] truncate text-hazard-textMuted" title={c.outfit}>
                    {c.outfit || <span className="text-hazard-textMuted/40">—</span>}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => onSelectCharacterForVariants?.(c.char_code)}
                      title="View Variants of this character"
                      className="px-2 py-0.5 rounded bg-hazard-void border border-hazard-border hover:border-hazard-gold text-hazard-gold text-[10px] font-bold transition"
                    >
                      {c.variant_count || 0}
                    </button>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Character"
                        className="p-1.5 text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-void rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCharacter(c.char_code)}
                        title="Delete Character"
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

      {/* Edit / Create Character Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
          <div className="w-full max-w-xl p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hazard-border pb-3">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-hazard-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                  {editingChar ? `Edit Character (${editingChar.char_code})` : 'Create New Original Character'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-hazard-textMuted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Character ID Code *
                </label>
                <input
                  type="text"
                  value={formCode}
                  disabled={Boolean(editingChar)}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="e.g. A01, B28"
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-gold font-mono font-bold rounded-xl outline-none focus:border-hazard-gold disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Canonical Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Amelia Watson"
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-textBright font-bold rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Shortened Names (comma-separated) *
                </label>
                <input
                  type="text"
                  value={formShortNames}
                  onChange={(e) => setFormShortNames(e.target.value)}
                  placeholder="e.g. Ame, Watson"
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-gold font-mono font-bold rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  World / Series (Tree Node ID)
                </label>
                <select
                  value={formSeriesId}
                  onChange={(e) => setFormSeriesId(e.target.value)}
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-cyan font-bold rounded-xl outline-none focus:border-hazard-gold cursor-pointer"
                >
                  <option value="">None (Unassigned)</option>
                  {worlds.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.parent_name ? `(under ${w.parent_name})` : ''} [{w.id}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Hazard Rank (Integer)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="15"
                  value={formHazardRank}
                  onChange={(e) => setFormHazardRank(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-textBright font-mono font-bold rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Avatar Image URL
                </label>
                <input
                  type="text"
                  value={formAvatar}
                  onChange={(e) => setFormAvatar(e.target.value)}
                  placeholder="https://... image URL"
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-textBright font-mono rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Default Base Prompt Tokens (_prpt_)
                </label>
                <textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="watson amelia, medium hair, blonde hair, bangs, blue eyes..."
                  rows={3}
                  className="w-full bg-hazard-void border border-hazard-border p-2.5 text-hazard-textBright font-mono rounded-xl outline-none focus:border-hazard-gold resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Default Outfit Tokens
                </label>
                <textarea
                  value={formOutfit}
                  onChange={(e) => setFormOutfit(e.target.value)}
                  placeholder="deerstalker, plaid capelet, brown vest, white shirt, brown pleated skirt..."
                  rows={2}
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
                onClick={handleSaveCharacter}
                disabled={!formCode.trim() || !formName.trim()}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition shadow-sm"
              >
                Save Character
              </button>
            </div>
          </div>
        </div>
      )}

      {/* O(1) Per-Character Image Treasure Chest Modal */}
      {chestChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn font-sans">
          <div className="w-full max-w-2xl max-h-[90vh] p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-hazard-border pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-hazard-gold" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                    Image Treasure Chest: {chestChar.canonical_name} ({chestChar.char_code})
                  </h3>
                  <p className="text-[11px] font-mono text-hazard-textMuted">
                    Direct O(1) file: <code className="text-hazard-cyan">Identity/Images/{chestChar.char_code}.json</code>
                  </p>
                </div>
              </div>
              <button onClick={() => setChestChar(null)} className="p-1 text-hazard-textMuted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Image to Chest Input Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-hazard-void rounded-2xl border border-hazard-border shrink-0">
              <input
                type="text"
                value={newChestUrl}
                onChange={(e) => setNewChestUrl(e.target.value)}
                placeholder="Paste Image URL (https://... or data:image/...)"
                className="flex-1 min-w-[200px] bg-transparent text-xs font-mono text-hazard-textBright outline-none placeholder:text-hazard-textMuted/40"
              />
              <select
                value={newChestAlbumId}
                onChange={(e) => setNewChestAlbumId(e.target.value)}
                className="bg-hazard-card border border-hazard-border px-3 py-1.5 text-xs text-hazard-cyan font-bold rounded-xl outline-none cursor-pointer"
              >
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddChestImage}
                disabled={!newChestUrl.trim()}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold uppercase bg-hazard-gold text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Image</span>
              </button>
            </div>

            {/* Images Grid */}
            <div className="flex-1 overflow-y-auto p-1">
              {isChestLoading ? (
                <div className="p-8 text-center text-xs font-mono text-hazard-textMuted">
                  Loading images from {chestChar.char_code}.json...
                </div>
              ) : chestImages.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-hazard-textMuted border border-dashed border-hazard-border rounded-2xl">
                  No images in this character's chest yet. Paste an image URL above to link it to an album.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {chestImages.map((img) => (
                    <div
                      key={img.image_id}
                      className="group relative flex flex-col p-2 bg-hazard-void rounded-2xl border border-hazard-border hover:border-hazard-gold/60 transition shadow-sm"
                    >
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-hazard-card border border-hazard-border mb-2">
                        <img
                          src={img.image_url}
                          alt="Chest Image"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-hazard-cyan/15 text-hazard-cyan border border-hazard-cyan/30 truncate max-w-[120px]">
                          {img.album_name || 'Album'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteChestImage(img.image_id)}
                          title="Delete image from chest"
                          className="p-1 text-hazard-textMuted hover:text-hazard-crimson transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-hazard-border shrink-0">
              <span className="text-xs font-mono text-hazard-textMuted">
                {chestImages.length} images stored in <strong className="text-hazard-gold">{chestChar.char_code}.json</strong>
              </span>
              <button
                type="button"
                onClick={() => setChestChar(null)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-void border border-hazard-border hover:border-hazard-gold/50 text-hazard-textBright hover:text-hazard-gold rounded-xl transition"
              >
                Close Chest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
