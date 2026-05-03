import { NextResponse } from "next/server";
import { getDb, deposits } from "@/db";
import { hasBinanceKeys, hasOkxKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { depositIntentSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { binanceDepositAddress } from "@/lib/binance";
import { okxDepositAddress } from "@/lib/okx";
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

  if (body.provider === "binance" && !hasBinanceKeys()) {
    return NextResponse.json(
      {
        message:
          "Route A is not enabled: add BINANCE_API_KEY and BINANCE_API_SECRET to the server .env file.",
      },
      { status: 503 },
    );
  }
  if (body.provider === "okx" && !hasOkxKeys()) {
    return NextResponse.json(
      {
        message:
          "Route B is not enabled: add OKX_API_KEY, OKX_API_SECRET, and OKX_PASSPHRASE to the server .env file.",
      },
      { status: 503 },
    );
  }

  const spec = USDT_NETWORKS[body.network];

  let address: string;
  let memo: string | null = null;
  if (body.provider === "binance") {
    const r = await binanceDepositAddress({
      coin: body.asset,
      network: body.network,
    });
    address = r.address;
    memo = r.tag?.trim() ? r.tag.trim() : null;
  } else {
    const r = await okxDepositAddress({
      ccy: body.asset,
      network: body.network,
    });
    address = r.address;
    memo = r.tag?.trim() ? r.tag.trim() : null;
  }

  const db = getDb();
  const [row] = await db
    .insert(deposits)
    .values({
      userId,
      provider: body.provider,
      asset: body.asset,
      networkCanonical: body.network,
      networkCex: body.provider === "binance" ? spec.binanceNetwork : spec.okxChain,
      addressShown: address,
      memoShown: memo,
      minConfirmations: spec.defaultConfirmations,
      status: DepositStatus.AWAITING_TRANSFER,
    })
    .returning();

  return NextResponse.json({ deposit: row });
}
