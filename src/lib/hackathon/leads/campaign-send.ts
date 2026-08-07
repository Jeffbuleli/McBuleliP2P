/**
 * Progressive Resend send for hackathon lead campaigns.
 * Daily batch default: 60 @ 09h Africa/Kinshasa (Resend mcbuleli.org).
 * Phase A: Gmail + iCloud → Phase B: corporate not yet contacted.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignEvents,
  hackathonCampaignRecipients,
  hackathonEmailCampaigns,
  hackathonLeads,
} from "@/db";
import { isValidLeadEmail } from "./lead-normalize";
import { companyOutreachKey } from "./lead-outreach-exclude";
import { canonicalEmailForDedup } from "@/lib/auth/email-normalize";
import { sendEmail, canSendViaResendApi, resendSendBlockedReason } from "@/lib/email/send";
import { SUPPORT_EMAIL } from "@/lib/support-contact";

export const LEAD_CAMPAIGN_DAILY_BATCH = 60;

/** Broad freemail set (corporate = everything else). */
const FREE_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.fr",
  "yahoo.com",
  "hotmail.com",
  "hotmail.fr",
  "outlook.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "live.com",
]);

/** Phase A priority: Gmail + Apple iCloud family only. */
const PRIORITY_INBOX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "icloud.com",
  "me.com",
  "mac.com",
]);

export type LeadCampaignDomainMode =
  | "gmail_icloud_first"
  | "corporate_only"
  | "any";

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

function isCorporateEmail(email: string): boolean {
  const d = emailDomain(email);
  return Boolean(d) && !FREE_DOMAINS.has(d);
}

export function isGmailOrIcloudEmail(email: string): boolean {
  const d = emailDomain(email);
  return Boolean(d) && PRIORITY_INBOX_DOMAINS.has(d);
}

function resolveDomainMode(args: {
  domainMode?: LeadCampaignDomainMode;
  corporateOnly?: boolean;
}): LeadCampaignDomainMode {
  if (args.domainMode) return args.domainMode;
  if (args.corporateOnly === false) return "any";
  return "corporate_only";
}

export async function approveEditionCampaigns(args: {
  editionId: string;
  approvedByUserId?: string | null;
  dryRun?: boolean;
}): Promise<{ approved: number }> {
  const db = getDb();
  const now = new Date();
  const updated = await db
    .update(hackathonEmailCampaigns)
    .set({
      status: "APPROVED",
      dryRun: args.dryRun ?? false,
      approvedAt: now,
      approvedByUserId: args.approvedByUserId ?? null,
      updatedAt: now,
    })
    .where(
      and(
        eq(hackathonEmailCampaigns.editionId, args.editionId),
        inArray(hackathonEmailCampaigns.status, [
          "DRAFT",
          "READY_FOR_REVIEW",
          "APPROVED",
          "PAUSED",
        ]),
      ),
    )
    .returning({ id: hackathonEmailCampaigns.id });

  for (const row of updated) {
    await db.insert(hackathonCampaignEvents).values({
      campaignId: row.id,
      type: "APPROVED",
      meta: {
        dryRun: args.dryRun ?? false,
        note: "Approved for progressive daily send (60/day Kinshasa 09h · Gmail/iCloud then corporate)",
      },
    });
  }

  return { approved: updated.length };
}

export type DailySendResult = {
  ok: true;
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  dryRunBlocked: boolean;
  limit: number;
  domainMode: LeadCampaignDomainMode;
  domainPhase: "gmail_icloud" | "corporate" | "any";
  samples: Array<{ email: string; subject: string; status: string }>;
  blockedReason?: string;
};

function emptySendResult(
  limit: number,
  domainMode: LeadCampaignDomainMode,
  extra: Partial<DailySendResult> = {},
): DailySendResult {
  const domainPhase =
    domainMode === "corporate_only"
      ? "corporate"
      : domainMode === "gmail_icloud_first"
        ? "gmail_icloud"
        : "any";
  return {
    ok: true,
    attempted: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    dryRunBlocked: false,
    limit,
    domainMode,
    domainPhase,
    samples: [],
    ...extra,
  };
}

/**
 * Send up to `limit` PENDING recipients across APPROVED campaigns for an edition.
 * `gmail_icloud_first`: Gmail/iCloud until exhausted, then corporate not contacted.
 */
export async function sendDailyLeadCampaignBatch(args: {
  editionId: string;
  limit?: number;
  /** Prefer enterprise inboxes for partnership tone (legacy). */
  corporateOnly?: boolean;
  /** gmail_icloud_first (cron) | corporate_only | any */
  domainMode?: LeadCampaignDomainMode;
  force?: boolean;
}): Promise<DailySendResult> {
  const limit = Math.min(
    Math.max(args.limit ?? LEAD_CAMPAIGN_DAILY_BATCH, 1),
    LEAD_CAMPAIGN_DAILY_BATCH,
  );
  const domainMode = resolveDomainMode(args);
  const db = getDb();

  if (!canSendViaResendApi()) {
    return emptySendResult(limit, domainMode, {
      dryRunBlocked: true,
      blockedReason: resendSendBlockedReason() ?? "resend_blocked",
    });
  }

  const campaigns = await db
    .select({
      id: hackathonEmailCampaigns.id,
      dryRun: hackathonEmailCampaigns.dryRun,
      status: hackathonEmailCampaigns.status,
    })
    .from(hackathonEmailCampaigns)
    .where(
      and(
        eq(hackathonEmailCampaigns.editionId, args.editionId),
        inArray(hackathonEmailCampaigns.status, ["APPROVED", "SENDING"]),
      ),
    );

  if (campaigns.length === 0) {
    return emptySendResult(limit, domainMode, {
      blockedReason: "no_approved_campaigns",
    });
  }

  const liveCampaignIds = campaigns
    .filter((c) => args.force || c.dryRun === false)
    .map((c) => c.id);

  if (liveCampaignIds.length === 0) {
    return emptySendResult(limit, domainMode, {
      dryRunBlocked: true,
      blockedReason: "all_campaigns_dry_run",
    });
  }

  // Mark SENDING
  await db
    .update(hackathonEmailCampaigns)
    .set({
      status: "SENDING",
      sendStartedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(inArray(hackathonEmailCampaigns.id, liveCampaignIds));

  const rows = await db
    .select({
      recipientId: hackathonCampaignRecipients.id,
      campaignId: hackathonCampaignRecipients.campaignId,
      subject: hackathonCampaignRecipients.personalizedSubject,
      html: hackathonCampaignRecipients.personalizedHtml,
      text: hackathonCampaignRecipients.personalizedText,
      leadId: hackathonLeads.id,
      email: hackathonLeads.email,
      emailCanonical: hackathonLeads.emailCanonical,
      emailValid: hackathonLeads.emailValid,
      suppressed: hackathonLeads.suppressed,
      score: hackathonLeads.score,
      category: hackathonLeads.category,
      source: hackathonLeads.source,
      company: hackathonLeads.company,
      contactCount: hackathonLeads.contactCount,
      lastContactedAt: hackathonLeads.lastContactedAt,
    })
    .from(hackathonCampaignRecipients)
    .innerJoin(
      hackathonLeads,
      eq(hackathonCampaignRecipients.leadId, hackathonLeads.id),
    )
    .where(
      and(
        inArray(hackathonCampaignRecipients.campaignId, liveCampaignIds),
        eq(hackathonCampaignRecipients.status, "PENDING"),
        eq(hackathonLeads.editionId, args.editionId),
        eq(hackathonLeads.suppressed, false),
        eq(hackathonLeads.emailValid, true),
      ),
    )
    .orderBy(
      // Gmail/iCloud first (phase A); corporate follow when phase B / filters apply
      sql`case when lower(split_part(${hackathonLeads.email}, '@', 2)) in ('gmail.com','googlemail.com','icloud.com','me.com','mac.com') then 0 else 1 end`,
      sql`case when ${hackathonLeads.source} in ('annuaire','fec','company','directory') then 0 else 1 end`,
      desc(hackathonLeads.score),
      asc(hackathonCampaignRecipients.createdAt),
    )
    .limit(Math.max(limit * 12, 300));

  let domainPhase: DailySendResult["domainPhase"] =
    domainMode === "corporate_only"
      ? "corporate"
      : domainMode === "gmail_icloud_first"
        ? "gmail_icloud"
        : "any";

  let ranked = rows;
  if (domainMode === "corporate_only") {
    ranked = rows.filter((row) => isCorporateEmail(row.email));
  } else if (domainMode === "gmail_icloud_first") {
    const priority = rows.filter((row) => isGmailOrIcloudEmail(row.email));
    if (priority.length > 0) {
      ranked = priority;
      domainPhase = "gmail_icloud";
    } else {
      ranked = rows.filter((row) => isCorporateEmail(row.email));
      domainPhase = "corporate";
    }
  }

  // Addresses / companies already SENT or leads already contacted on this edition
  const alreadySentKeys = new Set<string>();
  const alreadySentEmails = new Set<string>();

  const contactedLeads = await db
    .select({
      emailCanonical: hackathonLeads.emailCanonical,
      company: hackathonLeads.company,
      email: hackathonLeads.email,
    })
    .from(hackathonLeads)
    .where(
      and(
        eq(hackathonLeads.editionId, args.editionId),
        sql`(${hackathonLeads.contactCount} > 0 OR ${hackathonLeads.lastContactedAt} IS NOT NULL)`,
      ),
    );
  for (const row of contactedLeads) {
    if (row.emailCanonical) {
      alreadySentEmails.add(row.emailCanonical.toLowerCase());
    }
    const key = companyOutreachKey(row.company, row.email);
    if (key) alreadySentKeys.add(key);
  }

  const sentRows = await db
    .select({
      company: hackathonLeads.company,
      email: hackathonLeads.email,
      emailCanonical: hackathonLeads.emailCanonical,
    })
    .from(hackathonCampaignRecipients)
    .innerJoin(
      hackathonLeads,
      eq(hackathonCampaignRecipients.leadId, hackathonLeads.id),
    )
    .where(
      and(
        inArray(hackathonCampaignRecipients.campaignId, liveCampaignIds),
        eq(hackathonCampaignRecipients.status, "SENT"),
      ),
    );
  for (const row of sentRows) {
    const key = companyOutreachKey(row.company, row.email);
    if (key) alreadySentKeys.add(key);
    const emailKey = (row.emailCanonical || row.email).toLowerCase();
    if (emailKey) alreadySentEmails.add(emailKey);
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const samples: DailySendResult["samples"] = [];
  const batchClaimed = new Set<string>(alreadySentKeys);
  const batchEmails = new Set<string>(alreadySentEmails);

  for (const row of ranked) {
    if (sent >= limit) break;

    const emailKey = (
      row.emailCanonical ||
      canonicalEmailForDedup(row.email) ||
      row.email
    ).toLowerCase();
    const companyKey = companyOutreachKey(row.company, row.email);

    if (
      (row.contactCount ?? 0) > 0 ||
      row.lastContactedAt != null ||
      batchEmails.has(emailKey)
    ) {
      await db
        .update(hackathonCampaignRecipients)
        .set({
          status: "SKIPPED",
          skipReason: "already_contacted",
          updatedAt: new Date(),
        })
        .where(eq(hackathonCampaignRecipients.id, row.recipientId));
      skipped += 1;
      continue;
    }

    if (companyKey && batchClaimed.has(companyKey)) {
      await db
        .update(hackathonCampaignRecipients)
        .set({
          status: "SKIPPED",
          skipReason: "duplicate_company",
          updatedAt: new Date(),
        })
        .where(eq(hackathonCampaignRecipients.id, row.recipientId));
      skipped += 1;
      continue;
    }

    if (!isValidLeadEmail(row.email)) {
      await db
        .update(hackathonCampaignRecipients)
        .set({
          status: "SKIPPED",
          skipReason: "invalid_email",
          updatedAt: new Date(),
        })
        .where(eq(hackathonCampaignRecipients.id, row.recipientId));
      skipped += 1;
      continue;
    }

    const ok = await sendEmail({
      to: row.email,
      subject: row.subject,
      html: row.html,
      text: row.text ?? undefined,
      replyTo: SUPPORT_EMAIL,
    });

    if (ok) {
      await db
        .update(hackathonCampaignRecipients)
        .set({
          status: "SENT",
          sentAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(hackathonCampaignRecipients.id, row.recipientId));

      await db
        .update(hackathonLeads)
        .set({
          lastContactedAt: new Date(),
          contactCount: sql`${hackathonLeads.contactCount} + 1`,
          lifecycle: "CONTACTED",
          updatedAt: new Date(),
        })
        .where(eq(hackathonLeads.id, row.leadId));

      // Also mark sibling PENDING rows for the same email as skipped
      await db.execute(sql`
        UPDATE hackathon_campaign_recipients r
        SET status = 'SKIPPED',
            skip_reason = 'already_contacted',
            updated_at = NOW()
        FROM hackathon_leads l
        WHERE r.lead_id = l.id
          AND r.status = 'PENDING'
          AND r.id <> ${row.recipientId}::uuid
          AND l.edition_id = ${args.editionId}::uuid
          AND lower(l.email_canonical) = ${emailKey}
      `);

      await db
        .update(hackathonEmailCampaigns)
        .set({
          sentCount: sql`${hackathonEmailCampaigns.sentCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(hackathonEmailCampaigns.id, row.campaignId));

      await db.insert(hackathonCampaignEvents).values({
        campaignId: row.campaignId,
        recipientId: row.recipientId,
        leadId: row.leadId,
        type: "SENT",
        meta: { to: row.email, batch: "daily_60", domainPhase },
      });

      sent += 1;
      batchEmails.add(emailKey);
      if (companyKey) batchClaimed.add(companyKey);
      if (samples.length < 8) {
        samples.push({
          email: row.email,
          subject: row.subject,
          status: "SENT",
        });
      }
    } else {
      await db
        .update(hackathonCampaignRecipients)
        .set({
          status: "FAILED",
          errorMessage: "resend_send_failed",
          retryCount: sql`${hackathonCampaignRecipients.retryCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(hackathonCampaignRecipients.id, row.recipientId));
      failed += 1;
      await db.insert(hackathonCampaignEvents).values({
        campaignId: row.campaignId,
        recipientId: row.recipientId,
        leadId: row.leadId,
        type: "ERROR",
        meta: { to: row.email, error: "resend_send_failed" },
      });
    }

    // Small pacing to avoid burst
    await new Promise((r) => setTimeout(r, 120));
  }

  // Keep progressive send alive until queue is empty
  for (const campaignId of liveCampaignIds) {
    const [{ pending }] = await db
      .select({
        pending: sql<number>`count(*)::int`,
      })
      .from(hackathonCampaignRecipients)
      .where(
        and(
          eq(hackathonCampaignRecipients.campaignId, campaignId),
          eq(hackathonCampaignRecipients.status, "PENDING"),
        ),
      );

    await db
      .update(hackathonEmailCampaigns)
      .set({
        status: pending > 0 ? "APPROVED" : "COMPLETED",
        sendCompletedAt: pending > 0 ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(hackathonEmailCampaigns.id, campaignId));
  }

  return {
    ok: true,
    attempted: sent + failed,
    sent,
    failed,
    skipped,
    dryRunBlocked: false,
    limit,
    domainMode,
    domainPhase,
    samples,
  };
}
