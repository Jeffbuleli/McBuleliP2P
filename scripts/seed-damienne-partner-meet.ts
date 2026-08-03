/**
 * Upsert private Partner Meet for Damienne formation (Elisabeth Adilelou).
 *
 *   npx tsx scripts/seed-damienne-partner-meet.ts
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import {
  DAMIENNE_LEARNER,
  DAMIENNE_MEET_SLUG,
  DAMIENNE_SESSIONS,
} from "../src/lib/hackathon/damienne";
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
  const first = DAMIENNE_SESSIONS[0]!;
  const meet = await upsertPartnerMeet({
    slug: DAMIENNE_MEET_SLUG,
    title: "McBuleli × Damienne - Formation Vibe Coding & Pi SDK",
    partnerName: DAMIENNE_LEARNER.displayName,
    partnerEmail: DAMIENNE_LEARNER.email,
    hostEmail: "ceo@mcbuleli.org",
    durationMinutes: first.durationMinutes,
    status: "confirmed",
    scheduledAt: new Date(first.startsAt),
    timezone: DAMIENNE_LEARNER.timezone,
    allowlistEmails: [
      DAMIENNE_LEARNER.email,
      "ceo@mcbuleli.org",
      "hi@mcbuleli.org",
    ],
    agenda: [
      "Vibe Coding : intention → prompt → code → review",
      "Outils : Cursor, Claude, Codex, GitHub",
      "Construire une app avec l'IA",
      "SDK Pi Network : auth, paiements, publication",
    ],
    notes:
      "[private-allowlist] Formation privée 1 mois · 3×/semaine 19h Porto-Novo (GMT+1) · hub https://mcbuleli.org/hackathon/damienne · 14 sessions jusqu'au 2 sept. 2026",
  });

  console.log("Damienne partner meet ready");
  console.log(`  slug: ${meet.slug}`);
  console.log(`  status: ${meet.status}`);
  console.log(`  scheduledAt: ${meet.scheduledAt?.toISOString() ?? "null"}`);
  console.log(`  room: ${meet.roomSlug}`);
  console.log(`  hub:     https://mcbuleli.org/hackathon/damienne`);
  console.log(`  landing: ${partnerMeetPublicUrl(meet.slug)}`);
  console.log(`  join:    https://mcbuleli.org/meet/${meet.slug}/join`);
  console.log(`  host:    https://mcbuleli.org/meet/${meet.slug}/host`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
