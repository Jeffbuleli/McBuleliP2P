/** Pending KYC older than this → reset to none (network/SDK drop / legacy Metamap orphans). */
export function kycStalePendingMs(): number {
  const raw = Number(process.env.KYC_STALE_PENDING_MS ?? String(60 * 60 * 1000));
  return Number.isFinite(raw) && raw > 0 ? raw : 60 * 60 * 1000;
}

export function isKycPendingStale(
  updatedAt: Date | string | null | undefined,
): boolean {
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() > kycStalePendingMs();
}

export const KYC_IN_FLIGHT_DIDIT = new Set([
  "In Progress",
  "Not Started",
  "Awaiting User",
  "Resubmitted",
]);

export const KYC_ABANDONED_DIDIT = new Set([
  "Expired",
  "Abandoned",
  "Kyc Expired",
]);
