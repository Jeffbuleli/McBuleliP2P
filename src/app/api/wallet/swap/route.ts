import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { executeWalletSwap } from "@/lib/wallet-swap";

const bodyZ = z.object({
  from: z.enum(["USDT", "PI", "USD", "CDF"]),
  to: z.enum(["USDT", "PI", "USD", "CDF"]),
  amount: z.string().min(1),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_swap_invalid_amount" }, { status: 400 });
  }
  const r = await executeWalletSwap({
    userId,
    from: parsed.data.from,
    to: parsed.data.to,
    amountStr: parsed.data.amount,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, batchId: r.batchId });
}
