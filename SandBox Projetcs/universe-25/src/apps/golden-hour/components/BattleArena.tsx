// path: src/apps/golden-hour/components/BattleArena.tsx

import React from 'react';
import { useGoldenHourStore, calculateHazardFromTime } from '../store/useGoldenHourStore';
import { useCurrencyStore } from '../../../store/useCurrencyStore';
import { useInventoryStore } from '../../../store/useInventoryStore';
import { SharedButton, TelemetryBar, ModalContainer, UniversalCard } from '../../../components/shared';
import {
  Swords,
  Shield,
  Info,
  Sparkles,
} from 'lucide-react';

export const BattleArena: React.FC = () => {
  const { arenaSlots } = useGoldenHourStore();
  const timeBalance = useCurrencyStore((s) => s.timeBalance);
  const { hazardLevel, goldenHours } = calculateHazardFromTime(timeBalance);
  const { discs, angelRollTickets } = useInventoryStore();

  // Aggregate stats across all 4 equipped slots
  const equippedItems = arenaSlots.map((s) => s.equippedItem).filter(Boolean);

  const aggregateStats = {
    ATK: 0,
    DEF: 0,
    SPD: 0,
    LUCK: 0,
  };

  const activeBuffs: { name: string; description: string; source: string }[] = [];
  const activeCurses: { name: string; description: string; source: string }[] = [];

  for (const item of equippedItems) {
    if (!item) continue;
    if (item.stats) {
      for (const s of item.stats) {
        if (s.name in aggregateStats) {
          aggregateStats[s.name as keyof typeof aggregateStats] += s.value;
        }
      }
    }
    if (item.buffs) {
      for (const b of item.buffs) {
        activeBuffs.push({ ...b, source: item.name });
      }
    }
    if (item.downsides) {
      for (const d of item.downsides) {
        activeCurses.push({ ...d, source: item.name });
      }
    }
  }

  return (
    <>
      {/* Telemetry Bar Showcase */}
      <div className="p-6 rounded-2xl bg-[#0e0a16]/80 border border-[#2e2638] shadow-gold-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd86b]/20 to-[#841822]/30 border border-[#ffd86b]/40 flex items-center justify-center text-[#ffd86b]">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider">
                Tab 1 — Primary Operational Stage
              </h3>
              <p className="text-xs text-[#8c7a9e]">
                Demonstrating TelemetryBar, UniversalCard, SharedButton, and ModalContainer
              </p>
            </div>
          </div>
          <SharedButton
            variant="secondary"
            size="sm"
            onClick={() => {/* Modal trigger would go here */}}
          >
            Inspect Modal
          </SharedButton>
        </div>

        <div className="pt-2">
          <div className="text-[11px] font-mono text-[#ffd86b] uppercase mb-2">Live Shared Telemetry Bar:</div>
          <TelemetryBar
            hazardLevel={hazardLevel}
            goldenHours={goldenHours}
            discs={discs}
            tickets={angelRollTickets}
            themeVariant="detailed"
            className="bg-[#120f18] border-[#2b2238]"
          />
        </div>
      </div>

      {/* Universal Cards Showcase */}
      <div className="space-y-3">
        <div className="text-xs font-cinzel font-bold text-[#ffd86b] uppercase tracking-wider">
          Universal Cards (Shared Interactive Entities)
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {equippedItems.map((item, index) => (
            <UniversalCard
              key={item?.id || `slot-${index}`}
              title={item?.name || `Empty Slot ${index + 1}`}
              subtitle={item?.category || 'Equip a relic'}
              description={item?.description || 'Drag and drop items from the vault to equip'}
              type={item?.category || 'Empty Slot'}
              score={item?.score || 0}
              rank={item?.rank || 'S₀'}
              icon={item?.iconEmoji ? (
                <span className="w-5 h-5">{item.iconEmoji}</span>
              ) : (
                <Shield className="w-5 h-5 text-[#ffd86b]" />
              )}
              featured={!!item && item.score >= 10}
              className="bg-[#120f18] border-[#2b2238]"
              onClick={() => {
                if (item) {
                  // Open modal with item details
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Row */}
      <div className="p-4 rounded-xl bg-[#120f18] border border-[#2b2238] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#ffd86b]" />
          <span className="text-xs text-[#8c7a9e]">
            {equippedItems.length}/4 Slots Equipped
          </span>
        </div>
        <div className="flex gap-2">
          <SharedButton variant="ghost" size="sm">
            Clear Selection
          </SharedButton>
          <SharedButton variant="primary" size="sm" onClick={() => {/* Open modal */}}>
            Equip Relic
          </SharedButton>
        </div>
      </div>

      {/* Shared Modal Container for Item Details */}
      <ModalContainer
        isOpen={false} // Would be controlled by state
        onClose={() => {/* Set state to false */}}
        title="Relic Details"
        subtitle="View detailed information about equipped relics"
        icon={<Sparkles className="w-5 h-5 text-[#ffd86b]" />}
      >
        <div className="space-y-4 text-xs text-[#9c93a8]">
          <p>
            Detailed view of selected relic with stats, buffs, and downsides.
          </p>
          <div className="p-4 rounded-xl bg-[#14101c] border border-[#2a2034] space-y-2">
            <div className="font-bold text-white uppercase text-[11px] font-cinzel">Relic Invariants:</div>
            <ul className="list-disc pl-4 space-y-1 text-[#8c7a9e]">
              <li>Score-based hazard ranking system</li>
              <li>Buff and curse mechanics</li>
              <li>Equipment slot limitations</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <SharedButton variant="secondary" size="md" onClick={() => {/* Close modal */}}>
              Close
            </SharedButton>
            <SharedButton variant="primary" size="md" onClick={() => {/* Close modal */}}>
              Acknowledge
            </SharedButton>
          </div>
        </div>
      </ModalContainer>
    </>
  );
};

export default BattleArena;
