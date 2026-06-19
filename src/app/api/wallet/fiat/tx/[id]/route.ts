import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { fiatFreshpayTransactions, getDb } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { hasFreshpayCardKeys, hasFreshpayKeys } from "@/lib/env";
import { refreshFiatTxFromProvider } from "@/lib/freshpay/reconcile-tx";
import { sanitizeFiatTxForUser } from "@/lib/fiat-api-errors";

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
  let [tx] = await db
    .select()
    .from(fiatFreshpayTransactions)
    .where(eq(fiatFreshpayTransactions.reference, parsed.data.id));

  if (!tx || tx.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isCard = tx.provider === "card" || tx.meta?.rail === "card";
  const canRefresh = isCard ? hasFreshpayCardKeys() : hasFreshpayKeys();
  const shouldRefresh =
    refresh && canRefresh && (tx.status === "PROCESSING" || tx.status === "INITIATED");

  if (shouldRefresh) {
    try {
      tx = await refreshFiatTxFromProvider(tx);
    } catch {
      // return last known row
    }
  }

  return NextResponse.json({
    ok: true,
    tx: sanitizeFiatTxForUser(tx),
  });
}
