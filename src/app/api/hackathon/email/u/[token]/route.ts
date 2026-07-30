import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignEvents,
  hackathonCampaignRecipients,
  hackathonLeads,
  hackathonSuppressionList,
} from "@/db";
import { canonicalEmailForDedup } from "@/lib/auth/email-normalize";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-click unsubscribe for lead campaigns.
 * GET /api/hackathon/email/u/:token
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (!token || token.length < 16) {
    return new NextResponse("Lien invalide.", { status: 400 });
  }

  const db = getDb();
  const [recipient] = await db
    .select({
      id: hackathonCampaignRecipients.id,
      campaignId: hackathonCampaignRecipients.campaignId,
      leadId: hackathonCampaignRecipients.leadId,
      email: hackathonLeads.email,
      emailCanonical: hackathonLeads.emailCanonical,
    })
    .from(hackathonCampaignRecipients)
    .innerJoin(
      hackathonLeads,
      eq(hackathonLeads.id, hackathonCampaignRecipients.leadId),
    )
    .where(eq(hackathonCampaignRecipients.unsubscribeToken, token))
    .limit(1);

  if (!recipient) {
    return new NextResponse(
      "Lien expiré ou inconnu. Si vous recevez encore des messages, écrivez à hi@mcbuleli.org.",
      {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      },
    );
  }

  const emailCanonical =
    recipient.emailCanonical || canonicalEmailForDedup(recipient.email);

  await db
    .insert(hackathonSuppressionList)
    .values({
      email: recipient.email,
      emailCanonical,
      reason: "unsubscribe",
      source: "campaign_one_click",
      campaignId: recipient.campaignId,
      leadId: recipient.leadId,
    })
    .onConflictDoNothing({
      target: hackathonSuppressionList.emailCanonical,
    });

  await db
    .update(hackathonLeads)
    .set({ suppressed: true, updatedAt: new Date() })
    .where(eq(hackathonLeads.id, recipient.leadId));

  await db
    .update(hackathonCampaignRecipients)
    .set({ status: "UNSUBSCRIBED", updatedAt: new Date() })
    .where(eq(hackathonCampaignRecipients.id, recipient.id));

  await db.insert(hackathonCampaignEvents).values({
    campaignId: recipient.campaignId,
    recipientId: recipient.id,
    leadId: recipient.leadId,
    type: "UNSUBSCRIBED",
    meta: { via: "one_click" },
  });

  return new NextResponse(
    "Vous ne recevrez plus ces communications du HACKATHON AI Kinshasa. Merci.",
    {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    },
  );
}
