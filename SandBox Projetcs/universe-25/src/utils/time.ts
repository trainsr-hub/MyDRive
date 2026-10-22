// path: src/utils/formatDuration.ts

// =============================================================================
// [GLOBAL TIME FORMATTING UTILITY]
// Chuyển tổng số giây thành dạng:
//   aYbMocDdhemfs
//
// - Đơn vị có giá trị 0 sẽ được bỏ qua.
// - Nếu toàn bộ bằng 0 → "0s"
// - Quy ước:
//   1Y = 365 ngày
//   1M = 30 ngày
// =============================================================================

export function formatDuration(
  seconds: number | string | null | undefined
): string {
  if (seconds === null || seconds === undefined || seconds === '') {
    return '0s';
  }

  let sec = typeof seconds === 'string' ? parseFloat(seconds) : seconds;

  if (isNaN(sec) || sec < 0) {
    return '0s';
  }

  sec = Math.floor(sec);

  const SECONDS_PER_MINUTE = 60;
  const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
  const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;
  const SECONDS_PER_MONTH = 30 * SECONDS_PER_DAY;
  const SECONDS_PER_YEAR = 365 * SECONDS_PER_DAY;

  const years = Math.floor(sec / SECONDS_PER_YEAR);
  sec %= SECONDS_PER_YEAR;

  const months = Math.floor(sec / SECONDS_PER_MONTH);
  sec %= SECONDS_PER_MONTH;

  const days = Math.floor(sec / SECONDS_PER_DAY);
  sec %= SECONDS_PER_DAY;

  const hours = Math.floor(sec / SECONDS_PER_HOUR);
  sec %= SECONDS_PER_HOUR;

  const minutes = Math.floor(sec / SECONDS_PER_MINUTE);
  const secondsRemaining = sec % SECONDS_PER_MINUTE;

  const parts: string[] = [];

  if (years > 0) parts.push(`${years}Y`);
  if (months > 0) parts.push(`${months}M`);
  if (days > 0) parts.push(`${days}D`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secondsRemaining > 0) parts.push(`${secondsRemaining}s`);

  return parts.length > 0 ? parts.join('') : '0s';
}