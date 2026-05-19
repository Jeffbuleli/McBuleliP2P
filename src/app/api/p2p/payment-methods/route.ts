import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getDb, p2pPaymentMethodDefs } from "@/db";
import { effectiveP2pCountryCode } from "@/lib/p2p-country-code";
import { getP2pPaymentMethodsForCountry } from "@/lib/p2p-payment-method-catalog";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cc = effectiveP2pCountryCode(url.searchParams.get("country"));
  const db = getDb();
  const rows = await db
    .select({
      code: p2pPaymentMethodDefs.code,
      label: p2pPaymentMethodDefs.label,
      countryCode: p2pPaymentMethodDefs.countryCode,
    })
    .from(p2pPaymentMethodDefs)
    .where(and(eq(p2pPaymentMethodDefs.countryCode, cc), eq(p2pPaymentMethodDefs.active, true)))
    .orderBy(asc(p2pPaymentMethodDefs.sortOrder), asc(p2pPaymentMethodDefs.label));

  const defs = rows.length > 0 ? rows : getP2pPaymentMethodsForCountry(cc);

  return NextResponse.json({ ok: true, methods: defs });
}
