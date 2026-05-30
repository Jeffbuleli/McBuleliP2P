/** Session lifetime — cookie maxAge and JWT exp (default 90 days). */
export function sessionMaxAgeSeconds(): number {
  const days = Number(process.env.SESSION_MAX_AGE_DAYS ?? "90");
  const safe = Number.isFinite(days) && days > 0 ? days : 90;
  return Math.floor(safe * 24 * 60 * 60);
}

export function sessionMaxAgeDaysLabel(): string {
  return `${Math.floor(sessionMaxAgeSeconds() / 86400)}d`;
}
