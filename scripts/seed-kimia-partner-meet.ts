/**
 * Upsert Partner Meet for KIMIA Service (créneau à fixer - mardi 10h-15h).
 *
 *   npx tsx scripts/seed-kimia-partner-meet.ts
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
    slug: "kimia-partenariat",
    title: "McBuleli × KIMIA Service - RDV partenariat",
    partnerName: "KIMIA Service",
    partnerEmail: "kimiaservice896@gmail.com",
    hostEmail: "ceo@mcbuleli.org",
    durationMinutes: 30,
    status: "proposed",
    scheduledAt: null,
    timezone: "Africa/Kinshasa",
    allowlistEmails: [
      "kimiaservice896@gmail.com",
      "ceo@mcbuleli.org",
      "hi@mcbuleli.org",
    ],
    agenda: [
      "Rôle KIMIA Service : Partenaire Services & Talents",
      "Mentorat, relais talents / offres, diffusion réseau entreprises",
      "Visibilité, logos partenaires & logistique Demo Day",
      "Prochaines étapes (référent, logo, créneau confirmé)",
    ],
    notes:
      "Créneau à fixer : mardi (idéalement 28 juillet 2026) entre 10h00 et 15h00 Kinshasa - visio McBuleli Meet.",
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
