/**
 * Requalify edition + regenerate latest dry-run campaigns.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import {
  getDb,
  hackathonEmailCampaigns,
  hackathonLeads,
} from "../src/db";
import { generateCampaignRecipients } from "../src/lib/hackathon/leads/campaign-service";
import { qualifyHackathonLeads } from "../src/lib/hackathon/leads/lead-qualify";

const EDITION_ID =
  process.env.EDITION_ID ?? "8e431de4-f539-4d77-a7d4-ee5d939889ca";

async function main() {
  const q = await qualifyHackathonLeads({ editionId: EDITION_ID });
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

  const latest = new Map<string, string>();
  for (const c of campaigns) {
    if (!latest.has(c.segment)) latest.set(c.segment, c.id);
  }

  const results = [];
  for (const [segment, campaignId] of latest) {
    const g = await generateCampaignRecipients({
      campaignId,
      regenerate: true,
    });
    results.push({
      segment,
      queued: g.queued,
      skipped: g.skipped,
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

  const segs = await db
    .select({
      segment: hackathonLeads.segment,
      n: sql<number>`count(*)::int`,
    })
    .from(hackathonLeads)
    .where(
      and(
        eq(hackathonLeads.editionId, EDITION_ID),
        eq(hackathonLeads.suppressed, false),
      ),
    )
    .groupBy(hackathonLeads.segment);

  console.log(
    JSON.stringify(
      {
        qualify: q.byCategory,
        bySegment: q.bySegment,
        cats,
        segs,
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
