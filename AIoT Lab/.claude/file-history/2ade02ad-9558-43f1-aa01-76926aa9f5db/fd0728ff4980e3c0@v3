import React, { useState, useEffect } from 'react';
import { WorldEntity, AlbumEntity } from '../types/identity';
import { CharactersTableView } from './components/identity/CharactersTableView';
import { VariantsTableView } from './components/identity/VariantsTableView';
import { WorldsTableView } from './components/identity/WorldsTableView';
import { AlbumsTableView } from './components/identity/AlbumsTableView';
import {
  User,
  Layers,
  Globe,
  Database,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';

type IdentitySubTab = 'characters' | 'variants' | 'worlds' | 'albums';

export const IdentityStudioApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IdentitySubTab>('characters');
  const [worlds, setWorlds] = useState<WorldEntity[]>([]);
  const [albums, setAlbums] = useState<AlbumEntity[]>([]);
  const [charactersList, setCharactersList] = useState<any[]>([]);
  const [filterCharForVariants, setFilterCharForVariants] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [wRes, cRes, aRes] = await Promise.all([
        fetch('/api/worlds'),
        fetch('/api/characters/all'),
        fetch('/api/albums'),
      ]);
      if (wRes.ok) {
        const wData: WorldEntity[] = await wRes.json();
        setWorlds(wData);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCharactersList(cData);
      }
      if (aRes.ok) {
        const aData: AlbumEntity[] = await aRes.json();
        setAlbums(aData);
      }
    } catch (e) {
      console.error('[IdentityStudio] Load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectCharacterForVariants = (charCode: string) => {
    setFilterCharForVariants(charCode);
    setActiveTab('variants');
  };

  const handleFilterByWorld = (worldName: string) => {
    setActiveTab('characters');
  };

  const tabs: { id: IdentitySubTab; label: string; count?: number; icon: React.ReactNode }[] = [
    {
      id: 'characters',
      label: 'Original Characters',
      count: charactersList.length,
      icon: <User className="w-4 h-4" />,
    },
    {
      id: 'variants',
      label: 'Variants & Skins',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'worlds',
      label: 'Worlds & Series',
      count: worlds.length,
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'albums',
      label: 'Album Containers',
      count: albums.length,
      icon: <FolderOpen className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-hazard-void text-hazard-textBright flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="border-b border-hazard-border bg-hazard-card/90 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-hazard-gold to-hazard-amber shadow-hazard-glow text-black font-black">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-hazard-textBright">
                Hazard Identity Studio
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-hazard-cyan/15 text-hazard-cyan border border-hazard-cyan/30 font-bold">
                SQLite 3-Tier Core
              </span>
            </div>
            <p className="text-xs text-hazard-textMuted font-mono mt-0.5">
              Authoritative Character Identities, Variants & World Registry
            </p>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-hazard-void border border-hazard-border text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-hazard-textMuted">rebased.db :8081</span>
          </div>

          <button
            onClick={loadData}
            title="Reload SQLite data"
            className="p-2.5 text-hazard-textMuted hover:text-hazard-gold bg-hazard-void border border-hazard-border rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-hazard-gold' : ''}`} />
          </button>

          {/* Switch to Legacy Studio Button */}
          <a
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-hazard-void border border-hazard-border hover:border-hazard-gold/50 text-hazard-textBright hover:text-hazard-gold rounded-xl transition"
          >
            <span>Legacy Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col gap-6 flex-1">
        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-2 p-1.5 bg-hazard-card border border-hazard-border rounded-2xl w-fit">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'variants') setFilterCharForVariants('all');
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition select-none ${
                  isActive
                    ? 'bg-gradient-to-r from-hazard-gold to-hazard-goldGlow text-black shadow-hazard-glow'
                    : 'text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-black/30 text-black' : 'bg-hazard-void text-hazard-textMuted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tab 1: Characters Table */}
        {activeTab === 'characters' && (
          <CharactersTableView
            worlds={worlds}
            albums={albums}
            onSelectCharacterForVariants={handleSelectCharacterForVariants}
          />
        )}

        {/* Tab 2: Variants Table */}
        {activeTab === 'variants' && (
          <VariantsTableView
            initialCharFilter={filterCharForVariants}
            characters={charactersList}
          />
        )}

        {/* Tab 3: Worlds Table */}
        {activeTab === 'worlds' && (
          <WorldsTableView
            worlds={worlds}
            onRefresh={loadData}
            onFilterByWorld={handleFilterByWorld}
          />
        )}

        {/* Tab 4: Albums Table */}
        {activeTab === 'albums' && (
          <AlbumsTableView
            albums={albums}
            onRefresh={loadData}
          />
        )}
      </main>
    </div>
  );
};
