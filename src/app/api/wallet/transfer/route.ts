import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { checkKycGate } from "@/lib/kyc-guard";
import { executeInternalTransfer } from "@/lib/wallet-internal-transfer";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { recordFinancialAudit } from "@/lib/financial-audit";

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
  const limited = enforceApiRateLimit("wallet_transfer", userId, req);
  if (limited) return limited;
  const kyc = await checkKycGate(userId, "wallet_transfer");
  if (!kyc.ok) {
    return NextResponse.json({ error: kyc.error }, { status: 403 });
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
  recordFinancialAudit({
    userId,
    action: "wallet_transfer",
    req,
    resourceType: "transfer",
    resourceId: r.batchId,
    asset: parsed.data.asset,
    amount: parsed.data.amount,
    meta: {
      recipientEmail: parsed.data.recipientEmail ?? null,
      recipientUserId: parsed.data.recipientUserId ?? null,
    },
  });
  return NextResponse.json({ ok: true, batchId: r.batchId });
}
