/**
 * LP pool day window definition:
 * - 24h windows are aligned to 01:00 UTC ("GMT") cutoffs
 * - dayStartAt → dayEndAt (exclusive end)
 */
export function poolDayWindowEndingAtLatestCutoff(now: Date): {
  dayStartAt: Date;
  dayEndAt: Date;
} {
  const ms = now.getTime();
  const utc = new Date(ms);

  // Compute latest cutoff (01:00 UTC) at or before `now`.
  const y = utc.getUTCFullYear();
  const m = utc.getUTCMonth();
  const d = utc.getUTCDate();
  const cutoffToday = Date.UTC(y, m, d, 1, 0, 0, 0);
  const dayEndMs = ms >= cutoffToday ? cutoffToday : cutoffToday - 86_400_000;

  const dayEndAt = new Date(dayEndMs);
  const dayStartAt = new Date(dayEndMs - 86_400_000);
  return { dayStartAt, dayEndAt };
}

export function isPoolPayoutWindow(now: Date): boolean {
  // Allowed on the 15th and on the last day of month, starting after 01:00 UTC.
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const hour = now.getUTCHours();
  if (hour < 1) return false;

  const is15 = d === 15;
  const lastDay = new Date(Date.UTC(y, m + 1, 0, 0, 0, 0, 0)).getUTCDate();
  const isLast = d === lastDay;
  return is15 || isLast;
}

