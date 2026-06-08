import { NextResponse } from "next/server";
import { z } from "zod";
import { communityEnabled } from "@/lib/community/config";
import {
  createTradingSignal,
  listTradingSignals,
} from "@/lib/community/signals-service";
import { checkKycGate } from "@/lib/kyc-guard";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const createZ = z.object({
  symbol: z.string().min(2).max(16),
  side: z.enum(["long", "short"]),
  entryPrice: z.string().optional(),
  targetPrice: z.string().optional(),
  stopPrice: z.string().optional(),
  note: z.string().min(10).max(500),
});

export async function GET(req: Request) {
  if (!communityEnabled()) {
    return NextResponse.json({ signals: [], nextCursor: null });
  }

  const url = new URL(req.url);
  const cursor = url.searchParams.get("cursor");
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const status = url.searchParams.get("status") as
    | "open"
    | "closed"
    | "all"
    | null;
  const authorId = url.searchParams.get("authorId");

  const result = await listTradingSignals({
    cursor,
    limit,
    status: status ?? "all",
    authorId: authorId ?? undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const kyc = await checkKycGate(userId, "community_signal");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await createTradingSignal({
    authorId: userId,
    ...parsed.data,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    signal: result.signal,
    bpGranted: result.bpGranted,
  });
}
