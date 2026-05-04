import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { createGroup } from "@/lib/group-savings-service";
import { APP_COUNTRY_CODES } from "@/lib/country-codes";

const bodyZ = z.object({
  type: z.enum(["likelimba", "avec"]),
  name: z.string().min(2).max(96),
  countryCode: z.enum(APP_COUNTRY_CODES).optional().nullable(),
  minMembers: z.number().int().min(2).max(100),
  maxMembers: z.number().int().min(2).max(100),
  contributionAmountUsdt: z.number().positive(),
  cycleDurationDays: z.number().int().min(1).max(365),
  paymentRules: z.string().max(2000).optional().nullable(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "group_invalid_body" }, { status: 400 });
  }
  const r = await createGroup({ userId, ...parsed.data });
  if (!r.ok) return NextResponse.json({ error: r.message }, { status: 400 });
  return NextResponse.json({ ok: true, groupId: r.groupId });
}

