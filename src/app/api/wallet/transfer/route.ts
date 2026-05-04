import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { executeInternalTransfer } from "@/lib/wallet-internal-transfer";

const bodyZ = z.object({
  recipientEmail: z.string().email(),
  asset: z.enum(["USDT", "PI", "USD", "CDF"]),
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
    return NextResponse.json({ error: "wallet_transfer_invalid_email" }, { status: 400 });
  }
  const r = await executeInternalTransfer({
    fromUserId: userId,
    recipientEmail: parsed.data.recipientEmail,
    asset: parsed.data.asset,
    amountStr: parsed.data.amount,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, batchId: r.batchId });
}
