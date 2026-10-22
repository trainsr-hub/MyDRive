// path: src/apps/golden-hour/GoldenHour.tsx

import React, { useState } from 'react';
import { AreaTab } from './components/AreaTab';
import { GachaAltar } from './components/GachaAltar';
import { VaultGalleries } from './components/VaultGalleries';
import { GoldenHourConfig } from './components/GoldenHourConfig';
import { calculateHazardFromTime } from './store/useGoldenHourStore';
import { useCurrencyStore } from '../../store/useCurrencyStore';
import { GameLayout } from '../../components/GameLayout';
import { Sparkles, Users, Archive, Sliders } from 'lucide-react';

type GoldenHourTab = 'area' | 'gacha' | 'vault' | 'config';

export const GoldenHour: React.FC = () => {
  // Default: Area/Resource Config tab (replaces Arena) per Manager vision
  const [activeTab, setActiveTab] = useState<GoldenHourTab>('area');

  const timeBalance = useCurrencyStore((s) => s.timeBalance);
  const { goldenHours, hazardLevel } = calculateHazardFromTime(timeBalance);

  const tabs = [
    { id: 'area', label: 'Resource / Config', icon: <Users className="w-4 h-4" /> },
    { id: 'gacha', label: 'Gacha', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'vault', label: 'Vault', icon: <Archive className="w-4 h-4" /> },
    { id: 'config', label: 'Config', icon: <Sliders className="w-4 h-4" /> }
  ];

  return (
    <GameLayout
      gameTitle="Golden Hour"
      gameTitleIcon={<Sparkles />}
      gameTitleBadge="MASTER GAME"
      gameTitleSubtitle="Universal Stake Nexus • Babylonian Altar"
      globalInfo={{ hazardLevel, goldenHours }}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id as GoldenHourTab)}
    >
      {activeTab === 'area' && <AreaTab />}
      {activeTab === 'gacha' && <GachaAltar />}
      {activeTab === 'vault' && <VaultGalleries />}
      {activeTab === 'config' && <GoldenHourConfig />}
    </GameLayout>
  );
};

export default GoldenHour;