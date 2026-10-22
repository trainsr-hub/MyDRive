import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playTick, playTimerStart, playTimerPause, playHatchFanfare, playTimerAlarm, playMarkBell } from '../core/audioFx';
import { isMarkHit, parseMarkInput, MAX_CUSTOM_MARKS, MIN_CHUNK_SECONDS } from '../core/timerMarks';
import {
  persistArcProgress,
  fetchArcProgress,
  resetArcProgress,
  fetchPomodoroTimerState,
  persistPomodoroTimerState,
} from '../../../core/syncEngine';
import {
  rollWeightedDino,
  calculatePomodoroTime,
  advanceDinoOneEvo,
  getDinoRollChance,
  type PomodoroTimeResult,
} from '../core/dinoMath';
import {
  POMODORO_2H_SECONDS,
  DAILY_LIMIT_SECONDS,
  getLocalDateKey,
} from '../core/clean2h';

export interface UserProgressData {
  owned_dinos: Record<string, { number: number; rank: number; ferocity?: number }>;
}

interface DinoPomodoroState {
  // Current Rolled Dino for Pomodoro
  currentDino: any | null;
  chancePercent: number;
  categoryChancePercent: number;
  categoryLabel: string;
  categoryCount: number;
  timeCalc: PomodoroTimeResult | null;

  // Active Timer (derived from dino unlocking evo ferocity / 5 minutes)
  sessionDuration: number; // in seconds
  timeRemaining: number; // in seconds
  isRunning: boolean;

  // Daily 10H Limit (visualized as 5 marks of 2H each)
  focusDayKey: string;
  focusTotalUsedSeconds: number; // 0 to 36000 seconds today
  focusCompletedPomodoros: number; // 0 to 5 completed 2H marks

  // Timer Marks: bell rings when elapsed time hits a mark; countdown keeps running
  marks: number[]; // custom checkpoints, in elapsed seconds (sorted)
  chunkSeconds: number; // repeating chunk size in seconds (0 = off)

  // Audio Config
  soundEnabled: boolean;
  tickSoundEnabled: boolean;

  // User Progress (Dinos Owned)
  userProgress: UserProgressData;

  // Last Claimed Dino for Instant Celebration / Feedback
  lastClaimedDino: any | null;

  // Actions
  initializeOrRollDino: (dinoLibrary: any[]) => void;
  swapDino: (dinoLibrary: any[]) => void;
  toggleTimer: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  claimDino: (dinoLibrary: any[]) => void;
  resetAllDinos: (dinoLibrary: any[]) => Promise<void>;
  tick: () => void;
  toggleSound: () => void;
  toggleTickSound: () => void;
  addMark: (input: string) => boolean;
  removeMark: (seconds: number) => void;
  clearMarks: () => void;
  setChunk: (input: string) => boolean;
  dismissCelebration: () => void;
  clearChunk: () => void;
  syncWithBackend: () => Promise<void>;
  syncTimerWithBackend: () => Promise<void>;
  persistTimerToBackend: () => Promise<void>;
}

export const useDinoPomodoroStore = create<DinoPomodoroState>()(
  persist(
    (set, get) => ({
      currentDino: null,
      chancePercent: 0,
      categoryChancePercent: 0,
      categoryLabel: '',
      categoryCount: 0,
      timeCalc: null,

      sessionDuration: 25 * 60,
      timeRemaining: 25 * 60,
      isRunning: false,

      focusDayKey: getLocalDateKey(),
      focusTotalUsedSeconds: 0,
      focusCompletedPomodoros: 0,

      marks: [],
      chunkSeconds: 0,

      soundEnabled: true,
      tickSoundEnabled: false,

      userProgress: { owned_dinos: {} },
      lastClaimedDino: null,

      initializeOrRollDino: (dinoLibrary) => {
        if (!dinoLibrary || dinoLibrary.length === 0) return;
        const { currentDino, userProgress } = get();

        // If a dino is already rolled, recompute its time calculation and pool chance with current userProgress
        if (currentDino) {
          const uuid = currentDino.uuid || currentDino.id || currentDino.name;
          const userCount = Number(userProgress.owned_dinos[uuid]?.number || 0);
          const calc = calculatePomodoroTime(currentDino, userCount, userProgress);
          const rollData = getDinoRollChance(currentDino, dinoLibrary, userProgress);
          const prev = get();
          const elapsed = Math.max(0, prev.sessionDuration - prev.timeRemaining);
          set({
            chancePercent: rollData.chancePercent,
            categoryChancePercent: rollData.categoryChancePercent,
            categoryLabel: rollData.categoryLabel,
            categoryCount: rollData.categoryCount,
            timeCalc: calc,
            sessionDuration: calc.durationSeconds,
            timeRemaining:
              prev.timeRemaining <= 0
                ? 0
                : Math.max(1, calc.durationSeconds - Math.min(elapsed, calc.durationSeconds - 1)),
          });
          return;
        }

        // Roll new dino with userProgress affinity
        const rolled = rollWeightedDino(dinoLibrary, userProgress);
        const uuid = rolled.dino.uuid || rolled.dino.id || rolled.dino.name;
        const userCount = Number(userProgress.owned_dinos[uuid]?.number || 0);
        const calc = calculatePomodoroTime(rolled.dino, userCount, userProgress);

        set({
          currentDino: rolled.dino,
          chancePercent: rolled.chancePercent,
          categoryChancePercent: rolled.categoryChancePercent,
          categoryLabel: rolled.categoryLabel,
          categoryCount: rolled.categoryCount,
          timeCalc: calc,
          sessionDuration: calc.durationSeconds,
          timeRemaining: calc.durationSeconds,
          isRunning: false,
        });
      },

      swapDino: (dinoLibrary) => {
        if (!dinoLibrary || dinoLibrary.length === 0) return;
        const { userProgress, soundEnabled } = get();

        if (soundEnabled) {
          playTimerPause();
        }

        const rolled = rollWeightedDino(dinoLibrary, userProgress);
        const uuid = rolled.dino.uuid || rolled.dino.id || rolled.dino.name;
        const userCount = Number(userProgress.owned_dinos[uuid]?.number || 0);
        const calc = calculatePomodoroTime(rolled.dino, userCount, userProgress);

        set({
          currentDino: rolled.dino,
          chancePercent: rolled.chancePercent,
          categoryChancePercent: rolled.categoryChancePercent,
          categoryLabel: rolled.categoryLabel,
          categoryCount: rolled.categoryCount,
          timeCalc: calc,
          sessionDuration: calc.durationSeconds,
          timeRemaining: calc.durationSeconds,
          isRunning: false,
        });

        get().persistTimerToBackend();
      },

      toggleTimer: () => {
        const { isRunning } = get();
        if (isRunning) {
          get().pauseTimer();
        } else {
          get().startTimer();
        }
      },

      startTimer: () => {
        const { timeRemaining, focusTotalUsedSeconds, soundEnabled } = get();
        if (timeRemaining <= 0) return;

        // Daily limit gate (10H = 36000s = 5 marks of 2H each)
        if (focusTotalUsedSeconds >= DAILY_LIMIT_SECONDS) {
          return;
        }

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(() => {});
        }

        if (soundEnabled) playTimerStart();
        set({ isRunning: true });
        get().persistTimerToBackend();
      },

      pauseTimer: () => {
        const { soundEnabled } = get();
        if (soundEnabled) playTimerPause();
        set({ isRunning: false });
        get().persistTimerToBackend();
      },

      resetTimer: () => {
        const { sessionDuration } = get();
        set({
          timeRemaining: sessionDuration,
          isRunning: false,
        });
        get().persistTimerToBackend();
      },

      claimDino: (dinoLibrary) => {
        const { currentDino, userProgress, timeRemaining, soundEnabled } = get();
        if (!currentDino || timeRemaining > 0) return;

        const uuid = currentDino.uuid || currentDino.id || currentDino.name;
        const currentCount = Number(userProgress.owned_dinos[uuid]?.number || 0);
        const evoCount = currentDino.evolutions?.length || 4;

        // Advance 1 evo at a time
        const newCount = advanceDinoOneEvo(currentCount, evoCount);
        const newRank = Math.min(
          evoCount,
          currentCount === 0 ? 1 : (userProgress.owned_dinos[uuid]?.rank || 1) + 1
        );
        const evoFero =
          currentDino.evolutions?.[newRank - 1]?.ferocity || currentDino.max_ferocity || 350;

        const updatedOwned = {
          ...userProgress.owned_dinos,
          [uuid]: {
            number: newCount,
            rank: newRank,
            ferocity: evoFero,
          },
        };

        const updatedProgress = { owned_dinos: updatedOwned };

        if (soundEnabled) {
          playHatchFanfare();
        }

        try {
          persistArcProgress(updatedProgress as any).catch(() => {});
        } catch {
          // Ignore
        }

        // Roll new random dino for next session
        let nextDinoObj = null;
        let nextChance = 0;
        let nextCatChance = 0;
        let nextCatLabel = '';
        let nextCatCount = 0;
        let nextCalc = null;

        if (dinoLibrary && dinoLibrary.length > 0) {
          const rolled = rollWeightedDino(dinoLibrary, updatedProgress);
          nextDinoObj = rolled.dino;
          nextChance = rolled.chancePercent;
          nextCatChance = rolled.categoryChancePercent;
          nextCatLabel = rolled.categoryLabel;
          nextCatCount = rolled.categoryCount;
          const nextKey = nextDinoObj.uuid || nextDinoObj.id || nextDinoObj.name;
          const nextCount = Number((updatedOwned as Record<string, any>)[nextKey]?.number || 0);
          nextCalc = calculatePomodoroTime(nextDinoObj, nextCount, updatedProgress);
        }

        set({
          userProgress: updatedProgress,
          lastClaimedDino: {
            dino: currentDino,
            rank: newRank,
            count: newCount,
          },
          currentDino: nextDinoObj || currentDino,
          chancePercent: nextChance,
          categoryChancePercent: nextCatChance,
          categoryLabel: nextCatLabel,
          categoryCount: nextCatCount,
          timeCalc: nextCalc,
          sessionDuration: nextCalc ? nextCalc.durationSeconds : 25 * 60,
          timeRemaining: nextCalc ? nextCalc.durationSeconds : 25 * 60,
          isRunning: false,
        });

        get().persistTimerToBackend();

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Dino Claimed! 🦖', {
              body: `${currentDino.name} has been upgraded to EVO ${newRank}! A new dinosaur has been rolled!`,
              icon: currentDino.image_url,
            });
          } catch {
            // Ignore
          }
        }
      },

      resetAllDinos: async (dinoLibrary) => {
        const emptyProgress = { owned_dinos: {} };

        try {
          await resetArcProgress();
        } catch (e) {
          console.warn('[DinoPomodoroStore] Error clearing backend progress:', e);
        }

        let freshDino = null;
        let freshChance = 0;
        let freshCatChance = 0;
        let freshCatLabel = '';
        let freshCatCount = 0;
        let freshCalc = null;

        if (dinoLibrary && dinoLibrary.length > 0) {
          const rolled = rollWeightedDino(dinoLibrary, emptyProgress);
          freshDino = rolled.dino;
          freshChance = rolled.chancePercent;
          freshCatChance = rolled.categoryChancePercent;
          freshCatLabel = rolled.categoryLabel;
          freshCatCount = rolled.categoryCount;
          freshCalc = calculatePomodoroTime(freshDino, 0, emptyProgress);
        }

        set({
          userProgress: emptyProgress,
          lastClaimedDino: null,
          currentDino: freshDino,
          chancePercent: freshChance,
          categoryChancePercent: freshCatChance,
          categoryLabel: freshCatLabel,
          categoryCount: freshCatCount,
          timeCalc: freshCalc,
          sessionDuration: freshCalc ? freshCalc.durationSeconds : 25 * 60,
          timeRemaining: freshCalc ? freshCalc.durationSeconds : 25 * 60,
          isRunning: false,
        });
      },

      tick: () => {
        const {
          isRunning,
          timeRemaining,
          focusTotalUsedSeconds,
          tickSoundEnabled,
          soundEnabled,
          sessionDuration,
          marks,
          chunkSeconds,
        } = get();

        if (!isRunning) return;

        // Daily limit gate (10H = 36000s = 5 chunks of 2H marks)
        if (focusTotalUsedSeconds >= DAILY_LIMIT_SECONDS) {
          set({
            isRunning: false,
            timeRemaining: 0,
            focusTotalUsedSeconds: DAILY_LIMIT_SECONDS,
            focusCompletedPomodoros: 5,
          });
          get().persistTimerToBackend();
          return;
        }

        const newUsedSeconds = focusTotalUsedSeconds + 1;
        const newCompletedMarks = Math.min(5, Math.floor(newUsedSeconds / POMODORO_2H_SECONDS));

        if (timeRemaining > 1) {
          const nextRemaining = timeRemaining - 1;
          const elapsedInSession = sessionDuration - nextRemaining;

          if (soundEnabled && isMarkHit(elapsedInSession, marks, chunkSeconds, sessionDuration)) {
            playMarkBell();
          } else if (tickSoundEnabled && soundEnabled) {
            playTick();
          }

          set({
            timeRemaining: nextRemaining,
            focusTotalUsedSeconds: newUsedSeconds,
            focusCompletedPomodoros: newCompletedMarks,
          });

          // Periodic persistence every 10 seconds while running
          if (newUsedSeconds % 10 === 0) {
            get().persistTimerToBackend();
          }
        } else if (timeRemaining === 1) {
          // Current dino incubation session completed!
          if (soundEnabled) {
            playTimerAlarm();
          }

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
              const dino = get().currentDino;
              new Notification('🦖 Incubation Complete!', {
                body: `${dino?.name || 'Prehistoric Specimen'} is ready for ascension! Click to claim.`,
                icon: dino?.image_url,
              });
            } catch {
              // Ignore
            }
          }

          set({
            timeRemaining: 0,
            isRunning: false,
            focusTotalUsedSeconds: newUsedSeconds,
            focusCompletedPomodoros: newCompletedMarks,
          });

          get().persistTimerToBackend();
        }
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      toggleTickSound: () => {
        set((state) => ({ tickSoundEnabled: !state.tickSoundEnabled }));
      },

      addMark: (input) => {
        const seconds = parseMarkInput(input);
        if (seconds === null) return false;
        const { marks, sessionDuration } = get();
        if (seconds >= sessionDuration) return false;
        if (marks.includes(seconds)) return true;
        if (marks.length >= MAX_CUSTOM_MARKS) return false;
        set({ marks: [...marks, seconds].sort((a, b) => a - b) });
        return true;
      },

      removeMark: (seconds) => {
        set((state) => ({ marks: state.marks.filter((m) => m !== seconds) }));
      },

      clearMarks: () => {
        set({ marks: [] });
      },

      setChunk: (input) => {
        const seconds = parseMarkInput(input);
        if (seconds === null || seconds < MIN_CHUNK_SECONDS) return false;
        set({ chunkSeconds: seconds });
        return true;
      },

      clearChunk: () => {
        set({ chunkSeconds: 0 });
      },

      dismissCelebration: () => {
        set({ lastClaimedDino: null });
      },

      syncWithBackend: async () => {
        try {
          const backend = await fetchArcProgress();
          if (backend?.owned_dinos) {
            set((state) => ({
              userProgress: {
                owned_dinos: {
                  ...state.userProgress.owned_dinos,
                  ...backend.owned_dinos,
                },
              },
            }));
          }
        } catch {
          // Ignore
        }
      },

      syncTimerWithBackend: async () => {
        try {
          const saved = await fetchPomodoroTimerState();
          const todayKey = getLocalDateKey();

          if (!saved) {
            get().persistTimerToBackend();
            return;
          }

          // Check for day rollover
          if (saved.day_key !== todayKey) {
            // New day: reset daily counter and completed marks
            set({
              focusDayKey: todayKey,
              focusTotalUsedSeconds: 0,
              focusCompletedPomodoros: 0,
              isRunning: false,
            });
            get().persistTimerToBackend();
            return;
          }

          // Same day: hydrate authoritative state from backend
          const totalUsed = Math.min(DAILY_LIMIT_SECONDS, Math.max(0, Number(saved.total_used_seconds || 0)));
          const completed = Math.min(5, Math.floor(totalUsed / POMODORO_2H_SECONDS));

          set({
            focusDayKey: todayKey,
            focusTotalUsedSeconds: totalUsed,
            focusCompletedPomodoros: completed,
            isRunning: false, // Never auto-run on refresh without explicit user action
          });
        } catch (e) {
          console.warn('[DinoPomodoroStore] Error synchronizing timer with backend:', e);
        }
      },

      persistTimerToBackend: async () => {
        try {
          const { timeRemaining, focusTotalUsedSeconds, focusCompletedPomodoros, isRunning } = get();
          const todayKey = getLocalDateKey();
          const hoursRemaining = Math.max(0, timeRemaining / 3600);

          await persistPomodoroTimerState({
            day_key: todayKey,
            hours_remaining: Number(hoursRemaining.toFixed(4)),
            seconds_remaining: timeRemaining,
            completed_pomodoros: focusCompletedPomodoros,
            total_used_seconds: focusTotalUsedSeconds,
            is_running: isRunning ? 1 : 0,
          });
        } catch (e) {
          console.warn('[DinoPomodoroStore] Error persisting timer to backend:', e);
        }
      },
    }),
    {
      name: 'dino_pomodoro_storage_v4',
      partialize: (state) => ({
        userProgress: state.userProgress,
        currentDino: state.currentDino,
        chancePercent: state.chancePercent,
        categoryChancePercent: state.categoryChancePercent,
        categoryLabel: state.categoryLabel,
        categoryCount: state.categoryCount,
        timeCalc: state.timeCalc,
        sessionDuration: state.sessionDuration,
        timeRemaining: state.timeRemaining,
        focusDayKey: state.focusDayKey,
        focusTotalUsedSeconds: state.focusTotalUsedSeconds,
        focusCompletedPomodoros: state.focusCompletedPomodoros,
        soundEnabled: state.soundEnabled,
        tickSoundEnabled: state.tickSoundEnabled,
        marks: state.marks,
        chunkSeconds: state.chunkSeconds,
      }),
    }
  )
);
