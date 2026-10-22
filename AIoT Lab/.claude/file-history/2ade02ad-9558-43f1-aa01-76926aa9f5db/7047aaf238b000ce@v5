import React, { useEffect, useState } from 'react';
import { App as ObsidianApp } from 'obsidian';
import { useTriggerStore } from '../store/useTriggerStore';
import { ComponentCardSelector } from './components/ComponentCardSelector';
import { TemplateBar } from './components/TemplateBar';
import { LockedRollsBar } from './components/LockedRollsBar';
import { ConditionConflictBanner } from './components/ConditionConflictBanner';
import { SaveTemplateModal } from './components/SaveTemplateModal';
import { TemplatesView } from './components/TemplatesView';
import { DynamicMatrixBar } from './components/DynamicMatrixBar';
import { RatingAnalyticsModal } from './components/RatingAnalyticsModal';
import { RetractableMasterPromptPanel } from './components/RetractableMasterPromptPanel';
import { ReverseEngineeringView } from './components/ReverseEngineeringView';
import { ComponentsManagerView } from './components/ComponentsManagerView';
import { ConditionsManagerView } from './components/ConditionsManagerView';
import { TournamentBracketView } from './components/TournamentBracketView';
import { renderComponentIcon } from '../utils/iconResolver';
import { HazardTemplate } from '../types/schema';
import {
  Zap,
  Bookmark,
  Layers,
  Sparkles,
  Dices,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Users,
  Eye,
  Terminal,
  Hash,
  ScanSearch,
  Trophy,
  Database,
} from 'lucide-react';

interface AppProps {
  app: ObsidianApp;
}

type TabType = 'triggers' | 'tournaments' | 'templates' | 'reverse' | 'components' | 'conditions' | 'pools' | 'wildcards' | 'exclusions';

export const App: React.FC<AppProps> = ({ app }) => {
  const {
    init,
    reload,
    isLoading,
    folders,
    matrixDomains,
    clearAllSelections,
    randomizeAll,
    rerollRandoms,
    randomCount,
    telemetry,
    activeKeywords,
    activeExclusions,
    compiledPrompt,
    tokenCount,
    applyTemplate,
    _workspace,
    setWorkspaceState,
  } = useTriggerStore();

  const activeTab = _workspace?.activeTab || 'triggers';
  const setActiveTab = (tab: TabType) => setWorkspaceState({ activeTab: tab });
  const [copied, setCopied] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  useEffect(() => {
    init(app);
  }, [app, init]);

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'triggers', label: 'Triggers', icon: <Zap className="w-5 h-5" /> },
    { id: 'tournaments', label: 'Tournaments', icon: <Trophy className="w-5 h-5 text-hazard-gold" /> },
    { id: 'templates', label: 'Templates', icon: <Bookmark className="w-5 h-5" /> },
    { id: 'reverse', label: 'Reverse Eng', icon: <ScanSearch className="w-5 h-5" /> },
    { id: 'components', label: 'Components', icon: <Layers className="w-5 h-5" /> },
    { id: 'conditions', label: 'Conditions', icon: <ShieldAlert className="w-5 h-5" /> },
    { id: 'pools', label: 'Pools', icon: <Dices className="w-5 h-5" /> },
    { id: 'wildcards', label: 'Wildcards', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'exclusions', label: 'Exclusions', icon: <ShieldAlert className="w-5 h-5" /> },
  ];

  const handleCopy = () => {
    if (!compiledPrompt) return;
    navigator.clipboard.writeText(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReroll = () => {
    setIsRolling(true);
    rerollRandoms();
    setTimeout(() => setIsRolling(false), 300);
  };

  const handleApplyTemplateAndNavigate = (template: HazardTemplate) => {
    applyTemplate(template);
    setActiveTab('triggers');
  };

  const totalSectionsCount = folders.length + matrixDomains.length;

  return (
    <div className="hazard-trigger-studio-root">
      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />

      {/* Rating & Performance Telemetry Analytics Dashboard Modal */}
      <RatingAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Centered Main Workspace with Extended Width */}
      <div className="max-w-6xl mx-auto w-full px-8 py-8 flex flex-col gap-8 pb-36">
        {/* Top Tab Switcher */}
        <nav className="flex items-center justify-between gap-4 p-2.5 bg-hazard-card/80 border border-hazard-border rounded-2xl backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              const isFirst = idx === 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 rounded-xl font-bold tracking-wide transition-all duration-200 select-none whitespace-nowrap ${
                    isFirst ? 'px-6 py-3.5 text-sm uppercase' : 'px-5 py-3 text-xs'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-hazard-gold to-hazard-goldGlow text-black shadow-hazard-glow scale-[1.02]'
                      : 'text-hazard-textMuted hover:text-white hover:bg-hazard-cardHover'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pr-2">
            {/* Link to Separated Identity Database UI */}
            <a
              href="/identity.html"
              title="Open Standalone SQLite Character Identity & Worlds Studio"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-hazard-gold bg-hazard-gold/15 border border-hazard-gold/40 hover:bg-hazard-gold hover:text-black rounded-xl transition shadow-sm"
            >
              <Database className="w-4 h-4" />
              <span className="hidden md:inline">Identity Studio</span>
            </a>

            {/* Quick Randomize All */}
            <button
              onClick={() => randomizeAll()}
              title="Randomize All Components (Set to Random Roll 🎲)"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-hazard-purple bg-hazard-purple/10 border border-hazard-purple/30 hover:bg-hazard-purple/20 hover:border-hazard-purple rounded-xl transition"
            >
              <Dices className="w-4 h-4" />
              <span className="hidden sm:inline">Random All</span>
            </button>

            {/* Re-roll / Generate Randoms */}
            <button
              onClick={handleReroll}
              title="Re-Roll Random Components"
              className="p-2.5 text-hazard-textMuted hover:text-hazard-gold bg-hazard-card border border-hazard-border rounded-xl transition hover:border-hazard-gold/50"
            >
              <RefreshCw className={`w-4 h-4 ${isRolling ? 'animate-spin text-hazard-gold' : ''}`} />
            </button>

            {/* Reload from disk */}
            <button
              onClick={() => reload()}
              title="Reload Component & Matrix Files from Disk"
              className="p-2.5 text-hazard-textMuted hover:text-hazard-cyan bg-hazard-card border border-hazard-border rounded-xl transition hover:border-hazard-cyan/50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-hazard-cyan' : ''}`} />
            </button>

            {/* Clear All */}
            <button
              onClick={() => clearAllSelections()}
              title="Clear All Selections (Set to Blank)"
              className="p-2.5 text-hazard-textMuted hover:text-hazard-crimson bg-hazard-card border border-hazard-border rounded-xl transition hover:border-hazard-crimson/50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* Tab 1: Triggers Engine View */}
        {activeTab === 'triggers' && (
          <div className="flex flex-col gap-6">
            {/* Active Template Status Bar & Quick Switcher */}
            <TemplateBar
              onOpenSaveModal={() => setIsSaveModalOpen(true)}
              onNavigateToTemplates={() => setActiveTab('templates')}
            />

            {/* Horizontal Dock of Currently Locked Random Rolls */}
            <LockedRollsBar />

            {/* Collision & Condition Conflict Notification Banner */}
            <ConditionConflictBanner />

            {/* Subject & Visible Subject Telemetry Header */}
            <div className="p-4 rounded-2xl bg-hazard-card/90 border border-hazard-border shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-hazard-cyan/10 border border-hazard-cyan/30 text-hazard-cyan">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-hazard-textBright">
                    Subject & Observer Telemetry
                  </h3>
                  <p className="text-[11px] text-hazard-textMuted font-mono">
                    Subject Cardinality + POV Vector Resolution
                  </p>
                </div>
              </div>

              {/* Badges / Telemetry Indicators */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                {/* Random Count Badge if Active */}
                {randomCount > 0 && (
                  <div className="px-3 py-1.5 rounded-lg bg-hazard-purple/20 border border-hazard-purple/50 text-hazard-purple flex items-center gap-1.5 font-bold shadow-sm">
                    <Dices className="w-3.5 h-3.5 animate-pulse" />
                    <span>{randomCount} Random</span>
                  </div>
                )}

                {/* Visible Count */}
                <div className="px-3 py-1.5 rounded-lg bg-hazard-void border border-hazard-border flex items-center gap-2">
                  <span className="text-hazard-textMuted">Visible:</span>
                  <strong className="text-hazard-cyan">
                    {telemetry.visibleFemales}♀ / {telemetry.visibleMales}♂
                  </strong>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-hazard-card text-hazard-textBright">
                    Total: {telemetry.totalVisible}
                  </span>
                </div>

                {/* Solo Indicator */}
                <div
                  className={`px-3 py-1.5 rounded-lg border transition ${
                    telemetry.isSolo
                      ? 'bg-hazard-gold/10 border-hazard-gold/50 text-hazard-gold font-bold shadow-hazard-glow'
                      : 'bg-hazard-void border-hazard-border text-hazard-textMuted'
                  }`}
                >
                  Solo Mode: {telemetry.isSolo ? 'ACTIVE' : 'OFF'}
                </div>

                {/* POV Indicator */}
                <div
                  className={`px-3 py-1.5 rounded-lg border transition flex items-center gap-1.5 ${
                    telemetry.isPOV
                      ? 'bg-hazard-crimson/10 border-hazard-crimson/50 text-hazard-crimson font-bold'
                      : 'bg-hazard-void border-hazard-border text-hazard-textMuted'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>POV: {telemetry.isPOV ? 'ENGAGED' : '3RD PERSON'}</span>
                </div>
              </div>
            </div>

            {/* Empty State */}
            {totalSectionsCount === 0 ? (
              <div className="p-12 text-center border border-dashed border-hazard-border rounded-2xl bg-hazard-card/20">
                <p className="text-sm text-hazard-textMuted">No component folders found in Hazard_Trigger_Data/Components/ or Matrices/.</p>
                <p className="text-xs text-hazard-textMuted/60 mt-1">Add subfolders and JSON files to begin building triggers.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* 1. Standalone Atomic Component Folders (Loaded from Hazard_Trigger_Data/Components/) */}
                {folders.map((folder) => (
                  <section key={folder.relPath} className="flex flex-col gap-4">
                    {/* Folder Header */}
                    <div className="flex flex-col gap-1 pb-2 border-b border-hazard-border">
                      <div className="flex items-center gap-2.5">
                        {renderComponentIcon(
                          folder.meta?.icon,
                          'w-4 h-4 text-hazard-gold',
                          <Hash className="w-4 h-4 text-hazard-gold" />
                        )}
                        <h2 className="text-base font-bold text-hazard-textBright uppercase tracking-wider">
                          {folder.displayName}
                        </h2>
                      </div>
                      {folder.meta?.description && (
                        <p className="text-xs text-hazard-textMuted font-mono pl-6">
                          {folder.meta.description}
                        </p>
                      )}
                    </div>

                    {/* Component Card Selectors Row */}
                    <div className="flex flex-wrap items-start gap-8 p-6 rounded-2xl bg-hazard-card/40 border border-hazard-border/60">
                      {folder.files.map((file) => (
                        <ComponentCardSelector
                          key={file.relPath}
                          file={file}
                          folderName={folder.displayName}
                        />
                      ))}
                    </div>
                  </section>
                ))}

                {/* 2. Dynamic Hierarchical Matrix Domains (Loaded from Hazard_Trigger_Data/Matrices/) - Positioned Behind Components */}
                {matrixDomains.map((domain) => (
                  <section key={domain.relPath} className="flex flex-col gap-4">
                    {/* Domain Header */}
                    <div className="flex flex-col gap-1 pb-2 border-b border-hazard-border">
                      <div className="flex items-center gap-2.5">
                        <Layers className="w-4 h-4 text-hazard-gold" />
                        <h2 className="text-base font-bold text-hazard-textBright uppercase tracking-wider">
                          {domain.displayName}
                        </h2>
                      </div>
                      <p className="text-xs text-hazard-textMuted font-mono pl-6">
                        Hierarchical Matrix Domain (Loaded from <code className="text-hazard-cyan">{domain.relPath}/</code>)
                      </p>
                    </div>

                    {/* Data-Driven Dynamic Matrix Bar (Base Anchors + Unlocked Pools) */}
                    <DynamicMatrixBar domain={domain} />

                    {/* Domain Child Component Card Selectors */}
                    <div className="flex flex-wrap items-start gap-8 p-6 rounded-2xl bg-hazard-card/40 border border-hazard-border/60">
                      {domain.files.map((file) => (
                        <ComponentCardSelector
                          key={file.relPath}
                          file={file}
                          folderName={domain.displayName}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* Retractable Master Compiled Prompt Output Panel (Click to Open / Click Outside to Close) */}
            <RetractableMasterPromptPanel onOpenAnalytics={() => setIsAnalyticsOpen(true)} />
          </div>
        )}

        {/* Tab 1.5: Tournament Dual-Wing Bracket Studio */}
        {activeTab === 'tournaments' && <TournamentBracketView />}

        {/* Tab 2: Templates Management View */}
        {activeTab === 'templates' && (
          <TemplatesView
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
            onApplyAndNavigate={handleApplyTemplateAndNavigate}
          />
        )}

        {/* Tab 3: Reverse Engineering / Prompt Decompiler View */}
        {activeTab === 'reverse' && (
          <ReverseEngineeringView
            onApplyAndNavigate={() => setActiveTab('triggers')}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
          />
        )}

        {/* Tab 4: Components & Options Schema Studio (Notion Table View) */}
        {activeTab === 'components' && <ComponentsManagerView />}

        {/* Tab 5: Conditions & Physics Collision Studio */}
        {activeTab === 'conditions' && <ConditionsManagerView />}

        {/* Placeholder Canvas for Other Tabs */}
        {activeTab !== 'triggers' &&
          activeTab !== 'tournaments' &&
          activeTab !== 'templates' &&
          activeTab !== 'reverse' &&
          activeTab !== 'components' &&
          activeTab !== 'conditions' && (
            <main className="flex-1 min-h-[450px] flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-hazard-border/80 bg-hazard-card/30 text-center">
              <h2 className="text-xl font-bold text-hazard-textBright tracking-wider uppercase">
                {activeTab} Management
              </h2>
              <p className="text-sm text-hazard-textMuted max-w-md mt-2">
                Autonomous object inspector and file catalog for {activeTab}.
              </p>
            </main>
          )}
      </div>
    </div>
  );
};
