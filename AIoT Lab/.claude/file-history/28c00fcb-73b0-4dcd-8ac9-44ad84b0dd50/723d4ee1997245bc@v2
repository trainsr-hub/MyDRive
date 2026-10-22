// path: src/apps/dino-pomodoro/core/clean2h.ts
// Mandate: Mathematical and Time Engine for Clean 2H Pomodoro & 10H Daily Limit (5 marks x 2H)

export const POMODORO_2H_SECONDS = 2 * 60 * 60; // 7200 seconds = 2 Hours
export const DAILY_LIMIT_SECONDS = 10 * 60 * 60; // 36000 seconds = 10 Hours
export const TOTAL_DAILY_MARKS = 5;

export interface EndOfDayCountdown {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string; // "HH:MM:SS"
  totalSeconds: number;
}

export interface MarkProgressItem {
  index: number;
  label: string;
  isCompleted: boolean;
  isActive: boolean;
  progressPercent: number;
  elapsedSeconds: number;
  remainingSeconds: number;
}

/**
 * Returns current local date string in YYYY-MM-DD format
 */
export function getLocalDateKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates countdown to end of day (10:30 PM = 22:30:00).
 * Invariant: Must always contain seconds ("HH:MM:SS").
 * If current time is past 22:30:00, counts down to tomorrow's 22:30:00.
 */
export function getCountdownTo1030PM(now: Date = new Date()): EndOfDayCountdown {
  const target = new Date(now);
  target.setHours(22, 30, 0, 0); // 10:30:00 PM

  if (now.getTime() >= target.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  const diffSec = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  const seconds = diffSec % 60;

  const formatted = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return {
    hours,
    minutes,
    seconds,
    formatted,
    totalSeconds: diffSec,
  };
}

/**
 * Calculates progress across the 5 marks (each mark = 2H = 7200s).
 * Strictly encapsulates the 10H daily limit as 5 visual marks.
 */
export function calculateDailyMarksProgress(totalUsedSeconds: number): MarkProgressItem[] {
  const clampedUsed = Math.min(DAILY_LIMIT_SECONDS, Math.max(0, totalUsedSeconds));

  return Array.from({ length: TOTAL_DAILY_MARKS }, (_, index) => {
    const markStart = index * POMODORO_2H_SECONDS;
    const markEnd = (index + 1) * POMODORO_2H_SECONDS;

    const isCompleted = clampedUsed >= markEnd;
    const isActive = clampedUsed >= markStart && clampedUsed < markEnd;

    const elapsedInBlock = Math.max(0, Math.min(POMODORO_2H_SECONDS, clampedUsed - markStart));
    const remainingInBlock = POMODORO_2H_SECONDS - elapsedInBlock;
    const progressPercent = Math.min(100, Math.max(0, (elapsedInBlock / POMODORO_2H_SECONDS) * 100));

    return {
      index,
      label: '2H',
      isCompleted,
      isActive,
      progressPercent,
      elapsedSeconds: elapsedInBlock,
      remainingSeconds: remainingInBlock,
    };
  });
}

/**
 * Formats seconds into HH:MM:SS format
 */
export function formatHMS(seconds: number): string {
  const sec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSecs = sec % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
}
