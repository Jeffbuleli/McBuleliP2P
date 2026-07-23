/** Guest join window after scheduled start (host/admin may still relaunch after). */
export const PARTNER_MEET_GUEST_JOIN_WINDOW_MS = 60 * 60 * 1000;

type MeetTimingInput = {
  scheduledAt?: Date | string | null;
  status?: string | null;
};

export function partnerMeetScheduledMs(
  meet: Pick<MeetTimingInput, "scheduledAt">,
): number | null {
  if (!meet.scheduledAt) return null;
  const t = new Date(meet.scheduledAt).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Past the 1h guest window after scheduled start. */
export function isPartnerMeetGuestJoinExpired(
  meet: MeetTimingInput,
  nowMs: number = Date.now(),
): boolean {
  if (meet.status === "done" || meet.status === "cancelled") return true;
  const start = partnerMeetScheduledMs(meet);
  if (start == null) return false;
  return nowMs - start >= PARTNER_MEET_GUEST_JOIN_WINDOW_MS;
}

export function isPartnerMeetInProgress(
  meet: MeetTimingInput,
  nowMs: number = Date.now(),
): boolean {
  if (meet.status === "cancelled" || meet.status === "done") return false;
  const start = partnerMeetScheduledMs(meet);
  if (start == null) return false;
  return nowMs >= start && nowMs - start < PARTNER_MEET_GUEST_JOIN_WINDOW_MS;
}

export function normalizeMeetDisplayText(s: string): string {
  return s.replace(/\s*[—–−]\s*/g, " - ");
}
