import React from 'react';
import { PromptNode, Rarity } from '../../types/schema';
import { useStudioStore } from '../../store/useStudioStore';
import { Plus, Minus, Flame, Sparkles, Tag } from 'lucide-react';

interface NodeCardProps {
  node: PromptNode;
}

const RARITY_STYLES: Record<Rarity, { border: string; bg: string; badge: string; text: string }> = {
  SSR: {
    border: 'border-hazard-crimson/60 hover:border-hazard-crimson',
    bg: 'bg-gradient-to-br from-hazard-crimson/10 to-hazard-amber/10',
    badge: 'bg-gradient-to-r from-hazard-crimson to-hazard-amber text-white font-bold',
    text: 'text-hazard-amber',
  },
  SR: {
    border: 'border-hazard-cyan/50 hover:border-hazard-cyan',
    bg: 'bg-hazard-cyan/5',
    badge: 'bg-hazard-cyan text-black font-semibold',
    text: 'text-hazard-cyan',
  },
  R: {
    border: 'border-hazard-purple/50 hover:border-hazard-purple',
    bg: 'bg-hazard-purple/5',
    badge: 'bg-hazard-purple text-white font-medium',
    text: 'text-hazard-purple',
  },
  N: {
    border: 'border-hazard-border hover:border-hazard-borderHover',
    bg: 'bg-hazard-card',
    badge: 'bg-hazard-cardHover text-hazard-textMuted',
    text: 'text-hazard-textMuted',
  },
};

export const NodeCard: React.FC<NodeCardProps> = ({ node }) => {
  const { activeNodeIds, nodeWeights, toggleNode, setNodeWeight } = useStudioStore();

  const isActive = activeNodeIds.includes(node.id);
  const currentWeight = nodeWeights[node.id] !== undefined ? nodeWeights[node.id] : (node.defaultWeight || 1.0);
  const rarity = node.rarity || 'N';
  const rarityStyle = RARITY_STYLES[rarity];

  const handleWeightDelta = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    setNodeWeight(node.id, currentWeight + delta);
  };

  return (
    <div
      onClick={() => toggleNode(node.id)}
      className={`relative flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none group ${
        isActive
          ? `border-hazard-gold bg-hazard-cardHover shadow-hazard-glow ring-1 ring-hazard-gold/50`
          : `${rarityStyle.border} ${rarityStyle.bg} hover:bg-hazard-cardHover/70`
      }`}
    >
      {/* Top Meta Bar: Rarity, Label & Gacha icon */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded tracking-wider uppercase font-mono ${rarityStyle.badge}`}>
            {rarity}
          </span>

          <div className="flex items-center gap-1">
            {node.gachaPoolId && (
              <span title="Linked to Gacha Pool" className="p-1 rounded bg-hazard-crimson/20 text-hazard-crimson text-xs">
                <Flame className="w-3 h-3 animate-pulse" />
              </span>
            )}
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-hazard-gold animate-ping" />
            )}
          </div>
        </div>

        {/* Node Name */}
        <h4 className={`text-xs font-semibold tracking-wide line-clamp-1 ${isActive ? 'text-hazard-gold' : 'text-hazard-textBright group-hover:text-white'}`}>
          {node.label}
        </h4>

        {/* Token Preview */}
        <p className="text-[11px] font-mono text-hazard-textMuted line-clamp-2 mt-1 leading-relaxed">
          {node.token}
        </p>
      </div>

      {/* Bottom Bar: Tags & Weight Steppers */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-hazard-border/50">
        {/* Tags or description */}
        <div className="flex items-center gap-1 overflow-hidden">
          {node.tags && node.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-hazard-void text-hazard-textMuted font-mono">
              #{tag}
            </span>
          ))}
        </div>

        {/* Weight Adjuster */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 bg-hazard-void/80 border border-hazard-border rounded-md px-1.5 py-0.5"
        >
          <button
            onClick={(e) => handleWeightDelta(e, -0.05)}
            className="text-hazard-textMuted hover:text-white p-0.5 transition"
            title="Decrease Weight (-0.05)"
          >
            <Minus className="w-2.5 h-2.5" />
          </button>

          <span className={`text-[10px] font-mono font-bold min-w-[28px] text-center ${currentWeight !== 1.0 ? 'text-hazard-gold' : 'text-hazard-textMuted'}`}>
            {currentWeight.toFixed(2)}
          </span>

          <button
            onClick={(e) => handleWeightDelta(e, 0.05)}
            className="text-hazard-textMuted hover:text-white p-0.5 transition"
            title="Increase Weight (+0.05)"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
