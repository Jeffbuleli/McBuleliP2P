import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { executeInternalTransfer } from "@/lib/wallet-internal-transfer";

const bodyZ = z
  .object({
    recipientEmail: z.string().email().optional(),
    recipientUserId: z.string().uuid().optional(),
    asset: z.enum(["USDT", "PI", "USD", "CDF"]),
    amount: z.string().min(1),
    memo: z.string().optional(),
  })
  .refine((d) => Boolean(d.recipientEmail || d.recipientUserId), {
    message: "wallet_transfer_recipient_required",
  });

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message;
    return NextResponse.json(
      { error: msg ?? "wallet_transfer_invalid_email" },
      { status: 400 },
    );
  }
  const r = await executeInternalTransfer({
    fromUserId: userId,
    recipientEmail: parsed.data.recipientEmail,
    recipientUserId: parsed.data.recipientUserId,
    asset: parsed.data.asset,
    amountStr: parsed.data.amount,
    memo: parsed.data.memo,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, batchId: r.batchId });
}
