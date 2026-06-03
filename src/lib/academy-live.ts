/** Build sovereign or Jitsi fallback URL for a live session. */
export function buildLiveJoinUrl(args: {
  editionSlug: string;
  sessionSlug: string;
  sessionLiveUrl: string | null;
  liveBaseUrl: string | null;
}): string {
  if (args.sessionLiveUrl?.trim()) {
    return args.sessionLiveUrl.trim();
  }
  const base =
    args.liveBaseUrl?.trim() ||
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    "";
  if (base) {
    return `${base.replace(/\/$/, "")}/${args.sessionSlug}`;
  }
  const room = `mcbuleli-${args.editionSlug}-${args.sessionSlug}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return `https://meet.jit.si/${room}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true`;
}

/** Session ended — replay may be available. */
export function isSessionEnded(args: {
  startsAt: Date;
  endsAt: Date | null;
}): boolean {
  const end = args.endsAt?.getTime() ?? args.startsAt.getTime() + 2 * 60 * 60 * 1000;
  return Date.now() > end + 5 * 60 * 1000;
}

export function isSessionLiveNow(args: {
  startsAt: Date;
  endsAt: Date | null;
  windowMin?: number;
}): boolean {
  const win = (args.windowMin ?? 20) * 60 * 1000;
  const now = Date.now();
  const start = args.startsAt.getTime();
  const end = args.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
  return now >= start - win && now <= end + win;
}
