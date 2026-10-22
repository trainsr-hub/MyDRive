import React, { useState, useEffect, useMemo } from 'react';
import { VariantEntity, CharacterEntity } from '../../../types/identity';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Check,
  X,
  Layers,
  Sparkles,
  Shirt,
} from 'lucide-react';

const FALLBACK_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%231a1f3a'/%3E%3Ctext x='50' y='55' font-size='32' text-anchor='middle' fill='%23d4af37' font-family='monospace'%3E%3F%3C/text%3E%3C/svg%3E";

interface VariantsTableViewProps {
  initialCharFilter?: string;
  characters: CharacterEntity[];
}

export const VariantsTableView: React.FC<VariantsTableViewProps> = ({
  initialCharFilter,
  characters,
}) => {
  const [variants, setVariants] = useState<VariantEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [charFilter, setCharFilter] = useState(initialCharFilter || 'all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantEntity | null>(null);
  const [formCharCode, setFormCharCode] = useState('');
  const [formVariantNames, setFormVariantNames] = useState('');
  const [formShortNames, setFormShortNames] = useState('');
  const [formHazardRank, setFormHazardRank] = useState(0);
  const [formPrompt, setFormPrompt] = useState('');
  const [formOutfit, setFormOutfit] = useState('');
  const [formAvatar, setFormAvatar] = useState('');

  const loadVariants = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/variants');
      if (res.ok) {
        const data: VariantEntity[] = await res.json();
        setVariants(data);
      }
    } catch (e) {
      console.error('[Identity] Failed to load variants:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVariants();
  }, []);

  useEffect(() => {
    if (initialCharFilter) {
      setCharFilter(initialCharFilter);
    }
  }, [initialCharFilter]);

  const filteredVariants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return variants.filter((v) => {
      const matchesSearch =
        !q ||
        (v.variant_names && v.variant_names.some((vn) => vn.toLowerCase().includes(q))) ||
        (v.short_names && v.short_names.some((sn) => sn.toLowerCase().includes(q))) ||
        (v.char_code && v.char_code.toLowerCase().includes(q)) ||
        (v.canonical_name && v.canonical_name.toLowerCase().includes(q));

      const matchesChar =
        charFilter === 'all' ||
        (v.char_code && v.char_code.toLowerCase() === charFilter.toLowerCase());

      return matchesSearch && matchesChar;
    });
  }, [variants, search, charFilter]);

  const handleOpenCreate = () => {
    setEditingVariant(null);
    setFormCharCode(charFilter !== 'all' ? charFilter : characters[0]?.char_code || 'A01');
    setFormVariantNames('');
    setFormShortNames('');
    setFormHazardRank(3);
    setFormPrompt('');
    setFormOutfit('');
    setFormAvatar('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: VariantEntity) => {
    setEditingVariant(v);
    setFormCharCode(v.char_code || '');
    setFormVariantNames(v.variant_names ? v.variant_names.join(', ') : '');
    setFormShortNames(v.short_names ? v.short_names.join(', ') : '');
    setFormHazardRank(v.hazard_rank ?? 0);
    setFormPrompt(v.base_prompt || v.prompt || '');
    setFormOutfit(v.outfit || '');
    setFormAvatar(v.avatar_url || '');
    setIsModalOpen(true);
  };

  const handleSaveVariant = async () => {
    if (!formCharCode.trim() || !formVariantNames.trim()) return;

    const namesList = formVariantNames
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);

    const shortList = formShortNames
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      id: editingVariant?.id,
      char_code: formCharCode.trim().toUpperCase(),
      variant_names: namesList,
      short_names: shortList,
      hazard_rank: parseInt(String(formHazardRank), 10) || 0,
      base_prompt: formPrompt.trim() || '',
      outfit: formOutfit.trim() || '',
      avatar_url: formAvatar.trim() || '',
    };

    try {
      const res = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadVariants();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error('[Identity] Failed to save variant:', e);
    }
  };

  const handleDeleteVariant = async (vid: string, names: string[]) => {
    const displayName = names && names.length > 0 ? names[0] : vid;
    if (!confirm(`Delete variant "${displayName}"?`)) return;

    try {
      const res = await fetch(`/api/variants/${encodeURIComponent(vid)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadVariants();
      }
    } catch (e) {
      console.error('[Identity] Failed to delete variant:', e);
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
              placeholder="Search variant name, short name, character..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-hazard-textBright outline-none w-full placeholder:text-hazard-textMuted/50"
            />
          </div>

          {/* Character Filter */}
          <div className="flex items-center gap-2 bg-hazard-void border border-hazard-border px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-hazard-textMuted" />
            <select
              value={charFilter}
              onChange={(e) => setCharFilter(e.target.value)}
              className="bg-transparent text-xs text-hazard-textBright outline-none cursor-pointer"
            >
              <option value="all">All Characters ({variants.length} Variants)</option>
              {characters.map((c) => (
                <option key={c.char_code} value={c.char_code}>
                  {c.char_code} - {c.canonical_name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs font-mono text-hazard-textMuted">
            Showing <strong className="text-hazard-gold">{filteredVariants.length}</strong> of {variants.length} variants
          </span>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Variant</span>
        </button>
      </div>

      {/* Variants Data Table */}
      <div className="overflow-x-auto rounded-2xl border border-hazard-border bg-hazard-card">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-hazard-border/80 bg-hazard-void/60 text-hazard-textMuted font-mono uppercase text-[11px]">
              <th className="py-3 px-4 w-48">Parent Character</th>
              <th className="py-3 px-4">Variant Names</th>
              <th className="py-3 px-4">Short Names</th>
              <th className="py-3 px-4 w-24">Hazard Rank</th>
              <th className="py-3 px-4">Prompt Tokens</th>
              <th className="py-3 px-4">Outfit Tokens</th>
              <th className="py-3 px-4 w-24 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hazard-border/40 font-mono">
            {filteredVariants.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-hazard-textMuted">
                  {isLoading ? 'Loading variants from SQLite...' : 'No variants found.'}
                </td>
              </tr>
            ) : (
              filteredVariants.map((v) => (
                <tr key={v.id} className="hover:bg-hazard-cardHover/50 transition">
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5 font-sans">
                      <img
                        src={v.avatar_url || v.char_avatar_url || FALLBACK_AVATAR}
                        alt={v.canonical_name || 'Character'}
                        className="w-7 h-7 rounded-lg object-cover border border-hazard-border bg-hazard-void shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
                        }}
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-hazard-textBright text-xs truncate">
                          {v.canonical_name}
                        </span>
                        <span className="font-mono text-[10px] text-hazard-gold font-bold">
                          {v.char_code}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-sans font-bold text-hazard-textBright">
                    <div className="flex flex-wrap gap-1">
                      {v.variant_names && v.variant_names.length > 0 ? (
                        v.variant_names.map((vn, i) => (
                          <span
                            key={i}
                            className="font-bold text-hazard-cyan bg-hazard-cyan/10 px-2 py-0.5 rounded border border-hazard-cyan/25 text-xs font-sans"
                          >
                            {vn}
                          </span>
                        ))
                      ) : (
                        <span className="text-hazard-textMuted/40">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex flex-wrap gap-1">
                      {v.short_names && v.short_names.length > 0 ? (
                        v.short_names.map((sn, i) => (
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
                    <span className="px-2 py-0.5 rounded-full bg-hazard-void border border-hazard-border text-hazard-cyan font-bold text-[10px]">
                      Rank {v.hazard_rank ?? 0}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 max-w-[240px] truncate text-hazard-textMuted" title={v.base_prompt || v.prompt}>
                    {v.base_prompt || v.prompt || <span className="text-hazard-textMuted/40">—</span>}
                  </td>
                  <td className="py-2.5 px-4 max-w-[200px] truncate text-hazard-textMuted" title={v.outfit}>
                    {v.outfit || <span className="text-hazard-textMuted/40">—</span>}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(v)}
                        title="Edit Variant"
                        className="p-1.5 text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-void rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteVariant(v.id, v.variant_names)}
                        title="Delete Variant"
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

      {/* Edit / Create Variant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
          <div className="w-full max-w-lg p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hazard-border pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-hazard-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                  {editingVariant ? 'Edit Character Variant' : 'Create New Character Variant'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-hazard-textMuted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Parent Character *
                </label>
                <select
                  value={formCharCode}
                  disabled={Boolean(editingVariant)}
                  onChange={(e) => setFormCharCode(e.target.value)}
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-gold font-mono font-bold rounded-xl outline-none focus:border-hazard-gold disabled:opacity-60 cursor-pointer"
                >
                  {characters.map((c) => (
                    <option key={c.char_code} value={c.char_code}>
                      {c.char_code} - {c.canonical_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Variant Names (comma-separated list of strings) *
                </label>
                <input
                  type="text"
                  value={formVariantNames}
                  onChange={(e) => setFormVariantNames(e.target.value)}
                  placeholder="e.g. The Casual Ame, Casual Outfit"
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-textBright font-bold rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Shortened Names (comma-separated)
                </label>
                <input
                  type="text"
                  value={formShortNames}
                  onChange={(e) => setFormShortNames(e.target.value)}
                  placeholder="e.g. Casual Ame"
                  className="w-full bg-hazard-void border border-hazard-border px-3 py-2 text-hazard-gold font-mono font-bold rounded-xl outline-none focus:border-hazard-gold"
                />
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

              <div className="col-span-2">
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Avatar Image URL (Optional)
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
                  Variant Prompt Tokens
                </label>
                <textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="short hair, bob cut, bangs, ahoge, blue eyes..."
                  rows={3}
                  className="w-full bg-hazard-void border border-hazard-border p-2.5 text-hazard-textBright font-mono rounded-xl outline-none focus:border-hazard-gold resize-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Variant Outfit Tokens
                </label>
                <textarea
                  value={formOutfit}
                  onChange={(e) => setFormOutfit(e.target.value)}
                  placeholder="white shirt, brown vest, rolled sleeves, brown pleated skirt..."
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
                onClick={handleSaveVariant}
                disabled={!formCharCode.trim() || !formVariantNames.trim()}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition shadow-sm"
              >
                Save Variant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
