import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionUserId } from "@/lib/session";
import { getDb, users } from "@/db";
import { fmtTradeAmount } from "@/lib/trade-math";
import { numFromNumeric } from "@/lib/wallet-types";

export const dynamic = "force-dynamic";

const REFILL_TO = 10_000;
const MIN_BALANCE_TO_REFILL = 100; // require user to have mostly spent it

export async function POST() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [u] = await db
    .select({ tradeDemoUsdtBalance: users.tradeDemoUsdtBalance })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!u) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cur = numFromNumeric(u.tradeDemoUsdtBalance?.toString());
  if (cur > MIN_BALANCE_TO_REFILL) {
    return NextResponse.json(
      { error: "demo_refill_not_needed", balance: cur },
      { status: 400 },
    );
  }

  await db
    .update(users)
    .set({ tradeDemoUsdtBalance: fmtTradeAmount(REFILL_TO) })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true, demoUsdt: String(REFILL_TO) });
}

