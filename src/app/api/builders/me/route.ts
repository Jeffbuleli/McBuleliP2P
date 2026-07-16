import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getBuildersSummary,
  requestBuildersPurchase,
} from "@/lib/builders/builders-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  tier: z.string().trim().min(3).max(16),
  txHash: z.string().trim().min(66).max(128),
  walletAddress: z.string().trim().min(10).max(64).optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getBuildersSummary(userId);
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[builders/me GET]", e);
    return NextResponse.json(
      { message: "builders_load_failed" },
      { status: 500 },
    );
  }
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

  const result = await requestBuildersPurchase({
    userId,
    tier: parsed.data.tier,
    txHash: parsed.data.txHash,
    walletAddress: parsed.data.walletAddress,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, membership: result.membership });
}
