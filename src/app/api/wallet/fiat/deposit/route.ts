import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import { hasPawapayKeys } from "@/lib/env";
import { pawapayInitiateDeposit } from "@/lib/pawapay/client";
import { normalizeCodPhoneNumber } from "@/lib/pawapay/normalize-phone";

const bodyZ = z.object({
  asset: z.enum(["USD", "CDF"]),
  grossAmount: z.string().min(1),
  phoneNumber: z.string().min(6),
  provider: z.string().min(2),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasPawapayKeys()) {
    return NextResponse.json({ error: "wallet_pawapay_unconfigured" }, { status: 503 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const { asset, grossAmount, phoneNumber, provider } = parsed.data;
  const gross = Number(grossAmount);
  if (!Number.isFinite(gross) || gross <= 0) {
    return NextResponse.json({ error: "wallet_fiat_invalid_amount" }, { status: 400 });
  }

  const depositId = randomUUID();

  try {
    const phone = normalizeCodPhoneNumber(phoneNumber);
    const r = await pawapayInitiateDeposit({
      depositId,
      amount: grossAmount,
      currency: asset,
      payer: {
        type: "MMO",
        accountDetails: {
          phoneNumber: phone,
          provider: provider.trim(),
        },
      },
      metadata: {
        userId,
      },
    });

    if (r.status !== "ACCEPTED" && r.status !== "DUPLICATE_IGNORED") {
      const code = r.failureReason?.failureCode?.trim() || null;
      const msg = r.failureReason?.failureMessage?.trim() || null;
      return NextResponse.json(
        {
          ok: false,
          error: "wallet_pawapay_deposit_rejected",
          failureReason: r.failureReason ?? null,
          detail: code && msg ? `${code}: ${msg}` : msg ?? code,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, depositId, status: r.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : null;
    return NextResponse.json(
      { ok: false, error: "wallet_pawapay_deposit_failed", detail: msg },
      { status: 502 },
    );
  }
}

