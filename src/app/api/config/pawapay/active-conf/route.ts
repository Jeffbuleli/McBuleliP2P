import { NextResponse } from "next/server";
import { hasPawapayKeys } from "@/lib/env";
import { pawapayActiveConfiguration } from "@/lib/pawapay/client";
import { z } from "zod";

const qZ = z.object({
  country: z.string().min(3).max(3).optional(),
  operationType: z.enum(["DEPOSIT", "PAYOUT", "REFUND"]).optional(),
  currency: z.enum(["USD", "CDF"]).optional(),
});

export async function GET(req: Request) {
  if (!hasPawapayKeys()) {
    return NextResponse.json({ ok: false, error: "wallet_pawapay_unconfigured" }, { status: 503 });
  }

  const url = new URL(req.url);
  const parsed = qZ.safeParse({
    country: url.searchParams.get("country") ?? undefined,
    operationType: url.searchParams.get("operationType") ?? undefined,
    currency: url.searchParams.get("currency") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid query." }, { status: 400 });
  }

  try {
    const conf = await pawapayActiveConfiguration({
      country: parsed.data.country,
      operationType: parsed.data.operationType,
    });

    const currency = parsed.data.currency;
    const countries = (conf.countries ?? []).map((c) => {
      const providers = (c.providers ?? []).map((p) => {
        const currencies = currency
          ? (p.currencies ?? []).filter((x) => x.currency === currency)
          : (p.currencies ?? []);
        return { provider: p.provider, displayName: p.displayName, logo: p.logo, currencies };
      });
      return { country: c.country, prefix: c.prefix, providers };
    });

    return NextResponse.json({ ok: true, companyName: conf.companyName ?? null, countries });
  } catch (e) {
    const msg = e instanceof Error ? e.message : null;
    return NextResponse.json(
      { ok: false, error: "pawapay_active_conf_failed", detail: msg },
      { status: 502 },
    );
  }
}

