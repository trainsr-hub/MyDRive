import React, { useMemo, useEffect, useState } from 'react';
import {
  Shuffle,
  Flame,
  Dna,
  Volume2,
  VolumeX,
  Trophy,
  Shield,
  Swords,
  Sparkles,
  Quote,
  BookOpen,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { useDinoPomodoroStore } from '../../../store/useDinoPomodoroStore';
import { rutGonTime } from '../../../../arc-jurassic/core/rutGonTime';
import { DinoCard } from '../../molecule/DinoCard';
import { EvoAvatar } from '../../../../arc-jurassic/components/molecule/EvoAvatar/EvoAvatar';
import { calcDinoRank, getDinoAvatarUrl } from '../../../../arc-jurassic/core/evolutionEngine';
import lookupRawData from '../../../../arc-jurassic/data/lookup.json';
import {
  formatCategoryLabel,
  getDinoCategoryKey,
  getDinoRollChance,
} from '../../../core/dinoMath';
import { computeEffectiveMarks } from '../../../core/timerMarks';
import { MarksPanel } from './MarksPanel';
import {
  getCountdownTo1030PM,
  formatHMS,
  POMODORO_2H_SECONDS,
  DAILY_LIMIT_SECONDS,
} from '../../../core/clean2h';

interface PomodoroTabProps {
  dinoLibrary: any[];
}

export const PomodoroTab: React.FC<PomodoroTabProps> = ({ dinoLibrary }) => {
  const {
    currentDino,
    chancePercent,
    categoryChancePercent,
    categoryLabel,
    categoryCount,
    timeCalc,
    sessionDuration,
    timeRemaining,
    isRunning,
    focusTotalUsedSeconds,
    focusCompletedPomodoros,
    soundEnabled,
    tickSoundEnabled,
    marks,
    chunkSeconds,
    userProgress,
    toggleTimer,
    startTimer,
    pauseTimer,
    swapDino,
    claimDino,
    toggleSound,
    toggleTickSound,
    syncTimerWithBackend,
  } = useDinoPomodoroStore();

  // 1Hz countdown to 10:30 PM (22:30:00) with seconds
  const [countdown1030, setCountdown1030] = useState(() => getCountdownTo1030PM());

  useEffect(() => {
    syncTimerWithBackend();

    const interval = setInterval(() => {
      setCountdown1030(getCountdownTo1030PM());
    }, 1000);
    return () => clearInterval(interval);
  }, [syncTimerWithBackend]);

  // Dynamically compute active roll probabilities with calibrated inverse formula
  const activeRollData = useMemo(() => {
    if (!currentDino || !dinoLibrary || dinoLibrary.length === 0) return null;
    return getDinoRollChance(currentDino, dinoLibrary, userProgress);
  }, [currentDino, dinoLibrary, userProgress]);

  if (!currentDino) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
        <div className="text-4xl animate-bounce mb-3">🥚</div>
        <p className="font-cinzel text-lg text-amber-300">Rolling prehistoric specimen...</p>
      </div>
    );
  }

  const uuid = currentDino.uuid || currentDino.id || currentDino.name;
  const ownedData = userProgress.owned_dinos[uuid];
  const currentCount = Number(ownedData?.number || 0);
  const isOwned = currentCount > 0;

  const activeChancePercent = activeRollData?.chancePercent ?? chancePercent;
  const activeCategoryChancePercent = activeRollData?.categoryChancePercent ?? categoryChancePercent;
  const activeCategoryLabel =
    activeRollData?.categoryLabel ||
    categoryLabel ||
    formatCategoryLabel(getDinoCategoryKey(currentDino));
  const activeCategoryCount = activeRollData?.categoryCount ?? categoryCount ?? 0;

  const evolutions = Array.isArray(currentDino.evolutions) && currentDino.evolutions.length > 0
    ? currentDino.evolutions
    : [
        { level: 10, ferocity: currentDino.evo1_ferocity || 300, health: 350, damage: 200 },
        { level: 20, ferocity: Math.round((currentDino.evo1_ferocity || 300) * 1.7), health: 600, damage: 350 },
        { level: 30, ferocity: Math.round((currentDino.evo1_ferocity || 300) * 2.6), health: 900, damage: 520 },
        { level: 40, ferocity: currentDino.max_ferocity || Math.round((currentDino.evo1_ferocity || 300) * 3.7), health: 1300, damage: 750 },
      ];
  const currentRank = calcDinoRank(currentCount, evolutions.length);
  const nextRank = timeCalc?.nextRank || 1;
  const nextEvoFerocity = timeCalc?.nextEvoFerocity || 300;
  const partnerCount = timeCalc?.partnerCount || 0;

  const targetFactIndex = Math.max(0, Math.min(3, nextRank - 1));
  const targetEvoFact =
    currentDino.facts?.[targetFactIndex] ||
    currentDino.facts?.[0] ||
    'Prehistoric specimen awaiting genetic incubation and biometric awakening.';

  const rawRarity = (currentDino.rarity || 'common').toLowerCase();
  const frameUrl =
    (lookupRawData.portrait_frames as Record<string, string>)[rawRarity] ||
    `https://cdn.paleo.gg/games/jwtg/images/portrait-frame/${rawRarity}.png`;

  // Circular progress calculation for the active dino session
  const sessionProgressPercent = sessionDuration > 0
    ? Math.min(100, Math.max(0, ((sessionDuration - timeRemaining) / sessionDuration) * 100))
    : 100;

  // Daily 10H focus progress percentage across the 5 marks
  const dailyFocusPercent = Math.min(100, Math.max(0, (focusTotalUsedSeconds / DAILY_LIMIT_SECONDS) * 100));

  const isComplete = timeRemaining <= 0;
  const isDailyLimitReached = focusTotalUsedSeconds >= DAILY_LIMIT_SECONDS;

  // Bell marks inside this session (custom + repeating chunk)
  const effectiveMarks = computeEffectiveMarks(marks, chunkSeconds, sessionDuration);

  // Sensitive Click Handler: Clicking anywhere on the main card toggles Start/Pause
  const handleHitboxClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('blockquote') || target.closest('input')) {
      return;
    }
    toggleTimer();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* ── TOP TELEMETRY STRIP ── */}
      <div className="bg-[#120d1c]/90 backdrop-blur-md border border-[#2e233d] rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Individual Dino Chance telemetry */}
          <div
            className="flex items-center gap-1.5 bg-[#1a1226] px-3 py-1 rounded-xl border border-amber-500/30 text-xs font-mono text-amber-300 shadow-sm"
            title={`Individual roll chance for ${currentDino.name}: ${activeChancePercent.toFixed(4)}% (Target Ferocity: ${nextEvoFerocity})`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-cinzel text-[#8c7a9e]">DINO CHANCE:</span>
            <span className="font-bold text-[#ffd86b]">{activeChancePercent.toFixed(3)}%</span>
          </div>

          {/* Category Total Chance telemetry */}
          <div
            className="flex items-center gap-1.5 bg-[#181126] px-3 py-1 rounded-xl border border-purple-500/40 text-xs font-mono text-purple-200 shadow-sm"
            title={`Total probability of rolling any ${activeCategoryLabel} (${activeCategoryCount} specimens in pool)`}
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-cinzel text-[#9c89b8]">CATEGORY:</span>
            <span className="font-bold text-[#e9d5ff]">
              {activeCategoryChancePercent.toFixed(2)}%
            </span>
            <span className="text-[10.5px] text-[#b8a5d4] font-sans">
              ({activeCategoryLabel}{activeCategoryCount > 0 ? ` • ${activeCategoryCount} dinos` : ''})
            </span>
          </div>

          {/* Related Dinosaur Affinity Boost Badge */}
          {partnerCount > 0 && (
            <div
              className="flex items-center gap-1.5 bg-[#0b291a] px-3 py-1 rounded-xl border border-emerald-500/40 text-xs font-mono text-emerald-300 shadow-sm"
              title={`Affinity Boost: +${Math.round(partnerCount * 10)}% roll chance from ${partnerCount} owned related dinosaurs!`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>+{Math.round(partnerCount * 10)}% AFFINITY BOOST</span>
              <span className="text-[10px] text-emerald-400/80 font-sans">({partnerCount} related dinos)</span>
            </div>
          )}

          {/* Formula breakdown (Ferocity / 5 minutes) */}
          <div className="flex items-center gap-1.5 bg-[#140e20] px-3 py-1 rounded-xl border border-[#3b2a52] text-xs font-mono text-sky-300">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {nextEvoFerocity} Fero ÷ 5 = <strong className="text-white">{rutGonTime(sessionDuration, 'seconds')}</strong>
            </span>
          </div>

          {/* End of Day Countdown (10:30 PM with seconds) */}
          <div
            className="flex items-center gap-1.5 bg-[#1b1226] px-3 py-1 rounded-xl border border-amber-500/40 text-xs font-mono text-amber-300 shadow-sm"
            title="Countdown to end of day (10:30:00 PM)"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-cinzel text-[#8c7a9e]">10:30 PM:</span>
            <span className="font-bold text-[#ffd86b] tabular-nums">{countdown1030.formatted}</span>
          </div>

          {/* Evo target */}
          <div className="flex items-center gap-1.5 bg-[#140e20] px-3 py-1 rounded-xl border border-emerald-500/30 text-xs font-mono text-emerald-300">
            <Dna className="w-3.5 h-3.5 text-emerald-400" />
            <span>{!isOwned ? 'NEW UNLOCK: EVO 1' : `UPGRADE: EVO ${nextRank}`}</span>
          </div>
        </div>

        {/* Audio Toggles */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? 'bg-[#1e172a] border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                : 'bg-[#120d1c] border-[#251b32] text-zinc-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={toggleTickSound}
            title={tickSoundEnabled ? 'Disable Metronome Tick' : 'Enable Soft Tick'}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-cinzel font-bold transition cursor-pointer flex items-center gap-1 ${
              tickSoundEnabled
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                : 'bg-[#120d1c] border-[#251b32] text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span>⏱ Tick</span>
          </button>
        </div>
      </div>

      {/* ── MAIN SENSITIVE INCUBATION HITBOX CARD ── */}
      <div
        onClick={handleHitboxClick}
        title={
          isComplete
            ? 'Incubation complete! Click Claim below.'
            : isRunning
            ? 'Click anywhere to Pause'
            : isDailyLimitReached
            ? 'All 5 marks fulfilled for today!'
            : 'Click anywhere to Start'
        }
        className={`relative w-full rounded-3xl p-6 sm:p-8 border-2 transition-all duration-300 cursor-pointer select-none overflow-hidden group shadow-2xl ${
          isComplete
            ? 'bg-gradient-to-b from-[#1f190e] via-[#15101a] to-[#0d0914] border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.35)]'
            : isRunning
            ? 'bg-gradient-to-b from-[#1c152a] via-[#120d1e] to-[#0b0813] border-amber-500/80 shadow-[0_0_35px_rgba(251,191,36,0.25)]'
            : 'bg-gradient-to-b from-[#161022] via-[#0e0a16] to-[#08060d] border-[#37274e] hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]'
        }`}
      >
        {/* Background ambient pulse glow */}
        <div
          className={`absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none transition duration-500 ${
            isRunning ? 'opacity-100 scale-110' : 'opacity-40'
          }`}
        />

        {/* ── 2-COLUMN INCUBATION COCKPIT (CARD ON LEFT, CHRONOMETER & CONTROLS ON RIGHT) ── */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-center justify-center gap-6 lg:gap-10">
          {/* LEFT: Authentic Dino Card */}
          <div className="shrink-0 flex flex-col items-center justify-center">
            <div className="transform transition duration-300 hover:scale-[1.02] drop-shadow-[0_12px_32px_rgba(0,0,0,0.85)]">
              <DinoCard
                dino={currentDino}
                isUnlocked={isOwned}
                scale={1.0}
              />
            </div>
          </div>

          {/* RIGHT: Incubation Reactor & Controls Cockpit */}
          <div className="flex-1 w-full max-w-lg flex flex-col justify-center space-y-4">
            {/* Top Status Header within Right Cockpit */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="text-center sm:text-left">
                <h2 className="font-cinzel-dec text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-[#ffd86b] to-amber-400 tracking-wider uppercase">
                  {currentDino.name}
                </h2>
                <div className="text-xs font-cinzel text-[#8c7a9e] tracking-wider uppercase mt-0.5">
                  Target: {isOwned ? `EVO ${nextRank} ASCENSION` : 'DISCOVERY & UNLOCK'}
                </div>
              </div>

              {/* Sensitive Hitbox Status Badge */}
              <div className="text-center sm:text-right">
                <div
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full font-cinzel text-xs font-bold tracking-wider uppercase shadow-md transition ${
                    isComplete
                      ? 'bg-amber-500 text-black animate-bounce font-black'
                      : isRunning
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-400 animate-pulse'
                      : isDailyLimitReached
                      ? 'bg-purple-950/90 text-purple-300 border border-purple-400'
                      : 'bg-[#221733] text-[#a493bc] border border-[#3d2a55]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isComplete
                        ? 'bg-black'
                        : isRunning
                        ? 'bg-emerald-400 animate-ping'
                        : isDailyLimitReached
                        ? 'bg-purple-400'
                        : 'bg-zinc-500'
                    }`}
                  />
                  <span>
                    {isComplete
                      ? 'INCUBATION COMPLETE!'
                      : isRunning
                      ? 'RUNNING • CLICK TO PAUSE'
                      : isDailyLimitReached
                      ? '5 MARKS FULFILLED'
                      : 'READY • CLICK TO START'}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#78698a] mt-0.5">
                  {isComplete ? 'Click Claim Dino Below' : '100% Hitbox Enabled (Click Anywhere)'}
                </div>
              </div>
            </div>

            {/* ── ADVANCED JURASSIC CHRONOMETER & HOLOGRAPHIC INCUBATION GAUGE ── */}
            <div className="relative flex flex-col items-center justify-center my-0.5 select-none">
              {/* Circular Reactor Dial Container */}
              <div className="relative w-[230px] h-[230px] flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 230 230">
                  <defs>
                    <linearGradient id="plasmaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="45%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#d97706" />
                    </linearGradient>
                  </defs>

                  {/* Outer Rotating Chronometer Dial */}
                  <circle
                    cx="115"
                    cy="115"
                    r="106"
                    fill="none"
                    stroke="rgba(251, 191, 36, 0.22)"
                    strokeWidth="1.5"
                    strokeDasharray="4 8"
                    className={`chrono-dial-outer ${isRunning ? 'running' : ''}`}
                  />

                  {/* Inner Counter-Rotating Orbit Ring */}
                  <circle
                    cx="115"
                    cy="115"
                    r="74"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="1"
                    strokeDasharray="3 14"
                    className="chrono-dial-inner"
                  />

                  {/* Background Ring Track */}
                  <circle
                    cx="115"
                    cy="115"
                    r="90"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeWidth="8"
                  />

                  {/* Active Plasma Progress Arc (Current Dino Session) */}
                  <circle
                    cx="115"
                    cy="115"
                    r="90"
                    fill="none"
                    stroke="url(#plasmaGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="565.49"
                    strokeDashoffset={565.49 * (1 - sessionProgressPercent / 100)}
                    transform="rotate(-90 115 115)"
                    style={{
                      transition: 'stroke-dashoffset 1000ms ease-linear',
                      filter: isRunning ? 'drop-shadow(0 0 8px rgba(251,191,36,0.6))' : 'none',
                    }}
                  />
                </svg>

                {/* Floating Bio-Energy Motes */}
                {isRunning && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                    <div className="energy-mote-1 absolute left-[30%] bottom-6 w-1.5 h-1.5 rounded-full bg-amber-300" />
                    <div className="energy-mote-2 absolute left-[65%] bottom-8 w-2 h-2 rounded-full bg-yellow-200" />
                    <div className="energy-mote-3 absolute left-[48%] bottom-5 w-1 h-1 rounded-full bg-amber-400" />
                    <div className="holo-scanline" />
                  </div>
                )}

                {/* Completion Shockwave Aura */}
                {isComplete && (
                  <div className="complete-shockwave-ring absolute inset-2 rounded-full border-2 border-amber-400 pointer-events-none" />
                )}

                {/* Inner Chrono Core: Digital Readout & Status */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
                  <div className="mb-0.5">
                    {isComplete ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black tracking-widest uppercase shadow-md animate-pulse">
                        ✨ INCUBATION COMPLETE
                      </span>
                    ) : isRunning ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[8.5px] font-mono font-bold tracking-wider uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        INCUBATING
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#1b1426] border border-[#3b2a52] text-amber-300/80 text-[8.5px] font-mono font-bold tracking-wider uppercase">
                        ⏸ PAUSED
                      </span>
                    )}
                  </div>

                  {/* Big Dynamic Countdown with 1Hz Pulse */}
                  <div
                    className={`font-mono text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-[#fff1cc] to-[#f59e0b] tracking-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] ${
                      isRunning ? 'timer-digits-pulse' : ''
                    }`}
                  >
                    {rutGonTime(timeRemaining, 'seconds')}
                  </div>

                  {/* Dynamic Charge Percentage */}
                  <div className="text-[10.5px] font-mono font-bold text-amber-300/90 tracking-wider mt-0.5">
                    {sessionProgressPercent.toFixed(1)}% INCUBATED
                  </div>
                </div>
              </div>

              {/* ── TIMER BAR WITH 5 SMALL MARKS (EACH 2H CHUNK) ── */}
              <div className="w-full space-y-1 mt-3">
                <div className="relative w-full h-4 bg-[#0e0a16] border border-[#3b2a52] rounded-full p-0.5 overflow-hidden shadow-inner">
                  {/* 4 Small Divider Notches creating 5 chunks of 2H marks (20%, 40%, 60%, 80%) */}
                  <div className="absolute inset-0 pointer-events-none z-20">
                    {[1, 2, 3, 4].map((markNum) => {
                      const percent = markNum * 20; // 20%, 40%, 60%, 80%
                      const isPassed = dailyFocusPercent >= percent;
                      return (
                        <div
                          key={markNum}
                          style={{ left: `${percent}%` }}
                          className={`absolute top-0 bottom-0 w-[2px] -ml-[1px] transition-colors duration-300 ${
                            isPassed ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-white/20'
                          }`}
                        />
                      );
                    })}

                    {/* Bell Mark Markers for current session */}
                    {effectiveMarks.map((m) => (
                      <div
                        key={m}
                        title={`Bell at ${rutGonTime(m, 'seconds')}`}
                        className={`absolute top-0 w-[1.5px] h-full ${
                          sessionDuration - timeRemaining >= m ? 'bg-emerald-300/80' : 'bg-amber-200/70'
                        }`}
                        style={{ left: `${(m / sessionDuration) * 100}%` }}
                      />
                    ))}
                  </div>

                  {/* Flowing Molten Plasma Fill Bar (representing daily focus across the 5 marks) */}
                  <div
                    className={`plasma-energy-bar h-full rounded-full transition-all duration-1000 ease-linear relative ${
                      isRunning ? '' : 'paused'
                    }`}
                    style={{ width: `${dailyFocusPercent}%` }}
                  >
                    {dailyFocusPercent > 2 && dailyFocusPercent < 99 && (
                      <div className="progress-head-flare absolute right-0 top-1/2 w-3.5 h-3.5 rounded-full bg-white pointer-events-none" />
                    )}
                  </div>
                </div>

                {/* 5 Small Marks Labels directly on the timer bar track */}
                <div className="flex items-center justify-between text-[9.5px] font-mono text-[#8c7a9e] px-1 pt-0.5">
                  {Array.from({ length: 5 }, (_, i) => {
                    const markThreshold = (i + 1) * POMODORO_2H_SECONDS;
                    const isCompleteMark = focusTotalUsedSeconds >= markThreshold;
                    const isActiveMark = !isCompleteMark && focusTotalUsedSeconds >= i * POMODORO_2H_SECONDS;
                    const remainingInBlock = Math.max(0, markThreshold - focusTotalUsedSeconds);

                    return (
                      <div
                        key={i}
                        title={`Mark ${i + 1} (2H): ${
                          isCompleteMark
                            ? 'Complete'
                            : isActiveMark
                            ? `${formatHMS(remainingInBlock)} remaining`
                            : 'Upcoming'
                        }`}
                        className={`flex items-center gap-1 transition-colors select-none ${
                          isCompleteMark
                            ? 'text-emerald-400 font-bold'
                            : isActiveMark
                            ? 'text-amber-300 font-bold animate-pulse'
                            : 'text-zinc-500'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>{isCompleteMark ? '✓ 2H' : `2H`}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Session Telemetry Strip */}
                <div className="flex items-center justify-between text-[10.5px] font-mono text-[#8c7a9e] px-1 pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1 text-emerald-400 font-bold" title="Total focus used today">
                    <span>⚡</span>
                    <span>{formatHMS(focusTotalUsedSeconds)} today</span>
                  </span>
                  <span className="text-zinc-400 font-mono text-[9.5px]">
                    {focusCompletedPomodoros} of 5 marks achieved
                  </span>
                  <span className="flex items-center gap-1 text-sky-400 font-bold" title="Remaining incubation time for this specimen">
                    <span>⏱</span>
                    <span>{rutGonTime(timeRemaining, 'seconds')} left</span>
                  </span>
                </div>
              </div>

              {/* ── TARGET EVO SPECIMEN QUOTE ── */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full mt-3 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#170e24]/90 via-[#211336]/85 to-[#140c20]/90 border border-amber-500/30 hover:border-amber-400/50 shadow-md transition select-none flex items-start gap-2.5"
                style={{
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 216, 107, 0.1)',
                }}
              >
                <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
                  <Quote className="w-3.5 h-3.5 fill-amber-400/20" />
                </div>
                <div className="flex-1 min-w-0">
                  <blockquote className="font-sans italic text-xs sm:text-[12.5px] text-zinc-100 leading-relaxed select-text cursor-text">
                    "{targetEvoFact}"
                  </blockquote>
                  <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-white/5 text-[10px] font-mono text-[#8c7a9e]">
                    <span className="font-cinzel text-amber-400/90 font-bold tracking-wider uppercase flex items-center gap-1">
                      <BookOpen className="w-2.5 h-2.5 text-amber-400" />
                      <span>EVO {nextRank} DOSSIER</span>
                    </span>
                    <span className="text-[#a493bc] italic">
                      {isOwned ? `Unlocks at Evo ${nextRank}` : 'Discovery Unlock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── ACTION BUTTONS INSIDE RIGHT COCKPIT ── */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 border-t border-white/10">
              {/* Swap Dino Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  swapDino(dinoLibrary);
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#201730] hover:bg-[#2d2042] border border-[#483761] hover:border-amber-500/50 text-[#ffd86b] font-cinzel font-bold text-xs tracking-wider uppercase transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Shuffle className="w-4 h-4" />
                <span>Swap Specimen</span>
              </button>

              {/* Start / Pause Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isRunning) {
                    pauseTimer();
                  } else {
                    startTimer();
                  }
                }}
                disabled={isDailyLimitReached}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-cinzel font-bold text-xs tracking-wider uppercase transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isDailyLimitReached
                    ? 'bg-[#201730] border border-[#483761] text-zinc-500 cursor-not-allowed'
                    : isRunning
                    ? 'bg-amber-500/20 border-2 border-amber-400 text-amber-300 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Pause Timer' : isDailyLimitReached ? '5 Marks Fulfilled' : 'Start Timer'}</span>
              </button>

              {/* Claim Button */}
              {isComplete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    claimDino(dinoLibrary);
                  }}
                  className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-gradient-to-r from-[#ffd86b] via-[#d4af37] to-[#aa8214] hover:brightness-110 text-black font-cinzel font-black text-xs tracking-widest uppercase transition active:scale-95 shadow-[0_0_30px_rgba(255,216,107,0.6)] flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <Trophy className="w-4 h-4 fill-black" />
                  <span>Claim Dino (EVO {nextRank})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── EVOLUTIONARY MILESTONE PATHWAY ── */}
        <div className="relative z-10 w-full mt-6 pt-5 border-t border-[#2d203f]/80">
          <div className="flex items-center justify-between gap-2 mb-3.5 px-1 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="font-cinzel text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                Evolutionary Milestones ({evolutions.length} Tiers)
              </h3>
            </div>
            <div className="text-[11px] font-mono text-[#8c7a9e] flex items-center gap-2">
              <span>Status:</span>
              <strong className={currentRank > 0 ? 'text-emerald-300' : 'text-zinc-400'}>
                {currentRank > 0 ? `EVO ${currentRank} ATTAINED` : 'UNOWNED'}
              </strong>
              <span>•</span>
              <span className="text-amber-400 font-bold">HATCHING: EVO {nextRank}</span>
            </div>
          </div>

          {/* Grid of Evolution Stages */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {evolutions.map((evo: any, index: number) => {
              const rank = index + 1;
              const isOwnedEvo = isOwned && currentRank >= rank;
              const isTargetEvo = rank === nextRank;
              const isFutureLocked = !isOwnedEvo && !isTargetEvo;

              const evoFerocity = Number(
                evo.ferocity ||
                (evo.damage && evo.health ? Math.floor(evo.damage + evo.health / 3.2) : 300)
              );
              const evoHatchSeconds = Math.max(60, Math.round((evoFerocity / 5) * 60));
              const evoAvatarUrl = getDinoAvatarUrl(currentDino, index, true);

              return (
                <div
                  key={rank}
                  title={`EVO ${rank}: "${currentDino.facts?.[index] || ''}"`}
                  className={`relative rounded-2xl p-3 flex flex-col items-center transition-all duration-300 text-center select-none ${
                    isTargetEvo
                      ? 'bg-gradient-to-b from-[#2e1d0d] via-[#1b1226] to-[#120c1c] border-2 border-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.35)] scale-[1.02] z-20'
                      : isOwnedEvo
                      ? 'bg-gradient-to-b from-[#131f18] to-[#0e1414] border border-emerald-500/40 shadow-sm'
                      : 'bg-[#120d1c]/80 border border-[#261c36] opacity-60 hover:opacity-90'
                  }`}
                >
                  <div className="mb-2">
                    {isTargetEvo ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-black text-[9.5px] font-black tracking-wider uppercase shadow-md animate-pulse">
                        🥚 HATCHING
                      </span>
                    ) : isOwnedEvo ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[9.5px] font-bold tracking-wider uppercase">
                        ✓ OWNED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-black/50 text-zinc-500 border border-zinc-700/40 text-[9.5px] font-mono font-bold tracking-wider uppercase">
                        LOCKED
                      </span>
                    )}
                  </div>

                  <div className="my-1 drop-shadow-md">
                    <EvoAvatar
                      size={58}
                      imageUrl={evoAvatarUrl}
                      frameUrl={frameUrl}
                      isUnlocked={isOwnedEvo || isTargetEvo}
                      showLockOverlay={isFutureLocked}
                      borderRadius="12px"
                    />
                  </div>

                  <div className="mt-2 text-xs font-cinzel font-black uppercase tracking-wider text-white">
                    EVO {rank}
                    <span className="text-[10px] font-mono text-zinc-400 ml-1 font-normal">
                      (LV.{evo.level || rank * 10})
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-amber-300">
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>{evoFerocity.toLocaleString()}</span>
                  </div>

                  <div className="mt-1 flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-300">
                    {evo.health !== undefined && (
                      <span className="flex items-center gap-0.5 text-sky-300" title="Health">
                        <Shield className="w-2.5 h-2.5" />
                        <span>{Math.round(evo.health)}</span>
                      </span>
                    )}
                    {evo.damage !== undefined && (
                      <span className="flex items-center gap-0.5 text-rose-300" title="Damage">
                        <Swords className="w-2.5 h-2.5" />
                        <span>{Math.round(evo.damage)}</span>
                      </span>
                    )}
                  </div>

                  <div
                    className="mt-2 pt-1.5 border-t border-white/10 w-full text-[10px] font-mono text-sky-300 flex items-center justify-center gap-1"
                    title="Pomodoro incubation time for this Evo tier"
                  >
                    <span className="text-zinc-500">⏱</span>
                    <span>{rutGonTime(evoHatchSeconds, 'seconds')}</span>
                  </div>

                  {currentDino.facts?.[index] && (
                    <div
                      className={`mt-1.5 text-[9px] font-mono flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md transition ${
                        isTargetEvo
                          ? 'text-amber-300 bg-amber-500/20 border border-amber-400/40 font-bold'
                          : 'text-[#8c7a9e] bg-white/5 hover:text-zinc-200'
                      }`}
                      title={currentDino.facts[index]}
                    >
                      <span>📜</span>
                      <span className="truncate max-w-[110px]">
                        {isTargetEvo ? 'Target Lore' : `Tier ${rank} Lore`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── BELL MARKS (custom checkpoints within the session) ── */}
      <MarksPanel />
    </div>
  );
};
