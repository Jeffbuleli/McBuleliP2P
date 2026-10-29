/**
 * Resend paid confirmation emails (Meet + QR) for edition nov26.
 *
 *   npx tsx scripts/resend-nov26-paid-confirmation-emails.ts
 *   npx tsx scripts/resend-nov26-paid-confirmation-emails.ts --dry-run
 *
 * Requires NOV26_GOOGLE_MEET_URL in env for Meet block in email.
 */
import { and, eq } from "drizzle-orm";
import { getDb, hackathonEditions, hackathonRegistrations } from "../src/db";
import { NOV26_EDITION_SLUG } from "../src/lib/hackathon/editions";
import { sendHackathonTicketEmail } from "../src/lib/email/messages/hackathon";

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const db = getDb();
  const [edition] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.slug, NOV26_EDITION_SLUG))
    .limit(1);
  if (!edition) {
    console.error("Edition nov26 not found — run seed-nov26-formation.ts first.");
    process.exit(1);
  }

  const rows = await db
    .select({ id: hackathonRegistrations.id, email: hackathonRegistrations.email })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, edition.id),
        eq(hackathonRegistrations.paymentStatus, "paid"),
      ),
    );

  console.log(`Found ${rows.length} paid registration(s) for nov26`);
  for (const row of rows) {
    if (dryRun) {
      console.log(`  dry-run would send → ${row.email} (${row.id})`);
      continue;
    }
    const ok = await sendHackathonTicketEmail({ registrationId: row.id });
    console.log(ok ? `  sent → ${row.email}` : `  skip/fail → ${row.email}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
