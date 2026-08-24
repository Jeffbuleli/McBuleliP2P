/**
 * Upsert Partner Meet for Kilelo talk à distance (Hackathon J1 · 10h00 Kinshasa).
 *
 *   npx tsx scripts/seed-kilelo-hackathon-meet.ts
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { KILELO_REMOTE_MEET_SLUG } from "../src/lib/hackathon/mc-day";
import {
  partnerMeetPublicUrl,
  upsertPartnerMeet,
} from "../src/lib/partner-meet";

function loadLocalEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  try {
    loadEnvFile(envPath);
  } catch {
    /* already loaded */
  }
}

loadLocalEnv();

async function main() {
  const slug = KILELO_REMOTE_MEET_SLUG;
  const meet = await upsertPartnerMeet({
    slug,
    title: "McBuleli Hackathon × Kilelo - Talk visio",
    partnerName: "Kilelo",
    partnerEmail: "support@kileloapp.com",
    hostEmail: "ceo@mcbuleli.org",
    durationMinutes: 15,
    status: "confirmed",
    scheduledAt: new Date("2026-08-28T10:00:00+01:00"),
    timezone: "Africa/Kinshasa",
    allowlistEmails: [
      "support@kileloapp.com",
      "ceo@mcbuleli.org",
      "hi@mcbuleli.org",
    ],
    agenda: [
      "Talk Kilelo : marketplace, matching, confiance et avis",
      "10 minutes · vitrine partenaires Hackathon",
      "Questions rapides si le temps le permet",
    ],
    notes:
      "Jeancy Kabangu à distance · créneau 10h00-10h10 Kinshasa · salle dédiée hackathon.",
  });

  console.log("Partner meet ready");
  console.log(`  slug: ${meet.slug}`);
  console.log(`  status: ${meet.status}`);
  console.log(`  scheduledAt: ${meet.scheduledAt?.toISOString() ?? "null"}`);
  console.log(`  room: ${meet.roomSlug}`);
  console.log(`  landing: ${partnerMeetPublicUrl(meet.slug)}`);
  console.log(`  join:    https://mcbuleli.org/meet/${meet.slug}/join`);
  console.log(`  host:    https://mcbuleli.org/meet/${meet.slug}/host`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
