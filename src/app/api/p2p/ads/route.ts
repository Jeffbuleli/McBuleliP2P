import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/session";
import {
  isP2pFiat,
  P2P_COUNTRY_CODES,
  type P2pCryptoAsset,
  type P2pSide,
} from "@/lib/p2p-config";
import { createAd, listUserAds } from "@/lib/p2p-service";

const createZ = z.object({
  side: z.enum(["sell", "buy"]),
  asset: z.enum(["USDT", "PI"]),
  fiatCurrency: z.string().min(3).max(8),
  price: z.string().min(1),
  minFiat: z.string().min(1),
  maxFiat: z.string().min(1),
  paymentMethods: z.string().min(3),
  paymentMethodCodes: z.array(z.string().min(2).max(32)).min(1).optional(),
  reserveAmountCrypto: z.string().min(1).optional(),
  terms: z.string().optional(),
  countryCode: z.enum(P2P_COUNTRY_CODES).optional(),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ads = await listUserAds(userId);
  return NextResponse.json({ ads });
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = createZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "p2p_invalid_limits" }, { status: 400 });
  }
  const d = parsed.data;
  if (!isP2pFiat(d.fiatCurrency)) {
    return NextResponse.json({ error: "p2p_invalid_limits" }, { status: 400 });
  }
  const cc = d.countryCode?.toUpperCase();
  if (cc && !(P2P_COUNTRY_CODES as readonly string[]).includes(cc)) {
    return NextResponse.json({ error: "p2p_invalid_limits" }, { status: 400 });
  }
  const r = await createAd({
    userId,
    side: d.side as P2pSide,
    asset: d.asset as P2pCryptoAsset,
    fiatCurrency: d.fiatCurrency.toUpperCase(),
    priceStr: d.price,
    minFiatStr: d.minFiat,
    maxFiatStr: d.maxFiat,
    paymentMethods: d.paymentMethods,
    paymentMethodCodes: d.paymentMethodCodes,
    reserveAmountCryptoStr: d.reserveAmountCrypto,
    terms: d.terms,
    countryCode: cc ?? null,
  });
  if (!r.ok) {
    return NextResponse.json({ error: r.message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, id: r.id });
}
