/**
 * Persist score + segment on hackathon_leads (batch).
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignEvents,
  hackathonLeads,
} from "@/db";
import { scoreLead } from "./lead-score";
import { segmentLead } from "./lead-segment";

export type QualifyLeadRow = {
  id: string;
  score: number;
  category: string;
  segment: string;
  priority: string;
  qualificationReason: string;
  recommendedProfile: string;
};

function lifecycleAfterQualify(
  current: string,
  category: string,
  alreadyRegistered: boolean,
): string {
  if (
    alreadyRegistered ||
    ["REGISTERED", "PAID", "CONFIRMED", "CONTACTED", "EMAIL_DELIVERED", "OPENED", "CLICKED", "INTERESTED"].includes(
      current,
    )
  ) {
    return current;
  }
  if (category === "A_HOT" || category === "B_QUALIFIED") {
    return "QUALIFIED";
  }
  return current === "LEAD" ? "LEAD" : current;
}

export async function qualifyHackathonLeads(args: {
  editionId: string;
  leadIds?: string[];
  /** Only score leads with score=0 if true */
  onlyUnscored?: boolean;
}): Promise<{
  updated: number;
  byCategory: Record<string, number>;
  bySegment: Record<string, number>;
  sample: QualifyLeadRow[];
}> {
  const db = getDb();
  const conditions = [eq(hackathonLeads.editionId, args.editionId)];
  if (args.leadIds?.length) {
    conditions.push(inArray(hackathonLeads.id, args.leadIds));
  }
  if (args.onlyUnscored) {
    conditions.push(eq(hackathonLeads.score, 0));
  }

  const rows = await db
    .select({
      id: hackathonLeads.id,
      location: hackathonLeads.location,
      jobTitle: hackathonLeads.jobTitle,
      company: hackathonLeads.company,
      skills: hackathonLeads.skills,
      notes: hackathonLeads.notes,
      experienceYears: hackathonLeads.experienceYears,
      source: hackathonLeads.source,
      linkedinUrl: hackathonLeads.linkedinUrl,
      lifecycle: hackathonLeads.lifecycle,
      alreadyRegistered: hackathonLeads.alreadyRegistered,
    })
    .from(hackathonLeads)
    .where(and(...conditions))
    .limit(2000);

  const byCategory: Record<string, number> = {};
  const bySegment: Record<string, number> = {};
  const sample: QualifyLeadRow[] = [];
  let updated = 0;
  const now = new Date();

  for (const row of rows) {
    const input = {
      location: row.location,
      jobTitle: row.jobTitle,
      company: row.company,
      skills: row.skills ?? [],
      notes: row.notes,
      experienceYears: row.experienceYears,
      source: row.source,
      linkedinUrl: row.linkedinUrl,
    };
    const scored = scoreLead(input);
    const segmented = segmentLead(input);
    const lifecycle = lifecycleAfterQualify(
      row.lifecycle,
      scored.category,
      row.alreadyRegistered,
    );

    await db
      .update(hackathonLeads)
      .set({
        score: scored.score,
        scoreBreakdown: scored.breakdown,
        category: scored.category,
        priority: scored.priority,
        qualificationReason: scored.qualificationReason,
        recommendedProfile: scored.recommendedProfile,
        segment: segmented.segment,
        lifecycle,
        updatedAt: now,
      })
      .where(eq(hackathonLeads.id, row.id));

    updated += 1;
    byCategory[scored.category] = (byCategory[scored.category] ?? 0) + 1;
    bySegment[segmented.segment] = (bySegment[segmented.segment] ?? 0) + 1;

    if (sample.length < 15) {
      sample.push({
        id: row.id,
        score: scored.score,
        category: scored.category,
        segment: segmented.segment,
        priority: scored.priority,
        qualificationReason: scored.qualificationReason,
        recommendedProfile: scored.recommendedProfile,
      });
    }
  }

  if (updated > 0) {
    await db.insert(hackathonCampaignEvents).values({
      type: "SCORED",
      meta: {
        editionId: args.editionId,
        updated,
        byCategory,
        bySegment,
      },
    });
    await db.insert(hackathonCampaignEvents).values({
      type: "SEGMENTED",
      meta: {
        editionId: args.editionId,
        updated,
        bySegment,
      },
    });
  }

  return { updated, byCategory, bySegment, sample };
}

export async function leadGenStats(editionId: string) {
  const db = getDb();
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      hot: sql<number>`count(*) filter (where ${hackathonLeads.category} = 'A_HOT')::int`,
      qualified: sql<number>`count(*) filter (where ${hackathonLeads.category} = 'B_QUALIFIED')::int`,
      low: sql<number>`count(*) filter (where ${hackathonLeads.category} = 'C_LOW')::int`,
      unqualified: sql<number>`count(*) filter (where ${hackathonLeads.category} = 'UNQUALIFIED')::int`,
      contacted: sql<number>`count(*) filter (where ${hackathonLeads.contactCount} > 0)::int`,
      notContacted: sql<number>`count(*) filter (where ${hackathonLeads.contactCount} = 0)::int`,
      registered: sql<number>`count(*) filter (where ${hackathonLeads.alreadyRegistered})::int`,
    })
    .from(hackathonLeads)
    .where(eq(hackathonLeads.editionId, editionId));

  const segments = await db
    .select({
      segment: hackathonLeads.segment,
      count: sql<number>`count(*)::int`,
    })
    .from(hackathonLeads)
    .where(eq(hackathonLeads.editionId, editionId))
    .groupBy(hackathonLeads.segment);

  return { totals, segments };
}
