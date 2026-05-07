import { NextResponse } from "next/server";
import { getDb, deposits } from "@/db";
import { hasBinanceKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { depositIntentSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { binanceDepositAddress } from "@/lib/binance";
import { DepositStatus } from "@/lib/status";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";
import { getPlatformSetting, PlatformSettingKey } from "@/lib/platform-settings";

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

  if (body.asset === "USDT") {
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

  if (body.asset === "PI") {
    const manual = await getPlatformSetting(PlatformSettingKey.PI_RECEIVE_ADDRESS_REAL);
    let addressShown: string | null = null;
    let memoShown: string | null = null;
    let networkCex: string | null = null;

    if (manual?.trim()) {
      addressShown = manual.trim();
      memoShown = null;
      networkCex = "manual";
    } else {
      return NextResponse.json(
        {
          message:
            "Pi deposits require a manual Pi receiving address (super-admin).",
        },
        { status: 503 },
      );
    }
    const db = getDb();
    const [row] = await db
      .insert(deposits)
      .values({
        userId,
        provider: "manual",
        asset: "PI",
        networkCanonical: PI_MAIN_NETWORK_ID,
        networkCex: networkCex!,
        addressShown: addressShown!,
        memoShown,
        minConfirmations: 30,
        status: DepositStatus.AWAITING_TRANSFER,
      })
      .returning();

    return NextResponse.json({ deposit: row });
  }

  return NextResponse.json({ message: "Unsupported asset." }, { status: 400 });
}
