/**
 * Progressive Resend send for hackathon lead campaigns.
 * Daily batch default: 50 (Resend daily limit 100 - leave headroom).
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
import { sendEmail, canSendViaResendApi, resendSendBlockedReason } from "@/lib/email/send";
import { SUPPORT_EMAIL } from "@/lib/support-contact";

export const LEAD_CAMPAIGN_DAILY_BATCH = 50;

const FREE_DOMAINS = new Set([
  "gmail.com",
  "yahoo.fr",
  "yahoo.com",
  "hotmail.com",
  "hotmail.fr",
  "outlook.com",
  "icloud.com",
  "live.com",
]);

function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at >= 0 ? email.slice(at + 1).toLowerCase() : "";
}

function isCorporateEmail(email: string): boolean {
  const d = emailDomain(email);
  return Boolean(d) && !FREE_DOMAINS.has(d);
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
        note: "Approved for progressive daily send (50/day Kinshasa 09h)",
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
  samples: Array<{ email: string; subject: string; status: string }>;
  blockedReason?: string;
};

/**
 * Send up to `limit` PENDING recipients across APPROVED campaigns for an edition.
 * Prefers corporate / annuaire-fec-company sources, then higher lead scores.
 */
export async function sendDailyLeadCampaignBatch(args: {
  editionId: string;
  limit?: number;
  /** Prefer enterprise inboxes for partnership tone */
  corporateOnly?: boolean;
  force?: boolean;
}): Promise<DailySendResult> {
  const limit = Math.min(
    Math.max(args.limit ?? LEAD_CAMPAIGN_DAILY_BATCH, 1),
    LEAD_CAMPAIGN_DAILY_BATCH,
  );
  const db = getDb();

  if (!canSendViaResendApi()) {
    return {
      ok: true,
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      dryRunBlocked: true,
      limit,
      samples: [],
      blockedReason: resendSendBlockedReason() ?? "resend_blocked",
    };
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
    return {
      ok: true,
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      dryRunBlocked: false,
      limit,
      samples: [],
      blockedReason: "no_approved_campaigns",
    };
  }

  const liveCampaignIds = campaigns
    .filter((c) => args.force || c.dryRun === false)
    .map((c) => c.id);

  if (liveCampaignIds.length === 0) {
    return {
      ok: true,
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      dryRunBlocked: true,
      limit,
      samples: [],
      blockedReason: "all_campaigns_dry_run",
    };
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
      emailValid: hackathonLeads.emailValid,
      suppressed: hackathonLeads.suppressed,
      score: hackathonLeads.score,
      category: hackathonLeads.category,
      source: hackathonLeads.source,
      company: hackathonLeads.company,
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
      // Prefer corporate domains, then preferred sources, then score
      sql`case when lower(split_part(${hackathonLeads.email}, '@', 2)) in ('gmail.com','yahoo.fr','yahoo.com','hotmail.com','hotmail.fr','outlook.com','icloud.com','live.com') then 1 else 0 end`,
      sql`case when ${hackathonLeads.source} in ('annuaire','fec','company','directory') then 0 else 1 end`,
      desc(hackathonLeads.score),
      asc(hackathonCampaignRecipients.createdAt),
    )
    .limit(Math.max(limit * 8, 200));

  const ranked = rows.filter((row) => {
    if (args.corporateOnly !== false && !isCorporateEmail(row.email)) {
      return false;
    }
    return true;
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const samples: DailySendResult["samples"] = [];

  for (const row of ranked) {
    if (sent >= limit) break;

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
        meta: { to: row.email, batch: "daily_50" },
      });

      sent += 1;
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
    samples,
  };
}
