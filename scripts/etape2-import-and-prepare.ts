/**
 * Étape 2 — import verified leads + qualify + prepare Jul 31 dry-run pack.
 * Usage (VPS): DATABASE_URL=... npx tsx scripts/etape2-import-and-prepare.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commitLeadImportFromFile } from "../src/lib/hackathon/leads/lead-import";
import { qualifyHackathonLeads } from "../src/lib/hackathon/leads/lead-qualify";
import { prepareJul31CampaignPack } from "../src/lib/hackathon/leads/campaign-service";
import { getDb, hackathonLeads } from "../src/db";
import { eq, sql } from "drizzle-orm";

const EDITION_ID =
  process.env.EDITION_ID ?? "8e431de4-f539-4d77-a7d4-ee5d939889ca";
const CSV_PATH = resolve(
  process.env.CSV_PATH ??
    "content/hackathon-leads/etape2-verified-leads.csv",
);

async function main() {
  const buffer = readFileSync(CSV_PATH);
  const imported = await commitLeadImportFromFile({
    editionId: EDITION_ID,
    filename: "etape2-verified-leads.csv",
    buffer,
    defaultSource: "company",
    updateExisting: true,
  });

  const qualified = await qualifyHackathonLeads({ editionId: EDITION_ID });

  const pack = await prepareJul31CampaignPack({
    editionId: EDITION_ID,
    minCategory: "B_QUALIFIED",
  });

  const db = getDb();
  const stats = await db
    .select({
      category: hackathonLeads.category,
      segment: hackathonLeads.segment,
      n: sql<number>`count(*)::int`,
    })
    .from(hackathonLeads)
    .where(eq(hackathonLeads.editionId, EDITION_ID))
    .groupBy(hackathonLeads.category, hackathonLeads.segment);

  console.log(
    JSON.stringify(
      {
        ok: true,
        imported: {
          inserted: imported.inserted,
          updated: imported.updated,
          skipped: imported.skipped,
          qualifiedOnImport: imported.qualified,
          summary: imported.summary,
        },
        qualify: {
          updated: qualified.updated,
          byCategory: qualified.byCategory,
          bySegment: qualified.bySegment,
        },
        pack: {
          scheduledAt: pack.scheduledAt,
          campaigns: pack.campaigns.map((c) => ({
            id: c.id,
            segment: c.segment,
            name: c.name,
            generate: c.generate,
          })),
        },
        leadStats: stats,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
