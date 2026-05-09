import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb, p2pPaymentMethodDefs } from "@/db";
import { isExcludedCodPawapayProvider } from "@/lib/cod-pawapay-providers";
import { effectiveP2pCountryCode } from "@/lib/p2p-country-code";
import { P2P_CD_PAYMENT_METHOD_FALLBACK } from "@/lib/p2p-cd-payment-fallback";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cc = effectiveP2pCountryCode(url.searchParams.get("country"));
  const db = getDb();
  let defs = await db
    .select({
      code: p2pPaymentMethodDefs.code,
      label: p2pPaymentMethodDefs.label,
      countryCode: p2pPaymentMethodDefs.countryCode,
    })
    .from(p2pPaymentMethodDefs)
    .where(and(eq(p2pPaymentMethodDefs.countryCode, cc), eq(p2pPaymentMethodDefs.active, true)))
    .orderBy(asc(p2pPaymentMethodDefs.sortOrder), asc(p2pPaymentMethodDefs.label));

  if (cc === "CD") {
    defs = defs.filter((d) => !isExcludedCodPawapayProvider(d.code));
    if (defs.length === 0) {
      defs = P2P_CD_PAYMENT_METHOD_FALLBACK.map((x) => ({ ...x }));
    }
  }

  return NextResponse.json({ ok: true, methods: defs });
}

