import { and, eq, gte } from "drizzle-orm";
import {
  academyEditions,
  academyEnrollments,
  academyLearningEvents,
  academyProgressNudges,
  academyPrograms,
  getDb,
  users,
} from "@/db";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_PROGRAM_LAUNCH,
} from "@/lib/academy-config";
import { appBaseUrl } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { findMarketingBroadcast } from "@/lib/email/marketing-broadcasts";
import {
  renderMarketingBroadcastHtml,
  renderMarketingBroadcastText,
} from "@/lib/email/marketing-layout";
import { preferFrenchEmail } from "@/lib/academy-email-locale";
import { getAcademyHub } from "@/lib/academy-service";
import { ensureAcademyLaunchSeed } from "@/lib/academy-seed";

const NUDGE_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const STALE_ACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

/** P1b - email aux inscrits cohorte avec progression < 60 % et peu d'activité récente. */
export async function runAcademyJourneyNudges(): Promise<{
  scanned: number;
  sent: number;
}> {
  if (process.env.RESEND_ALLOW_SEND !== "true") {
    return { scanned: 0, sent: 0 };
  }

  await ensureAcademyLaunchSeed();
  const db = getDb();
  const now = Date.now();
  const staleBefore = new Date(now - STALE_ACTIVITY_MS);

  const [edition] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      and(
        eq(academyEditions.slug, ACADEMY_EDITION_JUNE_2026),
        eq(academyPrograms.slug, ACADEMY_PROGRAM_LAUNCH),
      ),
    )
    .limit(1);
  if (!edition) return { scanned: 0, sent: 0 };

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
        eq(academyEnrollments.editionId, edition.id),
        eq(academyEnrollments.status, "active"),
      ),
    );

  let scanned = 0;
  let sent = 0;

  for (const en of enrollments) {
    scanned += 1;
    const hub = await getAcademyHub({
      userId: en.userId,
      locale: preferFrenchEmail(en.countryCode) ? "fr" : "en",
      viewerRole: "learner",
    });
    if (hub.journey.progressPercent >= 60) continue;

    const [recent] = await db
      .select({ id: academyLearningEvents.id })
      .from(academyLearningEvents)
      .where(
        and(
          eq(academyLearningEvents.userId, en.userId),
          gte(academyLearningEvents.createdAt, staleBefore),
        ),
      )
      .limit(1);
    if (recent) continue;

    const [nudge] = await db
      .select({ lastSentAt: academyProgressNudges.lastSentAt })
      .from(academyProgressNudges)
      .where(eq(academyProgressNudges.userId, en.userId))
      .limit(1);
    if (nudge && nudge.lastSentAt.getTime() > now - NUDGE_COOLDOWN_MS) {
      continue;
    }

    const locale = preferFrenchEmail(en.countryCode) ? "fr" : "en";
    const def = findMarketingBroadcast("academy_journey", locale);
    if (!def) continue;

    const copy = {
      ...def.copy,
      ctaHref: `${appBaseUrl().replace(/\/$/, "")}/app/academy?utm_source=email&utm_medium=journey&utm_campaign=academy_progress`,
    };

    const ok = await sendEmail({
      to: en.email,
      subject: def.subject,
      html: renderMarketingBroadcastHtml({
        copy,
        locale,
        resendAudience: true,
      }),
      text: renderMarketingBroadcastText({
        copy,
        locale,
        resendAudience: true,
      }),
    });
    if (!ok) continue;

    await db
      .insert(academyProgressNudges)
      .values({ userId: en.userId, lastSentAt: new Date() })
      .onConflictDoUpdate({
        target: academyProgressNudges.userId,
        set: { lastSentAt: new Date() },
      });
    sent += 1;
  }

  return { scanned, sent };
}
