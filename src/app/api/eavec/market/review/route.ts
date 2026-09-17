import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import {
  countEavecMarketPendingReview,
  listEavecMarketPendingReview,
  reviewEavecMarketListing,
} from "@/lib/eavec-market/service";

function isStaff(role: string | undefined) {
  return role === UserRole.AGENT || role === UserRole.SUPER_ADMIN;
}

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [listings, pendingCount] = await Promise.all([
    listEavecMarketPendingReview(),
    countEavecMarketPendingReview(),
  ]);
  return NextResponse.json({ listings, pendingCount });
}

const bodyZ = z.object({
  id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || !isStaff(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "eavec_market_invalid" }, { status: 400 });
  }
  const r = await reviewEavecMarketListing({
    id: parsed.data.id,
    reviewerUserId: user.id,
    action: parsed.data.action,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
