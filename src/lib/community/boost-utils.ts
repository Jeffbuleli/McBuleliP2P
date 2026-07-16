/** Pure boost helpers - safe for client components (no DB). */

export function isPostBoosted(
  boostedUntil: string | Date | null | undefined,
): boolean {
  if (!boostedUntil) return false;
  const t =
    typeof boostedUntil === "string"
      ? new Date(boostedUntil).getTime()
      : boostedUntil.getTime();
  return Number.isFinite(t) && t > Date.now();
}
