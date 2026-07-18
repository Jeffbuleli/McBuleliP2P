import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { getDb, hackathonRegistrations } from "@/db";
import { sendHackathonHoldReminderEmail } from "@/lib/email/messages/hackathon";

/**
 * Expire overdue seat holds and send ~24h payment reminders.
 */
export async function runHackathonHoldMaintenance(): Promise<{
  expired: number;
  reminded: number;
}> {
  const db = getDb();
  const now = new Date();

  const expiredRows = await db
    .update(hackathonRegistrations)
    .set({ paymentStatus: "expired", updatedAt: now })
    .where(
      and(
        eq(hackathonRegistrations.paymentStatus, "reserved"),
        lte(hackathonRegistrations.holdExpiresAt, now),
      ),
    )
    .returning({ id: hackathonRegistrations.id });

  const reminderWindowEnd = new Date(now.getTime() + 28 * 60 * 60 * 1000);
  const reminderWindowStart = new Date(now.getTime() + 20 * 60 * 60 * 1000);

  const due = await db
    .select({ id: hackathonRegistrations.id })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.paymentStatus, "reserved"),
        isNull(hackathonRegistrations.holdReminderSentAt),
        gte(hackathonRegistrations.holdExpiresAt, reminderWindowStart),
        lte(hackathonRegistrations.holdExpiresAt, reminderWindowEnd),
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

  return { expired: expiredRows.length, reminded };
}
