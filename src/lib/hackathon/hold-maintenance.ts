import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { getDb, hackathonRegistrations } from "@/db";
import { sendHackathonHoldReminderEmail } from "@/lib/email/messages/hackathon";
import { HACKATHON_REMINDER_HOURS } from "@/lib/hackathon/constants";

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

  return { expired: 0, reminded };
}
