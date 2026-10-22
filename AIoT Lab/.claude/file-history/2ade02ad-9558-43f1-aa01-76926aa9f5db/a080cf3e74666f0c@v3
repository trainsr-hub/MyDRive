import React from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { GachaPoolItem } from '../../types/schema';
import { X, Flame, Check, Dices } from 'lucide-react';

interface PoolInspectorProps {
  onClose: () => void;
}

export const PoolInspector: React.FC<PoolInspectorProps> = ({ onClose }) => {
  const { gachaPools, activeGachaPoolIds, toggleGachaPool, reroll, lastResolved } = useStudioStore();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="flex flex-col w-full max-w-2xl max-h-[85vh] bg-hazard-card border border-hazard-border rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-hazard-border bg-hazard-void">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-hazard-crimson" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-hazard-textBright">
              Gacha Pools & Dynamic Lotteries
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-hazard-textMuted hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          <p className="text-xs text-hazard-textMuted">
            Gacha pools randomly select items during prompt generation according to their draw count and weights. Toggle which pools are actively drawn.
          </p>

          <div className="space-y-3">
            {gachaPools.map((pool) => {
              const isActive = activeGachaPoolIds.includes(pool.id);

              return (
                <div
                  key={pool.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isActive
                      ? 'border-hazard-crimson/60 bg-hazard-crimson/5'
                      : 'border-hazard-border bg-hazard-void/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleGachaPool(pool.id)}
                        className={`flex items-center justify-center w-5 h-5 rounded border transition ${
                          isActive
                            ? 'bg-hazard-crimson border-hazard-crimson text-white'
                            : 'border-hazard-border text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <h4 className="text-xs font-semibold text-hazard-textBright">
                          {pool.name}
                        </h4>
                        <p className="text-[11px] text-hazard-textMuted">
                          {pool.description} • Draws:{' '}
                          <strong className="text-hazard-gold">{pool.drawCount}</strong>
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-hazard-card border border-hazard-border text-hazard-textMuted">
                      {pool.items.length} items
                    </span>
                  </div>

                  {/* Pool Items List */}
                  <div className="mt-3 pt-2.5 border-t border-hazard-border/50 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {pool.items.map((item, idx) => {
                      const token = typeof item === 'object' ? (item as GachaPoolItem).token : String(item);
                      const rarity = typeof item === 'object' ? (item as GachaPoolItem).rarity || 'N' : 'N';

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-2 py-1 bg-hazard-void/80 rounded border border-hazard-border/40 text-[11px] font-mono"
                        >
                          <span className="text-hazard-textMuted truncate mr-2">{token}</span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-hazard-card text-hazard-gold font-bold">
                            {rarity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-hazard-border bg-hazard-void">
          <button
            onClick={reroll}
            className="flex items-center gap-2 px-3 py-1.5 bg-hazard-gold/10 border border-hazard-gold/30 hover:bg-hazard-gold/20 text-hazard-gold text-xs font-semibold rounded-lg transition"
          >
            <Dices className="w-4 h-4" />
            <span>Test Re-Roll</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-hazard-gold text-black text-xs font-bold rounded-lg hover:brightness-110 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
