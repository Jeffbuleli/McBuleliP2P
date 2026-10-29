import { and, eq, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { getDb, hackathonRegistrations } from "@/db";
import { sendEmailVerification } from "@/lib/email/messages/verify-email";
import { sendHackathonHoldReminderEmail } from "@/lib/email/messages/hackathon";
import { HACKATHON_REMINDER_HOURS } from "@/lib/hackathon/constants";
import type { EmailLocale } from "@/lib/email/locale";

/**
 * Hackathon seat holds do not auto-expire.
 * Cron (hourly on VPS) sends payment reminders every HACKATHON_REMINDER_HOURS.
 */
export async function runHackathonHoldMaintenance(): Promise<{
  expired: number;
  reminded: number;
}> {
  const db = getDb();
  const now = new Date();
  const reminderCutoff = new Date(
    now.getTime() - HACKATHON_REMINDER_HOURS * 60 * 60 * 1000,
  );

  await db
    .update(hackathonRegistrations)
    .set({ holdExpiresAt: null, updatedAt: now })
    .where(
      and(
        isNotNull(hackathonRegistrations.holdExpiresAt),
        or(
          eq(hackathonRegistrations.paymentStatus, "reserved"),
          eq(hackathonRegistrations.paymentStatus, "pending"),
          eq(hackathonRegistrations.paymentStatus, "failed"),
        ),
      ),
    );

  // Legacy status `expired` with a pay token → back to reserved.
  await db
    .update(hackathonRegistrations)
    .set({
      paymentStatus: "reserved",
      holdExpiresAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(hackathonRegistrations.paymentStatus, "expired"),
        isNotNull(hackathonRegistrations.paymentToken),
      ),
    );

  // Due: reserved, never reminded and created >= 24h ago,
  // OR last reminder was >= 24h ago.
  const due = await db
    .select({ id: hackathonRegistrations.id })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.paymentStatus, "reserved"),
        or(
          and(
            isNull(hackathonRegistrations.holdReminderSentAt),
            lte(hackathonRegistrations.createdAt, reminderCutoff),
          ),
          and(
            sql`${hackathonRegistrations.holdReminderSentAt} IS NOT NULL`,
            lte(hackathonRegistrations.holdReminderSentAt, reminderCutoff),
          ),
        ),
      ),
    )
    .limit(100);

  let reminded = 0;
  for (const row of due) {
    const ok = await sendHackathonHoldReminderEmail({
      registrationId: row.id,
    }).catch(() => false);
    if (ok) {
      await db
        .update(hackathonRegistrations)
        .set({ holdReminderSentAt: now, updatedAt: now })
        .where(eq(hackathonRegistrations.id, row.id));
      reminded += 1;
    }
  }

  // pending_verify: resend email verification every 24h (no seat loss).
  const verifyDue = await db
    .select({
      id: hackathonRegistrations.id,
      userId: hackathonRegistrations.userId,
      email: hackathonRegistrations.email,
      locale: hackathonRegistrations.locale,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.paymentStatus, "pending_verify"),
        isNotNull(hackathonRegistrations.userId),
        or(
          and(
            isNull(hackathonRegistrations.holdReminderSentAt),
            lte(hackathonRegistrations.createdAt, reminderCutoff),
          ),
          and(
            isNotNull(hackathonRegistrations.holdReminderSentAt),
            lte(hackathonRegistrations.holdReminderSentAt, reminderCutoff),
          ),
        ),
      ),
    )
    .limit(50);

  let verifyReminded = 0;
  for (const row of verifyDue) {
    if (!row.userId) continue;
    try {
      await sendEmailVerification({
        userId: row.userId,
        email: row.email,
        locale: (row.locale === "en" ? "en" : "fr") as EmailLocale,
        meta: { hackathonRegistrationId: row.id },
      });
      await db
        .update(hackathonRegistrations)
        .set({ holdReminderSentAt: now, updatedAt: now })
        .where(eq(hackathonRegistrations.id, row.id));
      verifyReminded += 1;
    } catch {
      /* skip */
    }
  }

  return { expired: 0, reminded: reminded + verifyReminded };
}
