import React, { useMemo, useState } from 'react';
import { useTriggerStore } from '../../store/useTriggerStore';
import { decomposePromptWithSetDifference, SetDifferenceResult } from '../../utils/promptDecompiler';
import {
  ScanSearch,
  ClipboardCopy,
  Trash2,
  Check,
  FileText,
  Layers,
  Sparkles,
  Search,
  ArrowRight,
  Copy,
  ChevronDown,
  ChevronRight,
  Database,
  Sigma,
  Minus,
  Plus,
  Zap,
} from 'lucide-react';

interface ReverseEngineeringViewProps {
  onApplyAndNavigate: () => void;
  onOpenSaveModal: () => void;
}

const SAMPLE_PROMPTS = [
  {
    name: 'Cyberpunk Solo',
    prompt: '1girl, solo, masterpiece, cyberpunk ninja, black sleek bodysuit, volumetric neon lighting, dynamic low angle, highly detailed, octane render, BREAK, best quality',
  },
  {
    name: 'Fantasy Portrait',
    prompt: '1girl, solo, upper body, cinematic lighting, magical fantasy atmosphere, soft smile, detailed eyes, 8k wallpaper',
  },
  {
    name: 'Action Duo',
    prompt: '2girls, dynamic fight pose, motion blur, dramatic rim lighting, epic combat background, photorealistic',
  },
];

export const ReverseEngineeringView: React.FC<ReverseEngineeringViewProps> = ({
  onApplyAndNavigate,
}) => {
  const { folders, matrixDomains, compiledPrompt: currentStudioPrompt, selectOption, _workspace, setWorkspaceState } = useTriggerStore();
  const [copiedResidual, setCopiedResidual] = useState(false);
  const [copiedMatched, setCopiedMatched] = useState(false);
  const [copiedWild, setCopiedWild] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [appliedPaths, setAppliedPaths] = useState<Set<string>>(new Set());

  const inputPrompt = _workspace?.reverse?.inputPrompt || '';
  const componentSearch = _workspace?.reverse?.componentSearch || '';
  const setComponentSearch = (value: string) =>
    setWorkspaceState({ reverse: { ...(_workspace?.reverse || { inputPrompt: '' }), componentSearch: value } });

  const result: SetDifferenceResult = useMemo(() => {
    return decomposePromptWithSetDifference(inputPrompt, folders, matrixDomains);
  }, [inputPrompt, folders, matrixDomains]);

  const visibleMatches = useMemo(() => {
    const query = componentSearch.trim().toLowerCase();
    if (!query) return result.matchedComponents;

    return result.matchedComponents.filter((component) =>
      component.folderDisplayName.toLowerCase().includes(query) ||
      component.fileDisplayName.toLowerCase().includes(query) ||
      component.entry.display_name.toLowerCase().includes(query) ||
      component.entryKey.toLowerCase().includes(query) ||
      component.matchedTokens.some((token) => token.includes(query))
    );
  }, [componentSearch, result.matchedComponents]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setWorkspaceState({ reverse: { ...(_workspace?.reverse || { componentSearch: '' }), inputPrompt: text } });
    } catch (err) {
      console.warn('[ReverseEngineering] Clipboard read failed:', err);
    }
  };

  const copyText = async (text: string, setter: (value: boolean) => void) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1800);
  };

  const handleAdoptComponent = (relPath: string, entryKey: string) => {
    // Matrix-state pseudo-entries are analytical references, not selectable component files.
    if (relPath.includes('/_state_')) return;
    selectOption(relPath, entryKey);
    setAppliedPaths((prev) => new Set(prev).add(relPath));
  };

  const handleAdoptAll = () => {
    result.matchedComponents.forEach((component) => {
      if (!component.relPath.includes('/_state_')) {
        selectOption(component.relPath, component.entryKey);
      }
    });
    setAppliedPaths(new Set(result.matchedComponents.filter((component) => !component.relPath.includes('/_state_')).map((component) => component.relPath)));
    onApplyAndNavigate();
  };

  const toggleExpanded = (relPath: string) => {
    setExpandedComponents((prev) => {
      const next = new Set(prev);
      if (next.has(relPath)) next.delete(relPath);
      else next.add(relPath);
      return next;
    });
  };

  const hasInput = Boolean(inputPrompt?.trim());

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-hazard-card/90 border border-hazard-border shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold shadow-hazard-glow">
            <ScanSearch className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold uppercase tracking-wider text-hazard-textBright">
                Reverse Engineering · Set Difference
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-hazard-gold/15 border border-hazard-gold/40 text-hazard-gold text-[10px] font-mono font-bold">
                Wild − Library
              </span>
            </div>
            <p className="text-xs text-hazard-textMuted font-mono mt-0.5">
              Extract existing component blocks from a completed wild prompt, then retain only its novel residual tokens.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentStudioPrompt && (
            <button
              type="button"
              onClick={() => setWorkspaceState({ reverse: { ...(_workspace?.reverse || { componentSearch: '' }), inputPrompt: currentStudioPrompt } })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-hazard-cyan bg-hazard-cyan/10 border border-hazard-cyan/30 hover:bg-hazard-cyan/20 hover:border-hazard-cyan rounded-xl transition"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Load Studio Prompt</span>
            </button>
          )}
          {SAMPLE_PROMPTS.map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => setWorkspaceState({ reverse: { ...(_workspace?.reverse || { componentSearch: '' }), inputPrompt: sample.prompt } })}
              className="px-2.5 py-1.5 text-[11px] font-mono font-bold text-hazard-textMuted hover:text-white bg-hazard-void border border-hazard-border rounded-xl transition hover:border-hazard-gold/50"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Wild completed prompt */}
      <section className="flex flex-col gap-3 p-5 rounded-3xl bg-hazard-card border border-hazard-border shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-hazard-textMuted">
            <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-hazard-gold/15 border border-hazard-gold/40 text-hazard-gold font-bold">1</div>
            <FileText className="w-4 h-4 text-hazard-gold" />
            <span className="font-bold text-hazard-textBright">Wild Completed Prompt</span>
            {hasInput && <span className="text-hazard-textMuted">→ split by comma · strip · set</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePaste}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-hazard-void border border-hazard-border text-hazard-textMuted hover:text-white hover:border-hazard-cyan/50 text-[11px] transition"
            >
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>Paste Clipboard</span>
            </button>
            {inputPrompt && (
              <button
                type="button"
                onClick={() => {
                  setWorkspaceState({ reverse: { ...(_workspace?.reverse || { componentSearch: '' }), inputPrompt: '' } });
                  setAppliedPaths(new Set());
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-hazard-void border border-hazard-border text-hazard-textMuted hover:text-hazard-crimson hover:border-hazard-crimson/50 text-[11px] transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        <textarea
          rows={5}
          value={inputPrompt}
          onChange={(e) => setWorkspaceState({ reverse: { ...(_workspace?.reverse || { componentSearch: '' }), inputPrompt: e.target.value } })}
          placeholder="Paste a completed wild prompt here: 1girl, solo, black hair, lying on back, cinematic lighting, ..."
          className="w-full p-4 rounded-2xl bg-hazard-void/90 border border-hazard-border focus:border-hazard-gold text-xs font-mono text-hazard-textBright placeholder:text-hazard-textMuted/40 resize-y outline-none leading-relaxed transition min-h-[130px]"
        />

        {hasInput && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-hazard-void/70 border border-hazard-border">
            <span className="text-[10px] font-mono text-hazard-textMuted uppercase tracking-wider mr-1">Wild Prompt Set:</span>
            {result.wildTokens.map((token, index) => (
              <span key={`${token}-${index}`} className="px-2 py-0.5 rounded-md bg-hazard-gold/10 border border-hazard-gold/30 text-hazard-gold text-[10px] font-mono">
                {token}
              </span>
            ))}
          </div>
        )}
      </section>

      {hasInput ? (
        <div className="flex flex-col gap-6">
          {/* Formula & Metrics */}
          <section className="p-5 rounded-3xl bg-gradient-to-r from-hazard-gold/10 via-hazard-card to-hazard-cyan/10 border border-hazard-gold/40 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Sigma className="w-6 h-6 text-hazard-gold" />
                <div>
                  <h3 className="text-sm font-bold text-hazard-textBright uppercase tracking-wide">Set-Difference Equation</h3>
                  <p className="text-[11px] font-mono text-hazard-textMuted mt-0.5">
                    <span className="text-hazard-gold">wild_prompt_set</span> <Minus className="inline w-3 h-3" /> <span className="text-hazard-cyan">components_set</span> = <span className="text-emerald-400">filtered_set</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <div className="px-3 py-2 rounded-xl bg-hazard-void border border-hazard-border">
                  <span className="text-hazard-textMuted">Wild: </span><strong className="text-hazard-gold">{result.stats.totalWildTokens}</strong>
                </div>
                <div className="px-3 py-2 rounded-xl bg-hazard-void border border-hazard-border">
                  <span className="text-hazard-textMuted">Library: </span><strong className="text-hazard-cyan">{result.stats.totalComponentTokens}</strong>
                </div>
                <div className="px-3 py-2 rounded-xl bg-hazard-void border border-hazard-border">
                  <span className="text-hazard-textMuted">Removed: </span><strong className="text-hazard-purple">{result.stats.totalMatched}</strong>
                </div>
                <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <span className="text-hazard-textMuted">Residual: </span><strong className="text-emerald-400">{result.stats.totalUnmatched}</strong>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Suggested library components */}
          <section className="flex flex-col gap-4 p-5 rounded-3xl bg-hazard-card border border-hazard-border shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hazard-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-hazard-cyan/15 border border-hazard-cyan/40 text-hazard-cyan font-bold">2</div>
                <Database className="w-4 h-4 text-hazard-cyan" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-hazard-textBright">Existing Component Suggestions</h3>
                  <p className="text-[11px] text-hazard-textMuted font-mono">Choose recognised components; their prompt-token sets form <span className="text-hazard-cyan">components_set</span>.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-hazard-void border border-hazard-border rounded-xl px-3 py-1.5 min-w-[210px]">
                  <Search className="w-3.5 h-3.5 text-hazard-textMuted" />
                  <input
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                    placeholder="Filter suggestions..."
                    className="w-full bg-transparent text-xs font-mono text-hazard-textBright placeholder:text-hazard-textMuted/40 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAdoptAll}
                  disabled={result.matchedComponents.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-hazard-cyan/15 border border-hazard-cyan/50 text-hazard-cyan hover:bg-hazard-cyan hover:text-black transition disabled:opacity-40"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Adopt All</span>
                </button>
              </div>
            </div>

            {visibleMatches.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-hazard-border bg-hazard-void/50 text-hazard-textMuted text-xs font-mono">
                No pre-existing component prompt tokens overlap with this wild prompt.
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                {visibleMatches.map((component) => {
                  const isExpanded = expandedComponents.has(component.relPath);
                  const isApplied = appliedPaths.has(component.relPath);
                  const isPseudoState = component.relPath.includes('/_state_');

                  return (
                    <div key={component.relPath} className={`rounded-2xl border transition ${isApplied ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-hazard-border bg-hazard-void/50 hover:border-hazard-cyan/40'}`}>
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(component.relPath)}
                          className="flex items-center gap-2 min-w-0 text-left"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-hazard-cyan shrink-0" /> : <ChevronRight className="w-4 h-4 text-hazard-textMuted shrink-0" />}
                          <Layers className="w-4 h-4 text-hazard-gold shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-hazard-textBright truncate">{component.folderDisplayName} · {component.fileDisplayName}</span>
                            <span className="text-[10px] font-mono text-hazard-textMuted truncate">{component.entry.display_name || component.entryKey}</span>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg bg-hazard-purple/15 border border-hazard-purple/40 text-hazard-purple text-[10px] font-mono font-bold">
                            {component.matchedTokenCount} shared
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-hazard-card border border-hazard-border text-hazard-textMuted text-[10px] font-mono">
                            {component.confidence}% coverage
                          </span>
                          {!isPseudoState && (
                            <button
                              type="button"
                              onClick={() => handleAdoptComponent(component.relPath, component.entryKey)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition ${isApplied ? 'bg-emerald-500 text-black' : 'bg-hazard-cyan/15 border border-hazard-cyan/40 text-hazard-cyan hover:bg-hazard-cyan hover:text-black'}`}
                            >
                              {isApplied ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                              <span>{isApplied ? 'Adopted' : 'Adopt'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-hazard-border/50 flex flex-col gap-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-hazard-textMuted">Matched from wild prompt</span>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {component.matchedTokens.map((token) => <span key={token} className="px-2 py-0.5 rounded-md bg-hazard-purple/15 border border-hazard-purple/40 text-hazard-purple text-[10px] font-mono">{token}</span>)}
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-hazard-textMuted">Component prompt</span>
                            <p className="mt-1 p-2 rounded-xl bg-hazard-card border border-hazard-border text-[11px] font-mono text-hazard-textBright leading-relaxed">{component.entry.prompt}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Step 3: Residual = wild - components */}
          <section className="flex flex-col gap-4 p-5 rounded-3xl bg-gradient-to-br from-emerald-950/25 via-hazard-card to-hazard-card border-2 border-emerald-500/45 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-500/25">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 font-bold">3</div>
                <Minus className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300">Filtered Residual Prompt</h3>
                  <p className="text-[11px] text-hazard-textMuted font-mono">The remaining novel material: <span className="text-emerald-400">wild_prompt_set − components_set</span>.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyText(result.matchedTokens.join(', '), setCopiedMatched)}
                  disabled={result.matchedTokens.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-hazard-void border border-hazard-border text-hazard-textMuted hover:text-white text-[11px] font-mono transition disabled:opacity-40"
                >
                  {copiedMatched ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMatched ? 'Copied Blocks' : 'Copy Extracted'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyText(result.reconstructedPrompt, setCopiedResidual)}
                  disabled={!result.reconstructedPrompt}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-black hover:brightness-110 text-xs font-mono font-bold transition disabled:opacity-40"
                >
                  {copiedResidual ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                  <span>{copiedResidual ? 'Copied Residual' : 'Copy Residual Prompt'}</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-hazard-void/85 border border-emerald-500/30 min-h-[110px]">
              {result.reconstructedPrompt ? (
                <p className="text-sm font-mono text-emerald-200 leading-relaxed break-words select-all">{result.reconstructedPrompt}</p>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-4 text-center">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <span className="text-xs font-mono text-emerald-300">Full coverage: all wild prompt tokens are already represented by your Components library.</span>
                </div>
              )}
            </div>

            {result.unmatchedTokens.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-hazard-card/50 border border-hazard-border">
                {result.unmatchedTokens.map((token, index) => (
                  <span key={`${token}-${index}`} className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono">{token}</span>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 rounded-3xl border-2 border-dashed border-hazard-border/80 bg-hazard-card/30 text-center gap-3">
          <ScanSearch className="w-12 h-12 text-hazard-gold/50 animate-pulse" />
          <h3 className="text-base font-bold uppercase tracking-wider text-hazard-textBright">Awaiting Wild Prompt</h3>
          <p className="text-xs text-hazard-textMuted font-mono max-w-md">Paste a completed prompt above. Faust will split it into a token set, subtract every recognized component prompt token, and return the remaining novel prompt.</p>
        </div>
      )}
    </div>
  );
};
