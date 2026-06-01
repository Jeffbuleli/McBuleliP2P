import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getMcbClaimSummary,
  requestMcbClaim,
} from "@/lib/mcb-claim-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  bpAmount: z.number().int().positive(),
  walletAddress: z.string().trim().min(10).max(64),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const summary = await getMcbClaimSummary(userId);
  return NextResponse.json(summary);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const result = await requestMcbClaim({
    userId,
    bpAmount: parsed.data.bpAmount,
    walletAddress: parsed.data.walletAddress,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    claim: result.claim,
    balance: result.balance,
  });
}
