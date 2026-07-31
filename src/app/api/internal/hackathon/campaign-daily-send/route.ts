import { NextResponse } from "next/server";
import {
  approveEditionCampaigns,
  sendDailyLeadCampaignBatch,
  LEAD_CAMPAIGN_DAILY_BATCH,
} from "@/lib/hackathon/leads/campaign-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DEFAULT_EDITION = "8e431de4-f539-4d77-a7d4-ee5d939889ca";

function authorize(req: Request): boolean {
  const secret = (
    process.env.CRON_SECRET ??
    process.env.MCBULELI_CRON_SECRET ??
    ""
  ).trim();
  if (!secret || secret.length < 12) return false;
  const header = req.headers.get("x-cron-secret")?.trim() ?? "";
  return header === secret;
}

/**
 * Progressive lead campaign send - 50/day @ ~09h Africa/Kinshasa (cron UTC 08:00).
 * POST { editionId?, limit?, corporateOnly?, approve? }
 */
export async function POST(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    editionId?: string;
    limit?: number;
    corporateOnly?: boolean;
    approve?: boolean;
    dryRun?: boolean;
  };

  const editionId = body.editionId?.trim() || DEFAULT_EDITION;
  const limit = body.limit ?? LEAD_CAMPAIGN_DAILY_BATCH;

  if (body.approve) {
    await approveEditionCampaigns({
      editionId,
      dryRun: body.dryRun === true ? true : false,
    });
  }

  const result = await sendDailyLeadCampaignBatch({
    editionId,
    limit,
    corporateOnly: body.corporateOnly !== false,
  });

  return NextResponse.json({
    editionId,
    ...result,
    note: "Lot quotidien max 50 - priorité emails entreprise (hors Gmail).",
  });
}
