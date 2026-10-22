// path: src/apps/arc-jurassic/core/rutGonTime.ts

export function rutGonTime(value: number | string, unit: string = 'seconds'): string {
    const number = Number(value);

    if (!Number.isFinite(number) || number <= 0) {
        return "0S";
    }

    const unitMap: Record<string, number> = {
        second: 1, seconds: 1, s: 1,
        minute: 60, minutes: 60, min: 60, m: 60,
        hour: 3600, hours: 3600, h: 3600,
        day: 86400, days: 86400, d: 86400,
        month: 2592000, months: 2592000, mo: 2592000,
        year: 31536000, years: 31536000, y: 31536000
    };

    const normalizedUnit = String(unit || "").toLowerCase().trim();
    const secondsPerUnit = unitMap[normalizedUnit] || 1;

    let totalSeconds = Math.floor(number * secondsPerUnit);

    const yearSeconds = 31536000;
    const monthSeconds = 2592000;
    const daySeconds = 86400;
    const hourSeconds = 3600;
    const minuteSeconds = 60;

    const years = Math.floor(totalSeconds / yearSeconds);
    totalSeconds %= yearSeconds;

    const months = Math.floor(totalSeconds / monthSeconds);
    totalSeconds %= monthSeconds;

    const days = Math.floor(totalSeconds / daySeconds);
    totalSeconds %= daySeconds;

    const hours = Math.floor(totalSeconds / hourSeconds);
    totalSeconds %= hourSeconds;

    const minutes = Math.floor(totalSeconds / minuteSeconds);
    const seconds = totalSeconds % minuteSeconds;

    const result = [];
    if (years > 0) result.push(`${years}Y`);
    if (months > 0) result.push(`${months}Mo`);
    if (days > 0) result.push(`${days}D`);
    if (hours > 0) result.push(`${hours}H`);
    if (minutes > 0) result.push(`${minutes}M`);
    if (seconds > 0) result.push(`${seconds}S`);

    if (result.length === 0) {
        return "0S";
    }

    return result.join(":");
}
