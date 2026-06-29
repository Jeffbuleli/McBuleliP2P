import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/session";
import { getDb, p2pAds, piPlatformPayments } from "@/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const actionZ = z.enum(["wallet_test", "p2p_ad_boost"]);

const bodyZ = z.object({
  paymentId: z.string().min(8),
  action: actionZ,
  actionRefId: z.string().uuid().optional(),
  amount: z.string().min(1),
  memo: z.string().min(1),
  meta: z.record(z.string(), z.unknown()).optional(),
  /** Matches Pi SDK `sandbox` / `resolvePiSdkSandbox()` - selects server API key + ledger asset. */
  sandbox: z.boolean().optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const { paymentId, action, actionRefId, amount, memo, meta, sandbox } =
    parsed.data;

  const mergedMeta: Record<string, unknown> = {
    ...(meta ?? {}),
    ...(sandbox === true ? { piSandbox: true } : {}),
  };

  const db = getDb();

  // Validate action reference ownership for high-value actions.
  if (action === "p2p_ad_boost") {
    if (!actionRefId) {
      return NextResponse.json({ message: "Missing actionRefId." }, { status: 400 });
    }
    const [ad] = await db
      .select({ id: p2pAds.id })
      .from(p2pAds)
      .where(and(eq(p2pAds.id, actionRefId), eq(p2pAds.userId, userId)))
      .limit(1);
    if (!ad) {
      return NextResponse.json({ message: "Not found." }, { status: 404 });
    }
  }

  // Idempotent insert: Pi SDK may retry callbacks.
  await db
    .insert(piPlatformPayments)
    .values({
      userId,
      kind: "U2A",
      paymentId,
      amount,
      memo,
      action,
      actionRefId: actionRefId ?? null,
      status: "INITIATED",
      meta: Object.keys(mergedMeta).length > 0 ? mergedMeta : null,
    })
    // drizzle doesn't support ON CONFLICT in all dialects; rely on unique index
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

