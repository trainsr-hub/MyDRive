import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { NodeCard } from './NodeCard';
import {
  User,
  Flame,
  Activity,
  Eye,
  Shield,
  Camera,
  Sparkles,
  Layers,
  Search,
  Grid,
} from 'lucide-react';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  User: <User className="w-4 h-4" />,
  Flame: <Flame className="w-4 h-4" />,
  Activity: <Activity className="w-4 h-4" />,
  Eye: <Eye className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
  Camera: <Camera className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
  Layers: <Layers className="w-4 h-4" />,
};

export const MatrixGrid: React.FC = () => {
  const {
    categories,
    nodes,
    activeNodeIds,
    selectedCategoryId,
    setSelectedCategory,
  } = useStudioStore();

  const [searchTerm, setSearchTerm] = useState('');

  // Filter nodes based on active category tab & search query
  const filteredNodes = nodes.filter((node) => {
    const matchesCategory =
      selectedCategoryId === 'all' || node.categoryId === selectedCategoryId;
    const matchesSearch =
      !searchTerm.trim() ||
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.tags && node.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    return matchesCategory && matchesSearch;
  });

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Category Navigation Bar & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-hazard-border bg-hazard-card/60 shrink-0">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition whitespace-nowrap ${
              selectedCategoryId === 'all'
                ? 'bg-hazard-gold text-black shadow-hazard-glow'
                : 'text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>All Nodes ({nodes.length})</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const categoryNodes = nodes.filter((n) => n.categoryId === cat.id);
            const activeInCat = categoryNodes.filter((n) => activeNodeIds.includes(n.id)).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  borderColor: isSelected ? cat.color : undefined,
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide border transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-hazard-cardHover text-white shadow-sm ring-1 ring-white/20'
                    : 'border-transparent text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover'
                }`}
              >
                <span style={{ color: cat.color }}>
                  {CATEGORY_ICONS[cat.icon] || <Layers className="w-3.5 h-3.5" />}
                </span>
                <span>{cat.name}</span>
                {activeInCat > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-full bg-hazard-gold text-black font-bold">
                    {activeInCat}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Node Search Bar */}
        <div className="flex items-center gap-2 bg-hazard-void border border-hazard-border rounded-lg px-2.5 py-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-hazard-textMuted" />
          <input
            type="text"
            placeholder="Search nodes, tokens, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-hazard-textBright placeholder:text-hazard-textMuted/60 outline-none"
          />
        </div>
      </div>

      {/* Category Info Header if specific category is selected */}
      {activeCategory && (
        <div className="flex items-center justify-between px-4 py-2 bg-hazard-void/50 border-b border-hazard-border/40 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span style={{ color: activeCategory.color }} className="font-bold">
              {activeCategory.name}
            </span>
            <span className="text-hazard-textMuted">• {activeCategory.description}</span>
          </div>
          <div className="text-[11px] font-mono text-hazard-textMuted">
            Mode:{' '}
            <span className="text-hazard-cyan font-bold uppercase">
              {activeCategory.selectionType} Selection
            </span>
          </div>
        </div>
      )}

      {/* Matrix Cards Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredNodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-hazard-textMuted">
            <p className="text-sm font-medium">No prompt nodes match the current filter.</p>
            <p className="text-xs mt-1">Try resetting the search or category tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredNodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
