/**
 * Target response times for manual crypto ops (human queue).
 * Used for admin SLA badges and user-facing hints. Override via env on Render.
 */
function parsePositiveHours(raw: string | undefined, fallback: number): number {
  const n = raw?.trim() ? Number(raw.trim()) : fallback;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function withdrawalSlaHours(): number {
  return parsePositiveHours(process.env.WITHDRAWAL_SLA_HOURS, 24);
}

/** PI / manual deposit stuck in PENDING_VALIDATION — informational only. */
export function depositValidationSlaHours(): number {
  return parsePositiveHours(process.env.DEPOSIT_VALIDATION_SLA_HOURS, 48);
}
