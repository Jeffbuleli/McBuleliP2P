/**
 * Hackathon lead email campaigns: create, generate personalized recipients, schedule.
 * Does NOT send mass email without APPROVED + launch (and respects dryRun / scheduledAt).
 */

import crypto from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignEvents,
  hackathonCampaignRecipients,
  hackathonEmailCampaigns,
  hackathonLeads,
  hackathonSuppressionList,
} from "@/db";
import { partnershipPublicBaseUrl } from "@/lib/email/config";
import {
  buildCampaignCtaUrl,
  HACKATHON_CAMPAIGN_SLUG,
  personalizeLeadEmail,
} from "./lead-personalize";
import {
  loadOutreachExclusionSet,
  outreachSkipReason,
  companyOutreachKey,
} from "./lead-outreach-exclude";
import type { HackathonLeadCategory, HackathonLeadSegment } from "./types";

const CATEGORY_RANK: Record<string, number> = {
  A_HOT: 3,
  B_QUALIFIED: 2,
  C_LOW: 1,
  UNQUALIFIED: 0,
};

function token(): string {
  return crypto.randomBytes(18).toString("base64url");
}

/** 31 Jul 2026 09:00 Africa/Kinshasa (UTC+1) = 08:00 UTC */
export const DEFAULT_CAMPAIGN_SCHEDULE_ISO = "2026-07-31T08:00:00.000Z";

export function defaultScheduleKinshasaJul31(): Date {
  return new Date(DEFAULT_CAMPAIGN_SCHEDULE_ISO);
}

function meetsMinCategory(
  leadCategory: string,
  minCategory: string,
): boolean {
  return (CATEGORY_RANK[leadCategory] ?? 0) >= (CATEGORY_RANK[minCategory] ?? 0);
}

/** Company keys already PENDING/SENT on this edition (optionally exclude one campaign). */
export async function loadEditionClaimedCompanyKeys(
  editionId: string,
  excludeCampaignId?: string,
): Promise<Set<string>> {
  const db = getDb();
  const campaigns = await db
    .select({ id: hackathonEmailCampaigns.id })
    .from(hackathonEmailCampaigns)
    .where(eq(hackathonEmailCampaigns.editionId, editionId));
  const ids = campaigns
    .map((c) => c.id)
    .filter((id) => id !== excludeCampaignId);
  if (ids.length === 0) return new Set();

  const rows = await db
    .select({
      company: hackathonLeads.company,
      email: hackathonLeads.email,
    })
    .from(hackathonCampaignRecipients)
    .innerJoin(
      hackathonLeads,
      eq(hackathonLeads.id, hackathonCampaignRecipients.leadId),
    )
    .where(
      and(
        inArray(hackathonCampaignRecipients.campaignId, ids),
        inArray(hackathonCampaignRecipients.status, ["PENDING", "SENT"]),
      ),
    );

  const claimed = new Set<string>();
  for (const row of rows) {
    const key = companyOutreachKey(row.company, row.email);
    if (key) claimed.add(key);
  }
  return claimed;
}

/** Emails already PENDING/SENT (or lead already contacted) for this edition. */
export async function loadEditionClaimedEmails(
  editionId: string,
  excludeCampaignId?: string,
): Promise<Set<string>> {
  const db = getDb();
  const claimed = new Set<string>();

  const contacted = await db
    .select({
      emailCanonical: hackathonLeads.emailCanonical,
    })
    .from(hackathonLeads)
    .where(
      and(
        eq(hackathonLeads.editionId, editionId),
        sql`(${hackathonLeads.contactCount} > 0 OR ${hackathonLeads.lastContactedAt} IS NOT NULL)`,
      ),
    );
  for (const row of contacted) {
    if (row.emailCanonical) claimed.add(row.emailCanonical.toLowerCase());
  }

  const campaigns = await db
    .select({ id: hackathonEmailCampaigns.id })
    .from(hackathonEmailCampaigns)
    .where(eq(hackathonEmailCampaigns.editionId, editionId));
  const ids = campaigns
    .map((c) => c.id)
    .filter((id) => id !== excludeCampaignId);
  if (ids.length === 0) return claimed;

  const rows = await db
    .select({
      emailCanonical: hackathonLeads.emailCanonical,
    })
    .from(hackathonCampaignRecipients)
    .innerJoin(
      hackathonLeads,
      eq(hackathonLeads.id, hackathonCampaignRecipients.leadId),
    )
    .where(
      and(
        inArray(hackathonCampaignRecipients.campaignId, ids),
        inArray(hackathonCampaignRecipients.status, ["PENDING", "SENT"]),
      ),
    );
  for (const row of rows) {
    if (row.emailCanonical) claimed.add(row.emailCanonical.toLowerCase());
  }
  return claimed;
}

export async function clearCampaignPendingRecipients(
  campaignId: string,
): Promise<number> {
  const db = getDb();
  const deleted = await db
    .delete(hackathonCampaignRecipients)
    .where(
      and(
        eq(hackathonCampaignRecipients.campaignId, campaignId),
        inArray(hackathonCampaignRecipients.status, ["PENDING", "SKIPPED"]),
      ),
    )
    .returning({ id: hackathonCampaignRecipients.id });
  return deleted.length;
}

export async function listCampaigns(editionId: string) {
  const db = getDb();
  return db
    .select()
    .from(hackathonEmailCampaigns)
    .where(eq(hackathonEmailCampaigns.editionId, editionId))
    .orderBy(desc(hackathonEmailCampaigns.createdAt))
    .limit(50);
}

export async function getCampaign(campaignId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonEmailCampaigns)
    .where(eq(hackathonEmailCampaigns.id, campaignId))
    .limit(1);
  return row ?? null;
}

export async function createCampaign(args: {
  editionId: string;
  name: string;
  segment: string;
  minCategory?: string;
  createdByUserId?: string | null;
  scheduledAt?: Date | null;
  dryRun?: boolean;
}): Promise<{ id: string }> {
  const db = getDb();
  const segment = args.segment || "mixed";
  const subjectTemplate =
    "{{firstName}}, HACKATHON AI KINSHASA - invitation personnalisée";
  const bodyTemplate =
    "Template généré par segment (developers / ai_data / design_product / entrepreneurs / general).";

  const [row] = await db
    .insert(hackathonEmailCampaigns)
    .values({
      editionId: args.editionId,
      name: args.name,
      segment,
      minCategory: args.minCategory ?? "B_QUALIFIED",
      subjectTemplate,
      bodyTemplate,
      status: "DRAFT",
      dryRun: args.dryRun ?? true,
      scheduledAt: args.scheduledAt ?? null,
      createdByUserId: args.createdByUserId ?? null,
    })
    .returning({ id: hackathonEmailCampaigns.id });

  await db.insert(hackathonCampaignEvents).values({
    campaignId: row!.id,
    type: "EMAIL_GENERATED",
    meta: { phase: "created", name: args.name, segment },
  });

  return { id: row!.id };
}

export type GenerateCampaignResult = {
  campaignId: string;
  prospectCount: number;
  queued: number;
  skipped: number;
  avgPersonalizationRate: number;
  preview: Array<{
    leadId: string;
    email: string;
    subject: string;
    facts: Record<string, string>;
    personalizationRate: number;
    status: string;
    skipReason: string | null;
  }>;
};

export async function generateCampaignRecipients(args: {
  campaignId: string;
  /** Replace existing PENDING recipients */
  regenerate?: boolean;
  /**
   * Shared edition-wide company claim set (mutated).
   * Ensures one email per company across the whole launch.
   */
  claimedCompanyKeys?: Set<string>;
  /** Shared edition-wide emails already queued or contacted (mutated). */
  claimedEmails?: Set<string>;
}): Promise<GenerateCampaignResult> {
  const db = getDb();
  const campaign = await getCampaign(args.campaignId);
  if (!campaign) throw new Error("campaign_not_found");
  if (
    !["DRAFT", "READY_FOR_REVIEW", "APPROVED", "PAUSED", "SENDING"].includes(
      campaign.status,
    )
  ) {
    throw new Error("campaign_locked");
  }

  if (args.regenerate) {
    await clearCampaignPendingRecipients(args.campaignId);
  }

  const leads = await db
    .select()
    .from(hackathonLeads)
    .where(eq(hackathonLeads.editionId, campaign.editionId))
    .orderBy(desc(hackathonLeads.score))
    .limit(3000);

  const suppressed = await db
    .select({ emailCanonical: hackathonSuppressionList.emailCanonical })
    .from(hackathonSuppressionList);
  const suppressedSet = new Set(suppressed.map((s) => s.emailCanonical));
  const partnerExclusion = await loadOutreachExclusionSet(campaign.editionId);

  const claimed =
    args.claimedCompanyKeys ??
    (await loadEditionClaimedCompanyKeys(campaign.editionId, args.campaignId));
  const claimedEmails =
    args.claimedEmails ??
    (await loadEditionClaimedEmails(campaign.editionId, args.campaignId));

  const base = partnershipPublicBaseUrl();
  let queued = 0;
  let skipped = 0;
  let rateSum = 0;
  let rateN = 0;
  const preview: GenerateCampaignResult["preview"] = [];

  for (const lead of leads) {
    if (campaign.segment !== "mixed" && lead.segment !== campaign.segment) {
      continue;
    }
    if (!meetsMinCategory(lead.category, campaign.minCategory)) {
      continue;
    }

    const clickToken = token();
    const unsubscribeToken = token();
    let status: "PENDING" | "SKIPPED" = "PENDING";
    let skipReason: string | null = null;

    const partnerSkip = outreachSkipReason({
      email: lead.email,
      emailCanonical: lead.emailCanonical,
      company: lead.company,
      exclusion: partnerExclusion,
    });

    const companyKey = companyOutreachKey(lead.company, lead.email);
    const emailKey = (lead.emailCanonical || lead.email).toLowerCase();

    if (!lead.emailValid) {
      status = "SKIPPED";
      skipReason = "invalid_email";
    } else if (lead.suppressed || suppressedSet.has(lead.emailCanonical)) {
      status = "SKIPPED";
      skipReason = "suppressed";
    } else if (partnerSkip) {
      status = "SKIPPED";
      skipReason = partnerSkip.startsWith("partner") ||
        partnerSkip.startsWith("sponsor") ||
        partnerSkip.startsWith("partner_org")
        ? "existing_partner"
        : partnerSkip;
    } else if (lead.alreadyRegistered) {
      status = "SKIPPED";
      skipReason = "already_registered";
    } else if (
      (lead.contactCount ?? 0) > 0 ||
      lead.lastContactedAt != null ||
      claimedEmails.has(emailKey)
    ) {
      status = "SKIPPED";
      skipReason =
        (lead.contactCount ?? 0) > 0 || lead.lastContactedAt != null
          ? "already_contacted"
          : "duplicate_email";
    } else if (companyKey && claimed.has(companyKey)) {
      status = "SKIPPED";
      skipReason = "duplicate_company";
    }

    const unsubUrl = `${base}/api/hackathon/email/u/${unsubscribeToken}`;
    const ctaUrl = buildCampaignCtaUrl({
      campaignSlug: HACKATHON_CAMPAIGN_SLUG,
      segment: lead.segment,
      clickToken,
    });

    const personalized = personalizeLeadEmail({
      lead: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        jobTitle: lead.jobTitle,
        company: lead.company,
        location: lead.location,
        skills: lead.skills ?? [],
        segment: lead.segment as HackathonLeadSegment,
        recommendedProfile: lead.recommendedProfile,
        notes: lead.notes,
      },
      unsubscribeUrl: unsubUrl,
      ctaUrl,
      campaignName: campaign.name,
    });

    try {
      await db.insert(hackathonCampaignRecipients).values({
        campaignId: args.campaignId,
        leadId: lead.id,
        personalizedSubject: personalized.subject,
        personalizedHtml: personalized.html,
        personalizedText: personalized.text,
        personalizationFacts: personalized.facts,
        status,
        skipReason,
        clickToken,
        unsubscribeToken,
      });
    } catch {
      // unique conflict → skip silently on regenerate races
      skipped += 1;
      continue;
    }

    if (status === "PENDING") {
      if (companyKey) claimed.add(companyKey);
      claimedEmails.add(emailKey);
      queued += 1;
      rateSum += personalized.personalizationRate;
      rateN += 1;
    } else {
      skipped += 1;
    }

    if (preview.length < 12) {
      preview.push({
        leadId: lead.id,
        email: lead.email,
        subject: personalized.subject,
        facts: personalized.facts,
        personalizationRate: personalized.personalizationRate,
        status,
        skipReason,
      });
    }
  }

  const prospectCount = queued + skipped;
  await db
    .update(hackathonEmailCampaigns)
    .set({
      prospectCount,
      status:
        campaign.status === "DRAFT" ? "READY_FOR_REVIEW" : campaign.status,
      updatedAt: new Date(),
    })
    .where(eq(hackathonEmailCampaigns.id, args.campaignId));

  await db.insert(hackathonCampaignEvents).values({
    campaignId: args.campaignId,
    type: "EMAIL_GENERATED",
    meta: {
      prospectCount,
      queued,
      skipped,
      avgPersonalizationRate: rateN ? Math.round(rateSum / rateN) : 0,
    },
  });

  return {
    campaignId: args.campaignId,
    prospectCount,
    queued,
    skipped,
    avgPersonalizationRate: rateN ? Math.round(rateSum / rateN) : 0,
    preview,
  };
}

export async function scheduleCampaign(args: {
  campaignId: string;
  scheduledAt: Date;
  /** Keep dryRun true until Resend quota allows real send */
  dryRun?: boolean;
  markReady?: boolean;
}) {
  const db = getDb();
  const campaign = await getCampaign(args.campaignId);
  if (!campaign) throw new Error("campaign_not_found");

  await db
    .update(hackathonEmailCampaigns)
    .set({
      scheduledAt: args.scheduledAt,
      dryRun: args.dryRun ?? campaign.dryRun,
      status: args.markReady ? "READY_FOR_REVIEW" : campaign.status,
      updatedAt: new Date(),
    })
    .where(eq(hackathonEmailCampaigns.id, args.campaignId));

  await db.insert(hackathonCampaignEvents).values({
    campaignId: args.campaignId,
    type: "EMAIL_GENERATED",
    meta: {
      scheduledAt: args.scheduledAt.toISOString(),
      dryRun: args.dryRun ?? campaign.dryRun,
      note: "Scheduled - no mass send until APPROVED after Resend quota reset",
    },
  });

  return { ok: true as const, scheduledAt: args.scheduledAt.toISOString() };
}

/** Create one campaign per segment for Jul 31 09:00 Kinshasa (dry-run). */
export async function prepareJul31CampaignPack(args: {
  editionId: string;
  createdByUserId?: string | null;
  minCategory?: HackathonLeadCategory;
}): Promise<{
  campaigns: Array<{
    id: string;
    segment: string;
    name: string;
    generate: GenerateCampaignResult;
  }>;
  scheduledAt: string;
}> {
  const scheduledAt = defaultScheduleKinshasaJul31();
  const segments: Array<{ segment: string; label: string }> = [
    { segment: "developers", label: "Developers / Tech" },
    { segment: "ai_data", label: "IA / Data" },
    { segment: "design_product", label: "Design / Product" },
    { segment: "entrepreneurs", label: "Entrepreneurs / Startups" },
    { segment: "general", label: "Profils généraux" },
  ];

  const campaigns = [];
  const claimedCompanyKeys = new Set<string>();
  const claimedEmails = new Set<string>();
  for (const s of segments) {
    const { id } = await createCampaign({
      editionId: args.editionId,
      name: `AI Hackathon 31 jul 09h - ${s.label}`,
      segment: s.segment,
      minCategory: args.minCategory ?? "B_QUALIFIED",
      createdByUserId: args.createdByUserId,
      scheduledAt,
      dryRun: true,
    });
    const generate = await generateCampaignRecipients({
      campaignId: id,
      regenerate: true,
      claimedCompanyKeys,
      claimedEmails,
    });
    await scheduleCampaign({
      campaignId: id,
      scheduledAt,
      dryRun: true,
      markReady: true,
    });
    campaigns.push({
      id,
      segment: s.segment,
      name: `AI Hackathon 31 jul 09h - ${s.label}`,
      generate,
    });
  }

  return { campaigns, scheduledAt: scheduledAt.toISOString() };
}

export async function listCampaignRecipients(args: {
  campaignId: string;
  limit?: number;
}) {
  const db = getDb();
  const rows = await db
    .select({
      id: hackathonCampaignRecipients.id,
      leadId: hackathonCampaignRecipients.leadId,
      status: hackathonCampaignRecipients.status,
      skipReason: hackathonCampaignRecipients.skipReason,
      subject: hackathonCampaignRecipients.personalizedSubject,
      facts: hackathonCampaignRecipients.personalizationFacts,
      email: hackathonLeads.email,
      company: hackathonLeads.company,
      firstName: hackathonLeads.firstName,
      lastName: hackathonLeads.lastName,
      segment: hackathonLeads.segment,
      score: hackathonLeads.score,
      category: hackathonLeads.category,
    })
    .from(hackathonCampaignRecipients)
    .innerJoin(
      hackathonLeads,
      eq(hackathonLeads.id, hackathonCampaignRecipients.leadId),
    )
    .where(eq(hackathonCampaignRecipients.campaignId, args.campaignId))
    .orderBy(desc(hackathonLeads.score))
    .limit(Math.min(args.limit ?? 50, 200));

  const [stats] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${hackathonCampaignRecipients.status} = 'PENDING')::int`,
      skipped: sql<number>`count(*) filter (where ${hackathonCampaignRecipients.status} = 'SKIPPED')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(hackathonCampaignRecipients)
    .where(eq(hackathonCampaignRecipients.campaignId, args.campaignId));

  return { rows, stats };
}

export async function getRecipientPreviewHtml(recipientId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      subject: hackathonCampaignRecipients.personalizedSubject,
      html: hackathonCampaignRecipients.personalizedHtml,
      text: hackathonCampaignRecipients.personalizedText,
      facts: hackathonCampaignRecipients.personalizationFacts,
      status: hackathonCampaignRecipients.status,
    })
    .from(hackathonCampaignRecipients)
    .where(eq(hackathonCampaignRecipients.id, recipientId))
    .limit(1);
  return row ?? null;
}
