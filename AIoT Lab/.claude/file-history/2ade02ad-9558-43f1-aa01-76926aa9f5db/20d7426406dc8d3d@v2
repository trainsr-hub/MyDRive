import React, { useState, useEffect, useMemo } from 'react';
import { useTriggerStore } from '../../store/useTriggerStore';
import { ComponentEntry } from '../../utils/componentScanner';
import { ComponentManager } from '../../utils/componentManager';
import { ConditionManager } from '../../utils/conditionManager';
import { NotionConditionMultiSelect } from './NotionConditionMultiSelect';
import { generateHexId, formatHexDate } from '../../utils/hexId';
import {
  X,
  Save,
  RefreshCw,
  Sparkles,
  Layers,
  HelpCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  User,
  Users,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  CheckSquare,
  Search,
} from 'lucide-react';

interface OptionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileRelPath: string;
  fileDisplayName: string;
  initialKey?: string | null;
  initialEntry?: ComponentEntry | null;
  onSaved?: (savedKey: string) => void;
}

export const OptionEditorModal: React.FC<OptionEditorModalProps> = ({
  isOpen,
  onClose,
  fileRelPath,
  fileDisplayName,
  initialKey,
  initialEntry,
  onSaved,
}) => {
  const { app, folders, matrixDomains, conditions, reload } = useTriggerStore();

  const isEditing = Boolean(initialKey);

  // Form States
  const [key, setKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState('');
  const [tagTeam, setTagTeam] = useState<string[]>([]);
  const [antiPrompt, setAntiPrompt] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [impacts, setImpacts] = useState<string[]>([]);
  const [females, setFemales] = useState(0);
  const [males, setMales] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockKey, setLockKey] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [description, setDescription] = useState('');

  // Auxiliary Input helpers
  const [newReqInput, setNewReqInput] = useState('');
  const [newImpactInput, setNewImpactInput] = useState('');
  const [tagTeamSearch, setTagTeamSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize or reset form values
  useEffect(() => {
    if (isOpen) {
      if (initialKey && initialEntry) {
        setKey(initialKey);
        setDisplayName(initialEntry.display_name || initialKey);
        setPrompt(initialEntry.prompt || '');
        setImage(initialEntry.image || initialEntry.thumbnail || '');
        setTagTeam(Array.isArray(initialEntry.tag_team) ? initialEntry.tag_team : []);
        setAntiPrompt(
          typeof initialEntry['anti-prompt'] === 'string'
            ? initialEntry['anti-prompt']
            : Array.isArray(initialEntry.exclude)
            ? initialEntry.exclude.join(', ')
            : ''
        );
        setRequirements(
          Array.isArray(initialEntry.requirement)
            ? initialEntry.requirement
            : Array.isArray(initialEntry.require)
            ? initialEntry.require
            : []
        );
        setImpacts(
          Array.isArray(initialEntry.impact)
            ? initialEntry.impact
            : Array.isArray(initialEntry.keywords)
            ? initialEntry.keywords
            : []
        );
        if (Array.isArray(initialEntry.subjects) && initialEntry.subjects.length >= 2) {
          setFemales(initialEntry.subjects[0]);
          setMales(initialEntry.subjects[1]);
        } else {
          setFemales(0);
          setMales(0);
        }
        setIsLocked(Boolean(initialEntry.locked || initialEntry.lock));
        setLockKey(initialEntry.lockKey || '');
        setIsCompleted(Boolean(initialEntry.completed));
        setIsVisible(initialEntry.visible !== false);
        setDescription(initialEntry.description || '');
      } else {
        // Create new option: generate fresh Hex ID
        const freshHex = generateHexId();
        setKey(freshHex);
        setDisplayName('');
        setPrompt('');
        setImage('');
        setTagTeam([]);
        setAntiPrompt('');
        setRequirements([]);
        setImpacts([]);
        setFemales(0);
        setMales(0);
        setIsLocked(false);
        setLockKey('');
        setIsCompleted(false);
        setIsVisible(true);
        setDescription('');
      }
      setErrorMsg('');
      setIsSaving(false);
    }
  }, [isOpen, initialKey, initialEntry]);

  // Flat lookup of all existing options across the entire vault for Tag-Team inheritance
  const allAvailableOptions = useMemo(() => {
    const list: { key: string; name: string; fileRelPath: string; prompt: string; fileName: string }[] = [];
    folders.forEach((folder) => {
      folder.files.forEach((file) => {
        Object.entries(file.entries).forEach(([optKey, optEntry]: [string, any]) => {
          list.push({
            key: optKey,
            name: optEntry.display_name || optKey,
            fileRelPath: file.relPath,
            prompt: optEntry.prompt || '',
            fileName: file.displayName,
          });
        });
      });
    });
    matrixDomains.forEach((domain) => {
      domain.files.forEach((file) => {
        Object.entries(file.entries).forEach(([optKey, optEntry]: [string, any]) => {
          list.push({
            key: optKey,
            name: optEntry.display_name || optKey,
            fileRelPath: file.relPath,
            prompt: optEntry.prompt || '',
            fileName: file.displayName,
          });
        });
      });
    });
    return list;
  }, [folders, matrixDomains]);

  // Filtered list for Tag-Team search
  const filteredTagTeamOptions = useMemo(() => {
    if (!tagTeamSearch.trim()) return allAvailableOptions.slice(0, 15);
    const q = tagTeamSearch.toLowerCase();
    return allAvailableOptions
      .filter(
        (o) =>
          o.key.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.fileName.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [allAvailableOptions, tagTeamSearch]);

  // Live compiled prompt sandbox preview: Own Prompt + TagTeam Prompts - AntiPrompt
  const calculatedPromptPreview = useMemo(() => {
    const tokens: string[] = [];

    // 1. Own prompt tokens
    if (prompt.trim()) {
      prompt
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => tokens.push(t));
    }

    // 2. Tag-team inherited prompt tokens
    tagTeam.forEach((ttKey) => {
      const target = allAvailableOptions.find((o) => o.key === ttKey);
      if (target && target.prompt) {
        target.prompt
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
          .forEach((t) => tokens.push(t));
      }
    });

    // 3. Subtractions via Anti-Prompt
    const antiTokens = antiPrompt
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const finalTokens = tokens.filter((t) => !antiTokens.includes(t.toLowerCase()));
    return Array.from(new Set(finalTokens)).join(', ');
  }, [prompt, tagTeam, antiPrompt, allAvailableOptions]);

  // Handlers for Requirements & Impacts tag lists
  const handleAddRequirement = () => {
    const val = newReqInput.trim().toLowerCase();
    if (val && !requirements.includes(val)) {
      setRequirements([...requirements, val]);
      setNewReqInput('');
    }
  };

  const handleRemoveRequirement = (req: string) => {
    setRequirements(requirements.filter((r) => r !== req));
  };

  const handleAddImpact = () => {
    const val = newImpactInput.trim().toLowerCase();
    if (val && !impacts.includes(val)) {
      setImpacts([...impacts, val]);
      setNewImpactInput('');
    }
  };

  const handleRemoveImpact = (imp: string) => {
    setImpacts(impacts.filter((i) => i !== imp));
  };

  const handleToggleTagTeam = (optKey: string) => {
    if (tagTeam.includes(optKey)) {
      setTagTeam(tagTeam.filter((k) => k !== optKey));
    } else {
      setTagTeam([...tagTeam, optKey]);
    }
  };

  // Submit & Save directly to file
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!app) return;

    const cleanKey = key.trim();
    if (!cleanKey) {
      setErrorMsg('Option Key / Hex ID is required.');
      return;
    }
    if (!displayName.trim()) {
      setErrorMsg('Display Name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const entryToSave: ComponentEntry = {
      display_name: displayName.trim(),
      prompt: prompt.trim(),
      image: image.trim() || undefined,
      description: description.trim() || undefined,
      tag_team: tagTeam.length > 0 ? tagTeam : undefined,
      'anti-prompt': antiPrompt.trim() || undefined,
      requirement: requirements.length > 0 ? requirements : undefined,
      impact: impacts.length > 0 ? impacts : undefined,
      // Backward compatibility aliases
      keywords: impacts.length > 0 ? impacts : undefined,
      require: requirements.length > 0 ? requirements : undefined,
      exclude: antiPrompt
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      subjects: females !== 0 || males !== 0 ? [females, males] : undefined,
      locked: isLocked ? true : undefined,
      lockKey: isLocked && lockKey.trim() ? lockKey.trim() : undefined,
      completed: isCompleted ? true : undefined,
      visible: isVisible ? undefined : false,
    };

    const success = await ComponentManager.saveEntry(
      app,
      fileRelPath,
      cleanKey,
      entryToSave,
      initialKey || undefined
    );

    if (success) {
      await reload();
      if (onSaved) onSaved(cleanKey);
      onClose();
    } else {
      setErrorMsg(`Failed to write entry to file at ${fileRelPath}. Check console logs.`);
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] bg-hazard-card border-2 border-hazard-gold/60 rounded-3xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-hazard-border bg-hazard-void shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold shadow-hazard-glow">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold uppercase tracking-wider text-hazard-textBright">
                  {isEditing ? 'Edit Component Option' : 'Create New Component Option'}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-hazard-gold/15 border border-hazard-gold/40 text-hazard-gold text-[10px] font-mono font-bold">
                  {fileDisplayName}
                </span>
              </div>
              <p className="text-xs text-hazard-textMuted font-mono mt-0.5">
                Target: <code className="text-hazard-cyan">{fileRelPath}</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-hazard-textMuted hover:text-white bg-hazard-card border border-hazard-border rounded-xl transition hover:border-hazard-gold/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSave} className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Identifiers (Hex ID & Display Name) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Hex ID / Key */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-hazard-textBright font-mono">
                  Unique Key (Hex ID) *
                </label>
                <button
                  type="button"
                  onClick={() => setKey(generateHexId())}
                  title="Generate Fresh Timestamp Hex ID"
                  className="flex items-center gap-1 text-[10px] font-mono text-hazard-gold hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Gen Hex</span>
                </button>
              </div>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. 1951ab89f3c"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-hazard-void border border-hazard-border focus:border-hazard-gold text-xs font-mono text-hazard-gold outline-none"
              />
              <span className="text-[10px] text-hazard-textMuted font-mono">
                Decoded: {formatHexDate(key)}
              </span>
            </div>

            {/* Human Display Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-hazard-textBright font-mono">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Cyberpunk Bodysuit (Wet)"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-hazard-void border border-hazard-border focus:border-hazard-gold text-xs text-hazard-textBright outline-none font-bold"
              />
              <span className="text-[10px] text-hazard-textMuted font-mono">
                Title displayed on component selector cards.
              </span>
            </div>
          </div>

          {/* Section 2: Image Preview & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-hazard-textBright font-mono">
                Image / Thumbnail URL
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... or local path"
                className="w-full px-3.5 py-2.5 rounded-xl bg-hazard-void border border-hazard-border focus:border-hazard-gold text-xs font-mono text-hazard-textBright outline-none"
              />
              <span className="text-[10px] text-hazard-textMuted font-mono">
                Optional 1:1 preview tile image for this option.
              </span>
            </div>

            {/* Thumbnail Preview Box */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-hazard-void border border-hazard-border">
              <div className="w-14 h-14 rounded-lg bg-hazard-card border border-hazard-border/80 overflow-hidden flex items-center justify-center shrink-0">
                {image ? (
                  <img src={image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-6 h-6 text-hazard-gold/50" />
                )}
              </div>
              <span className="text-[10px] text-hazard-textMuted font-mono">
                {image ? 'Valid Image URL' : 'Fallback Icon Active'}
              </span>
            </div>
          </div>

          {/* Section 3: Prompt Textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-hazard-textBright font-mono">
              Base Prompt Tokens *
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. wet clothes, translucent shirt, soaked fabric"
              className="w-full p-3.5 rounded-xl bg-hazard-void border border-hazard-border focus:border-hazard-gold text-xs font-mono text-hazard-textBright outline-none leading-relaxed resize-none"
            />
            <span className="text-[10px] text-hazard-textMuted font-mono">
              Comma-separated tokens directly supplied by this option. Supports <code>{'{opt1|opt2}'}</code> permutation syntax.
            </span>
          </div>

          {/* Section 4: Tag-Team (Prompt Inheritance) & Anti-Prompt */}
          <div className="flex flex-col gap-3 p-4 rounded-2xl bg-hazard-void/90 border border-hazard-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-hazard-purple" />
                <span className="text-xs font-bold uppercase tracking-wider text-hazard-purple font-mono">
                  Tag-Team Prompt Inheritance
                </span>
              </div>
              <span className="text-[10px] font-mono text-hazard-textMuted">
                {tagTeam.length} inherited components
              </span>
            </div>

            {/* Tag-Team Selector & Search */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-hazard-card border border-hazard-border rounded-xl px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-hazard-textMuted" />
                <input
                  type="text"
                  placeholder="Search other components to inherit prompt tokens from..."
                  value={tagTeamSearch}
                  onChange={(e) => setTagTeamSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-hazard-textBright placeholder:text-hazard-textMuted/50 outline-none"
                />
              </div>

              {/* Tag-Team Active Badges */}
              {tagTeam.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-hazard-card border border-hazard-purple/40">
                  {tagTeam.map((ttKey) => {
                    const match = allAvailableOptions.find((o) => o.key === ttKey);
                    return (
                      <span
                        key={ttKey}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-hazard-purple/20 border border-hazard-purple/60 text-hazard-purple text-[11px] font-mono font-bold"
                      >
                        <span>{match?.name || ttKey}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTagTeam(ttKey)}
                          className="hover:text-hazard-crimson"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Tag-Team Search Results Picker */}
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {filteredTagTeamOptions.map((opt) => {
                  const isSelected = tagTeam.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleToggleTagTeam(opt.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition ${
                        isSelected
                          ? 'bg-hazard-purple text-white font-bold'
                          : 'bg-hazard-card border border-hazard-border text-hazard-textMuted hover:text-white'
                      }`}
                    >
                      <span>{opt.name}</span>
                      <span className="text-[9px] opacity-60">({opt.fileName})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Anti-Prompt Field */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-hazard-border/60">
              <label className="text-xs font-bold uppercase tracking-wider text-hazard-crimson font-mono">
                Anti-Prompt (Local Token Subtractions)
              </label>
              <input
                type="text"
                value={antiPrompt}
                onChange={(e) => setAntiPrompt(e.target.value)}
                placeholder="e.g. blazer, suit jacket, necktie"
                className="w-full px-3.5 py-2.5 rounded-xl bg-hazard-card border border-hazard-border focus:border-hazard-crimson text-xs font-mono text-hazard-crimson outline-none"
              />
              <span className="text-[10px] text-hazard-textMuted font-mono">
                Tokens stripped away from the combined tag-team inherited prompt.
              </span>
            </div>
          </div>

          {/* Section 5: Conditions (Requirements & Impacts) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Requirements (Conditions Needed) */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-hazard-void border border-hazard-border">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center justify-between">
                <span>Requirements (Conditions Needed)</span>
                <span className="text-[10px] text-hazard-textMuted">{requirements.length} active</span>
              </label>
              <div className="p-1 rounded-xl bg-hazard-card border border-hazard-border">
                <NotionConditionMultiSelect
                  selectedIds={requirements}
                  conditions={conditions}
                  variant="requirement"
                  onChange={setRequirements}
                  onConditionCreated={async (newId, newEntry) => {
                    if (app) {
                      await ConditionManager.saveCondition(app, newId, newEntry);
                      await reload();
                    }
                  }}
                />
              </div>
              <span className="text-[10px] text-hazard-textMuted font-mono">
                Prerequisite condition states required for this option to be active/rolled.
              </span>
            </div>

            {/* Impacts (Conditions Asserted) */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-hazard-void border border-hazard-border">
              <label className="text-xs font-bold uppercase tracking-wider text-hazard-cyan font-mono flex items-center justify-between">
                <span>Impacts (Conditions Asserted)</span>
                <span className="text-[10px] text-hazard-textMuted">{impacts.length} active</span>
              </label>
              <div className="p-1 rounded-xl bg-hazard-card border border-hazard-border">
                <NotionConditionMultiSelect
                  selectedIds={impacts}
                  conditions={conditions}
                  variant="impact"
                  onChange={setImpacts}
                  onConditionCreated={async (newId, newEntry) => {
                    if (app) {
                      await ConditionManager.saveCondition(app, newId, newEntry);
                      await reload();
                    }
                  }}
                />
              </div>
              <span className="text-[10px] text-hazard-textMuted font-mono">
                Condition states that this option activates and contributes to the scene.
              </span>
            </div>
          </div>

          {/* Section 6: Subject Math Vector, Completion & Visibility Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Subject Vector Math */}
            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-hazard-void border border-hazard-border">
              <label className="text-xs font-bold uppercase tracking-wider text-hazard-textBright font-mono">
                Subject Vector [♀, ♂]
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 bg-hazard-card p-2 rounded-xl border border-hazard-border">
                  <span className="text-xs font-bold text-hazard-gold font-mono">♀</span>
                  <input
                    type="number"
                    value={females}
                    onChange={(e) => setFemales(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-mono text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-hazard-card p-2 rounded-xl border border-hazard-border">
                  <span className="text-xs font-bold text-hazard-cyan font-mono">♂</span>
                  <input
                    type="number"
                    value={males}
                    onChange={(e) => setMales(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-mono text-white outline-none"
                  />
                </div>
              </div>
              <span className="text-[10px] text-hazard-textMuted font-mono">
                Use negative values (e.g. <code>[0, -1]</code>) for POV observer absorption.
              </span>
            </div>

            {/* Visibility Status (Show / Hide in Trigger options) */}
            <div className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-hazard-void border border-hazard-border">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-hazard-cyan font-mono flex items-center gap-1.5">
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-rose-400" />}
                  <span>Trigger Visibility</span>
                </label>
                <p className="text-[11px] text-hazard-textMuted font-mono mt-1">
                  Controls whether this option is active and selectable on Trigger cards.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-hazard-border/50">
                <span className="text-xs font-mono text-hazard-textBright font-bold">
                  {isVisible ? 'VISIBLE (ACTIVE)' : 'HIDDEN'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                    isVisible
                      ? 'bg-hazard-cyan text-black border border-hazard-cyan font-extrabold shadow-sm'
                      : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                  }`}
                >
                  {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{isVisible ? 'Visible' : 'Hidden'}</span>
                </button>
              </div>
            </div>

            {/* Completion Status Checkbox */}
            <div className="flex flex-col justify-between gap-3 p-4 rounded-2xl bg-hazard-void border border-hazard-border">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Completion Status</span>
                </label>
                <p className="text-[11px] text-hazard-textMuted font-mono mt-1">
                  Marks whether this component option has been finalized and verified.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-hazard-border/50">
                <span className="text-xs font-mono text-hazard-textBright font-bold">
                  {isCompleted ? 'COMPLETED' : 'DRAFT'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsCompleted(!isCompleted)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition ${
                    isCompleted
                      ? 'bg-emerald-500 text-black border border-emerald-400 font-extrabold shadow-sm'
                      : 'bg-hazard-card border border-hazard-border text-hazard-textMuted hover:text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCompleted ? '✓ Done' : 'Draft'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 7: Live Calculated Prompt Sandbox */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-hazard-card to-hazard-void border border-hazard-gold/40 shadow-sm flex flex-col gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-hazard-gold font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Calculated Output Prompt (Preview)</span>
            </span>
            <div className="p-3 rounded-xl bg-hazard-void/90 border border-hazard-border text-xs font-mono text-hazard-textBright leading-relaxed min-h-[42px] select-all">
              {calculatedPromptPreview || <span className="text-hazard-textMuted/40 italic">Empty prompt</span>}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-hazard-border bg-hazard-void shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-hazard-card hover:bg-hazard-cardHover text-hazard-textBright border border-hazard-border rounded-xl transition text-xs font-bold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-hazard-gold to-hazard-goldGlow text-black shadow-hazard-glow hover:scale-[1.02] active:scale-95 transition disabled:opacity-40"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : isEditing ? 'Update Option' : 'Create Option'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
