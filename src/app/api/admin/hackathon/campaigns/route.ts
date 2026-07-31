import { NextResponse } from "next/server";
import { z } from "zod";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";
import {
  createCampaign,
  clearCampaignPendingRecipients,
  generateCampaignRecipients,
  getCampaign,
  getRecipientPreviewHtml,
  listCampaignRecipients,
  listCampaigns,
  loadEditionClaimedCompanyKeys,
  loadEditionClaimedEmails,
  prepareJul31CampaignPack,
  scheduleCampaign,
  defaultScheduleKinshasaJul31,
} from "@/lib/hackathon/leads/campaign-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authError(e: unknown) {
  const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
  return NextResponse.json({ error: msg }, { status: 403 });
}

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return authError(e);
  }

  const url = new URL(req.url);
  const editionId = url.searchParams.get("editionId");
  const campaignId = url.searchParams.get("campaignId");
  const recipientId = url.searchParams.get("recipientId");

  if (recipientId) {
    const preview = await getRecipientPreviewHtml(recipientId);
    if (!preview) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, preview });
  }

  if (campaignId) {
    const campaign = await getCampaign(campaignId);
    if (!campaign) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const recipients = await listCampaignRecipients({ campaignId });
    return NextResponse.json({ ok: true, campaign, ...recipients });
  }

  if (!editionId) {
    return NextResponse.json({ error: "editionId_required" }, { status: 400 });
  }
  const campaigns = await listCampaigns(editionId);
  return NextResponse.json({ ok: true, campaigns });
}

export async function POST(req: Request) {
  let admin: { id: string };
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return authError(e);
  }

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const parsed = z
    .object({
      action: z.enum([
        "create",
        "generate",
        "schedule",
        "prepare_jul31_pack",
        "approve",
        "send_daily_batch",
        "regenerate_all",
      ]),
      editionId: z.string().uuid().optional(),
      campaignId: z.string().uuid().optional(),
      name: z.string().min(2).max(200).optional(),
      segment: z.string().min(2).max(32).optional(),
      minCategory: z.string().max(24).optional(),
      scheduledAt: z.string().datetime().optional(),
      dryRun: z.boolean().optional(),
      regenerate: z.boolean().optional(),
      limit: z.number().int().min(1).max(50).optional(),
      corporateOnly: z.boolean().optional(),
    })
    .safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const data = parsed.data;

  try {
    if (data.action === "approve") {
      if (!data.editionId) {
        return NextResponse.json(
          { error: "editionId_required" },
          { status: 400 },
        );
      }
      const { approveEditionCampaigns } = await import(
        "@/lib/hackathon/leads/campaign-send"
      );
      const result = await approveEditionCampaigns({
        editionId: data.editionId,
        approvedByUserId: admin.id,
        dryRun: data.dryRun === true,
      });
      return NextResponse.json({
        ok: true,
        action: "approve",
        note:
          data.dryRun === true
            ? "Campagnes APPROVED mais dryRun=true (pas d'envoi Resend)."
            : "Campagnes APPROVED - dryRun=false - lots quotidiens 50 emails à 09h Kinshasa.",
        ...result,
      });
    }

    if (data.action === "send_daily_batch") {
      if (!data.editionId) {
        return NextResponse.json(
          { error: "editionId_required" },
          { status: 400 },
        );
      }
      const { sendDailyLeadCampaignBatch } = await import(
        "@/lib/hackathon/leads/campaign-send"
      );
      const result = await sendDailyLeadCampaignBatch({
        editionId: data.editionId,
        limit: data.limit ?? 50,
        corporateOnly: data.corporateOnly !== false,
      });
      return NextResponse.json({
        action: "send_daily_batch",
        ...result,
      });
    }

    if (data.action === "regenerate_all") {
      if (!data.editionId) {
        return NextResponse.json(
          { error: "editionId_required" },
          { status: 400 },
        );
      }
      const campaigns = await listCampaigns(data.editionId);
      const eligible = campaigns.filter((c) =>
        ["DRAFT", "READY_FOR_REVIEW", "APPROVED", "PAUSED", "SENDING"].includes(
          c.status,
        ),
      );
      // Clear all pending first so company dedupe is fair across segments
      for (const c of eligible) {
        await clearCampaignPendingRecipients(c.id);
      }
      // Keep SENT / already-contacted emails claimed so regenerate never re-queues them
      const claimedCompanyKeys = await loadEditionClaimedCompanyKeys(
        data.editionId,
      );
      const claimedEmails = await loadEditionClaimedEmails(data.editionId);
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
          queued: generate.queued,
          skipped: generate.skipped,
        });
      }
      return NextResponse.json({
        ok: true,
        action: "regenerate_all",
        note: "Contenus régénérés (partenariat / 1 email par adresse déjà contactée).",
        campaigns: out,
      });
    }

    if (data.action === "prepare_jul31_pack") {
      if (!data.editionId) {
        return NextResponse.json(
          { error: "editionId_required" },
          { status: 400 },
        );
      }
      const pack = await prepareJul31CampaignPack({
        editionId: data.editionId,
        createdByUserId: admin.id,
        minCategory: (data.minCategory as "B_QUALIFIED") ?? "B_QUALIFIED",
      });
      return NextResponse.json({
        ok: true,
        action: "prepare_jul31_pack",
        note: "Emails générés et planifiés pour le 31 juil. 2026 09:00 Kinshasa. dryRun=true — aucun envoi Resend.",
        ...pack,
      });
    }

    if (data.action === "create") {
      if (!data.editionId || !data.name) {
        return NextResponse.json({ error: "missing_fields" }, { status: 400 });
      }
      const created = await createCampaign({
        editionId: data.editionId,
        name: data.name,
        segment: data.segment ?? "mixed",
        minCategory: data.minCategory,
        createdByUserId: admin.id,
        scheduledAt: data.scheduledAt
          ? new Date(data.scheduledAt)
          : defaultScheduleKinshasaJul31(),
        dryRun: data.dryRun ?? true,
      });
      return NextResponse.json({ ok: true, action: "create", ...created });
    }

    if (data.action === "generate") {
      if (!data.campaignId) {
        return NextResponse.json(
          { error: "campaignId_required" },
          { status: 400 },
        );
      }
      const result = await generateCampaignRecipients({
        campaignId: data.campaignId,
        regenerate: data.regenerate ?? true,
      });
      return NextResponse.json({ ok: true, action: "generate", ...result });
    }

    if (data.action === "schedule") {
      if (!data.campaignId) {
        return NextResponse.json(
          { error: "campaignId_required" },
          { status: 400 },
        );
      }
      const scheduledAt = data.scheduledAt
        ? new Date(data.scheduledAt)
        : defaultScheduleKinshasaJul31();
      const result = await scheduleCampaign({
        campaignId: data.campaignId,
        scheduledAt,
        dryRun: data.dryRun ?? true,
        markReady: true,
      });
      return NextResponse.json({
        action: "schedule",
        note: "Planifié — pas d'envoi masse tant que non APPROVED / quota Resend OK",
        ...result,
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  return NextResponse.json({ error: "unknown_action" }, { status: 400 });
}
