// path: src/apps/dino-pomodoro/core/timerMarks.ts
// Pure helpers for Pomodoro "marks": elapsed-time checkpoints that ring a bell
// while the countdown keeps running until the real end.

/** Hard cap on custom marks to keep the UI and bar readable. */
export const MAX_CUSTOM_MARKS = 24;
/** Smallest allowed repeating chunk size (seconds). */
export const MIN_CHUNK_SECONDS = 60;

/**
 * Merges custom marks with the repeating chunk grid into one sorted, de-duplicated
 * list of elapsed-second checkpoints strictly inside the session (0 < mark < duration).
 * The session end itself is never a mark — the final alarm handles it.
 */
export function computeEffectiveMarks(
  customMarks: number[],
  chunkSeconds: number,
  durationSeconds: number
): number[] {
  const set = new Set<number>();

  for (const m of customMarks) {
    if (m > 0 && m < durationSeconds) set.add(m);
  }

  if (chunkSeconds >= MIN_CHUNK_SECONDS) {
    for (let t = chunkSeconds; t < durationSeconds; t += chunkSeconds) {
      set.add(t);
    }
  }

  return Array.from(set).sort((a, b) => a - b);
}

/** True if the given elapsed second lands exactly on a mark. */
export function isMarkHit(
  elapsedSeconds: number,
  customMarks: number[],
  chunkSeconds: number,
  durationSeconds: number
): boolean {
  if (elapsedSeconds <= 0 || elapsedSeconds >= durationSeconds) return false;
  if (customMarks.includes(elapsedSeconds)) return true;
  return chunkSeconds >= MIN_CHUNK_SECONDS && elapsedSeconds % chunkSeconds === 0;
}

/**
 * Parses user input into whole seconds.
 *  - "25"       → 25 minutes
 *  - "7.5"      → 7m 30s
 *  - "12:30"    → 12m 30s (mm:ss)
 *  - "1:05:00"  → 1h 05m (hh:mm:ss)
 * Returns null for invalid / non-positive input.
 */
export function parseMarkInput(raw: string): number | null {
  const text = raw.trim();
  if (!text) return null;

  const parts = text.split(':');
  if (parts.length > 3 || parts.some((p) => p.trim() === '' || !/^\d+(\.\d+)?$/.test(p.trim()))) {
    return null;
  }

  const nums = parts.map(Number);
  let seconds: number;
  if (nums.length === 1) seconds = nums[0] * 60;
  else if (nums.length === 2) seconds = nums[0] * 60 + nums[1];
  else seconds = nums[0] * 3600 + nums[1] * 60 + nums[2];

  seconds = Math.round(seconds);
  return seconds > 0 ? seconds : null;
}
