import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { enforceApiRateLimit } from "@/lib/api-rate-limit";
import { resolveTransferRecipient } from "@/lib/wallet-internal-transfer";

const queryZ = z
  .object({
    email: z.string().email().optional(),
    userId: z.string().uuid().optional(),
  })
  .refine((d) => Boolean(d.email || d.userId), {
    message: "wallet_transfer_recipient_required",
  });

/** Preview recipient before confirming an internal transfer. */
export async function GET(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const limited = enforceApiRateLimit("wallet_transfer", userId, req);
  if (limited) return limited;

  const url = new URL(req.url);
  const parsed = queryZ.safeParse({
    email: url.searchParams.get("email") || undefined,
    userId: url.searchParams.get("userId") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "wallet_transfer_invalid_email" },
      { status: 400 },
    );
  }

  const r = await resolveTransferRecipient({
    fromUserId: userId,
    recipientEmail: parsed.data.email,
    recipientUserId: parsed.data.userId,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, recipient: r.recipient });
}
