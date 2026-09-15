import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  buildMemberFinancialPassport,
  grantPassportConsent,
  listMyPassportConsents,
  revokePassportConsent,
} from "@/lib/avec/financial-passport";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await ctx.params;
  const url = new URL(req.url);
  const memberUserId = url.searchParams.get("memberUserId")?.trim() || userId;

  const r = await buildMemberFinancialPassport({
    groupId,
    memberUserId,
    viewerUserId: userId,
  });
  if (!r.ok) {
    const status = r.message === "group_forbidden" ? 403 : 404;
    return NextResponse.json({ error: r.message }, { status });
  }

  const consents =
    memberUserId === userId
      ? await listMyPassportConsents({ groupId, memberUserId: userId })
      : [];

  return NextResponse.json({ ok: true, passport: r.passport, consents });
}

const grantSchema = z.object({
  partnerLabel: z.string().trim().min(2).max(128),
  scopes: z.array(z.enum(["summary", "score", "savings", "loans"])).min(1).max(4),
  durationDays: z.number().int().min(1).max(365).default(30),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_input" }, { status: 400 });
  }

  const r = await grantPassportConsent({
    groupId,
    memberUserId: userId,
    partnerLabel: parsed.data.partnerLabel,
    scopes: parsed.data.scopes,
    durationDays: parsed.data.durationDays,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 403 });
  }
  return NextResponse.json({ ok: true, consentId: r.consentId });
}

const revokeSchema = z.object({
  consentId: z.string().uuid(),
});

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: groupId } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_input" }, { status: 400 });
  }

  const r = await revokePassportConsent({
    groupId,
    memberUserId: userId,
    consentId: parsed.data.consentId,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
