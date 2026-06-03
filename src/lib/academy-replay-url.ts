/** Resolve learner-facing replay URL (HTTPS link or R2 public object). */

export function academyR2PublicBase(): string | null {
  const base =
    process.env.ACADEMY_R2_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_ACADEMY_R2_PUBLIC_BASE_URL?.trim() ||
    "";
  return base ? base.replace(/\/$/, "") : null;
}

export function resolveAcademyReplayPlayUrl(args: {
  replayUrl: string | null | undefined;
  replayR2Key: string | null | undefined;
}): string | null {
  const direct = args.replayUrl?.trim();
  if (direct) return direct;

  const key = args.replayR2Key?.trim();
  const base = academyR2PublicBase();
  if (key && base) {
    return `${base}/${key.replace(/^\//, "")}`;
  }
  return null;
}
