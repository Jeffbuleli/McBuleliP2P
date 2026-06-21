import {
  ACADEMY_TEST_LIVE_SESSION,
} from "@/lib/academy-config";
import { isSessionEnded, isSessionLiveNow } from "@/lib/academy-live";
import type { AcademySessionView } from "@/lib/academy-service";

/** Test live visible only when explicitly enabled (admin/staff or env). */
export function isAcademyTestLiveEnabled(): boolean {
  const v = process.env.ACADEMY_TEST_LIVE_ENABLED?.trim().toLowerCase();
  if (v === "true" || v === "1") return true;
  if (v === "false" || v === "0") return false;
  return process.env.NODE_ENV !== "production";
}

export function shouldShowAcademySessionSlug(args: {
  sessionSlug: string;
  isStaff: boolean;
}): boolean {
  if (args.sessionSlug !== ACADEMY_TEST_LIVE_SESSION) return true;
  return args.isStaff || isAcademyTestLiveEnabled();
}

export function isAcademySessionUpcoming(s: AcademySessionView): boolean {
  if (s.isLiveNow) return true;
  if (s.hasReplay) return false;
  const ended = isSessionEnded({
    startsAt: new Date(s.startsAt),
    endsAt: s.endsAt ? new Date(s.endsAt) : null,
  });
  return !ended;
}

export function partitionAcademySessions(sessions: AcademySessionView[]): {
  upcoming: AcademySessionView[];
  replays: AcademySessionView[];
} {
  const upcoming: AcademySessionView[] = [];
  const replays: AcademySessionView[] = [];
  for (const s of sessions) {
    if (s.hasReplay && s.replayUrl) {
      replays.push(s);
      continue;
    }
    if (isAcademySessionUpcoming(s)) upcoming.push(s);
  }
  return { upcoming, replays };
}

export function filterVisibleSessions(
  sessions: AcademySessionView[],
  args: { isStaff: boolean },
): AcademySessionView[] {
  return sessions.filter((s) =>
    shouldShowAcademySessionSlug({ sessionSlug: s.slug, isStaff: args.isStaff }),
  );
}
