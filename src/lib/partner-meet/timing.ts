/** Fallback when duration is unknown (legacy partnership RDVs). */
export const PARTNER_MEET_GUEST_JOIN_WINDOW_MS = 60 * 60 * 1000;

/** Grace after scheduled end so late rejoins still work. */
const PARTNER_MEET_GUEST_GRACE_MS = 30 * 60 * 1000;

type MeetTimingInput = {
  scheduledAt?: Date | string | null;
  status?: string | null;
  durationMinutes?: number | null;
};

export function partnerMeetScheduledMs(
  meet: Pick<MeetTimingInput, "scheduledAt">,
): number | null {
  if (!meet.scheduledAt) return null;
  const t = new Date(meet.scheduledAt).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Guest join window = session duration + 30 min grace (min 60 min). */
export function partnerMeetGuestWindowMs(
  meet: Pick<MeetTimingInput, "durationMinutes">,
): number {
  const mins = meet.durationMinutes;
  if (typeof mins === "number" && Number.isFinite(mins) && mins > 0) {
    return Math.max(60, mins) * 60 * 1000 + PARTNER_MEET_GUEST_GRACE_MS;
  }
  return PARTNER_MEET_GUEST_JOIN_WINDOW_MS;
}

/** Past the guest window after scheduled start. */
export function isPartnerMeetGuestJoinExpired(
  meet: MeetTimingInput,
  nowMs: number = Date.now(),
): boolean {
  if (meet.status === "done" || meet.status === "cancelled") return true;
  const start = partnerMeetScheduledMs(meet);
  if (start == null) return false;
  return nowMs - start >= partnerMeetGuestWindowMs(meet);
}

export function isPartnerMeetInProgress(
  meet: MeetTimingInput,
  nowMs: number = Date.now(),
): boolean {
  if (meet.status === "cancelled" || meet.status === "done") return false;
  const start = partnerMeetScheduledMs(meet);
  if (start == null) return false;
  return nowMs >= start && nowMs - start < partnerMeetGuestWindowMs(meet);
}

export function normalizeMeetDisplayText(s: string): string {
  return s.replace(/\s*[—–−]\s*/g, " - ");
}
