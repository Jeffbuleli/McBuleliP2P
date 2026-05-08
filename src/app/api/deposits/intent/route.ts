import { NextResponse } from "next/server";
import { getDb, deposits } from "@/db";
import { hasBinanceKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { depositIntentSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { binanceDepositAddress } from "@/lib/binance";
import { DepositStatus } from "@/lib/status";

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = depositIntentSchema.safeParse(await req.json());
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const first =
      Object.values(flat.fieldErrors).flat()[0] ?? "Invalid deposit request.";
    return NextResponse.json(
      { message: first, fieldErrors: flat.fieldErrors },
      { status: 400 },
    );
  }
  const body = parsed.data;

  if (!hasBinanceKeys()) {
    return NextResponse.json(
      {
        message:
          "USDT deposits require BINANCE_API_KEY and BINANCE_API_SECRET in .env.",
      },
      { status: 503 },
    );
  }
  const spec = USDT_NETWORKS[body.network];
  const r = await binanceDepositAddress({
    coin: body.asset,
    network: body.network,
  });
  const address = r.address;
  const memo = r.tag?.trim() ? r.tag.trim() : null;

  const db = getDb();
  const [row] = await db
    .insert(deposits)
    .values({
      userId,
      provider: body.provider,
      asset: body.asset,
      networkCanonical: body.network,
      networkCex: spec.binanceNetwork,
      addressShown: address,
      memoShown: memo,
      minConfirmations: spec.defaultConfirmations,
      status: DepositStatus.AWAITING_TRANSFER,
    })
    .returning();

  return NextResponse.json({ deposit: row });
}
