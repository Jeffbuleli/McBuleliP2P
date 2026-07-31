/**
 * Suppress venue partners (Silikin/TEXAF) + regenerate Jul31 dry-run emails with B2B IT copy.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignRecipients,
  hackathonEmailCampaigns,
  hackathonLeads,
  hackathonSuppressionList,
} from "../src/db";
import { canonicalEmailForDedup } from "../src/lib/auth/email-normalize";
import { generateCampaignRecipients } from "../src/lib/hackathon/leads/campaign-service";
import {
  isExcludedOutreachCompany,
  isExcludedOutreachDomain,
} from "../src/lib/hackathon/leads/lead-outreach-exclude";

const EDITION_ID =
  process.env.EDITION_ID ?? "8e431de4-f539-4d77-a7d4-ee5d939889ca";

async function main() {
  const db = getDb();

  const leads = await db
    .select({
      id: hackathonLeads.id,
      email: hackathonLeads.email,
      emailCanonical: hackathonLeads.emailCanonical,
      company: hackathonLeads.company,
      notes: hackathonLeads.notes,
    })
    .from(hackathonLeads)
    .where(eq(hackathonLeads.editionId, EDITION_ID));

  const toSuppress = leads.filter(
    (l) =>
      isExcludedOutreachDomain(l.email) ||
      isExcludedOutreachCompany(l.company),
  );

  for (const l of toSuppress) {
    const noteTag = "excluded: existing partner/venue";
    const notes =
      l.notes && l.notes.includes(noteTag)
        ? l.notes
        : [l.notes, noteTag].filter(Boolean).join(" | ");

    await db
      .update(hackathonLeads)
      .set({
        suppressed: true,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(hackathonLeads.id, l.id));

    const emailCanonical =
      l.emailCanonical || canonicalEmailForDedup(l.email);
    await db
      .insert(hackathonSuppressionList)
      .values({
        email: l.email,
        emailCanonical,
        reason: "manual",
        source: "existing_partner_venue",
        leadId: l.id,
      })
      .onConflictDoNothing();
  }

  const campaigns = await db
    .select({
      id: hackathonEmailCampaigns.id,
      segment: hackathonEmailCampaigns.segment,
      name: hackathonEmailCampaigns.name,
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
    if (!latestBySegment.has(c.segment)) {
      latestBySegment.set(c.segment, c.id);
    }
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
      previewSubjects: generate.preview.map((p) => ({
        email: p.email,
        subject: p.subject,
        status: p.status,
        skipReason: p.skipReason,
      })),
    });
  }

  const keepIds = [...latestBySegment.values()];
  if (keepIds.length) {
    const oldIds = campaigns
      .map((c) => c.id)
      .filter((id) => !keepIds.includes(id));
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
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        suppressedLeads: toSuppress.map((l) => ({
          email: l.email,
          company: l.company,
        })),
        results,
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
