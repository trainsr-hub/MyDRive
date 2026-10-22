import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import { TargetEngine } from '../../types/schema';
import {
  Flame,
  RefreshCw,
  Lock,
  Unlock,
  Save,
  Trash2,
  Database,
  Sliders,
  Check,
  Layers,
} from 'lucide-react';

interface HeaderBarProps {
  onOpenPools: () => void;
  onOpenJsonEditor: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ onOpenPools, onOpenJsonEditor }) => {
  const {
    presets,
    activePresetId,
    targetEngine,
    seed,
    isSeedLocked,
    loadPreset,
    saveCurrentPreset,
    setTargetEngine,
    setSeed,
    toggleSeedLock,
    reroll,
    clearSelections,
    reloadVaultData,
    activeNodeIds,
  } = useStudioStore();

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isReloading, setIsReloading] = useState(false);

  const engines: TargetEngine[] = ['ComfyUI', 'SD_WebUI', 'NovelAI', 'Midjourney', 'Flux'];

  const handleSavePreset = async () => {
    if (!newPresetName.trim()) return;
    await saveCurrentPreset(newPresetName.trim());
    setNewPresetName('');
    setIsSavingPreset(false);
  };

  const handleReload = async () => {
    setIsReloading(true);
    await reloadVaultData();
    setTimeout(() => setIsReloading(false), 500);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-hazard-border bg-hazard-void/90 backdrop-blur-md shrink-0">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-hazard-crimson to-hazard-amber shadow-crimson-glow text-white">
          <Flame className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-wider uppercase text-hazard-textBright">
              Hazard Trigger <span className="text-hazard-gold text-xs font-mono px-2 py-0.5 rounded bg-hazard-gold/10 border border-hazard-gold/30">STUDIO</span>
            </h1>
          </div>
          <p className="text-xs text-hazard-textMuted">
            {activeNodeIds.length} Nodes Active • Sovereign Prompt Engine
          </p>
        </div>
      </div>

      {/* Center Controls: Presets & Engine */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Preset Selector */}
        <div className="flex items-center gap-1 bg-hazard-card border border-hazard-border rounded-lg p-1">
          <Layers className="w-4 h-4 ml-2 text-hazard-gold" />
          <select
            value={activePresetId || ''}
            onChange={(e) => loadPreset(e.target.value)}
            className="bg-transparent text-xs text-hazard-textBright px-2 py-1 outline-none cursor-pointer"
          >
            <option value="" disabled>Select Preset</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id} className="bg-hazard-card text-hazard-textBright">
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsSavingPreset(!isSavingPreset)}
            title="Save Current as Preset"
            className="p-1.5 text-hazard-textMuted hover:text-hazard-gold hover:bg-hazard-cardHover rounded transition"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Engine Target Selector */}
        <div className="flex items-center bg-hazard-card border border-hazard-border rounded-lg p-1">
          <Sliders className="w-4 h-4 ml-2 text-hazard-cyan" />
          <select
            value={targetEngine}
            onChange={(e) => setTargetEngine(e.target.value as TargetEngine)}
            className="bg-transparent text-xs text-hazard-textBright px-2 py-1 outline-none cursor-pointer"
          >
            {engines.map((eng) => (
              <option key={eng} value={eng} className="bg-hazard-card text-hazard-textBright">
                {eng}
              </option>
            ))}
          </select>
        </div>

        {/* Seed Controls */}
        <div className="flex items-center gap-1 bg-hazard-card border border-hazard-border rounded-lg px-2 py-1">
          <button
            onClick={toggleSeedLock}
            className={`p-1 rounded transition ${isSeedLocked ? 'text-hazard-amber' : 'text-hazard-textMuted hover:text-white'}`}
            title={isSeedLocked ? 'Seed Locked' : 'Seed Unlocked (Auto-Roll)'}
          >
            {isSeedLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
            className="w-24 bg-transparent text-xs font-mono text-hazard-gold outline-none"
            placeholder="Seed"
          />
        </div>
      </div>

      {/* Action Buttons: Reroll, Gacha Inspector, JSON & Clear */}
      <div className="flex items-center gap-2">
        {/* Re-roll Trigger Button */}
        <button
          onClick={reroll}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-gradient-to-r from-hazard-gold to-hazard-goldGlow hover:brightness-110 active:scale-95 rounded-lg shadow-hazard-glow transition"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Re-Roll Graph</span>
        </button>

        {/* Gacha Pools Drawer Trigger */}
        <button
          onClick={onOpenPools}
          title="Inspect Gacha Pools"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-hazard-cyan bg-hazard-cyan/10 border border-hazard-cyan/30 hover:bg-hazard-cyan/20 rounded-lg transition"
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Gacha Pools</span>
        </button>

        {/* Vault Data Manager / Hot-Reload */}
        <button
          onClick={handleReload}
          title="Reload Vault JSON Files"
          className={`p-2 text-hazard-textMuted hover:text-hazard-gold bg-hazard-card border border-hazard-border rounded-lg transition ${isReloading ? 'animate-spin text-hazard-gold' : ''}`}
        >
          <Database className="w-4 h-4" />
        </button>

        {/* JSON Schema Explorer */}
        <button
          onClick={onOpenJsonEditor}
          title="Open Vault JSON Inspector"
          className="px-2.5 py-2 text-xs text-hazard-textMuted hover:text-white bg-hazard-card border border-hazard-border rounded-lg transition"
        >
          JSON Data
        </button>

        {/* Clear All */}
        <button
          onClick={clearSelections}
          title="Clear Node Selections"
          className="p-2 text-hazard-textMuted hover:text-hazard-crimson bg-hazard-card border border-hazard-border rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Save Preset Inline Dialog */}
      {isSavingPreset && (
        <div className="w-full flex items-center gap-2 p-2 mt-2 bg-hazard-card border border-hazard-gold/40 rounded-lg animate-fadeIn">
          <input
            type="text"
            placeholder="Enter Preset Name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="flex-1 bg-hazard-void border border-hazard-border px-3 py-1 text-xs text-hazard-textBright rounded outline-none focus:border-hazard-gold"
          />
          <button
            onClick={handleSavePreset}
            className="flex items-center gap-1 px-3 py-1 bg-hazard-gold text-black font-semibold text-xs rounded hover:brightness-110 transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => setIsSavingPreset(false)}
            className="px-2 py-1 text-xs text-hazard-textMuted hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      )}
    </header>
  );
};
