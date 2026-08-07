/**
 * Progressive lead campaign: regenerate queue then send up to 60/day.
 *
 * Dry regenerate only:
 *   npx tsx scripts/send-lead-campaign-daily-batch.ts --regenerate
 *
 * Live send (approve dryRun=false + Resend batch):
 *   npx tsx scripts/send-lead-campaign-daily-batch.ts --send
 *
 * Options:
 *   --editionId=<uuid>
 *   --minCategory=C_LOW|B_QUALIFIED|A_HOT|UNQUALIFIED
 *   --limit=60
 *   --domainMode=gmail_icloud_first|corporate_only|any
 *   --corporateOnly=false
 *   --reopenCompleted  (reactivate latest COMPLETED pack per segment)
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { loadEnvFile } from "node:process";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonEmailCampaigns,
} from "../src/db";
import {
  clearCampaignPendingRecipients,
  generateCampaignRecipients,
  listCampaigns,
  loadEditionClaimedCompanyKeys,
  loadEditionClaimedEmails,
} from "../src/lib/hackathon/leads/campaign-service";
import {
  approveEditionCampaigns,
  LEAD_CAMPAIGN_DAILY_BATCH,
  sendDailyLeadCampaignBatch,
  type LeadCampaignDomainMode,
} from "../src/lib/hackathon/leads/campaign-send";
import {
  canSendViaResendApi,
  resendSendBlockedReason,
} from "../src/lib/email/send";

const DEFAULT_EDITION = "8e431de4-f539-4d77-a7d4-ee5d939889ca";

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

function parseArgs(argv: string[]) {
  const out: {
    regenerate?: boolean;
    send?: boolean;
    reopenCompleted?: boolean;
    editionId: string;
    minCategory: string;
    limit: number;
    corporateOnly: boolean;
    domainMode: LeadCampaignDomainMode;
  } = {
    editionId: DEFAULT_EDITION,
    minCategory: "C_LOW",
    limit: LEAD_CAMPAIGN_DAILY_BATCH,
    corporateOnly: false,
    domainMode: "gmail_icloud_first",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--regenerate") out.regenerate = true;
    else if (a === "--send") out.send = true;
    else if (a === "--reopenCompleted") out.reopenCompleted = true;
    else if (a.startsWith("--editionId="))
      out.editionId = a.slice("--editionId=".length);
    else if (a === "--editionId" && argv[i + 1]) out.editionId = argv[++i];
    else if (a.startsWith("--minCategory="))
      out.minCategory = a.slice("--minCategory=".length);
    else if (a === "--minCategory" && argv[i + 1])
      out.minCategory = argv[++i];
    else if (a.startsWith("--limit="))
      out.limit = Math.min(
        LEAD_CAMPAIGN_DAILY_BATCH,
        Math.max(1, Number(a.slice("--limit=".length)) || 60),
      );
    else if (a === "--limit" && argv[i + 1])
      out.limit = Math.min(
        LEAD_CAMPAIGN_DAILY_BATCH,
        Math.max(1, Number(argv[++i]) || 60),
      );
    else if (a === "--corporateOnly=false") {
      out.corporateOnly = false;
      out.domainMode = "any";
    } else if (a === "--corporateOnly=true") {
      out.corporateOnly = true;
      out.domainMode = "corporate_only";
    } else if (a.startsWith("--domainMode=")) {
      const mode = a.slice("--domainMode=".length) as LeadCampaignDomainMode;
      out.domainMode = mode;
      out.corporateOnly = mode === "corporate_only";
    }
  }
  return out;
}

/** Reactivate latest COMPLETED pack campaigns for segments with no active queue. */
async function reopenCompletedPack(editionId: string) {
  const db = getDb();
  const rows = await db.execute<{ id: string; segment: string }>(sql`
    WITH active_segments AS (
      SELECT DISTINCT segment
      FROM hackathon_email_campaigns
      WHERE edition_id = ${editionId}::uuid
        AND status IN ('DRAFT','READY_FOR_REVIEW','APPROVED','PAUSED','SENDING')
    ),
    candidates AS (
      SELECT DISTINCT ON (c.segment) c.id, c.segment
      FROM hackathon_email_campaigns c
      WHERE c.edition_id = ${editionId}::uuid
        AND c.status = 'COMPLETED'
        AND c.name LIKE 'AI Hackathon 31 jul%'
        AND c.segment NOT IN (SELECT segment FROM active_segments)
      ORDER BY c.segment, c.updated_at DESC NULLS LAST
    )
    SELECT id, segment FROM candidates
  `);
  const list = Array.isArray(rows)
    ? rows
    : ((rows as { rows?: { id: string; segment: string }[] }).rows ?? []);
  if (list.length === 0) return [];
  const ids = list.map((r) => r.id);
  const updated = await db
    .update(hackathonEmailCampaigns)
    .set({
      status: "APPROVED",
      dryRun: false,
      sendCompletedAt: null,
      updatedAt: new Date(),
    })
    .where(inArray(hackathonEmailCampaigns.id, ids))
    .returning({
      id: hackathonEmailCampaigns.id,
      segment: hackathonEmailCampaigns.segment,
      status: hackathonEmailCampaigns.status,
    });
  return updated;
}

async function setMinCategory(editionId: string, minCategory: string) {
  const db = getDb();
  const updated = await db
    .update(hackathonEmailCampaigns)
    .set({
      minCategory,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(hackathonEmailCampaigns.editionId, editionId),
        inArray(hackathonEmailCampaigns.status, [
          "DRAFT",
          "READY_FOR_REVIEW",
          "APPROVED",
          "PAUSED",
          "SENDING",
        ]),
      ),
    )
    .returning({
      id: hackathonEmailCampaigns.id,
      segment: hackathonEmailCampaigns.segment,
      minCategory: hackathonEmailCampaigns.minCategory,
    });
  return updated;
}

async function regenerateEdition(editionId: string) {
  const campaigns = await listCampaigns(editionId);
  const eligible = campaigns.filter((c) =>
    ["DRAFT", "READY_FOR_REVIEW", "APPROVED", "PAUSED", "SENDING"].includes(
      c.status,
    ),
  );
  for (const c of eligible) {
    await clearCampaignPendingRecipients(c.id);
  }
  const claimedCompanyKeys = await loadEditionClaimedCompanyKeys(editionId);
  const claimedEmails = await loadEditionClaimedEmails(editionId);
  const out = [];
  for (const c of eligible) {
    const generate = await generateCampaignRecipients({
      campaignId: c.id,
      regenerate: false,
      claimedCompanyKeys,
      claimedEmails,
    });
    out.push({
      id: c.id,
      segment: c.segment,
      minCategory: c.minCategory,
      queued: generate.queued,
      skipped: generate.skipped,
    });
  }
  return out;
}

async function pendingStats(editionId: string) {
  const db = getDb();
  const result = await db.execute<{
    segment: string;
    pending: number;
    sent: number;
  }>(sql`
    SELECT c.segment,
           count(*) FILTER (WHERE r.status = 'PENDING')::int AS pending,
           count(*) FILTER (WHERE r.status = 'SENT')::int AS sent
    FROM hackathon_email_campaigns c
    LEFT JOIN hackathon_campaign_recipients r ON r.campaign_id = c.id
    WHERE c.edition_id = ${editionId}::uuid
      AND c.status IN ('DRAFT','READY_FOR_REVIEW','APPROVED','PAUSED','SENDING')
    GROUP BY c.segment
    ORDER BY c.segment
  `);
  return Array.isArray(result) ? result : (result as { rows?: unknown }).rows ?? result;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.regenerate && !args.send) {
    console.error(
      "Usage: --regenerate  and/or  --send  [--minCategory=C_LOW] [--limit=60] [--domainMode=gmail_icloud_first]",
    );
    process.exit(1);
  }

  // Auto-reopen when expanding past C_LOW (other segments often COMPLETED).
  const shouldReopen =
    args.reopenCompleted ||
    args.minCategory === "UNQUALIFIED" ||
    args.minCategory === "C_LOW";

  console.log(
    JSON.stringify(
      {
        editionId: args.editionId,
        minCategory: args.minCategory,
        limit: args.limit,
        domainMode: args.domainMode,
        corporateOnly: args.corporateOnly,
        reopenCompleted: shouldReopen,
        regenerate: Boolean(args.regenerate || args.send),
        send: Boolean(args.send),
      },
      null,
      2,
    ),
  );

  if (shouldReopen) {
    const reopened = await reopenCompletedPack(args.editionId);
    console.log("reopened_completed:", JSON.stringify(reopened, null, 2));
  }

  const lowered = await setMinCategory(args.editionId, args.minCategory);
  console.log(
    `minCategory -> ${args.minCategory} on ${lowered.length} campaign(s)`,
  );

  // Always refresh queue before send so we pick never-contacted C_LOW+
  const regenerated = await regenerateEdition(args.editionId);
  console.log("regenerate:", JSON.stringify(regenerated, null, 2));
  console.log("pending_by_segment:", JSON.stringify(await pendingStats(args.editionId), null, 2));

  if (!args.send) {
    console.log("Dry regenerate only (no Resend). Pass --send to approve + send.");
    return;
  }

  if (!canSendViaResendApi()) {
    console.error(
      "Resend blocked:",
      resendSendBlockedReason() ?? "unknown",
    );
    process.exit(1);
  }

  const approved = await approveEditionCampaigns({
    editionId: args.editionId,
    dryRun: false,
  });
  console.log("approved:", approved);

  const result = await sendDailyLeadCampaignBatch({
    editionId: args.editionId,
    limit: args.limit,
    domainMode: args.domainMode,
    corporateOnly: args.corporateOnly,
  });
  console.log("send_result:", JSON.stringify(result, null, 2));

  if (!result.ok || result.sent === 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    // Drizzle/pg pool keeps the process alive otherwise
    process.exit(process.exitCode ?? 0);
  });
