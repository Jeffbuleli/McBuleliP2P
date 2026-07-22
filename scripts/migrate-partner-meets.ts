/**
 * Apply drizzle/0110_partner_meets.sql then upsert Kilelo meet.
 *   npx tsx scripts/migrate-partner-meets.ts
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import postgres from "postgres";
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
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const sql = postgres(url, { max: 1 });
  const migration = readFileSync(
    path.join(process.cwd(), "drizzle/0110_partner_meets.sql"),
    "utf8",
  );
  for (const stmt of migration.split("--> statement-breakpoint")) {
    const s = stmt.trim();
    if (s) await sql.unsafe(s);
  }
  console.log("✓ migration partner_meets");
  await sql.end();

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
      "Réponse à Jeancy Kabangu - visio 20-30 min sur McBuleli Meet.",
  });

  console.log("✓ Partner meet ready");
  console.log(`  landing: ${partnerMeetPublicUrl(meet.slug)}`);
  console.log(`  room: ${meet.roomSlug}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
