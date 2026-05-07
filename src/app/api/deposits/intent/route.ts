import { NextResponse } from "next/server";
import { getDb, deposits } from "@/db";
import { hasBinanceKeys, hasOkxKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { depositIntentSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { binanceDepositAddress } from "@/lib/binance";
import { okxDepositAddress } from "@/lib/okx";
import { DepositStatus } from "@/lib/status";
import { getPiOkxChain, PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";
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
    const chain = getPiOkxChain();
    const address = manual?.trim()
      ? manual.trim()
      : (() => {
          if (!hasOkxKeys()) {
            return null;
          }
          return null;
        })();

    let addressShown: string | null = null;
    let memoShown: string | null = null;
    let networkCex: string | null = null;

    if (manual?.trim()) {
      addressShown = manual.trim();
      memoShown = null;
      networkCex = "manual";
    } else {
      if (!hasOkxKeys()) {
        return NextResponse.json(
          {
            message:
              "Pi deposits require either a manual Pi receiving address (super-admin) or OKX_API_KEY/SECRET/PASSPHRASE in .env.",
          },
          { status: 503 },
        );
      }
      const r = await okxDepositAddress({ ccy: "PI", chain });
      addressShown = r.address;
      memoShown = r.tag;
      networkCex = chain;
    }
    const db = getDb();
    const [row] = await db
      .insert(deposits)
      .values({
        userId,
        provider: "okx",
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
