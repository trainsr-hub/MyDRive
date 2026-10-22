// path: src/apps/golden-hour/components/VaultGalleries.tsx

import React, { useState } from 'react';
import { useGoldenHourStore, ELEMENT_REGISTRY } from '../store/useGoldenHourStore';
import { HazardBadge } from '../../../components/HazardBadge';
import type { VaultCategory, ElementalAttribute, PullItem } from '../types';
import {
  UniversalCard,
  SharedButton,
  ModalContainer,
  CodexGrid
} from '../../../components/shared';
import {
  Shield,
  BookOpen,
  Zap,
  Swords,
  TrendingUp,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

export const VaultGalleries: React.FC = () => {
  const {
    arenaSlots,
    equipRelic,
    unequipRelic,
    energyReserves,
    getVaultByCategory,
  } = useGoldenHourStore();

  const [activeCategory, setActiveCategory] = useState<VaultCategory>('tactical');
  const [selectedSlotForEquip, setSelectedSlotForEquip] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<PullItem | null>(null);

  const tacticalItems = getVaultByCategory('tactical');
  const collectionItems = getVaultByCategory('collection');
  const energyItems = getVaultByCategory('energy');

  const isEquippedInAnySlot = (itemId: string): number | null => {
    const slot = arenaSlots.find((s) => s.equippedItem?.id === itemId);
    return slot ? slot.slotIndex : null;
  };

  const toCodexItem = (item: PullItem) => ({
    id: item.id,
    name: item.name,
    score: item.score,
    rank: item.rank,
    type: item.rarity ? `${item.rarity.toUpperCase()} ${item.category}` : item.category,
    description: item.description,
  });

  const categoryTabs = [
    { id: 'tactical' as VaultCategory, label: 'Tactical Arsenal', icon: <Swords className="w-4 h-4" /> },
    { id: 'collection' as VaultCategory, label: 'Cultural Lore', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'energy' as VaultCategory, label: 'IoT Energy', icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Category Sub-Navigation */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-[#120f18] border border-[#2b2238]">
        <div className="flex items-center gap-2">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-cinzel font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#ffd86b] text-black shadow-gold-sm'
                    : 'text-[#8c7a9e] hover:text-white hover:bg-[#1c1626]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tactical Arsenal Tab Content */}
      {activeCategory === 'tactical' && (
        <div className="space-y-6">
          {/* Target Slot Selector for Quick-Equipping */}
          <div className="p-4 rounded-xl bg-[#120f18] border border-[#2b2238] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-mono text-[#cbd5e1]">
              <Shield className="w-4 h-4 text-[#ffd86b]" />
              <span>Target Arena Loadout Slot:</span>
            </div>

            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((slotIdx) => {
                const isSelected = selectedSlotForEquip === slotIdx;
                const slotItem = arenaSlots[slotIdx]?.equippedItem;

                return (
                  <SharedButton
                    key={slotIdx}
                    variant={isSelected ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setSelectedSlotForEquip(slotIdx)}
                    className={`flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#ffd86b] text-black ring-2 ring-[#d4af37]'
                        : 'bg-[#171320] text-[#8c7a9e] hover:text-white border border-[#2b2238]'
                    }`}
                  >
                    <span>Slot {slotIdx + 1}</span>
                    {slotItem && (
                      <span className="text-[10px] opacity-80 truncate max-w-[60px]">
                        ({slotItem.name.split(' ')[0]})
                      </span>
                    )}
                  </SharedButton>
                );
              })}
            </div>
          </div>

          {tacticalItems.length === 0 ? (
            <div className="p-12 text-center bg-[#120f18] rounded-2xl border border-[#2b2238] space-y-4">
              <Swords className="w-10 h-10 text-[#685c78] mx-auto" />
              <h4 className="font-cinzel text-base font-bold text-[#8c7a9e]">No Tactical Relics Found</h4>
              <p className="text-xs text-[#685c78]">Summon packs in Tab 2 (Summoning Altar) or inject dev cheat relics.</p>
            </div>
          ) : (
            <CodexGrid
              items={tacticalItems.map(toCodexItem)}
              itemsPerPage={4}
              onItemClick={(item) => {
                const found = tacticalItems.find((t) => t.id === item.id);
                if (found) {
                  setSelectedItem(found);
                  setIsModalOpen(true);
                }
              }}
              showDetails={false}
              className="space-y-4"
            />
          )}
        </div>
      )}

      {/* Cultural Lore Tab Content */}
      {activeCategory === 'collection' && (
        <div className="space-y-6">
          {collectionItems.length === 0 ? (
            <div className="p-12 text-center bg-[#120f18] rounded-2xl border border-[#2b2238] space-y-4">
              <BookOpen className="w-10 h-10 text-[#685c78] mx-auto" />
              <h4 className="font-cinzel text-base font-bold text-[#8c7a9e]">No Collectibles Unlocked</h4>
              <p className="text-xs text-[#685c78]">Historical records and cuneiform artifacts will appear here upon summoning.</p>
            </div>
          ) : (
            <CodexGrid
              items={collectionItems.map(toCodexItem)}
              itemsPerPage={4}
              onItemClick={(item) => {
                const found = collectionItems.find((c) => c.id === item.id);
                if (found) {
                  setSelectedItem(found);
                  setIsModalOpen(true);
                }
              }}
              showDetails={true}
              className="space-y-4"
            />
          )}
        </div>
      )}

      {/* IoT Energy Tab Content */}
      {activeCategory === 'energy' && (
        <div className="space-y-6">
          {/* Elemental Reserve Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(Object.keys(ELEMENT_REGISTRY) as ElementalAttribute[]).map((attr) => {
              const element = ELEMENT_REGISTRY[attr];
              const value = energyReserves[attr] || 0;

              return (
                <UniversalCard
                  key={attr}
                  title={element.name}
                  subtitle={attr.toUpperCase()}
                  description={`Elemental energy reserve`}
                  type="Elemental Reserve"
                  score={Math.min(16, (value / 250) * 16)} // Normalize to 0-16 scale
                  rank={value >= 200 ? '✦' : value >= 150 ? 'S₄' : value >= 100 ? 'S₃' : value >= 50 ? 'S₂' : 'S₁'}
                  icon={
                    <span className="w-5 h-5" style={{ color: element.color }}>
                      {element.icon}
                    </span>
                  }
                  className="bg-[#120f18] border-[#2b2238]"
                />
              );
            })}
          </div>

          {/* Harvested Core History */}
          <div className="space-y-4">
            {energyItems.length === 0 ? (
              <p className="text-xs text-[#685c78] italic text-center">No individual energy cores logged in history.</p>
            ) : (
              <CodexGrid
                items={energyItems.map(toCodexItem)}
                itemsPerPage={6}
                onItemClick={(item) => {
                  const found = energyItems.find((e) => e.id === item.id);
                  if (found) {
                    setSelectedItem(found);
                    setIsModalOpen(true);
                  }
                }}
                showDetails={true}
                className="space-y-4"
              />
            )}
          </div>
        </div>
      )}

      {/* Shared Modal for Item Details */}
      <ModalContainer
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
        }}
        title="Item Details"
        subtitle="View detailed information about selected item"
        icon={<Sparkles className="w-5 h-5 text-[#ffd86b]" />}
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Item Header */}
            <div className="flex items-center justify-between border-b border-[#2b2238] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffd86b]/20 to-[#841822]/30 border border-[#ffd86b]/40 flex items-center justify-center text-[#ffd86b]">
                  {selectedItem.iconEmoji ? (
                    <span className="w-5 h-5">{selectedItem.iconEmoji}</span>
                  ) : (
                    <Shield className="w-5 h-5 text-[#ffd86b]" />
                  )}
                </div>
                <div>
                  <h3 className="font-cinzel text-base font-bold text-white uppercase tracking-wider">
                    {selectedItem.name || 'Unknown Item'}
                  </h3>
                  {selectedItem.category && (
                    <p className="text-xs text-[#8c7a9e]">{selectedItem.rarity.toUpperCase()} {selectedItem.category}</p>
                  )}
                </div>
              </div>

              <SharedButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedItem(null);
                }}
              >
                Close
              </SharedButton>
            </div>

            {/* Item Description */}
            {selectedItem.description && (
              <div className="space-y-3">
                <p className="text-xs text-[#9c93a8] leading-relaxed">
                  {selectedItem.description}
                </p>
              </div>
            )}

            {/* Hazard Badge */}
            {selectedItem.score !== undefined && selectedItem.rank !== undefined && (
              <div className="flex items-center justify-center space-y-4">
                <HazardBadge
                  score={selectedItem.score}
                  rank={selectedItem.rank}
                  size="lg"
                  showDetails={true}
                />
              </div>
            )}

            {/* Stats Section */}
            {selectedItem.stats && selectedItem.stats.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                    Combat Stats
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 rounded-xl bg-[#171320] border border-[#2b2238]">
                  {selectedItem.stats.map((s) => (
                    <div key={s.name} className="flex justify-between">
                      <span className="text-[#8c7a9e]">{s.name}:</span>
                      <strong className={s.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {s.value >= 0 ? `+${s.value}` : s.value}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buffs Section */}
            {selectedItem.buffs && selectedItem.buffs.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                    Tactical Buffs
                  </h3>
                </div>
                <div className="space-y-2">
                  {selectedItem.buffs.map((b, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#082015] border border-[#16a34a]/40">
                      <TrendingUp className="w-3 h-3" />
                      <div>
                        <strong className="text-emerald-300">{b.name}</strong>
                        <p className="text-[10px] text-[#9c93a8]">{b.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Downsides Section */}
            {selectedItem.downsides && selectedItem.downsides.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                    Double-Edged Curses
                  </h3>
                </div>
                <div className="space-y-2">
                  {selectedItem.downsides.map((d, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#3b080f]/40 border border-[#841822]">
                      <AlertTriangle className="w-3 h-3" />
                      <div>
                        <strong className="text-rose-300">{d.name}</strong>
                        <p className="text-[10px] text-[#9c93a8]">{d.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lore Section for Collectibles */}
            {selectedItem.loreText && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                    Historical Lore
                  </h3>
                </div>
                <div className="p-3 rounded-xl bg-[#171320] border border-[#2b2238]">
                  <p className="text-xs text-[#cbd5e1] font-serif italic">
                    "{selectedItem.loreText}"
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              {selectedItem.category === 'relic' && (
                <>
                  <SharedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const slot = isEquippedInAnySlot(selectedItem.id);
                      if (slot !== null) {
                        unequipRelic(slot);
                      } else {
                        equipRelic(selectedSlotForEquip, selectedItem.id);
                      }
                      setIsModalOpen(false);
                      setSelectedItem(null);
                    }}
                  >
                    {isEquippedInAnySlot(selectedItem.id) !== null ? 'Unequip' : 'Equip to Slot'}
                  </SharedButton>
                  <SharedButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedItem(null);
                    }}
                  >
                    Close
                  </SharedButton>
                </>
              )}
              {(selectedItem.category === 'collectible' || selectedItem.category === 'energy-core') && (
                <SharedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedItem(null);
                  }}
                >
                  Close
                </SharedButton>
              )}
            </div>
          </div>
        )}
      </ModalContainer>
    </div>
  );
};

export default VaultGalleries;
