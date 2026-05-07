import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { fiatPawapayTransactions, getDb } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { hasPawapayKeys } from "@/lib/env";
import { pawapayFetchDepositStatus, pawapayFetchPayoutStatus } from "@/lib/pawapay/client";

const paramsZ = z.object({
  id: z.string().uuid(),
});

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await ctx.params;
  const parsed = paramsZ.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const refresh = url.searchParams.get("refresh") === "1";

  const db = getDb();
  const [tx] = await db
    .select()
    .from(fiatPawapayTransactions)
    .where(eq(fiatPawapayTransactions.pawapayId, parsed.data.id));

  if (!tx || tx.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (refresh && hasPawapayKeys() && (tx.status === "PROCESSING" || tx.status === "INITIATED")) {
    try {
      if (tx.kind === "deposit") {
        const s = await pawapayFetchDepositStatus(tx.pawapayId);
        if (s) {
          await db
            .update(fiatPawapayTransactions)
            .set({
              status: s.status === "COMPLETED" ? "COMPLETED" : s.status === "FAILED" ? "FAILED" : "PROCESSING",
              failureCode: s.failureReason?.failureCode ?? null,
              failureMessage: s.failureReason?.failureMessage ?? null,
              updatedAt: new Date(),
              completedAt: s.status === "COMPLETED" || s.status === "FAILED" ? new Date() : null,
            })
            .where(eq(fiatPawapayTransactions.pawapayId, tx.pawapayId));
        }
      } else if (tx.kind === "payout") {
        const s = await pawapayFetchPayoutStatus(tx.pawapayId);
        if (s) {
          await db
            .update(fiatPawapayTransactions)
            .set({
              status: s.status === "COMPLETED" ? "COMPLETED" : s.status === "FAILED" ? "FAILED" : "PROCESSING",
              failureCode: s.failureReason?.failureCode ?? null,
              failureMessage: s.failureReason?.failureMessage ?? null,
              updatedAt: new Date(),
              completedAt: s.status === "COMPLETED" || s.status === "FAILED" ? new Date() : null,
            })
            .where(eq(fiatPawapayTransactions.pawapayId, tx.pawapayId));
        }
      }
    } catch {
      // best-effort refresh
    }
  }

  const [fresh] = await db
    .select()
    .from(fiatPawapayTransactions)
    .where(eq(fiatPawapayTransactions.pawapayId, parsed.data.id));

  return NextResponse.json({
    ok: true,
    tx: fresh,
  });
}

