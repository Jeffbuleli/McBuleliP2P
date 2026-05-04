/** Simple interest: APR is nominal annual, pro-rated by locked calendar days. */
export function maturityRewardAmount(
  principal: number,
  aprPercentAnnual: number,
  termDays: number,
): number {
  if (!Number.isFinite(principal) || principal <= 0) return 0;
  if (!Number.isFinite(aprPercentAnnual) || aprPercentAnnual < 0) return 0;
  if (!Number.isFinite(termDays) || termDays <= 0) return 0;
  return principal * (aprPercentAnnual / 100) * (termDays / 365);
}

/** Linear accrual for display (not compounded). */
export function accruedRewardLinear(
  principal: number,
  aprPercentAnnual: number,
  termDays: number,
  startedAt: Date,
  endsAt: Date,
  now: Date = new Date(),
): number {
  const full = maturityRewardAmount(principal, aprPercentAnnual, termDays);
  const t0 = startedAt.getTime();
  const t1 = endsAt.getTime();
  if (t1 <= t0) return 0;
  const p = Math.min(1, Math.max(0, (now.getTime() - t0) / (t1 - t0)));
  return full * p;
}
