import { and, eq, gte, inArray, lte } from "drizzle-orm";
import {
  academyTrainingEventParticipants,
  academyTrainingEventReminders,
  academyTrainingEvents,
  getDb,
  users,
} from "@/db";
import { preferFrenchEmail } from "@/lib/academy-email-locale";
import { sendEmail } from "@/lib/email/send";
import { syncEventLifecycleStatuses } from "@/lib/events/events-service";
import {
  EventReminderKind,
  EventStatus,
  ParticipantStatus,
  type EventReminderKindValue,
} from "@/lib/events/types";
import { createUserNotification } from "@/lib/notifications-service";

const WINDOWS: { kind: EventReminderKindValue; ms: number; tolMs: number }[] = [
  { kind: EventReminderKind.D7, ms: 7 * 24 * 3600_000, tolMs: 30 * 60_000 },
  { kind: EventReminderKind.D1, ms: 24 * 3600_000, tolMs: 20 * 60_000 },
  { kind: EventReminderKind.H1, ms: 3600_000, tolMs: 10 * 60_000 },
  { kind: EventReminderKind.M15, ms: 15 * 60_000, tolMs: 5 * 60_000 },
  { kind: EventReminderKind.START, ms: 0, tolMs: 5 * 60_000 },
];

function pickReminderKind(msUntil: number): EventReminderKindValue | null {
  for (const w of WINDOWS) {
    if (msUntil >= w.ms - w.tolMs && msUntil <= w.ms + w.tolMs) return w.kind;
  }
  if (msUntil < 0 && msUntil >= -5 * 60_000) return EventReminderKind.START;
  return null;
}

export async function runEventReminders(): Promise<{
  notified: number;
  emails: number;
  lifecycle: { live: number; completed: number };
}> {
  const lifecycle = await syncEventLifecycleStatuses();
  const db = getDb();
  const now = Date.now();
  const horizon = new Date(now + 7 * 24 * 3600_000 + 60 * 60_000);

  const allEvents = await db
    .select()
    .from(academyTrainingEvents)
    .where(
      and(
        gte(academyTrainingEvents.startDate, new Date(now - 10 * 60_000)),
        lte(academyTrainingEvents.startDate, horizon),
        inArray(academyTrainingEvents.status, [EventStatus.PUBLISHED, EventStatus.LIVE]),
      ),
    );

  let notified = 0;
  let emails = 0;

  for (const event of allEvents) {
    const msUntil = event.startDate.getTime() - now;
    const kind = pickReminderKind(msUntil);
    if (!kind) continue;

    const participants = await db
      .select({
        userId: academyTrainingEventParticipants.userId,
        email: users.email,
        countryCode: users.countryCode,
      })
      .from(academyTrainingEventParticipants)
      .innerJoin(users, eq(academyTrainingEventParticipants.userId, users.id))
      .where(
        and(
          eq(academyTrainingEventParticipants.eventId, event.id),
          eq(academyTrainingEventParticipants.participantStatus, ParticipantStatus.ENROLLED),
        ),
      );

    const href = `/app/events/${event.slug}`;
    const when = new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: event.timezone,
    }).format(event.startDate);

    for (const p of participants) {
      const [sent] = await db
        .select({ id: academyTrainingEventReminders.id })
        .from(academyTrainingEventReminders)
        .where(
          and(
            eq(academyTrainingEventReminders.eventId, event.id),
            eq(academyTrainingEventReminders.userId, p.userId),
            eq(academyTrainingEventReminders.reminderKind, kind),
          ),
        )
        .limit(1);
      if (sent) continue;

      await db.insert(academyTrainingEventReminders).values({
        eventId: event.id,
        userId: p.userId,
        reminderKind: kind,
      });

      await createUserNotification({
        userId: p.userId,
        kind: "event_reminder",
        payload: {
          eventId: event.id,
          eventSlug: event.slug,
          title: event.title,
          reminderKind: kind,
          startsAt: event.startDate.toISOString(),
          href,
          platform: "McBuleli Live",
        },
      });
      notified += 1;

      if (process.env.RESEND_API_KEY && process.env.RESEND_ALLOW_SEND === "true" && p.email) {
        const isFr = preferFrenchEmail(p.countryCode);
        const subject = isFr
          ? `Rappel formation — ${event.title}`
          : `Training reminder — ${event.title}`;
        const body = isFr
          ? `Bonjour,\n\nFormation : ${event.title}\nDate : ${when}\nPlateforme : McBuleli Live\n\nRejoindre : https://mcbuleli.org${href}\n`
          : `Hello,\n\nTraining: ${event.title}\nWhen: ${when}\nPlatform: McBuleli Live\n\nJoin: https://mcbuleli.org${href}\n`;
        await sendEmail({
          to: p.email,
          subject,
          html: `<pre style="font-family:sans-serif">${body}</pre>`,
          text: body,
        }).catch(() => null);
        emails += 1;
      }
    }
  }

  return { notified, emails, lifecycle };
}
