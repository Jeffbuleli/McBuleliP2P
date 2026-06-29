import { and, eq, gte, lte, sql } from "drizzle-orm";
import {
  academyEditions,
  academyEnrollments,
  academySessionReminders,
  academySessions,
  getDb,
  users,
} from "@/db";
import { createUserNotification } from "@/lib/notifications-service";
import { sendEmail } from "@/lib/email/send";
import { preferFrenchEmail } from "@/lib/academy-email-locale";

const REMINDER_24H_MS = 24 * 60 * 60 * 1000;
const REMINDER_1H_MS = 60 * 60 * 1000;

export async function runAcademySessionReminders(): Promise<{
  notified: number;
  emails: number;
}> {
  const db = getDb();
  const now = Date.now();
  const windowEnd = new Date(now + REMINDER_24H_MS + 15 * 60 * 1000);

  const sessions = await db
    .select({
      session: academySessions,
      editionSlug: academyEditions.slug,
      editionTitleFr: academyEditions.titleFr,
      editionTitleEn: academyEditions.titleEn,
    })
    .from(academySessions)
    .innerJoin(academyEditions, eq(academySessions.editionId, academyEditions.id))
    .where(
      and(
        gte(academySessions.startsAt, new Date(now - 5 * 60 * 1000)),
        lte(academySessions.startsAt, windowEnd),
        sql`${academyEditions.status} IN ('open', 'active')`,
      ),
    );

  let notified = 0;
  let emails = 0;

  for (const { session, editionSlug, editionTitleFr, editionTitleEn } of sessions) {
    const start = session.startsAt.getTime();
    const msUntil = start - now;

    let kind: "24h" | "1h" | null = null;
    if (msUntil > REMINDER_24H_MS - 20 * 60 * 1000 && msUntil <= REMINDER_24H_MS + 20 * 60 * 1000) {
      kind = "24h";
    } else if (msUntil > REMINDER_1H_MS - 15 * 60 * 1000 && msUntil <= REMINDER_1H_MS + 15 * 60 * 1000) {
      kind = "1h";
    }
    if (!kind) continue;

    const enrollments = await db
      .select({
        userId: academyEnrollments.userId,
        email: users.email,
        countryCode: users.countryCode,
      })
      .from(academyEnrollments)
      .innerJoin(users, eq(academyEnrollments.userId, users.id))
      .where(
        and(
          eq(academyEnrollments.editionId, session.editionId),
          eq(academyEnrollments.status, "active"),
        ),
      );

    const titleFr = session.titleFr;
    const titleEn = session.titleEn;
    const startsIso = session.startsAt.toISOString();
    const cohortHref = `/app/academy/${editionSlug}`;

    for (const en of enrollments) {
      const [sent] = await db
        .select({ id: academySessionReminders.id })
        .from(academySessionReminders)
        .where(
          and(
            eq(academySessionReminders.sessionId, session.id),
            eq(academySessionReminders.userId, en.userId),
            eq(academySessionReminders.reminderKind, kind),
          ),
        )
        .limit(1);
      if (sent) continue;

      await db.insert(academySessionReminders).values({
        sessionId: session.id,
        userId: en.userId,
        reminderKind: kind,
      });

      await createUserNotification({
        userId: en.userId,
        kind: "academy_session_reminder",
        payload: {
          editionSlug,
          sessionSlug: session.slug,
          sessionTitleFr: titleFr,
          sessionTitleEn: titleEn,
          startsAt: startsIso,
          reminderKind: kind,
          href: cohortHref,
        },
      });
      notified += 1;

      if (process.env.RESEND_API_KEY && process.env.RESEND_ALLOW_SEND === "true") {
        const isFr = preferFrenchEmail(en.countryCode);
        const subject =
          kind === "1h"
            ? isFr
              ? `Rappel - live dans 1h : ${titleFr}`
              : `Reminder - live in 1h: ${titleEn}`
            : isFr
              ? `Rappel - live demain : ${titleFr}`
              : `Reminder - live tomorrow: ${titleEn}`;
        const body = isFr
          ? `<p>Bonjour,</p><p>Votre session <strong>${titleFr}</strong> (${editionTitleFr}) commence le ${new Date(startsIso).toLocaleString("fr-FR")}.</p><p><a href="https://mcbuleli.org${cohortHref}">Ouvrir McBuleli Academy</a></p>`
          : `<p>Hello,</p><p>Your session <strong>${titleEn}</strong> (${editionTitleEn}) starts at ${new Date(startsIso).toLocaleString("en-US")}.</p><p><a href="https://mcbuleli.org${cohortHref}">Open McBuleli Academy</a></p>`;

        const sent = await sendEmail({
          to: en.email,
          subject,
          html: body,
        });
        if (sent) emails += 1;
      }
    }
  }

  return { notified, emails };
}
