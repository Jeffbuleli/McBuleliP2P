import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { hasBinanceKeys } from "@/lib/env";
import { getSessionUserId } from "@/lib/session";
import { depositIntentSchema } from "@/lib/validation";
import { USDT_NETWORKS } from "@/lib/networks";
import { binanceDepositAddress } from "@/lib/binance";
import { DepositStatus } from "@/lib/status";
import {
  MIN_DEPOSIT_USDT_FIRST,
  MIN_DEPOSIT_USDT_SUBSEQUENT,
} from "@/lib/usdt-deposit-constants";
import { fmtWalletAmount } from "@/lib/wallet-types";

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
  const declaredNum = Number(body.declaredAmountUsdt);
  if (!Number.isFinite(declaredNum) || declaredNum <= 0) {
    return NextResponse.json({ message: "deposit_invalid_declared_amount" }, { status: 400 });
  }

  const db = getDb();
  const [{ c }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(deposits)
    .where(
      and(
        eq(deposits.userId, userId),
        eq(deposits.asset, "USDT"),
        eq(deposits.status, DepositStatus.CONFIRMED),
      ),
    );
  const prevConfirmed = Number(c ?? 0);
  const minGross =
    prevConfirmed > 0 ? MIN_DEPOSIT_USDT_SUBSEQUENT : MIN_DEPOSIT_USDT_FIRST;
  if (declaredNum + 1e-12 < minGross) {
    return NextResponse.json(
      {
        message: "deposit_declared_below_min",
        min: String(minGross),
      },
      { status: 400 },
    );
  }

  const spec = USDT_NETWORKS[body.network];
  let address: string;
  let memo: string | null;
  try {
    const r = await binanceDepositAddress({
      coin: body.asset,
      network: body.network,
    });
    address = r.address;
    memo = r.tag?.trim() ? r.tag.trim() : null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Binance request failed";
    const detail = msg.length > 240 ? `${msg.slice(0, 240)}…` : msg;
    return NextResponse.json(
      {
        message: "deposit_provider_unavailable",
        detail,
      },
      { status: 503 },
    );
  }

  const declaredStr = fmtWalletAmount(declaredNum);
  const noteTrim = body.userNote?.trim();

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
      declaredAmountUsdt: declaredStr,
      userNote: noteTrim ? noteTrim : null,
    })
    .returning();

  return NextResponse.json({ deposit: row });
}
