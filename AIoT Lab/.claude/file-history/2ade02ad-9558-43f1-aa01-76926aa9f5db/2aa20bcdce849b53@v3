import React, { useState, useMemo } from 'react';
import { WorldEntity } from '../../../types/identity';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Globe,
  Users,
  X,
  Layers,
  BookOpen,
} from 'lucide-react';

interface WorldsTableViewProps {
  worlds: WorldEntity[];
  onRefresh: () => void;
  onFilterByWorld?: (worldName: string) => void;
}

export const WorldsTableView: React.FC<WorldsTableViewProps> = ({
  worlds,
  onRefresh,
  onFilterByWorld,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorld, setEditingWorld] = useState<WorldEntity | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formChildOf, setFormChildOf] = useState<string>('');
  const [formDescription, setFormDescription] = useState('');
  const [formRules, setFormRules] = useState('');

  const filteredWorlds = useMemo(() => {
    const q = search.trim().toLowerCase();
    return worlds.filter((w) => {
      return (
        !q ||
        w.name.toLowerCase().includes(q) ||
        (w.parent_name && w.parent_name.toLowerCase().includes(q)) ||
        (w.description && w.description.toLowerCase().includes(q)) ||
        (w.rules && w.rules.some((r) => r.toLowerCase().includes(q)))
      );
    });
  }, [worlds, search]);

  const handleOpenCreate = (parentWorldId?: string) => {
    setEditingWorld(null);
    setFormName('');
    setFormChildOf(parentWorldId || (worlds[0]?.id || ''));
    setFormDescription('');
    setFormRules('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: WorldEntity) => {
    setEditingWorld(w);
    setFormName(w.name);
    setFormChildOf(w.child_of || '');
    setFormDescription(w.description || '');
    setFormRules(w.rules ? w.rules.join(', ') : '');
    setIsModalOpen(true);
  };

  const handleSaveWorld = async () => {
    if (!formName.trim()) return;

    const rulesList = formRules
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const payload = {
      id: editingWorld?.id,
      name: formName.trim(),
      child_of: formChildOf || null,
      description: formDescription.trim(),
      rules: rulesList,
    };

    try {
      const res = await fetch('/api/worlds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onRefresh();
        setIsModalOpen(false);
      }
    } catch (e) {
      console.error('[Identity] Failed to save world:', e);
    }
  };

  const handleDeleteWorld = async (wid: string, name: string) => {
    if (!confirm(`Delete world "${name}"? Child nodes will have their parent link detached.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/worlds/${encodeURIComponent(wid)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (e) {
      console.error('[Identity] Failed to delete world:', e);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-hazard-card border border-hazard-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-hazard-void border border-hazard-border px-3 py-1.5 rounded-xl min-w-[280px]">
            <Search className="w-4 h-4 text-hazard-textMuted" />
            <input
              type="text"
              placeholder="Search world name, parent, rule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-hazard-textBright outline-none w-full placeholder:text-hazard-textMuted/50"
            />
          </div>

          <span className="text-xs font-mono text-hazard-textMuted">
            Showing <strong className="text-hazard-gold">{filteredWorlds.length}</strong> of {worlds.length} tree nodes
          </span>
        </div>

        <button
          onClick={() => handleOpenCreate()}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 active:scale-95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New World Node</span>
        </button>
      </div>

      {/* Worlds Tree Table */}
      <div className="overflow-x-auto rounded-2xl border border-hazard-border bg-hazard-card">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-hazard-border/80 bg-hazard-void/60 text-hazard-textMuted font-mono uppercase text-[11px]">
              <th className="py-3 px-4 w-36">Hex ID</th>
              <th className="py-3 px-4">World / Node Name</th>
              <th className="py-3 px-4 w-44">Child Of (Parent)</th>
              <th className="py-3 px-4">Rules & Modifiers</th>
              <th className="py-3 px-4">Description</th>
              <th className="py-3 px-4 w-28 text-center">Characters</th>
              <th className="py-3 px-4 w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hazard-border/40 font-mono">
            {filteredWorlds.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-hazard-textMuted">
                  No worlds found.
                </td>
              </tr>
            ) : (
              filteredWorlds.map((w) => (
                <tr key={w.id} className="hover:bg-hazard-cardHover/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-bold text-hazard-gold bg-hazard-gold/10 px-2 py-0.5 rounded border border-hazard-gold/25 text-[10px]">
                      {w.id}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-sans font-bold text-hazard-textBright">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-hazard-cyan shrink-0" />
                      <span>{w.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {w.parent_name ? (
                      <span className="inline-flex items-center gap-1 font-bold text-hazard-cyan bg-hazard-cyan/10 px-2 py-0.5 rounded border border-hazard-cyan/25 text-[11px]">
                        <span>{w.parent_name}</span>
                      </span>
                    ) : (
                      <span className="text-hazard-gold font-bold text-[10px] bg-hazard-gold/15 px-2 py-0.5 rounded border border-hazard-gold/30">
                        ROOT
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {w.rules && w.rules.length > 0 ? (
                        w.rules.map((r, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.2 rounded bg-hazard-void text-hazard-textMuted text-[10px] border border-hazard-border"
                          >
                            #{r}
                          </span>
                        ))
                      ) : (
                        <span className="text-hazard-textMuted/40">—</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-[240px] truncate text-hazard-textMuted" title={w.description}>
                    {w.description || <span className="text-hazard-textMuted/40">—</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onFilterByWorld?.(w.name)}
                      title="Filter characters linked to this world node"
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-hazard-void border border-hazard-border hover:border-hazard-cyan text-hazard-cyan font-bold text-[11px] transition"
                    >
                      <Users className="w-3 h-3" />
                      <span>{w.character_count || 0}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenCreate(w.id)}
                        title="Add Child World to this node"
                        className="p-1.5 text-hazard-textMuted hover:text-hazard-cyan hover:bg-hazard-void rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(w)}
                        title="Edit World Node"
                        className="p-1.5 text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-void rounded-lg transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteWorld(w.id, w.name)}
                        title="Delete World Node"
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

      {/* Edit / Create World Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
          <div className="w-full max-w-md p-6 bg-hazard-card border-2 border-hazard-border rounded-3xl shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-hazard-border pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-hazard-gold" />
                <h3 className="text-sm font-black uppercase tracking-wider text-hazard-textBright">
                  {editingWorld ? `Edit World Node (${editingWorld.name})` : 'Create New World Node'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-hazard-textMuted hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  World / Node Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. HoloMyth, Hololive, Gaming"
                  className="w-full bg-hazard-void border border-hazard-border px-3.5 py-2 text-hazard-textBright font-bold rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Child Of (Parent World Node in Tree)
                </label>
                <select
                  value={formChildOf}
                  onChange={(e) => setFormChildOf(e.target.value)}
                  className="w-full bg-hazard-void border border-hazard-border px-3.5 py-2 text-hazard-cyan font-bold rounded-xl outline-none focus:border-hazard-gold cursor-pointer"
                >
                  <option value="">None (Top-Level Root e.g. 'All')</option>
                  {worlds
                    .filter((w) => !editingWorld || w.id !== editingWorld.id)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.id})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Rules (comma-separated list of rule strings)
                </label>
                <input
                  type="text"
                  value={formRules}
                  onChange={(e) => setFormRules(e.target.value)}
                  placeholder="e.g. idol_agency, first_generation, myth_lore"
                  className="w-full bg-hazard-void border border-hazard-border px-3.5 py-2 text-hazard-textBright font-mono rounded-xl outline-none focus:border-hazard-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-hazard-textMuted uppercase font-bold mb-1 block">
                  Description / Lore Notes
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Description of the franchise or world branch..."
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
                onClick={handleSaveWorld}
                disabled={!formName.trim()}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-gold text-black rounded-xl hover:brightness-110 disabled:opacity-50 transition shadow-sm"
              >
                Save World Node
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
