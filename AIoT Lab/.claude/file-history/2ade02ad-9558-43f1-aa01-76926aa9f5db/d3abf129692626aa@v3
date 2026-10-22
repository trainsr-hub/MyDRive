import React, { useState } from 'react';
import { useStudioStore } from '../../store/useStudioStore';
import {
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  Layers,
  ChevronUp,
  ChevronDown,
  Terminal,
} from 'lucide-react';

export const OutputPanel: React.FC = () => {
  const {
    lastResolved,
    customPositive,
    customNegative,
    setCustomPositive,
    setCustomNegative,
  } = useStudioStore();

  const [copiedType, setCopiedType] = useState<'pos' | 'neg' | 'lora' | 'all' | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!lastResolved) return null;

  const copyToClipboard = (text: string, type: 'pos' | 'neg' | 'lora' | 'all') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  const fullPromptCombined = `${lastResolved.positivePrompt}\n\nNegative Prompt:\n${lastResolved.negativePrompt}`;

  return (
    <div className="border-t border-hazard-border bg-hazard-card/95 backdrop-blur-md shrink-0 transition-all duration-300">
      {/* Top Bar / Collapse Toggle */}
      <div className="flex items-center justify-between px-4 py-2 bg-hazard-void border-b border-hazard-border/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-hazard-gold">
            <Terminal className="w-3.5 h-3.5" />
            <span>Prompt Output Matrix</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className="px-2 py-0.5 rounded bg-hazard-card border border-hazard-border text-hazard-textBright">
              Tokens: <strong className="text-hazard-gold">{lastResolved.tokenCount}</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-hazard-card border border-hazard-border text-hazard-cyan">
              LoRAs: <strong>{lastResolved.loras.length}</strong>
            </span>
            {lastResolved.gachaDraws.length > 0 && (
              <span className="px-2 py-0.5 rounded bg-hazard-card border border-hazard-border text-hazard-crimson">
                Gacha Procs: <strong>{lastResolved.gachaDraws.length}</strong>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Copy Full */}
          <button
            onClick={() => copyToClipboard(fullPromptCombined, 'all')}
            className="flex items-center gap-1.5 px-3 py-1 bg-hazard-gold/10 border border-hazard-gold/30 hover:bg-hazard-gold/20 text-hazard-gold text-xs font-semibold rounded transition"
          >
            {copiedType === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedType === 'all' ? 'Copied Full!' : 'Copy Master (Pos + Neg)'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-hazard-textMuted hover:text-white transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[320px] overflow-y-auto">
          {/* Positive Prompt Block */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-hazard-gold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Positive Prompt</span>
              </label>

              <button
                onClick={() => copyToClipboard(lastResolved.positivePrompt, 'pos')}
                className="flex items-center gap-1 text-[11px] text-hazard-textMuted hover:text-hazard-gold transition"
              >
                {copiedType === 'pos' ? <Check className="w-3 h-3 text-hazard-gold" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === 'pos' ? 'Copied!' : 'Copy Positive'}</span>
              </button>
            </div>

            <div className="p-2.5 bg-hazard-void rounded-lg border border-hazard-border/80 text-xs font-mono text-hazard-textBright select-all leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
              {lastResolved.positivePrompt || <span className="text-hazard-textMuted">No positive tokens selected...</span>}
            </div>

            {/* Custom Positive Input */}
            <input
              type="text"
              placeholder="Inject custom positive tokens..."
              value={customPositive}
              onChange={(e) => setCustomPositive(e.target.value)}
              className="w-full bg-hazard-void/60 border border-hazard-border px-2.5 py-1 text-xs text-hazard-textBright rounded outline-none focus:border-hazard-gold"
            />
          </div>

          {/* Negative Prompt Block */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-hazard-crimson">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Negative Prompt (Exclusions Applied)</span>
              </label>

              <button
                onClick={() => copyToClipboard(lastResolved.negativePrompt, 'neg')}
                className="flex items-center gap-1 text-[11px] text-hazard-textMuted hover:text-hazard-crimson transition"
              >
                {copiedType === 'neg' ? <Check className="w-3 h-3 text-hazard-crimson" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === 'neg' ? 'Copied!' : 'Copy Negative'}</span>
              </button>
            </div>

            <div className="p-2.5 bg-hazard-void rounded-lg border border-hazard-border/80 text-xs font-mono text-hazard-textMuted select-all leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
              {lastResolved.negativePrompt || <span className="text-hazard-textMuted">No negative tokens...</span>}
            </div>

            {/* Custom Negative Input */}
            <input
              type="text"
              placeholder="Inject custom negative tokens..."
              value={customNegative}
              onChange={(e) => setCustomNegative(e.target.value)}
              className="w-full bg-hazard-void/60 border border-hazard-border px-2.5 py-1 text-xs text-hazard-textBright rounded outline-none focus:border-hazard-crimson"
            />
          </div>

          {/* LoRA Tags Bar if any */}
          {lastResolved.loras.length > 0 && (
            <div className="col-span-1 md:col-span-2 flex items-center justify-between p-2 bg-hazard-void/80 rounded-lg border border-hazard-border/50 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="text-hazard-gold font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> LoRAs:
                </span>
                {lastResolved.loras.map((lora, idx) => (
                  <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded bg-hazard-card border border-hazard-border text-hazard-textBright">
                    {lora}
                  </span>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(lastResolved.loras.join(' '), 'lora')}
                className="flex items-center gap-1 text-[11px] text-hazard-textMuted hover:text-hazard-gold shrink-0 ml-2"
              >
                {copiedType === 'lora' ? <Check className="w-3 h-3 text-hazard-gold" /> : <Copy className="w-3 h-3" />}
                <span>Copy LoRAs</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
