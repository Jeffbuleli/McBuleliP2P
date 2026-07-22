/**
 * Upsert Partner Meet for Kilelo RDV.
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
    status: "proposed",
    allowlistEmails: [
      "support@kileloapp.com",
      "ceo@mcbuleli.org",
      "hi@mcbuleli.org",
    ],
    agenda: [
      "Attentes de part et d'autre pour le McBuleli Hackathon",
      "Rôle Kilelo : talk / mentorat marketplace & confiance",
      "Déroulement des 3 jours et logistique Demo Day",
      "Prochaines étapes (logo, créneau talk, contact référent)",
    ],
    notes:
      "Réponse à Jeancy Kabangu - visio 20-30 min sur McBuleli Meet. Créneaux proposés dans l'email.",
  });

  console.log("✓ Partner meet ready");
  console.log(`  slug: ${meet.slug}`);
  console.log(`  room: ${meet.roomSlug}`);
  console.log(`  landing: ${partnerMeetPublicUrl(meet.slug)}`);
  console.log(`  join:    https://mcbuleli.org/meet/${meet.slug}/join`);
  console.log(`  host:    https://mcbuleli.org/meet/${meet.slug}/host`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
