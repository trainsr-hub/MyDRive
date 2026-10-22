// path: src/apps/vinyl-angel/VinylAngel.tsx

import { useState } from 'react';
import { useVinylStore } from './store/useVinylStore';
import { VinylPlayer } from './components/VinylPlayer';
import { VinylGallery } from './components/VinylGallery';
import { VinylPlaylists } from './components/VinylPlaylists';
import { VinylIngestion } from './components/VinylIngestion';
import { VinylConfig } from './components/VinylConfig';
import { GameLayout } from '../../components/GameLayout';
import {
  Disc3,
  Trophy,
  ListMusic,
  DownloadCloud,
  Sliders,
} from 'lucide-react';

const TARGET_PROJECT_ID = 'music_app';

type VinylTab = 'gameplay' | 'gallery' | 'playlists' | 'ingestion' | 'config';

export function VinylAngel() {
  const { localTheme, discs, angelRollTickets } = useVinylStore();

  const [activeTab, setActiveTab] = useState<VinylTab>('gameplay');

  // Theme styling mapping for wrapper
  const themeClasses: Record<string, string> = {
    'celestial-gold': 'bg-[#0c0b0e] text-[#f5f0e8]',
    'obsidian-abyss': 'bg-[#050505] text-[#e2e8f0]',
    'crimson-void': 'bg-[#0d0406] text-[#fde8e8]',
    'emerald-sanctuary': 'bg-[#040d08] text-[#ecfdf5]',
    'cyber-neon': 'bg-[#070512] text-[#fdf4ff]',
  };

  return (
    <div className={`min-h-screen transition-colors duration-500 p-4 md:p-8 font-sans ${themeClasses[localTheme] || themeClasses['celestial-gold']}`}>
      <GameLayout
        showBackButton={true}
        backButtonLabel="Golden Hour"
        title="Vinyl Angel"
        gameTitleIcon={<Disc3 className="w-5 h-5 text-[#ffd86b]" />}
        gameTitleBadge="天界黑胶"
        gameTitleSubtitle="Autonomous Music Laboratory, Harmonic Hazard Scoring & Dynamic ETL Ingestion"
        globalInfo={{
          hazardLevel: undefined,
          goldenHours: undefined,
          discs: discs,
          tickets: angelRollTickets
        }}
        tabs={[
          { id: 'gameplay', label: 'Gameplay', icon: <Disc3 className="w-4 h-4" /> },
          { id: 'gallery', label: 'Gallery & Sync', icon: <Trophy className="w-4 h-4" /> },
          { id: 'playlists', label: 'Playlists', icon: <ListMusic className="w-4 h-4" /> },
          { id: 'ingestion', label: 'Song Ingestion', icon: <DownloadCloud className="w-4 h-4" /> },
          { id: 'config', label: 'Config', icon: <Sliders className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as VinylTab)}
      >
        <div className={activeTab === 'gameplay' ? 'block' : 'hidden'}>
          <VinylPlayer
            projectId={TARGET_PROJECT_ID}
            onNavigateToIngestion={() => setActiveTab('ingestion')}
          />
        </div>

        <div className={activeTab === 'gallery' ? 'block' : 'hidden'}>
          <VinylGallery
            projectId={TARGET_PROJECT_ID}
            onNavigateToIngestion={() => setActiveTab('ingestion')}
            onNavigateToGameplay={() => setActiveTab('gameplay')}
          />
        </div>

        <div className={activeTab === 'playlists' ? 'block' : 'hidden'}>
          <VinylPlaylists
            projectId={TARGET_PROJECT_ID}
            onNavigateToGameplay={() => setActiveTab('gameplay')}
          />
        </div>

        <div className={activeTab === 'ingestion' ? 'block' : 'hidden'}>
          <VinylIngestion
            projectId={TARGET_PROJECT_ID}
            onNavigateToGameplay={() => setActiveTab('gameplay')}
            onNavigateToGallery={() => setActiveTab('gallery')}
          />
        </div>

        <div className={activeTab === 'config' ? 'block' : 'hidden'}>
          <VinylConfig />
        </div>
      </GameLayout>
    </div>
  );
}

export default VinylAngel;