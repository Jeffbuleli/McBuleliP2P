/**
 * Import annuaire Kinshasa CSV + requalify with relaxed B2B scoring + regen latest dry-run pack.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignRecipients,
  hackathonEmailCampaigns,
  hackathonLeads,
} from "../src/db";
import { commitLeadImportFromFile } from "../src/lib/hackathon/leads/lead-import";
import { qualifyHackathonLeads } from "../src/lib/hackathon/leads/lead-qualify";
import { generateCampaignRecipients } from "../src/lib/hackathon/leads/campaign-service";
import { sql } from "drizzle-orm";

const EDITION_ID =
  process.env.EDITION_ID ?? "8e431de4-f539-4d77-a7d4-ee5d939889ca";
const CSV_PATH = resolve(
  process.env.CSV_PATH ??
    "content/hackathon-leads/annuaire-import-priority.csv",
);

async function main() {
  const buffer = readFileSync(CSV_PATH);
  const imported = await commitLeadImportFromFile({
    editionId: EDITION_ID,
    filename: "annuaire-import-priority.csv",
    buffer,
    defaultSource: "annuaire",
    updateExisting: true,
  });

  const qualified = await qualifyHackathonLeads({ editionId: EDITION_ID });

  const db = getDb();
  const campaigns = await db
    .select({
      id: hackathonEmailCampaigns.id,
      segment: hackathonEmailCampaigns.segment,
      createdAt: hackathonEmailCampaigns.createdAt,
    })
    .from(hackathonEmailCampaigns)
    .where(
      and(
        eq(hackathonEmailCampaigns.editionId, EDITION_ID),
        eq(hackathonEmailCampaigns.dryRun, true),
      ),
    )
    .orderBy(desc(hackathonEmailCampaigns.createdAt));

  const latestBySegment = new Map<string, string>();
  for (const c of campaigns) {
    if (!latestBySegment.has(c.segment)) latestBySegment.set(c.segment, c.id);
  }

  const results = [];
  for (const [segment, campaignId] of latestBySegment) {
    const generate = await generateCampaignRecipients({
      campaignId,
      regenerate: true,
    });
    results.push({
      segment,
      campaignId,
      queued: generate.queued,
      skipped: generate.skipped,
    });
  }

  const cats = await db
    .select({
      category: hackathonLeads.category,
      n: sql<number>`count(*)::int`,
    })
    .from(hackathonLeads)
    .where(eq(hackathonLeads.editionId, EDITION_ID))
    .groupBy(hackathonLeads.category);

  const keepIds = [...latestBySegment.values()];
  const oldIds = campaigns.map((c) => c.id).filter((id) => !keepIds.includes(id));
  if (oldIds.length) {
    await db
      .delete(hackathonCampaignRecipients)
      .where(
        and(
          inArray(hackathonCampaignRecipients.campaignId, oldIds),
          inArray(hackathonCampaignRecipients.status, ["PENDING", "SKIPPED"]),
        ),
      );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        imported: {
          inserted: imported.inserted,
          updated: imported.updated,
          skipped: imported.skipped,
          summary: imported.summary,
        },
        qualify: qualified.byCategory,
        cats,
        campaigns: results,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
