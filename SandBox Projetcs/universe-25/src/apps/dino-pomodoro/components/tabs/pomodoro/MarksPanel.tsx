import React, { useState } from 'react';
import { Bell, BellRing, Plus, X, Repeat, Trash2 } from 'lucide-react';
import { useDinoPomodoroStore } from '../../../store/useDinoPomodoroStore';
import { rutGonTime } from '../../../../arc-jurassic/core/rutGonTime';
import { computeEffectiveMarks, MAX_CUSTOM_MARKS, MIN_CHUNK_SECONDS } from '../../../core/timerMarks';

/**
 * Marks editor: custom bell checkpoints (by elapsed time) plus an optional
 * repeating chunk size. Reaching a mark rings the bell; the countdown continues
 * until the real end of the session.
 */
export const MarksPanel: React.FC = () => {
  const {
    marks,
    chunkSeconds,
    sessionDuration,
    timeRemaining,
    addMark,
    removeMark,
    clearMarks,
    setChunk,
    clearChunk,
  } = useDinoPomodoroStore();

  const [markInput, setMarkInput] = useState('');
  const [chunkInput, setChunkInput] = useState('');
  const [error, setError] = useState('');

  const elapsed = Math.max(0, sessionDuration - timeRemaining);
  const effective = computeEffectiveMarks(marks, chunkSeconds, sessionDuration);
  const customInSession = new Set(marks);

  const submitMark = () => {
    if (!markInput.trim()) return;
    if (addMark(markInput)) {
      setMarkInput('');
      setError('');
    } else {
      setError(
        `Invalid mark. Use minutes (25), mm:ss (12:30) or h:mm:ss — must be before the session end (${rutGonTime(
          sessionDuration,
          'seconds'
        )}).`
      );
    }
  };

  const submitChunk = () => {
    if (!chunkInput.trim()) return;
    if (setChunk(chunkInput)) {
      setChunkInput('');
      setError('');
    } else {
      setError(`Invalid chunk. Minimum is ${MIN_CHUNK_SECONDS / 60} minute. Examples: 25, 10:00.`);
    }
  };

  const onEnter = (fn: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') fn();
  };

  const inputCls =
    'flex-1 min-w-0 bg-[#1b122b] text-white border border-white/15 px-3 py-1.5 rounded-xl text-xs font-mono outline-none focus:border-amber-400 cursor-text select-text';
  const btnCls =
    'px-3 py-1.5 rounded-xl bg-[#201730] hover:bg-[#2d2042] border border-[#483761] hover:border-amber-500/50 text-[#ffd86b] font-cinzel font-bold text-[11px] tracking-wider uppercase transition active:scale-95 flex items-center gap-1.5 cursor-pointer';

  return (
    <div
      id="pomodoro-marks-panel"
      className="bg-[#120d1c]/90 backdrop-blur-md border border-[#2e233d] rounded-2xl px-5 py-4 shadow-lg space-y-3"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-amber-400" />
          <h3 className="font-cinzel text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
            Bell Marks
          </h3>
          <span className="text-[10.5px] font-mono text-[#8c7a9e]">
            rings at each mark • timer keeps counting to the end
          </span>
        </div>
        {(marks.length > 0 || chunkSeconds > 0) && (
          <button
            type="button"
            id="marks-clear-all"
            onClick={() => {
              clearMarks();
              clearChunk();
              setError('');
            }}
            className="text-[10.5px] font-mono text-[#8c7a9e] hover:text-rose-300 flex items-center gap-1 cursor-pointer transition"
          >
            <Trash2 className="w-3 h-3" /> clear all
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Custom mark */}
        <div className="space-y-1">
          <label htmlFor="mark-input" className="text-[10.5px] font-mono text-[#8c7a9e] uppercase">
            Add mark (elapsed time)
          </label>
          <div className="flex gap-2">
            <input
              id="mark-input"
              value={markInput}
              onChange={(e) => setMarkInput(e.target.value)}
              onKeyDown={onEnter(submitMark)}
              placeholder="e.g. 25 or 12:30"
              disabled={marks.length >= MAX_CUSTOM_MARKS}
              className={inputCls}
            />
            <button type="button" id="mark-add" onClick={submitMark} className={btnCls}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Repeating chunk */}
        <div className="space-y-1">
          <label htmlFor="chunk-input" className="text-[10.5px] font-mono text-[#8c7a9e] uppercase">
            Chunk every{' '}
            {chunkSeconds > 0 && (
              <strong className="text-emerald-300">(active: {rutGonTime(chunkSeconds, 'seconds')})</strong>
            )}
          </label>
          <div className="flex gap-2">
            <input
              id="chunk-input"
              value={chunkInput}
              onChange={(e) => setChunkInput(e.target.value)}
              onKeyDown={onEnter(submitChunk)}
              placeholder="e.g. 25 (minutes)"
              className={inputCls}
            />
            <button type="button" id="chunk-set" onClick={submitChunk} className={btnCls}>
              <Repeat className="w-3.5 h-3.5" /> Set
            </button>
            {chunkSeconds > 0 && (
              <button
                type="button"
                id="chunk-off"
                onClick={clearChunk}
                title="Turn off repeating chunk"
                className="p-1.5 rounded-xl border border-[#483761] text-zinc-400 hover:text-rose-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <div className="text-[11px] font-mono text-rose-300">{error}</div>}

      {/* Effective marks for the current session */}
      {effective.length === 0 ? (
        <div className="text-[11px] font-mono text-[#78698a] flex items-center gap-1.5">
          <Bell className="w-3 h-3" /> No marks in this session — only the final alarm will ring.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {effective.map((m) => {
            const passed = elapsed >= m;
            const removable = customInSession.has(m);
            return (
              <span
                key={m}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border transition ${
                  passed
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#1b122b] border-amber-500/40 text-amber-300'
                }`}
                title={removable ? 'Custom mark' : 'From repeating chunk'}
              >
                {passed ? <BellRing className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
                {rutGonTime(m, 'seconds')}
                {removable && (
                  <button
                    type="button"
                    aria-label={`Remove mark ${rutGonTime(m, 'seconds')}`}
                    onClick={() => removeMark(m)}
                    className="hover:text-rose-300 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};
