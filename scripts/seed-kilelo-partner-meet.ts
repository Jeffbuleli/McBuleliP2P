/**
 * Upsert Partner Meet for Kilelo RDV (confirmé lundi 27 juillet 15h00).
 *
 *   npx tsx scripts/seed-kilelo-partner-meet.ts
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
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
  const meet = await upsertPartnerMeet({
    slug: "kilelo-partenariat",
    title: "McBuleli × Kilelo - RDV partenariat",
    partnerName: "Kilelo",
    partnerEmail: "support@kileloapp.com",
    hostEmail: "ceo@mcbuleli.org",
    durationMinutes: 30,
    status: "confirmed",
    scheduledAt: new Date("2026-07-27T15:00:00+01:00"),
    timezone: "Africa/Kinshasa",
    allowlistEmails: [
      "support@kileloapp.com",
      "ceo@mcbuleli.org",
      "hi@mcbuleli.org",
    ],
    agenda: [
      "Attentes de part et d'autre pour le McBuleli Hackathon",
      "Rôle Kilelo : talk / mentorat marketplace & confiance",
      "Déroulement des 2 jours et logistique Demo Day",
      "Prochaines étapes (logo, créneau talk, contact référent)",
    ],
    notes:
      "RDV confirmé lundi 27 juillet 2026 15h00 Kinshasa - visio McBuleli Meet avec CEO McBuleli.",
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
