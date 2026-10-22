import React, { useState } from 'react';
import { useTriggerStore, RANDOM_SELECTION_KEY } from '../../store/useTriggerStore';
import { RatingLogger } from '../../utils/ratingLogger';
import { PromptRatingRecord, RatingScore, ResolvedComponentSummary } from '../../types/schema';
import { Star, BarChart3, Check, Sparkles, MessageSquare } from 'lucide-react';

interface PromptRatingBarProps {
  onOpenAnalytics: () => void;
}

export const PromptRatingBar: React.FC<PromptRatingBarProps> = ({ onOpenAnalytics }) => {
  const {
    app,
    compiledPrompt,
    tokenCount,
    folders,
    selections,
    resolvedSelections,
    matrixBaseStates,
    activeKeywords,
    activeExclusions,
    activeTemplate,
  } = useTriggerStore();

  const baseEmotionStates = matrixBaseStates?.['_01_Expression'] || [];
  const basePoseStates = matrixBaseStates?.['_02_Pose_Action'] || [];

  const [lastRatedScore, setLastRatedScore] = useState<RatingScore | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);

  const handleRate = async (score: RatingScore) => {
    if (!app || !compiledPrompt.trim()) return;

    // Collect all resolved components from the current prompt roll
    const resolvedComponents: ResolvedComponentSummary[] = [];

    for (const folder of folders) {
      for (const file of folder.files) {
        const resolvedKey = resolvedSelections[file.relPath];
        if (resolvedKey && file.entries[resolvedKey]) {
          const entry = file.entries[resolvedKey];
          resolvedComponents.push({
            relPath: file.relPath,
            key: resolvedKey,
            displayName: entry.display_name || resolvedKey,
            promptSnippet: entry.prompt || '',
            isRandomRoll: selections[file.relPath] === RANDOM_SELECTION_KEY,
          });
        }
      }
    }

    const record: PromptRatingRecord = {
      id: `rate_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      dateTime: new Date().toISOString(),
      rating: score,
      compiledPrompt,
      tokenCount,
      templateId: activeTemplate?.id || null,
      templateName: activeTemplate?.name || null,
      baseEmotionStates: [...baseEmotionStates],
      basePoseStates: [...basePoseStates],
      resolvedComponents,
      activeKeywords: [...activeKeywords],
      activeExclusions: [...activeExclusions],
      notes: noteInput.trim() || undefined,
    };

    await RatingLogger.appendRating(app, record);

    setLastRatedScore(score);
    setFeedbackMsg(`Logged ★ ${score} to ratings.jsonl!`);
    if (noteInput) setNoteInput('');
    setShowNoteInput(false);

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 2000);
  };

  const ratingButtons: { score: RatingScore; label: string; desc: string; style: string }[] = [
    { score: 3, label: '3', desc: 'Defective / Poor', style: 'bg-rose-950/40 text-rose-400 border-rose-600/50 hover:bg-rose-600 hover:text-white' },
    { score: 4, label: '4', desc: 'Mediocre / Flawed', style: 'bg-orange-950/40 text-orange-400 border-orange-500/50 hover:bg-orange-500 hover:text-white' },
    { score: 5, label: '5', desc: 'Acceptable / Decent', style: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500 hover:text-black' },
    { score: 6, label: '6', desc: 'Good / High Quality', style: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500 hover:text-black' },
    { score: 7, label: '7', desc: 'Masterpiece / God Tier', style: 'bg-hazard-gold/20 text-hazard-gold border-hazard-gold/60 hover:bg-hazard-gold hover:text-black shadow-hazard-glow' },
  ];

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-hazard-border/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Rating Prompt Label */}
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-hazard-gold fill-hazard-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-hazard-textBright font-mono">
            Rate Generation Batch:
          </span>
          {feedbackMsg && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono font-bold animate-pulse flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>{feedbackMsg}</span>
            </span>
          )}
        </div>

        {/* Right: 5 Rating Buttons & Analytics Link */}
        <div className="flex items-center gap-2">
          {/* 5 Rating Options */}
          <div className="flex items-center gap-1.5">
            {ratingButtons.map(({ score, label, desc, style }) => (
              <button
                key={score}
                type="button"
                onClick={() => handleRate(score)}
                disabled={!compiledPrompt}
                title={`Rate ${score}★: ${desc}`}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border transition-all duration-150 select-none active:scale-90 disabled:opacity-30 disabled:pointer-events-none ${style} ${
                  lastRatedScore === score && !feedbackMsg ? 'ring-2 ring-white/30' : ''
                }`}
              >
                <span>{label}★</span>
              </button>
            ))}
          </div>

          {/* Quick Note Toggle */}
          <button
            type="button"
            onClick={() => setShowNoteInput(!showNoteInput)}
            title="Add optional notes to this rating"
            className={`p-1.5 rounded-xl border transition ${
              showNoteInput
                ? 'bg-hazard-gold text-black border-hazard-gold'
                : 'bg-hazard-void text-hazard-textMuted border-hazard-border hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
          </button>

          {/* Open Analytics Modal Button */}
          <button
            type="button"
            onClick={onOpenAnalytics}
            title="Open Component Performance Analytics Dashboard"
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-hazard-void border border-hazard-border hover:border-hazard-gold/50 text-hazard-textMuted hover:text-hazard-gold text-xs font-mono transition active:scale-95"
          >
            <BarChart3 className="w-3.5 h-3.5 text-hazard-cyan" />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>
      </div>

      {/* Optional Quick Notes Input */}
      {showNoteInput && (
        <div className="flex items-center gap-2 pt-1 animate-fadeIn">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Add optional batch notes (e.g. hands distorted, incredible lighting, defective eyes)..."
            className="w-full px-3 py-1 bg-hazard-void border border-hazard-border focus:border-hazard-gold focus:outline-none rounded-xl text-xs text-hazard-textBright font-mono placeholder:text-hazard-textMuted/40 transition"
          />
        </div>
      )}
    </div>
  );
};
